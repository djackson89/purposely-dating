-- Create conversation starters pool table
CREATE TABLE public.conversation_starters_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  depth_level INTEGER NOT NULL DEFAULT 1,
  question JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.conversation_starters_pool ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own pool questions" 
ON public.conversation_starters_pool 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pool questions" 
ON public.conversation_starters_pool 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pool questions" 
ON public.conversation_starters_pool 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pool questions" 
ON public.conversation_starters_pool 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX idx_conversation_starters_pool_user_category_depth 
ON public.conversation_starters_pool (user_id, category, depth_level, used_at);

-- Create function to get available questions from pool
CREATE OR REPLACE FUNCTION get_pool_question(
  p_user_id UUID,
  p_category TEXT,
  p_depth_level INTEGER
) RETURNS JSONB AS $$
DECLARE
  question_data JSONB;
  question_id UUID;
BEGIN
  -- Get an unused question from the pool
  SELECT id, question INTO question_id, question_data
  FROM public.conversation_starters_pool
  WHERE user_id = p_user_id 
    AND category = p_category 
    AND depth_level = p_depth_level 
    AND used_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- If question found, mark it as used
  IF question_id IS NOT NULL THEN
    UPDATE public.conversation_starters_pool
    SET used_at = now()
    WHERE id = question_id;
  END IF;

  RETURN question_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to count available questions
CREATE OR REPLACE FUNCTION count_pool_questions(
  p_user_id UUID,
  p_category TEXT,
  p_depth_level INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.conversation_starters_pool
    WHERE user_id = p_user_id 
      AND category = p_category 
      AND depth_level = p_depth_level 
      AND used_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;