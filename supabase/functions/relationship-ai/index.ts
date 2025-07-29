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
        temperature: type === 'intimacy' ? 0.8 : 0.7,
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