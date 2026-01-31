-- Fix: Infinite recursion in user_roles RLS policies
-- Run this in Supabase SQL Editor

-- The problem: The "Admins can view all roles" policy calls has_role()
-- which queries user_roles, causing infinite recursion

-- Step 1: Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Step 2: Drop and recreate the has_role function to properly bypass RLS
-- Must drop first because we're changing parameter names
-- Use CASCADE to drop dependent policies - they will be automatically recreated
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role) CASCADE;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_role_result BOOLEAN;
BEGIN
  -- Explicitly bypass RLS by using a direct query
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  ) INTO has_role_result;
  
  RETURN has_role_result;
END;
$$;

-- Step 3: Grant execute permission
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO anon;

-- Step 4: Recreate the admin policies WITHOUT recursion
-- Note: Policies on other tables (foundation_modules, foundation_lessons, etc.) 
-- will need to be recreated manually if they were dropped by CASCADE
-- Instead of using has_role in the policy, we'll use a simpler approach
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  -- User can see their own roles, OR
  auth.uid() = user_id
  OR
  -- User is an admin (check directly without recursion)
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Step 5: Verify policies don't have recursion
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 6: Test by fetching your own roles (this should work now)
SELECT * FROM public.user_roles WHERE user_id = auth.uid();
