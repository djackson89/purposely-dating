-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create notification_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  success BOOLEAN DEFAULT true
);

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for notification_logs (admin access)
CREATE POLICY "Allow service role to manage notification logs" 
ON public.notification_logs 
FOR ALL 
USING (true);

-- Add push notification fields to profiles table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'push_token') THEN
        ALTER TABLE public.profiles ADD COLUMN push_token TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notifications_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'timezone') THEN
        ALTER TABLE public.profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'love_language') THEN
        ALTER TABLE public.profiles ADD COLUMN love_language TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'personality_type') THEN
        ALTER TABLE public.profiles ADD COLUMN personality_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'relationship_status') THEN
        ALTER TABLE public.profiles ADD COLUMN relationship_status TEXT;
    END IF;
END $$;

-- Schedule the daily question notification to run every day at 8:00 AM UTC
SELECT cron.schedule(
    'daily-question-notification',
    '0 8 * * *', -- Every day at 8:00 AM UTC
    $$
    SELECT
        net.http_post(
            url:='https://csupviqxprhtrbfbugct.supabase.co/functions/v1/daily-question-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzdXB2aXF4cHJodHJiZmJ1Z2N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NjkzMDAsImV4cCI6MjA2OTA0NTMwMH0.n6TVqq3meOhshgGzTfMt2Ef90mSYi8mxUz2UXteyHzg"}'::jsonb,
            body:='{"scheduled": true}'::jsonb
        ) as request_id;
    $$
);