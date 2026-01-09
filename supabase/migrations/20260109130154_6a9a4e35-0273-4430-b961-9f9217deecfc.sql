-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins and teachers can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create available_slots table for fixed time slots
CREATE TABLE public.available_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active slots"
ON public.available_slots
FOR SELECT
USING (is_active = true);

CREATE POLICY "Teachers can manage their own slots"
ON public.available_slots
FOR ALL
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- Create lessons table
CREATE TABLE public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own lessons"
ON public.lessons
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view their lessons"
ON public.lessons
FOR SELECT
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all lessons"
ON public.lessons
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create lessons"
ON public.lessons
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own lessons"
ON public.lessons
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Teachers can update their lessons"
ON public.lessons
FOR UPDATE
USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can manage all lessons"
ON public.lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create lesson_plans table
CREATE TABLE public.lesson_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own lesson plans"
ON public.lesson_plans
FOR ALL
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view lesson plans"
ON public.lesson_plans
FOR SELECT
USING (public.has_role(auth.uid(), 'student'));

-- Create lesson_plan_files table for attachments
CREATE TABLE public.lesson_plan_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_plan_id UUID REFERENCES public.lesson_plans(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_plan_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their lesson plan files"
ON public.lesson_plan_files
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.lesson_plans lp 
        WHERE lp.id = lesson_plan_id 
        AND (lp.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);

CREATE POLICY "Students can view lesson plan files"
ON public.lesson_plan_files
FOR SELECT
USING (public.has_role(auth.uid(), 'student'));

-- Create lesson_notes table for teacher notes on lessons
CREATE TABLE public.lesson_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notes TEXT NOT NULL,
    is_visible_to_student BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their notes"
ON public.lesson_notes
FOR ALL
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view visible notes on their lessons"
ON public.lesson_notes
FOR SELECT
USING (
    is_visible_to_student = true 
    AND EXISTS (
        SELECT 1 FROM public.lessons l 
        WHERE l.id = lesson_id 
        AND l.student_id = auth.uid()
    )
);

-- Create storage bucket for lesson materials
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-materials', 'lesson-materials', true);

-- Storage policies
CREATE POLICY "Teachers can upload lesson materials"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'lesson-materials' 
    AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Teachers can update their materials"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'lesson-materials' 
    AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Teachers can delete their materials"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'lesson-materials' 
    AND (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Anyone can view lesson materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lesson-materials');

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_plans_updated_at
BEFORE UPDATE ON public.lesson_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lesson_notes_updated_at
BEFORE UPDATE ON public.lesson_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();