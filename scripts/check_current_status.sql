-- Quick check: What's the current state of kwongofficial@gmail.com?
-- Run this in Supabase SQL Editor to see the exact situation

SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  ur.role,
  ur.created_at as role_assigned
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kwongofficial@gmail.com';

-- If the above shows NULL for role, the user exists but has no role assigned
-- If it shows 'student', you need to run fix_kwong_admin_role.sql
-- If it shows 'admin', then there's an RLS issue preventing the frontend from reading it
