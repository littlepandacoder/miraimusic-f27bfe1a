-- Recreate foundation-related RLS policies after CASCADE drop
-- Run this AFTER fix_rls_recursion.sql or fix_rls_recursion_enum.sql

-- Foundation Modules Policies
CREATE POLICY IF NOT EXISTS "Admins can manage foundation modules"
ON public.foundation_modules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Teachers and Admins can view foundation modules"
ON public.foundation_modules
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'teacher')
);

-- Foundation Lessons Policies
CREATE POLICY IF NOT EXISTS "Admins can manage foundation lessons"
ON public.foundation_lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Teachers and Admins can view foundation lessons"
ON public.foundation_lessons
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'teacher')
);

-- Student Foundation Progress Policies
CREATE POLICY IF NOT EXISTS "Teachers and Admins can manage progress"
ON public.student_foundation_progress
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') 
  OR public.has_role(auth.uid(), 'teacher')
);

-- Verify all policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname
FROM pg_policies
WHERE tablename IN ('foundation_modules', 'foundation_lessons', 'student_foundation_progress')
ORDER BY tablename, policyname;
