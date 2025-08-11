-- Tighten RLS on public.subscribers to prevent unauthorized inserts/updates
-- This keeps existing SELECT policy and restricts write access

-- Drop overly permissive policies if they exist
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create stricter policies that only allow users to manage their own row
CREATE POLICY "update_own_subscription"
ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "insert_own_subscription"
ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid() OR email = auth.email());
