-- Add created_by and published metadata to foundation_lessons
ALTER TABLE public.foundation_lessons
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT false;

-- Allow teachers to manage (insert/update/delete) their own lessons, admins can manage all
-- First, drop the previous admin-only policy if it exists; create a more permissive policy

-- Revoke existing policy (safe to recreate)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE polname = 'Admins can manage foundation lessons'
      AND schemaname = 'public'
      AND tablename = 'foundation_lessons'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can manage foundation lessons" ON public.foundation_lessons';
  END IF;
EXCEPTION WHEN others THEN
  -- ignore
END$$;

-- Create policy allowing admins to manage all
CREATE POLICY "Admins can manage foundation lessons"
ON public.foundation_lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy allowing teachers to manage lessons they created
CREATE POLICY "Teachers can manage their own foundation lessons"
ON public.foundation_lessons
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR (
    public.has_role(auth.uid(), 'teacher') AND created_by = auth.uid()
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR (
    public.has_role(auth.uid(), 'teacher') AND created_by = auth.uid()
  )
);

-- Allow teachers and admins to select foundation lessons
CREATE POLICY "Teachers and Admins can view foundation lessons"
ON public.foundation_lessons
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Allow students to view published lessons
CREATE POLICY "Students can view published foundation lessons"
ON public.foundation_lessons
FOR SELECT
USING (is_published = true);
