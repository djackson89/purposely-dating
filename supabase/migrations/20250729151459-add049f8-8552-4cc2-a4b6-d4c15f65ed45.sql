-- Update the bot_users policies to allow any authenticated user to create bots
DROP POLICY IF EXISTS "Admins can manage bots" ON public.bot_users;

-- Allow any authenticated user to create bots for engagement
CREATE POLICY "Anyone can create bots for engagement" 
ON public.bot_users 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to view bots
CREATE POLICY "Anyone can view active bots" 
ON public.bot_users 
FOR SELECT 
USING (is_active = true);

-- Allow users to update their own created bots
CREATE POLICY "Users can update bots they created" 
ON public.bot_users 
FOR UPDATE 
USING (auth.uid() = created_by OR auth.uid()::text = created_by);

-- Allow users to delete bots they created
CREATE POLICY "Users can delete bots they created" 
ON public.bot_users 
FOR DELETE 
USING (auth.uid() = created_by OR auth.uid()::text = created_by);