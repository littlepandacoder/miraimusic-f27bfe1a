-- Create per-lesson student progress table and extend module progress

-- Student lesson-level progress
CREATE TABLE public.student_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.foundation_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id)
);

ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their lesson progress"
ON public.student_lesson_progress
FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers and Admins can manage lesson progress"
ON public.student_lesson_progress
FOR SELECT
USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

-- Extend student_foundation_progress with status and last_updated
ALTER TABLE public.student_foundation_progress
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Ensure admins and teachers can manage progress rows
CREATE POLICY IF NOT EXISTS "Teachers and Admins can manage progress"
ON public.student_foundation_progress
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Students can view and update their own progress
CREATE POLICY IF NOT EXISTS "Students can view/update their own progress"
ON public.student_foundation_progress
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY IF NOT EXISTS "Students can update their own progress"
ON public.student_foundation_progress
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);
