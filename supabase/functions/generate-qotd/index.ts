import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audience = 'woman→man', count = 14, tone = 'curious, warm, direct, playful-but-substantive', depth = 5 } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const system = `You generate smart, emotionally intelligent dating questions for long-term compatibility. Output JSON ONLY.`;

    const user = `Objective: Generate ${count} fresh, deep, non-generic questions for audience "${audience}".
Tone: ${tone}
Depth: ${depth}
Return an array of JSON objects with fields: question (14–28 words), angle, tags (subset of [values,conflict,trust,family,ambition,intimacy,faith,finances,healing,boundaries]), follow_ups (0–2 strings), depth_score (4 or 5).
Rules: Be specific, no cliches, single high-leverage moment per question, safe and non-clinical. JSON only, no preface.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.6,
        max_tokens: 1800
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('OpenAI error', text);
      return new Response(JSON.stringify({ error: 'Generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';

    // Attempt to parse JSON array from response
    let parsed;
    try {
      parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
    } catch {
      // Try to extract JSON array substring
      const match = content.match(/\[([\s\S]*)\]/);
      parsed = match ? JSON.parse(match[0]) : [];
    }

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('generate-qotd error', err);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
