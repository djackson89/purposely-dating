import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const STRIPE_PRICE_YEARLY_PREMIUM = Deno.env.get("STRIPE_PRICE_YEARLY_PREMIUM") || "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");
    let event: any;
    try {
      if (!STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET not set");
      event = stripe.webhooks.constructEvent(rawBody, sig!, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook signature verification failed", err);
      return new Response(JSON.stringify({ error: "invalid_signature" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const type = event.type as string;
    if (!type.startsWith("customer.subscription.")) {
      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const subscription = event.data.object as any;
    const customerId: string = subscription.customer;
    const status: string = subscription.status;
    const trial_end: number | null = subscription.trial_end; // seconds

    // Plan filter
    const item = subscription.items?.data?.[0];
    const priceId = item?.price?.id as string | undefined;
    if (!priceId || priceId !== STRIPE_PRICE_YEARLY_PREMIUM) {
      return new Response(JSON.stringify({ ignored: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Resolve user_id via subscribers table first
    let userId: string | null = null;
    const { data: subRow } = await supabaseService.from("subscribers").select("user_id, email").eq("stripe_customer_id", customerId).maybeSingle();
    if (subRow?.user_id) {
      userId = subRow.user_id;
    }

    // Fallback: look up customer and map by email -> profiles
    if (!userId) {
      try {
        const cust = await stripe.customers.retrieve(customerId);
        // deno-lint-ignore no-explicit-any
        const email = (cust as any)?.email as string | undefined;
        if (email) {
          const { data: prof } = await supabaseService.from("profiles").select("id").eq("email", email).maybeSingle();
          if (prof?.id) userId = prof.id;
          // also update subscribers linkage if exists
          await supabaseService.from("subscribers").upsert({ email, user_id: prof?.id ?? null, stripe_customer_id: customerId }, { onConflict: "email" });
        }
      } catch (e) {
        console.warn("Stripe customer lookup failed", e);
      }
    }

    if (!userId) {
      console.warn("No user mapping for customer", customerId);
      return new Response(JSON.stringify({ ok: true, note: "no-user" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine if conversion happened now
    let setActivatedAt = false;
    const prevStatus: string | null = event.data.previous_attributes?.status ?? null;
    const becameActive = status === "active" && (!trial_end || trial_end * 1000 <= Date.now());
    if (becameActive) {
      if (prevStatus === null || ["trialing", "incomplete", "past_due"].includes(prevStatus)) {
        setActivatedAt = true;
      } else {
        // Compare against existing row
        const { data: existing } = await supabaseService
          .from("billing")
          .select("status, premium_activated_at")
          .eq("user_id", userId)
          .eq("plan_price_id", STRIPE_PRICE_YEARLY_PREMIUM)
          .maybeSingle();
        if (existing && existing.status !== "active" && !existing.premium_activated_at) setActivatedAt = true;
      }
    }

    const upsertPayload: any = {
      user_id: userId,
      stripe_customer_id: customerId,
      subscription_id: subscription.id,
      status,
      trial_end: trial_end ? new Date(trial_end * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: !!subscription.cancel_at_period_end,
      plan_price_id: STRIPE_PRICE_YEARLY_PREMIUM,
      updated_at: new Date().toISOString(),
    };
    if (setActivatedAt) upsertPayload.premium_activated_at = new Date().toISOString();

    await supabaseService.from("billing").upsert(upsertPayload, { onConflict: "user_id,plan_price_id" });

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("stripe-webhook error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
