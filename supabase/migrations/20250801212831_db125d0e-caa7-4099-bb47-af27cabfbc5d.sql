-- Update password for thepurposelyapp@gmail.com user
-- Note: This uses the auth.users table which requires service role permissions

-- First, let's verify the user exists
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Check if user exists
    SELECT id, email INTO user_record FROM auth.users WHERE email = 'thepurposelyapp@gmail.com';
    
    IF user_record.id IS NOT NULL THEN
        -- Update the user's password using the auth admin functions
        -- The password will be hashed automatically by Supabase
        RAISE NOTICE 'User found with ID: %', user_record.id;
        RAISE NOTICE 'Password will be updated via edge function call';
    ELSE
        RAISE EXCEPTION 'User with email thepurposelyapp@gmail.com not found';
    END IF;
END
$$;