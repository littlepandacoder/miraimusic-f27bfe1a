-- Check user roles for kwongofficial@gmail.com
-- Run this in Supabase SQL Editor to verify the admin role

-- Check if user exists and has roles
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  u.email_confirmed_at,
  ur.role,
  ur.created_at as role_assigned
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kwongofficial@gmail.com';

-- If the above returns no role, add it with this:
-- First get the user_id from the query above, then run:
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_ID_FROM_ABOVE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Check all roles for verification
SELECT * FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'kwongofficial@gmail.com'
);
