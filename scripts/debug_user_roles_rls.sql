-- Ensure user_roles RLS policies allow users to read their own roles
-- Run this in Supabase SQL Editor if roles aren't loading

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- If the above shows no SELECT policy for users, add this:
-- DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
-- CREATE POLICY "Users can view their own roles"
-- ON public.user_roles
-- FOR SELECT
-- USING (auth.uid() = user_id);

-- Test if RLS is working - this should return your roles if logged in:
SELECT * FROM public.user_roles WHERE user_id = auth.uid();

-- If using app_role enum type, verify the role value matches:
SELECT 
  ur.role,
  ur.role::text as role_text,
  pg_typeof(ur.role) as role_type
FROM public.user_roles ur
WHERE ur.user_id = auth.uid();
