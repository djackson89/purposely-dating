import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const { userProfile, userId } = await req.json();
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting question pool population for user:', userId);

    // Check if user already has questions in the pool
    const { data: existingQuestions, error: checkError } = await supabase
      .from('conversation_starters_pool')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing questions:', checkError);
    } else if (existingQuestions && existingQuestions.length > 0) {
      console.log('User already has questions in pool, skipping generation');
      return new Response(JSON.stringify({ 
        success: true, 
        questionsGenerated: 0,
        message: 'Question pool already exists' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Define all categories to populate
    const categories = [
      'First Date Deep Dive',
      'Date Night Debates', 
      'Relationship Talk',
      'Trust & Boundaries',
      'Communication Style',
      'Red Flag Radar',
      'Mental Health & Growth',
      'Future & Values',
      'Self Discovery',
      'Intimacy & Connection',
      'Pillow Talk & Tea'
    ];

    // Define depth levels
    const depthLevels = [1, 2, 3]; // Casual, Deep, Intimate

    const questionsToInsert = [];

    for (const category of categories) {
      for (const depthLevel of depthLevels) {
        console.log(`Generating questions for ${category} at depth ${depthLevel}`);
        
        // Create appropriate prompt based on category and depth
        let prompt = '';
        let systemPrompt = `You are an expert relationship coach who creates emotionally intelligent conversation starters. The user has these characteristics:
        - Love Language: ${userProfile?.loveLanguage || 'Unknown'}
        - Relationship Status: ${userProfile?.relationshipStatus || 'Unknown'}
        - Age: ${userProfile?.age || 'Unknown'}
        - Gender: ${userProfile?.gender || 'Unknown'}
        - Personality Type: ${userProfile?.personalityType || 'Unknown'}`;

        // Adjust prompts based on category
        if (category === 'Pillow Talk & Tea') {
          prompt = `Generate 25 multiple-choice questions for a "girl's night" conversation game about bedroom confessions, spicy secrets, and flirty topics. Each question should have a statement followed by 4 suggestive, revealing options labeled A, B, C, D. The tone should be fun, intimate, cheeky, bold, and playful - like late-night girl talk with wine in hand. Focus on turn-ons, hookup stories, fantasies, bedroom moves, post-hookup thoughts, and intimate confessions that girlfriends share with each other. Make them slightly provocative but always with a vibe of friendship, laughter, and trust. Format as: "Statement?" with options A. [option] B. [option] C. [option] D. [option].`;
        } else if (category === 'Date Night Debates') {
          prompt = `Generate 25 multiple-choice debate questions about controversial relationship topics. Each should have a provocative statement followed by 4 options labeled A, B, C, D that range from strongly agree to strongly disagree. Focus on topics like dating standards, relationship expectations, gender roles, and modern dating challenges. Make them thought-provoking and likely to spark interesting discussions. Format as: "Statement?" with options A. [option] B. [option] C. [option] D. [option].`;
        } else {
          // Regular conversation starters for other categories
          const categoryDescriptions = {
            'First Date Deep Dive': 'first date conversations that go beyond surface level',
            'Relationship Talk': 'relationship dynamics, expectations, and experiences', 
            'Trust & Boundaries': 'trust, transparency, and boundaries in relationships',
            'Communication Style': 'emotional intelligence, conflict resolution, and communication patterns',
            'Red Flag Radar': 'identifying healthy versus unhealthy relationship patterns',
            'Mental Health & Growth': 'emotional maturity, self-awareness, and psychological health',
            'Future & Values': 'life values, future compatibility, and shared vision',
            'Self Discovery': 'personal development, self-awareness, and emotional growth',
            'Intimacy & Connection': 'emotional and physical intimacy in relationships'
          };
          
          const depthDescriptions = {
            1: 'casual and approachable',
            2: 'deeper and more thought-provoking', 
            3: 'intimate and profound'
          };
          
          prompt = `Generate 25 ${depthDescriptions[depthLevel]} conversation starter questions about ${categoryDescriptions[category] || category.toLowerCase()}. Make them emotionally intelligent, specific enough that someone thinks "That's such a good question, I never thought about that." Focus on authentic connection and meaningful dialogue.`;
        }

        try {
          // Make API call to OpenAI
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
              max_tokens: 2000,
              temperature: 0.7,
            }),
          });

          if (!response.ok) {
            console.error(`OpenAI API error for ${category} depth ${depthLevel}`);
            continue;
          }

          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // Parse questions based on category type
          let questions = [];
          
          if (category === 'Pillow Talk & Tea' || category === 'Date Night Debates') {
            // Parse multiple choice questions
            const responseLines = aiResponse.split('\n').filter(line => line.trim());
            
            for (let i = 0; i < responseLines.length; i++) {
              const line = responseLines[i].trim();
              if (line.includes('?') && !line.match(/^[A-D]\./)) {
                const statement = line;
                const options = [];
                
                for (let j = 1; j <= 4 && (i + j) < responseLines.length; j++) {
                  const optionLine = responseLines[i + j].trim();
                  const optionMatch = optionLine.match(/^([A-D])\.\s*(.+)$/);
                  if (optionMatch) {
                    options.push({
                      key: optionMatch[1],
                      text: optionMatch[2]
                    });
                  }
                }
                
                if (options.length >= 4) {
                  questions.push({
                    statement: statement,
                    options: options.slice(0, 4)
                  });
                  i += 4; // Skip the option lines we just processed
                }
              }
            }
          } else {
            // Parse regular questions
            questions = aiResponse.split('\n')
              .filter(line => line.trim() && line.includes('?'))
              .map(line => 
                line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, "'").replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
              )
              .slice(0, 25);
          }

          // Add questions to insert array
          for (const question of questions) {
            questionsToInsert.push({
              user_id: userId,
              category: category,
              depth_level: depthLevel,
              question: question
            });
          }

          console.log(`Generated ${questions.length} questions for ${category} depth ${depthLevel}`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error generating questions for ${category} depth ${depthLevel}:`, error);
          continue;
        }
      }
    }

    // Insert all questions into the pool
    if (questionsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('conversation_starters_pool')
        .insert(questionsToInsert);

      if (insertError) {
        console.error('Error inserting questions:', insertError);
        throw new Error('Failed to populate question pool');
      }
    }

    console.log(`Successfully populated pool with ${questionsToInsert.length} questions for user ${userId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      questionsGenerated: questionsToInsert.length,
      message: 'Question pool populated successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in populate-question-pool function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});