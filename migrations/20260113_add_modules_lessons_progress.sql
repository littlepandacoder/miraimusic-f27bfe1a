-- Migration: add modules, module_lessons, lesson_videos and lesson_progress tables
-- Run this against your Supabase/Postgres database (psql or Supabase SQL editor)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  level text DEFAULT 'beginner',
  status text DEFAULT 'available',
  xp_reward integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lessons that belong to modules
CREATE TABLE IF NOT EXISTS module_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  "order" integer DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Videos attached to a lesson (multiple per lesson allowed)
CREATE TABLE IF NOT EXISTS lesson_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES module_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  source text DEFAULT 'supabase', -- supabase | loveable | external
  size_bytes bigint,
  duration_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- Student progress for each lesson
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES module_lessons(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  completed boolean DEFAULT false,
  watched_seconds integer DEFAULT 0,
  last_watched_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_module_lessons_module_id ON module_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_videos_lesson_id ON lesson_videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_student ON lesson_progress(lesson_id, student_id);
