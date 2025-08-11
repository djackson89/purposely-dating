import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Configurable CORS (set APP_ORIGIN in prod, e.g. https://thepurposely.app)
const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Vary": "Origin",
  "Content-Type": "application/json",
};

const TZ = "America/Chicago";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const priceId = Deno.env.get("STRIPE_PRICE_YEARLY_PREMIUM") ?? "";

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "missing_jwt" }), { status: 401, headers: cors });
    }

    // Verify the JWT using anon client scoped with the provided token
    const authClient = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: userData, error: authErr } = await authClient.auth.getUser();
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "invalid_jwt" }), { status: 401, headers: cors });
    }

    const user = userData.user;

    // Use service role for DB reads and admin guard
    const db = createClient(url, service, { auth: { persistSession: false } });

    // Admin check via user_roles table (service role bypasses RLS)
    const { data: roles, error: roleErr } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roleErr) {
      console.error("admin-metrics role check error", roleErr);
      return new Response(JSON.stringify({ error: "server_error", detail: roleErr.message }), { status: 500, headers: cors });
    }

    const isAdmin = Array.isArray(roles) && roles.some((r: any) => r.role === "admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "not_admin" }), { status: 403, headers: cors });
    }

    // Presence (<= 2 minutes)
    const twoMinAgoIso = new Date(Date.now() - 120000).toISOString();
    const { count: active_now } = await db
      .from("presence")
      .select("user_id", { count: "exact", head: true })
      .gte("last_seen_at", twoMinAgoIso);

    // Other metrics via SQL function if available, else compute with queries
    // Prefer existing admin_metrics RPC which already handles CST logic
    try {
      const { data: rpc, error: rpcErr } = await db.rpc("admin_metrics", { tz: TZ, price_id: priceId });
      if (rpcErr) throw rpcErr;
      const payload = {
        ...(rpc || {}),
        totals: { ...(rpc?.totals || {}), active_now: active_now ?? 0 },
        generated_at: new Date().toISOString(),
        tz: TZ,
      };
      return new Response(JSON.stringify(payload), { status: 200, headers: cors });
    } catch (e) {
      // Fallback direct queries if RPC missing
      // Users (profiles)
      const { count: users_all } = await db.from("profiles").select("id", { count: "exact", head: true });

      // Signups today (CST)
      const now = new Date();
      const chicagoNow = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
      const cstStart = new Date(chicagoNow.getFullYear(), chicagoNow.getMonth(), chicagoNow.getDate(), 0, 0, 0, 0);
      const cstStartIso = new Date(cstStart.getTime() + (now.getTime() - chicagoNow.getTime())).toISOString();
      const { count: signups_today } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", cstStartIso)
        .lt("created_at", new Date().toISOString());

      const { count: free_trial_now } = await db
        .from("billing")
        .select("user_id", { count: "exact", head: true })
        .eq("plan_price_id", priceId)
        .eq("status", "trialing");

      const { count: premium_active_now } = await db
        .from("billing")
        .select("user_id", { count: "exact", head: true })
        .eq("plan_price_id", priceId)
        .eq("status", "active")
        .or("trial_end.is.null")
        .lte("trial_end", new Date().toISOString());

      const { count: premium_converted_today } = await db
        .from("billing")
        .select("user_id", { count: "exact", head: true })
        .gte("premium_activated_at", cstStartIso)
        .lt("premium_activated_at", new Date().toISOString());

      const last7StartIso = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
      const { count: premium_converted_last7 } = await db
        .from("billing")
        .select("user_id", { count: "exact", head: true })
        .gte("premium_activated_at", last7StartIso)
        .lt("premium_activated_at", new Date().toISOString());

      const payload = {
        generated_at: new Date().toISOString(),
        tz: TZ,
        totals: {
          users_all: users_all ?? 0,
          signups_today: signups_today ?? 0,
          free_trial_now: free_trial_now ?? 0,
          premium_active_now: premium_active_now ?? 0,
          premium_converted_today: premium_converted_today ?? 0,
          premium_converted_last7: premium_converted_last7 ?? 0,
          active_now: active_now ?? 0,
        },
      };
      return new Response(JSON.stringify(payload), { status: 200, headers: cors });
    }
  } catch (e: any) {
    console.error("admin-metrics error", e);
    return new Response(JSON.stringify({ error: "server_error", detail: e?.message || String(e) }), { status: 500, headers: cors });
  }
});
