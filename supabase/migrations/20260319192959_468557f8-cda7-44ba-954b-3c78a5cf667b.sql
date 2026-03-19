
-- Course modules that admin uploads videos to
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text,
  thumbnail_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view published modules
CREATE POLICY "Authenticated users can view published courses"
ON public.course_modules FOR SELECT TO authenticated
USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage all
CREATE POLICY "Admins can manage courses"
ON public.course_modules FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Student progress tracking
CREATE TABLE public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  watched_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.course_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own progress"
ON public.course_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.course_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_progress_updated_at
BEFORE UPDATE ON public.course_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for course videos
INSERT INTO storage.buckets (id, name, public) VALUES ('course-videos', 'course-videos', true);

CREATE POLICY "Anyone can view course videos"
ON storage.objects FOR SELECT USING (bucket_id = 'course-videos');

CREATE POLICY "Admins can upload course videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'course-videos' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete course videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'course-videos' AND has_role(auth.uid(), 'admin'::app_role));
