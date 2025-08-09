import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create separate clients: anon for auth, service role for DB writes
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    }
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Admin override: grant full access without Stripe
    const { data: rolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    const isAdmin = Array.isArray(rolesData) && rolesData.some((r: any) => r.role === 'admin');

    if (isAdmin) {
      logStep('Admin detected, granting full access');
      await supabaseAdmin.from('subscribers').upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: true,
        subscription_tier: 'Admin',
        subscription_end: null,
        has_intimacy_addon: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: 'Admin',
        subscription_end: null,
        has_intimacy_addon: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep('No customer found, updating unsubscribed state');
      await supabaseAdmin.from('subscribers').upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: null,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10,
      expand: ["data.items.data.price"],
    });
    const hasAnyActive = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;
    let hasIntimacyAddon = false;
    let hasPremium = false;

    if (hasAnyActive) {
      // Evaluate across all active subscriptions
      for (const sub of subscriptions.data) {
        // track the most distant end date
        const end = new Date(sub.current_period_end * 1000).toISOString();
        if (!subscriptionEnd || end > subscriptionEnd) subscriptionEnd = end;

        // Determine if this sub is premium by interval week/year
        const firstItem = sub.items.data[0];
        const interval = firstItem.price?.recurring?.interval;
        if (interval === 'week' || interval === 'year') {
          hasPremium = true;
          if (!subscriptionTier) {
            subscriptionTier = interval === 'week' ? 'Weekly' : 'Yearly';
          }
        }

        // Detect add-on by scanning items for $2.99/week
        const subHasAddon = sub.items.data.some((item) => {
          const price = item.price;
          return (
            price?.unit_amount === 299 &&
            price?.currency === 'usd' &&
            price?.recurring?.interval === 'week'
          );
        });
        if (subHasAddon) hasIntimacyAddon = true;
      }
      logStep("Computed subscription flags", { hasPremium, hasIntimacyAddon, subscriptionEnd, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    await supabaseAdmin.from("subscribers").upsert({
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      subscribed: hasPremium,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      has_intimacy_addon: hasIntimacyAddon,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    logStep("Updated database with subscription info", { subscribed: hasPremium, subscriptionTier, hasIntimacyAddon });
    return new Response(JSON.stringify({
      subscribed: hasPremium,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      has_intimacy_addon: hasIntimacyAddon
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    const status = errorMessage.startsWith('Authentication error') ? 401 : 500;
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status,
    });
  }
});