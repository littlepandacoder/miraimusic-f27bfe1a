-- Create school districts
CREATE TABLE public.districts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage districts"
ON public.districts
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and Admins can view districts"
ON public.districts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Create classes that belong to districts
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage classes"
ON public.classes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and Admins can view classes"
ON public.classes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Class students (students assigned to a class)
CREATE TABLE public.class_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (class_id, student_id)
);

ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage class_students"
ON public.class_students
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can add a student to a class in their district"
ON public.class_students
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND EXISTS (
    SELECT 1 FROM public.districts d
    JOIN public.classes c ON c.district_id = d.id
    JOIN public.district_teachers dt ON dt.district_id = d.id
    WHERE c.id = class_id
      AND dt.teacher_id = auth.uid()
  )
);

CREATE POLICY "Students can view their class assignment"
ON public.class_students
FOR SELECT
USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- District teachers (assign teachers to a district)
CREATE TABLE public.district_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id UUID REFERENCES public.districts(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (district_id, teacher_id)
);

ALTER TABLE public.district_teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage district_teachers"
ON public.district_teachers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view districts they are assigned to"
ON public.district_teachers
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- Teacher-students (teachers can assign themselves students)
CREATE TABLE public.teacher_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, student_id)
);

ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can assign themselves students"
ON public.teacher_students
FOR INSERT
WITH CHECK (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and Admins can view their students"
ON public.teacher_students
FOR SELECT
USING (auth.uid() = teacher_id OR public.has_role(auth.uid(), 'admin'));

-- Helpful indexes
CREATE INDEX idx_classes_district_id ON public.classes(district_id);
CREATE INDEX idx_class_students_class_id ON public.class_students(class_id);
CREATE INDEX idx_district_teachers_district_id ON public.district_teachers(district_id);
CREATE INDEX idx_teacher_students_teacher_id ON public.teacher_students(teacher_id);
