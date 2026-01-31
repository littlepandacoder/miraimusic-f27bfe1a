-- Fix: Change kwongofficial@gmail.com from student to admin
-- Run this in Supabase SQL Editor

-- Step 1: Find the user and their current roles
SELECT 
  u.id as user_id,
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kwongofficial@gmail.com';

-- Step 2: Delete the student role (if exists)
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'kwongofficial@gmail.com'
)
AND role = 'student';

-- Step 3: Add the admin role (or update if using enum type)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'kwongofficial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Verify the change
SELECT 
  u.email,
  ur.role,
  ur.created_at as role_assigned
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kwongofficial@gmail.com';
