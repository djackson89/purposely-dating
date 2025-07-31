-- Fix security warnings for functions by setting search_path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for count function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;