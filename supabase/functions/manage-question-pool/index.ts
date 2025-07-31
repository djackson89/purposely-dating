import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userProfile, category, depthLevel, questionsToGenerate = 20 } = await req.json();
    
    console.log(`Managing question pool - Action: ${action}, Category: ${category}, Depth: ${depthLevel}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user ID from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    if (action === 'populate_pool') {
      // Generate questions using AI
      const prompt = buildPromptForCategory(category, depthLevel, userProfile, questionsToGenerate);
      
      console.log('Generating questions with AI...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert at creating engaging conversation starters and questions.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      
      console.log('Raw AI response:', generatedContent);

      // Parse the generated questions
      const questions = parseGeneratedQuestions(generatedContent, category);
      console.log(`Parsed ${questions.length} questions for pool`);

      // Insert questions into the pool
      const poolInserts = questions.map(question => ({
        user_id: user.id,
        category,
        depth_level: depthLevel,
        question: question
      }));

      const { error: insertError } = await supabaseClient
        .from('conversation_starters_pool')
        .insert(poolInserts);

      if (insertError) {
        console.error('Error inserting questions into pool:', insertError);
        throw insertError;
      }

      console.log(`Successfully added ${questions.length} questions to pool`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          questionsAdded: questions.length,
          message: `Added ${questions.length} questions to the pool`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_pool_question') {
      // Get a question from the pool using the database function
      const { data: question, error: poolError } = await supabaseClient
        .rpc('get_pool_question', {
          p_user_id: user.id,
          p_category: category,
          p_depth_level: depthLevel
        });

      if (poolError) {
        console.error('Error getting pool question:', poolError);
        return new Response(
          JSON.stringify({ success: false, error: poolError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          question: question,
          hasQuestion: question !== null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_pool_count') {
      // Check how many questions are left in the pool
      const { data: count, error: countError } = await supabaseClient
        .rpc('count_pool_questions', {
          p_user_id: user.id,
          p_category: category,
          p_depth_level: depthLevel
        });

      if (countError) {
        console.error('Error counting pool questions:', countError);
        throw countError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          count: count || 0,
          needsRefresh: (count || 0) < 10
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Error in manage-question-pool function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildPromptForCategory(category: string, depthLevel: number, userProfile: any, questionsToGenerate: number): string {
  const baseContext = `
User Profile:
- Love Language: ${userProfile?.loveLanguage || 'Unknown'}
- Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
- Age: ${userProfile?.age || 'Unknown'}
- Gender: ${userProfile?.gender || 'Unknown'}
- Personality Type: ${userProfile?.personalityType || 'Unknown'}

Generate ${questionsToGenerate} conversation starters for category "${category}" at depth level ${depthLevel}.
`;

  if (category === 'Pillow Talk & Tea') {
    return `${baseContext}

You are generating intimate, playful conversation starters for "Pillow Talk & Tea" - these are meant for private conversations between romantic partners, focusing on personal desires, intimate thoughts, and romantic confessions.

Depth Level Guidelines:
- Level 1 (Light & Playful): Fun, flirty questions that spark giggles and light intimacy
- Level 2 (Deeper Connection): More personal questions about desires and intimate thoughts  
- Level 3 (Deep Intimacy): Very personal, vulnerable questions about deepest desires and fantasies

IMPORTANT FORMAT REQUIREMENTS:
1. Each question must be a JSON object with either:
   - Simple format: {"text": "question text here"}
   - Multiple choice format: {"text": "question text here", "options": ["option1", "option2", "option3", "option4"]}

2. Provide EXACTLY ${questionsToGenerate} questions
3. Each question should be on its own line as a complete JSON object
4. No additional text, explanations, or formatting - just the JSON objects

Examples for Level ${depthLevel}:
${depthLevel === 1 ? `{"text": "What's the most romantic thing someone could do for you right now?"}
{"text": "If you could plan the perfect date night, what would it look like?", "options": ["Cozy night in", "Adventure outdoors", "Fancy dinner", "Something spontaneous"]}` : ''}
${depthLevel === 2 ? `{"text": "What's something you've always wanted to try but never told anyone?"}
{"text": "When do you feel most confident and attractive?", "options": ["When I'm dressed up", "In intimate moments", "When I'm being myself", "When someone compliments me"]}` : ''}
${depthLevel === 3 ? `{"text": "What's your deepest desire that you've never shared with anyone?"}
{"text": "What makes you feel most emotionally connected to someone?", "options": ["Deep conversations", "Physical intimacy", "Shared experiences", "Acts of service"]}` : ''}

Generate ${questionsToGenerate} questions now:`;
  }

  // Default prompt for other categories
  return `${baseContext}

Generate engaging conversation starters that are appropriate for the category and depth level.
Each question should be returned as a JSON object with the format:
{"text": "question text here"}

Or for multiple choice questions:
{"text": "question text here", "options": ["option1", "option2", "option3", "option4"]}

Generate ${questionsToGenerate} questions now:`;
}

function parseGeneratedQuestions(content: string, category: string): any[] {
  const questions: any[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
    
    try {
      // Try to parse each line as JSON
      const parsed = JSON.parse(trimmed);
      if (parsed.text) {
        questions.push(parsed);
      }
    } catch (e) {
      // If JSON parsing fails, try to extract text from the line
      if (trimmed.includes('"text"') && trimmed.includes('"')) {
        try {
          // Try to fix common JSON formatting issues
          let fixed = trimmed;
          if (!fixed.startsWith('{')) fixed = '{' + fixed;
          if (!fixed.endsWith('}')) fixed = fixed + '}';
          
          const parsed = JSON.parse(fixed);
          if (parsed.text) {
            questions.push(parsed);
          }
        } catch (e2) {
          console.warn('Could not parse line:', trimmed);
        }
      }
    }
  }
  
  console.log(`Successfully parsed ${questions.length} questions from AI response`);
  return questions;
}