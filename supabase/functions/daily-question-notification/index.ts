import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserProfile {
  id: string;
  user_id: string;
  timezone?: string;
  age?: string;
  gender?: string;
  loveLanguage?: string;
  relationshipStatus?: string;
  personalityType?: string;
  push_token?: string;
  push_notifications_enabled?: boolean;
}

// Question bank categorized by relationship themes
const questionBank = {
  communication: [
    "What's one thing you wish your partner understood better about you?",
    "How do you prefer to receive feedback in your relationship?",
    "What conversation have you been avoiding that could bring you closer?",
    "When do you feel most heard by your partner?"
  ],
  intimacy: [
    "What makes you feel most connected to your partner?",
    "How do you like to show affection in your relationship?",
    "What's your favorite way to spend quality time together?",
    "What small gesture from your partner always brightens your day?"
  ],
  growth: [
    "What's one relationship skill you'd like to develop this month?",
    "How has your relationship helped you grow as a person?",
    "What pattern would you like to change in your relationships?",
    "What does 'loving yourself' look like to you today?"
  ],
  gratitude: [
    "What are you most grateful for in your relationship today?",
    "What strength does your partner bring that complements yours?",
    "What moment from your relationship still makes you smile?",
    "How has your partner supported your dreams lately?"
  ],
  future: [
    "What relationship goal would you like to work on together?",
    "How do you envision growing together in the next year?",
    "What tradition would you like to start with your partner?",
    "What adventure would you love to share together?"
  ]
};

function getPersonalizedQuestion(profile: UserProfile): string {
  const categories = Object.keys(questionBank) as Array<keyof typeof questionBank>;
  
  // Select category based on profile
  let selectedCategory: keyof typeof questionBank = 'communication';
  
  if (profile.loveLanguage === 'Physical Touch' || profile.loveLanguage === 'Quality Time') {
    selectedCategory = 'intimacy';
  } else if (profile.personalityType?.includes('Growth') || profile.personalityType?.includes('Introspective')) {
    selectedCategory = 'growth';
  } else if (profile.relationshipStatus === 'In a relationship' || profile.relationshipStatus === 'Married') {
    selectedCategory = Math.random() > 0.5 ? 'gratitude' : 'future';
  }
  
  const questions = questionBank[selectedCategory];
  return questions[Math.floor(Math.random() * questions.length)];
}

function shouldSendNotification(timezone: string): boolean {
  try {
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const hour = userTime.getHours();
    const minute = userTime.getMinutes();
    
    // Send notification at 8:00 AM (within a 5-minute window to account for cron timing)
    return hour === 8 && minute <= 5;
  } catch (error) {
    console.error('Error checking timezone:', error);
    // Default to UTC if timezone is invalid
    const utcHour = new Date().getUTCHours();
    return utcHour === 8;
  }
}

async function sendPushNotification(token: string, question: string): Promise<boolean> {
  try {
    // This would integrate with your push notification service (FCM, APNS, etc.)
    // For now, we'll log it and you can integrate with your preferred service
    console.log(`Sending notification to token: ${token.substring(0, 10)}...`);
    console.log(`Question: ${question}`);
    
    // Example FCM integration (you'll need to add your FCM server key)
    const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    const fcmKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmKey) {
      console.error('FCM_SERVER_KEY not configured');
      return false;
    }
    
    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: '💕 Purposely Question of the Day',
          body: question,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        },
        data: {
          type: 'daily_question',
          question: question,
          timestamp: new Date().toISOString(),
        },
      }),
    });
    
    if (!response.ok) {
      console.error('FCM Error:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily question notification job...');

    // Get all user profiles with push notification settings
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('push_notifications_enabled', true)
      .not('push_token', 'is', null);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users with push notifications enabled');
      return new Response(
        JSON.stringify({ message: 'No users to notify' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} users with push notifications enabled`);

    let notificationsSent = 0;
    let errors = 0;

    // Process each user
    for (const profile of profiles) {
      try {
        // Check if it's 8 AM in the user's timezone
        const timezone = profile.timezone || 'UTC';
        
        if (!shouldSendNotification(timezone)) {
          console.log(`Skipping user ${profile.user_id} - not 8 AM in timezone ${timezone}`);
          continue;
        }

        // Generate personalized question
        const question = getPersonalizedQuestion(profile);
        
        // Send push notification
        const success = await sendPushNotification(profile.push_token, question);
        
        if (success) {
          notificationsSent++;
          console.log(`Sent notification to user ${profile.user_id}`);
          
          // Log the notification for analytics
          await supabase
            .from('notification_logs')
            .insert({
              user_id: profile.user_id,
              type: 'daily_question',
              title: '💕 Purposely Question of the Day',
              body: question,
              sent_at: new Date().toISOString(),
              timezone: timezone
            });
        } else {
          errors++;
        }
      } catch (error) {
        console.error(`Error processing user ${profile.user_id}:`, error);
        errors++;
      }
    }

    console.log(`Daily question job completed. Sent: ${notificationsSent}, Errors: ${errors}`);

    return new Response(
      JSON.stringify({
        message: 'Daily question notifications processed',
        sent: notificationsSent,
        errors: errors,
        totalUsers: profiles.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});