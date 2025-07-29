-- Create table for scenario interactions (likes, shares)
CREATE TABLE public.scenario_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_index INTEGER NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'share')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for scenario comments
CREATE TABLE public.scenario_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for comment likes
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable Row Level Security
ALTER TABLE public.scenario_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Scenario interactions policies
CREATE POLICY "Users can view all scenario interactions" 
ON public.scenario_interactions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own scenario interactions" 
ON public.scenario_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenario interactions" 
ON public.scenario_interactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Scenario comments policies
CREATE POLICY "Users can view all scenario comments" 
ON public.scenario_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create scenario comments" 
ON public.scenario_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenario comments" 
ON public.scenario_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenario comments" 
ON public.scenario_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Users can view all comment likes" 
ON public.comment_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create comment likes" 
ON public.comment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" 
ON public.comment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.scenario_comments 
ADD CONSTRAINT scenario_comments_parent_comment_id_fkey 
FOREIGN KEY (parent_comment_id) REFERENCES public.scenario_comments(id) ON DELETE CASCADE;

ALTER TABLE public.comment_likes 
ADD CONSTRAINT comment_likes_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.scenario_comments(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_scenario_interactions_scenario_index ON public.scenario_interactions(scenario_index);
CREATE INDEX idx_scenario_interactions_user_id ON public.scenario_interactions(user_id);
CREATE INDEX idx_scenario_comments_scenario_index ON public.scenario_comments(scenario_index);
CREATE INDEX idx_scenario_comments_parent_comment_id ON public.scenario_comments(parent_comment_id);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scenario_comments_updated_at
BEFORE UPDATE ON public.scenario_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();