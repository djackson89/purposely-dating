import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_PRICE_YEARLY_PREMIUM = Deno.env.get("STRIPE_PRICE_YEARLY_PREMIUM") || "";
const TZ = "America/Chicago";

// Simple in-memory cache
let cacheData: any = null;
let cacheAt = 0;
let cacheDataPresence: any = null;
let cacheAtPresence = 0;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const bypass = url.searchParams.get("bypass_cache") === "1";

  try {
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userErr } = await supabaseAnon.auth.getUser(token);
    if (userErr || !userData.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Check admin role via user_roles
    const { data: roles } = await supabaseAnon.from("user_roles").select("role").eq("user_id", userData.user.id);
    const isAdmin = roles?.some((r: any) => r.role === "admin");
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const now = Date.now();

    // Presence cache (5s)
    let presence: number | null = null;
    if (!bypass && cacheDataPresence && now - cacheAtPresence < 5000) {
      presence = cacheDataPresence;
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (presence === null) {
      const { data: pres } = await supabaseService
        .from("presence")
        .select("user_id", { count: "exact", head: true })
        .gte("last_seen_at", new Date(Date.now() - 120000).toISOString());
      presence = pres ? (pres as any).length ?? 0 : ((pres as any)?.count ?? 0);
      // When using head:true, supabase-js returns data=null and count='exact' number via .count
      const { count } = await supabaseService
        .from("presence")
        .select("user_id", { count: "exact", head: true })
        .gte("last_seen_at", new Date(Date.now() - 120000).toISOString());
      presence = count ?? 0;
      cacheDataPresence = presence;
      cacheAtPresence = now;
    }

    // Other counters cache (60s)
    if (!bypass && cacheData && now - cacheAt < 60000) {
      const merged = { ...cacheData };
      merged.totals.active_now = presence;
      return new Response(JSON.stringify(merged), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: rpc, error: rpcErr } = await supabaseService.rpc("admin_metrics", { tz: TZ, price_id: STRIPE_PRICE_YEARLY_PREMIUM });
    if (rpcErr) throw rpcErr;
    const payload = { ...(rpc || {}), totals: { ...(rpc?.totals || {}), active_now: presence }, generated_at: new Date().toISOString(), tz: TZ };

    cacheData = payload;
    cacheAt = now;

    return new Response(JSON.stringify(payload), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("admin-metrics error", e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
