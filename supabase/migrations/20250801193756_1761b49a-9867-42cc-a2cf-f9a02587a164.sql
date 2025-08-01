-- Grant full premium access to thepurposelyapp@gmail.com
INSERT INTO public.subscribers (
  email, 
  subscribed, 
  subscription_tier, 
  subscription_end,
  updated_at,
  created_at
) VALUES (
  'thepurposelyapp@gmail.com',
  true,
  'Premium',
  '2025-12-31 23:59:59+00',
  now(),
  now()
) ON CONFLICT (email) 
DO UPDATE SET 
  subscribed = true,
  subscription_tier = 'Premium',
  subscription_end = '2025-12-31 23:59:59+00',
  updated_at = now();