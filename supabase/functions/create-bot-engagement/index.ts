import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const botNames = [
  "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Charlotte", "Mia", "Amelia",
  "Harper", "Evelyn", "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery",
  "Sofia", "Camila", "Aria", "Scarlett", "Victoria", "Madison", "Luna", "Grace",
  "Chloe", "Penelope", "Layla", "Riley", "Zoey", "Nora", "Lily", "Eleanor",
  "Hannah", "Lillian", "Addison", "Aubrey", "Ellie", "Stella", "Natalie", "Zoe",
  "Leah", "Hazel", "Violet", "Aurora", "Savannah", "Audrey", "Brooklyn", "Bella",
  "Claire", "Skylar"
];

const commentTemplates = [
  "OMG this is so relatable! Going through the same thing right now 😭",
  "This perspective really opened my eyes. Thank you for sharing!",
  "I needed to hear this today. Sometimes we overthink everything.",
  "Wait... this actually makes so much sense. Why didn't I think of this?",
  "This is exactly what my therapist told me last week!",
  "Girl, you're not alone in this. We've all been there 💕",
  "Such a healthy way to look at it. Love this advice!",
  "This hits different when you're going through it yourself",
  "Wow, I never considered this angle before. Mind blown!",
  "Finally someone who gets it! This is so validating."
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { action, scenarioIndex } = await req.json()

    if (action === 'create_bots') {
      // Create 50 bot users
      const botUsers = []
      
      for (let i = 0; i < botNames.length; i++) {
        const name = botNames[i]
        const email = `${name.toLowerCase()}bot${i + 1}@purposely.app`
        const password = `BotUser${i + 1}!`
        
        try {
          // Create auth user
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: name,
              is_bot: true
            }
          })

          if (userError) {
            console.error(`Error creating bot user ${name}:`, userError)
            continue
          }

          // Assign bot role
          await supabaseAdmin.from('user_roles').insert({
            user_id: userData.user.id,
            role: 'bot'
          })

          // Update profile with bot data
          await supabaseAdmin.from('profiles').update({
            full_name: name,
            love_language: ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service', 'Receiving Gifts'][Math.floor(Math.random() * 5)],
            relationship_status: ['Single', 'In a relationship', 'Married', 'Dating'][Math.floor(Math.random() * 4)],
            age: ['18-24', '25-34', '35-44', '45+'][Math.floor(Math.random() * 4)],
            gender: 'Female',
            personality_type: ['INFP', 'ENFP', 'ISFJ', 'ESFJ', 'INFJ', 'ENFJ'][Math.floor(Math.random() * 6)]
          }).eq('id', userData.user.id)

          botUsers.push({
            id: userData.user.id,
            name: name,
            email: email
          })

        } catch (error) {
          console.error(`Failed to create bot ${name}:`, error)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Created ${botUsers.length} bot users`,
          bots: botUsers 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (action === 'generate_engagement' && scenarioIndex !== undefined) {
      // Get random bot users
      const { data: bots } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('gender', 'Female')
        .limit(10)

      if (!bots || bots.length === 0) {
        throw new Error('No bot users found. Create bots first.')
      }

      // Generate comments from 10 random bots
      const comments = []
      for (let i = 0; i < 10; i++) {
        const bot = bots[i % bots.length]
        const comment = commentTemplates[i]
        
        const { data: commentData } = await supabaseAdmin
          .from('scenario_comments')
          .insert({
            scenario_index: scenarioIndex,
            user_id: bot.id,
            content: comment
          })
          .select()
          .single()

        if (commentData) {
          comments.push({
            id: commentData.id,
            content: comment,
            author: bot.full_name
          })
        }
      }

      // Generate likes (1400-1900)
      const likeCount = Math.floor(Math.random() * 500) + 1400
      const botLikers = bots.slice(0, Math.min(likeCount, bots.length))
      
      for (const bot of botLikers) {
        await supabaseAdmin
          .from('scenario_interactions')
          .insert({
            scenario_index: scenarioIndex,
            user_id: bot.id,
            interaction_type: 'like'
          })
      }

      // Generate shares (800-1100)
      const shareCount = Math.floor(Math.random() * 300) + 800
      const botSharers = bots.slice(0, Math.min(shareCount, bots.length))
      
      for (const bot of botSharers) {
        await supabaseAdmin
          .from('scenario_interactions')
          .insert({
            scenario_index: scenarioIndex,
            user_id: bot.id,
            interaction_type: 'share'
          })
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Generated engagement for scenario ${scenarioIndex}`,
          comments: comments.length,
          likes: likeCount,
          shares: shareCount
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-bot-engagement function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})