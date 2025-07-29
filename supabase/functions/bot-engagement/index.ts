import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const womenNames = [
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia',
  'Harper', 'Evelyn', 'Abigail', 'Emily', 'Elizabeth', 'Mila', 'Ella', 'Avery',
  'Sofia', 'Camila', 'Aria', 'Scarlett', 'Victoria', 'Madison', 'Luna', 'Grace',
  'Chloe', 'Penelope', 'Layla', 'Riley', 'Zoey', 'Nora', 'Lily', 'Eleanor',
  'Hannah', 'Lillian', 'Addison', 'Aubrey', 'Ellie', 'Stella', 'Natalie', 'Zoe',
  'Leah', 'Hazel', 'Violet', 'Aurora', 'Savannah', 'Audrey', 'Brooklyn', 'Bella', 'Claire', 'Skylar'
];

const sampleComments = [
  "Girl, RUN! This is beyond disrespectful 💔",
  "Your dignity is worth more than this relationship",
  "He's training you to accept less. Don't let him!",
  "The audacity! You deserve someone who celebrates you",
  "This isn't love - love doesn't humiliate you publicly",
  "Trust your gut feeling. It's trying to protect you",
  "A real man builds you up, not tears you down",
  "You're not broken, your picker just needs an upgrade",
  "He's showing you who he is - believe him",
  "Standards aren't asking too much, they're the minimum"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, scenario_index } = await req.json();

    if (action === 'create_bots') {
      console.log('Creating bot users...');
      
      // Create 50 bot users
      const botsToCreate = womenNames.map((name, index) => ({
        name: name,
        bio: `Empowering women to know their worth 💖`,
        personality_traits: { supportive: true, direct: true },
        is_active: true,
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      }));

      const { data: bots, error: botError } = await supabase
        .from('bot_users')
        .insert(botsToCreate)
        .select();

      if (botError) throw botError;

      return new Response(JSON.stringify({ 
        success: true, 
        message: `Created ${bots.length} bot users`,
        bots: bots 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'simulate_engagement') {
      console.log(`Simulating engagement for scenario ${scenario_index}...`);
      
      // Get active bots
      const { data: bots } = await supabase
        .from('bot_users')
        .select('*')
        .eq('is_active', true)
        .limit(10);

      if (!bots || bots.length === 0) {
        throw new Error('No bots available');
      }

      // Create comments from 10 random bots
      const commentsToCreate = sampleComments.slice(0, 10).map((comment, index) => ({
        scenario_index: scenario_index,
        content: comment,
        bot_user_id: bots[index % bots.length].id,
        user_id: null
      }));

      const { error: commentError } = await supabase
        .from('scenario_comments')
        .insert(commentsToCreate);

      if (commentError) throw commentError;

      // Simulate likes (1400-1900)
      const likesCount = Math.floor(Math.random() * 501) + 1400;
      const sharesCount = Math.floor(Math.random() * 301) + 800;

      // Note: You'll need to implement the likes/shares simulation
      // based on your specific requirements

      return new Response(JSON.stringify({ 
        success: true,
        message: `Simulated ${commentsToCreate.length} comments`,
        stats: { likes: likesCount, shares: sharesCount }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});