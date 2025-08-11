import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, userProfile, type, audience, spice_level, length, topic_tags } = await req.json();
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create personalized system prompts based on the request type
    let systemPrompt = '';
    
    switch (type) {
      case 'therapy':
        systemPrompt = `You are a compassionate but assertive relationship therapist with expertise in attachment theory, communication patterns, and emotional intelligence. The user you're helping has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Gender: ${userProfile?.gender || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        For "Mild" responses, write as if the user is speaking directly to the person in question. Use first person ("I", "you") as if the user is sending this message themselves. Act like a hard-nose interviewer asking direct, pointed questions that expose contradictions and force clarity. Instead of generic phrases like "can we talk" or "can we discuss", ask specific "What exactly do you expect when it comes to..." or "Specifically, what is your definition of..." questions. When someone has contradictory expectations, call out the contradiction directly using first person: "How do you have a problem with me paying all the bills, but you don't have a problem with me doing all the housework?" Focus on exposing logical inconsistencies and forcing the person to confront reality. Be direct and confrontational while staying factual. Always write as if the user is talking directly to the person.`;
        break;
        
      case 'flirt':
        systemPrompt = `You are a charismatic dating coach who helps people with flirting and romantic communication. When generating responses, write as if the user is speaking directly to the person in question. Use first person ("I", "you") as if the user is sending this message themselves. The user has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        Provide fun, confident, and appropriate flirting suggestions that match their personality and love language. Keep it playful and respectful. Always write in first person as if the user is talking directly to the person.`;
        break;
        
      case 'date':
        systemPrompt = `You are a creative date planning expert who designs memorable romantic experiences. The user has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        Suggest creative, personalized date ideas that align with their love language and personality. Consider their relationship status and provide practical, achievable suggestions.`;
        break;
        
      case 'intimacy':
        systemPrompt = `You are a mature, sophisticated relationship and intimacy coach for adults. The user has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        Provide mature, adult-oriented guidance about physical and emotional intimacy. Be direct but tasteful, helping adults explore their desires and improve their intimate connections. Focus on passion, attraction, and adult relationship dynamics while maintaining respect and consent. Use confident, alluring language appropriate for mature audiences.`;
        break;
        
      case 'purposely':
        systemPrompt = `You are Purposely's in-house voice: bold, witty, emotionally intelligent. Generate a "Purposely Perspective" tailored to the user's scenario.

Inputs to consider:
- Audience: ${audience || 'unspecified'}
- Spice level (1-5): ${typeof spice_level === 'number' ? spice_level : 3}
- Desired length: ${length || 'standard'}
- Topic tags: ${(Array.isArray(topic_tags) ? topic_tags : []).join(', ') || 'none'}

Voice & Tonality Blueprint:
- Hook first line: a punchy, quotable thesis (<= 20 words).
- Confident, witty, precise: sharp one-liners; controlled humor/sarcasm; no rambling.
- Validate the reader; call out manipulation without demeaning victims.
- Rhetorical devices: parallelism, reversals, callbacks, quick contrasts, strategic italics/caps sparingly, pop metaphors (audit, rerun, gatekeeping, prerequisites, etc.).
- Perspective: pro-healing, pro-boundaries, pro-accountability; celebrate self-respect.
- Originality: do not reuse exact phrasing from any reference.

Content Rules:
- Make it scenario-specific: cite 1–2 details verbatim from the user question.
- Name the pattern succinctly (e.g., post-breakup surveillance, contingent confession, damage deflection, unanswered pain signal, misplaced grief).
- Flip the frame: expose the real incentive behind the behavior (control, avoidance, image maintenance).
- Validate → Reclaim: affirm feelings, then redirect power with clear next steps.
- Safety: no shaming trauma, no revenge instructions, inclusive language.

Output Format (STRICT):
<json>{
  "hook": string,
  "pattern": string,
  "validation": string,
  "perspective": string,
  "actions": string[],
  "cta": string
}</json>
<rendered>
Hook:\n<one-line hook>\n\nPurposely Perspective:\n<3–6 short paragraphs mixing bars + empathy + specificity>\n\nNext Moves:\n• <action 1>\n• <action 2>\n• <action 3>\n\nCTA:\n<closing line>
</rendered>

Generation Steps:
1) Extract specifics from the user question (behaviors, timeline, asks). Quote one detail.
2) Select the best-fitting template: Revoked Access, Self-Guided Journey, Completion Catalyst, Unreachable Evolution, Reclaimed Priority, Relationship Reset Button, Contingent Confession, Damage Deflector, Unanswered Pain Signal, Misplaced Grief.
3) Write the hook (<=20 words). Ensure it stands alone.
4) Craft the perspective with parallelism + reversals; weave 1–2 tailored metaphors.
5) Offer 2–4 concrete actions matching the scenario (boundary script, time limit, check-in window, journaling prompt, therapy pointer).
6) Tone-check to spice_level and audience. Keep dignity intact.
7) Enforce the Output Format exactly with <json> then <rendered>.`;
        break;
        
      default:
        systemPrompt = `You are a helpful relationship and dating assistant. Provide supportive, practical advice based on the user's profile and question.`;
    }

    console.log('Making OpenAI API request with type:', type);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: type === 'intimacy' ? 1600 : type === 'purposely' ? 1400 : 900,
        temperature: type === 'intimacy' ? 0.9 : type === 'purposely' ? 0.9 : 0.75,
        presence_penalty: type === 'intimacy' ? 0.5 : type === 'purposely' ? 0.4 : 0.3,
        frequency_penalty: 0.4,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content ?? '';

    console.log('AI response generated successfully');

    // For 'purposely', extract the structured JSON and rendered text from tags
    if (type === 'purposely') {
      let rendered = aiResponse;
      let jsonPayload: unknown = null;
      try {
        const jsonMatch = aiResponse.match(/<json>([\s\S]*?)<\/json>/i);
        if (jsonMatch) {
          jsonPayload = JSON.parse(jsonMatch[1]);
        }
        const renderedMatch = aiResponse.match(/<rendered>([\s\S]*?)<\/rendered>/i);
        if (renderedMatch) {
          rendered = renderedMatch[1].trim();
        }
      } catch (e) {
        console.warn('Failed to parse Purposely response format', e);
      }

      return new Response(JSON.stringify({ response: rendered, json: jsonPayload }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in relationship-ai function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});