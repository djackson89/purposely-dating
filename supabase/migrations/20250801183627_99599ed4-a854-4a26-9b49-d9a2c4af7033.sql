-- Add intake_completed column to existing user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS intake_completed BOOLEAN NOT NULL DEFAULT false;