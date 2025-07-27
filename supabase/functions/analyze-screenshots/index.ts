import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScreenshotAnalysisRequest {
  images: string[]; // base64 encoded images
  context?: string; // additional context from user
  userProfile?: {
    loveLanguage: string;
    relationshipStatus: string;
    age: string;
    gender: string;
    personalityType: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const { images, context, userProfile }: ScreenshotAnalysisRequest = await req.json();

    if (!images || images.length === 0) {
      throw new Error('No images provided');
    }

    if (images.length > 6) {
      throw new Error('Maximum 6 images allowed');
    }

    console.log(`Analyzing ${images.length} screenshots`);

    // Prepare messages for OpenAI Vision API
    const content = [
      {
        type: "text",
        text: `Please analyze these ${images.length} screenshot(s) of a messaging conversation. Extract and interpret the conversation context, including:

1. What messages were exchanged
2. The tone and emotion of the conversation
3. Any relationship dynamics you can observe
4. Key context that would be helpful for crafting a response

${context ? `Additional context from user: ${context}` : ''}

${userProfile ? `User profile context:
- Love Language: ${userProfile.loveLanguage}
- Relationship Status: ${userProfile.relationshipStatus}
- Age: ${userProfile.age}
- Personality: ${userProfile.personalityType}` : ''}

Please provide:
1. A summary of the conversation content
2. The emotional tone and context
3. Suggested approach for responding
4. Any red flags or positive signs you notice

Be thorough but concise in your analysis.`
      },
      ...images.map(image => ({
        type: "image_url",
        image_url: {
          url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`
        }
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert relationship coach and conversation analyst. You help people understand messaging conversations and provide thoughtful insights for responding effectively.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Screenshot analysis completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      imageCount: images.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-screenshots function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});