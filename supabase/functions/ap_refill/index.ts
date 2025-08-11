import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-service-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

const TARGET_STOCK = 300;
const MIN_STOCK = 120;
const BATCH_SIZE = 30;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateBatch(n: number) {
  const system = 'You write fictional, anonymous, user-submitted relationship dilemmas (Ask Purposely). Return STRICT JSON.';
  const user = `Return a STRICT JSON array with exactly ${n} items. Each item must be an object with keys: question (string), perspective (string), tags (array of 1-4 short keywords). No markdown, no backticks, no commentary.`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.8,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const content: string = data.choices?.[0]?.message?.content ?? "[]";
  let arr: any[] = [];
  try {
    arr = JSON.parse(content);
  } catch {
    const m = content.match(/\[[\s\S]*\]/);
    if (m) arr = JSON.parse(m[0]);
  }
  if (!Array.isArray(arr)) arr = [];
  return arr.map((x) => ({
    question: String(x?.question || "").trim(),
    perspective: String(x?.perspective || String(x?.answer || "")).trim(),
    tags: Array.isArray(x?.tags) ? x.tags.slice(0, 4).map((t: any) => String(t)) : [],
  })).filter((x) => x.question && x.perspective);
}

async function handleRefill(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Auth: require service role key in Authorization or x-service-key
  const auth = req.headers.get('authorization') || '';
  const svc = req.headers.get('x-service-key') || '';
  const ok = auth === `Bearer ${SERVICE_ROLE_KEY}` || svc === SERVICE_ROLE_KEY;
  if (!ok) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  // Count available stock
  const { count: availableCount, error: countErr } = await supabase
    .from('ap_seed')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'available');
  if (countErr) {
    console.error('count error', countErr);
    return new Response(JSON.stringify({ error: countErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const available = availableCount || 0;
  if (available >= MIN_STOCK) {
    return new Response(JSON.stringify({ inserted: 0, available }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const toGenerate = Math.max(0, TARGET_STOCK - available);
  let inserted = 0;

  try {
    let remaining = toGenerate;
    while (remaining > 0) {
      const n = Math.min(BATCH_SIZE, remaining);
      const batch = await generateBatch(n);
      const rows = await Promise.all(batch.map(async (x) => ({
        question: x.question,
        perspective: x.perspective,
        tags: x.tags || [],
        hash: await sha256Hex(`${x.question}|${x.perspective}`),
        status: 'available' as const,
      })));

      if (rows.length) {
        const { data, error } = await supabase
          .from('ap_seed')
          .upsert(rows, { onConflict: 'hash', ignoreDuplicates: false });
        if (error) {
          console.error('upsert error', error);
        } else {
          inserted += data?.length ?? 0;
        }
      }

      remaining -= n;
    }
  } catch (e: any) {
    console.error('ap_refill error', e?.message || e);
    return new Response(JSON.stringify({ error: String(e?.message || e), inserted, available }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Re-count available after insert
  const { count: afterAvailable } = await supabase
    .from('ap_seed')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'available');

  return new Response(JSON.stringify({ inserted, available: afterAvailable || 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

serve(handleRefill);
