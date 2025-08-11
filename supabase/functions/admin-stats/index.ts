import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-STATS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

    // Client for auth user retrieval (uses anon)
    const supabaseAuthClient = createClient(supabaseUrl, anonKey);

    // Client with service role for admin operations
    const supabaseService = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAuthClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not found");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check admin role
    const { data: roles, error: rolesError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1);

    if (rolesError) throw new Error(`Roles query failed: ${rolesError.message}`);
    const isAdmin = roles && roles.length > 0;
    if (!isAdmin) {
      logStep("Forbidden: user is not admin");
      return new Response(JSON.stringify({ error: "forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // List all users and count
    let totalUsers = 0;
    let todaySignups = 0;
    let page = 1;
    const perPage = 200;

    // Compute Chicago (CST/CDT) midnight in UTC for today
    const now = new Date();
    const chicagoNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const tzOffsetMs = now.getTime() - chicagoNow.getTime();
    const chicagoMidnightLocal = new Date(
      chicagoNow.getFullYear(), chicagoNow.getMonth(), chicagoNow.getDate(), 0, 0, 0, 0
    );
    const chicagoMidnightUtc = new Date(chicagoMidnightLocal.getTime() + tzOffsetMs);
    logStep("Computed Chicago midnight UTC", { chicagoMidnightUtc: chicagoMidnightUtc.toISOString() });

    while (true) {
      const { data: usersPage, error } = await supabaseService.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`listUsers failed: ${error.message}`);

      const users = usersPage?.users ?? [];
      totalUsers += users.length;

      for (const u of users) {
        const created = new Date(u.created_at);
        if (created >= chicagoMidnightUtc) todaySignups += 1;
      }

      if (!usersPage || users.length < perPage) break;
      page += 1;
    }

    logStep("Counts computed", { totalUsers, todaySignups });

    return new Response(
      JSON.stringify({ total_users: totalUsers, today_signups_cst: todaySignups }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});