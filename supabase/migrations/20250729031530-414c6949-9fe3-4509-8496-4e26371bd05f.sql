-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create bot users table
CREATE TABLE public.bot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  personality_traits JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Bot users policies
CREATE POLICY "Everyone can view active bots" 
ON public.bot_users 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage bots" 
ON public.bot_users 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add bot_user_id to scenario_comments table
ALTER TABLE public.scenario_comments 
ADD COLUMN bot_user_id UUID REFERENCES public.bot_users(id) ON DELETE CASCADE,
ADD CONSTRAINT check_user_or_bot CHECK (
  (user_id IS NOT NULL AND bot_user_id IS NULL) OR 
  (user_id IS NULL AND bot_user_id IS NOT NULL)
);

-- Update scenario_comments policies to handle bot comments
DROP POLICY IF EXISTS "Users can create scenario comments" ON public.scenario_comments;
CREATE POLICY "Users and admins can create scenario comments" 
ON public.scenario_comments 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id AND bot_user_id IS NULL) OR 
  (public.has_role(auth.uid(), 'admin') AND bot_user_id IS NOT NULL)
);

-- Create trigger for bot users updated_at
CREATE TRIGGER update_bot_users_updated_at
BEFORE UPDATE ON public.bot_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_bot_users_is_active ON public.bot_users(is_active);
CREATE INDEX idx_scenario_comments_bot_user_id ON public.scenario_comments(bot_user_id);