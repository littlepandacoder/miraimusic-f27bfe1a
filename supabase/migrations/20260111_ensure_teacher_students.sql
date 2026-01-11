-- Ensure teacher_students table exists and has the correct policies
CREATE TABLE IF NOT EXISTS public.teacher_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, student_id)
);

ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- Teachers can assign themselves students
CREATE POLICY IF NOT EXISTS "Teachers can assign themselves students"
ON public.teacher_students
FOR INSERT
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Teachers and Admins can view their students"
ON public.teacher_students
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- Create helpful index
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher_id ON public.teacher_students(teacher_id);
