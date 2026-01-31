-- Alternative fix if the table uses app_role ENUM instead of TEXT
-- Run this INSTEAD of fix_rls_recursion.sql if your role column is an ENUM

-- Check if you're using ENUM type:
SELECT column_name, data_type, udt_name
FROM information_schema.columns
WHERE table_name = 'user_roles' AND column_name = 'role';

-- If the above shows 'USER-DEFINED' or 'app_role', use this fix:

-- Step 1: Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Step 2: Drop and recreate has_role function to handle enum
-- Must drop first because we're changing parameter names
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.has_role(UUID, app_role);

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
  -- Cast TEXT to app_role enum if needed
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = _role
  ) INTO has_role_result;
  
  RETURN has_role_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, TEXT) TO anon;

-- Step 3: Recreate policies without recursion
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::TEXT = 'admin'
  )
);

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::TEXT = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role::TEXT = 'admin'
  )
);

-- Verify
SELECT * FROM public.user_roles WHERE user_id = auth.uid();
