-- Create mental health check-ins table
CREATE TABLE public.mental_health_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  stress_level INTEGER NOT NULL CHECK (stress_level >= 1 AND stress_level <= 10),
  energy_level INTEGER NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  mental_clarity INTEGER NOT NULL CHECK (mental_clarity >= 1 AND mental_clarity <= 10),
  anxious_thoughts INTEGER NOT NULL CHECK (anxious_thoughts >= 1 AND anxious_thoughts <= 10),
  depressive_thoughts INTEGER NOT NULL CHECK (depressive_thoughts >= 1 AND depressive_thoughts <= 10),
  ai_recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, created_at::date) -- One check-in per day
);

-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  entry_type TEXT DEFAULT 'general' CHECK (entry_type IN ('general', 'therapy', 'reflection', 'gratitude')),
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create dating prospects table
CREATE TABLE public.dating_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  attractiveness_rating INTEGER CHECK (attractiveness_rating >= 1 AND attractiveness_rating <= 10),
  overall_ranking INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  flags JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create conversation starters usage table
CREATE TABLE public.conversation_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  was_helpful BOOLEAN,
  used_with TEXT, -- prospect nickname or 'general'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create app settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  daily_reminders BOOLEAN DEFAULT true,
  therapy_reminders BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  theme_preference TEXT DEFAULT 'auto' CHECK (theme_preference IN ('light', 'dark', 'auto')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id) -- One settings record per user
);

-- Enable RLS on all tables
ALTER TABLE public.mental_health_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for mental health check-ins
CREATE POLICY "Users can view their own check-ins" 
ON public.mental_health_checkins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins" 
ON public.mental_health_checkins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins" 
ON public.mental_health_checkins 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for journal entries
CREATE POLICY "Users can view their own journal entries" 
ON public.journal_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries" 
ON public.journal_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries" 
ON public.journal_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries" 
ON public.journal_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for dating prospects
CREATE POLICY "Users can view their own dating prospects" 
ON public.dating_prospects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dating prospects" 
ON public.dating_prospects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dating prospects" 
ON public.dating_prospects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dating prospects" 
ON public.dating_prospects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for conversation usage
CREATE POLICY "Users can view their own conversation usage" 
ON public.conversation_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversation usage" 
ON public.conversation_usage 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for user settings
CREATE POLICY "Users can view their own settings" 
ON public.user_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dating_prospects_updated_at
  BEFORE UPDATE ON public.dating_prospects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();