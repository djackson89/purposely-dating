-- Grant admin role to the specified user by email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'derrick.jaxn@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;