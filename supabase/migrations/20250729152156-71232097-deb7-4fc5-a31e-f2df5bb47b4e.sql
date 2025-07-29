-- Remove social features tables and keep only share functionality

-- Drop social interaction tables
DROP TABLE IF EXISTS public.comment_likes CASCADE;
DROP TABLE IF EXISTS public.scenario_comments CASCADE; 
DROP TABLE IF EXISTS public.scenario_interactions CASCADE;
DROP TABLE IF EXISTS public.bot_users CASCADE;