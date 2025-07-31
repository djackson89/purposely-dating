import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { count = 5 } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert at creating spicy, flirty conversation starters for late-night girl talk. 

CATEGORY: Pillow Talk & Tea
THEME: Bedroom confessions, spicy secrets, and flirty conversations designed to spark playful, sexy, or slightly scandalous dialogue among female friends via text.

TONE: Fun, intimate, cheeky, bold, with a vibe of friendship, laughter, and trust. Think late-night girl talk with a glass of wine in hand.

FORMAT: Multiple choice questions with exactly 4 suggestive or revealing options per question (A, B, C, D).

STYLE EXAMPLES (use these as inspiration for tone and content):
1. "What's your ultimate turn-on during a makeout session?" (A: Neck kisses, B: Whispering in my ear, C: Hands exploring slowly, D: Being pinned down)
2. "What's your post-hookup guilty pleasure?" (A: Stealing his hoodie, B: Replaying the whole night in my head, C: Posting a thirst trap, D: Texting my bestie a full recap)
3. "Where's your fantasy spot to hook up at least once?" (A: In a hotel elevator, B: On the beach at night, C: Backseat of a car, D: In his office after hours)
4. "What makes you feel instantly sexy in the bedroom?" (A: Wearing lingerie he hasn't seen, B: When he's obsessed with every inch of me, C: That first look before things get heated, D: Knowing I'm the one in control tonight)
5. "What's your late-night text likely to say?" (A: "U up?", B: "You better not fall asleep on me 😈", C: "Come over. Now.", D: "Just a fire selfie with no caption")

Generate questions that feel like something you'd text in a group chat with your best girlfriends - flirty, bold, intimate, playful, and slightly provocative but always with trust and friendship at the core.

Return ONLY a JSON array of objects in this exact format:
[
  {
    "statement": "Question text here?",
    "options": [
      {"key": "A", "text": "Option A text"},
      {"key": "B", "text": "Option B text"},
      {"key": "C", "text": "Option C text"},
      {"key": "D", "text": "Option D text"}
    ]
  }
]`;

    const userPrompt = `Generate ${count} new "Pillow Talk & Tea" multiple choice questions that match the style and tone of the examples. Each question should be flirty, intimate, and perfect for late-night girlfriend conversations. Make them spicy but fun, bold but trusting.`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response from OpenAI');
    }

    let generatedQuestions;
    try {
      generatedQuestions = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', data.choices[0].message.content);
      throw new Error('Failed to parse generated questions');
    }

    // Validate the structure
    if (!Array.isArray(generatedQuestions)) {
      throw new Error('Generated questions should be an array');
    }

    // Ensure each question has the correct structure
    const validatedQuestions = generatedQuestions.map((q, index) => {
      if (!q.statement || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
        console.error(`Invalid question structure at index ${index}:`, q);
        throw new Error(`Invalid question structure at index ${index}`);
      }
      
      // Ensure options have correct format
      q.options.forEach((option, optIndex) => {
        if (!option.key || !option.text) {
          throw new Error(`Invalid option structure at question ${index}, option ${optIndex}`);
        }
      });
      
      return q;
    });

    return new Response(JSON.stringify({ questions: validatedQuestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-pillow-talk-questions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});