import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-INTIMACY-ADDON] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Auth via anon key to read current user from token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Ensure user has an active Premium subscription before allowing add-on
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found. Subscribe to Premium first.");
    }
    const customerId = customers.data[0].id;

    const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10, expand: ["data.items.data.price"] });
    // Allow users who are active OR trialing on Premium (weekly/yearly)
    const hasEligiblePremium = subs.data.some((sub) => {
      const status = sub.status;
      const eligibleStatus = status === "active" || status === "trialing";
      const hasPremiumItem = sub.items.data.some((item) => {
        const interval = item.price?.recurring?.interval;
        return interval === "week" || interval === "year";
      });
      return eligibleStatus && hasPremiumItem;
    });
    if (!hasEligiblePremium) {
      throw new Error("No active or trialing Premium subscription. Please subscribe to Premium first.");
    }

    // Create a checkout session for the $2.99/week add-on, no trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "18+ Intimacy Add-on" },
            unit_amount: 299,
            recurring: { interval: "week" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/?addon=intimacy_success`,
      cancel_url: `${req.headers.get("origin")}/`,
      allow_promotion_codes: false,
      automatic_tax: { enabled: true },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
