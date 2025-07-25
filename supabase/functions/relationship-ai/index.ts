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
    const { prompt, userProfile, type } = await req.json();
    
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
        systemPrompt = `You are a compassionate relationship therapist with expertise in attachment theory, communication patterns, and emotional intelligence. The user you're helping has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Gender: ${userProfile?.gender || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        Provide warm, professional, and actionable relationship advice. Keep responses under 200 words and focus on practical steps they can take.`;
        break;
        
      case 'flirt':
        systemPrompt = `You are a charismatic dating coach who helps people with flirting and romantic communication. The user has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        Provide fun, confident, and appropriate flirting suggestions that match their personality and love language. Keep it playful and respectful.`;
        break;
        
      case 'date':
        systemPrompt = `You are a creative date planning expert who designs memorable romantic experiences. The user has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}
        
        Suggest creative, personalized date ideas that align with their love language and personality. Consider their relationship status and provide practical, achievable suggestions.`;
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
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

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