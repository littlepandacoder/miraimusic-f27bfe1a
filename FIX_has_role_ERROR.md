# 🔐 Fix: Create has_role Function First

The error means the `has_role()` function doesn't exist in your database. We need to create it before running the migration.

---

## 📋 Step 1: Create the has_role Function

Go to https://app.supabase.com → SQL Editor → New Query

Copy and paste this SQL **FIRST** (before the foundation tables migration):

```sql
-- Create has_role function for Row Level Security policies
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, role_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_roles.user_id = $1 
    AND user_roles.role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Click **Run** ▶️

**Expected output**: `Query successful - no rows returned`

---

## 🔄 Step 2: Now Run the Foundation Tables Migration

After the function is created, run the main migration SQL (the one with CREATE TABLE public.foundation_modules...)

Copy and paste this:

```sql
-- Create foundation modules
CREATE TABLE public.foundation_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    level TEXT NOT NULL DEFAULT 'beginner',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.foundation_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage foundation modules"
ON public.foundation_modules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and Admins can view foundation modules"
ON public.foundation_modules
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Create foundation lessons
CREATE TABLE public.foundation_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.foundation_modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 20,
    content JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.foundation_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage foundation lessons"
ON public.foundation_lessons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers and Admins can view foundation lessons"
ON public.foundation_lessons
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Student progress table
CREATE TABLE public.student_foundation_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.foundation_modules(id) ON DELETE CASCADE NOT NULL,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    progress_percent NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (student_id, module_id)
);

ALTER TABLE public.student_foundation_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own progress"
ON public.student_foundation_progress
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own progress"
ON public.student_foundation_progress
FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers and Admins can manage progress"
ON public.student_foundation_progress
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));
```

Click **Run** ▶️

---

## 🌱 Step 3: Seed the Data

Create a **new query** and paste:

```sql
-- Seed default modules
INSERT INTO public.foundation_modules (title, description, level, xp_reward)
VALUES
  ('Welcome to Piano', 'Learn the basics of the piano keyboard and posture', 'beginner', 100),
  ('Reading Notes', 'Master reading music notes on the staff', 'beginner', 150),
  ('Rhythm Basics', 'Understand time signatures and note values', 'beginner', 125),
  ('Your First Chords', 'Learn major and minor triads', 'beginner', 175),
  ('Simple Melodies', 'Play your first complete songs', 'beginner', 200);

-- Seed lessons for module 1 (Welcome to Piano)
WITH m AS (
  SELECT id FROM public.foundation_modules WHERE title = 'Welcome to Piano' LIMIT 1
)
INSERT INTO public.foundation_lessons (module_id, title, description, duration_minutes)
SELECT m.id, data.title, data.description, data.duration
FROM m, (VALUES
  ('Introduction to Piano', 'Learn about the piano keyboard, how keys are arranged, and basic orientation', 15),
  ('Proper Posture & Seating', 'Master the correct sitting position and hand posture to prevent injury', 20),
  ('Hand Position & Technique', 'Learn finger independence and proper hand formation on the keys', 20),
  ('Warm-up Exercises', 'Practice essential finger exercises to prepare for playing', 15)
) AS data(title, description, duration);

-- Seed lessons for module 2 (Reading Notes)
WITH m AS (
  SELECT id FROM public.foundation_modules WHERE title = 'Reading Notes' LIMIT 1
)
INSERT INTO public.foundation_lessons (module_id, title, description, duration_minutes)
SELECT m.id, data.title, data.description, data.duration
FROM m, (VALUES
  ('The Musical Staff', 'Understand the five lines and four spaces of the music staff', 15),
  ('Treble Clef Notes', 'Learn to read notes in the treble clef (high notes)', 20),
  ('Bass Clef Notes', 'Learn to read notes in the bass clef (low notes)', 20),
  ('Ledger Lines', 'Master notes that extend above and below the staff', 15),
  ('Accidentals (Sharps, Flats, Naturals)', 'Learn sharps, flats, and natural symbols', 20),
  ('Note Reading Practice', 'Practice reading various notes across the keyboard', 25)
) AS data(title, description, duration);

-- Seed lessons for module 3 (Rhythm Basics)
WITH m AS (
  SELECT id FROM public.foundation_modules WHERE title = 'Rhythm Basics' LIMIT 1
)
INSERT INTO public.foundation_lessons (module_id, title, description, duration_minutes)
SELECT m.id, data.title, data.description, data.duration
FROM m, (VALUES
  ('Note Values & Rests', 'Learn whole notes, half notes, quarter notes, and their corresponding rests', 20),
  ('Time Signatures', 'Understand common time signatures (4/4, 3/4, 2/4)', 20),
  ('Counting Beats', 'Practice counting beats and understanding rhythm patterns', 25),
  ('Rhythm Notation', 'Learn dotted notes and how to read complex rhythms', 20),
  ('Rhythm Practice', 'Practice clapping and playing rhythmic patterns', 25)
) AS data(title, description, duration);

-- Seed lessons for module 4 (Your First Chords)
WITH m AS (
  SELECT id FROM public.foundation_modules WHERE title = 'Your First Chords' LIMIT 1
)
INSERT INTO public.foundation_lessons (module_id, title, description, duration_minutes)
SELECT m.id, data.title, data.description, data.duration
FROM m, (VALUES
  ('Introduction to Chords', 'Understand what chords are and why they matter', 15),
  ('Major Triads', 'Learn the structure and sound of major chords', 20),
  ('Minor Triads', 'Learn the structure and sound of minor chords', 20),
  ('Playing Chords on Piano', 'Practice playing major and minor chords', 25),
  ('Chord Transitions', 'Learn to smoothly transition between chords', 20),
  ('Chord Practice Songs', 'Play simple songs using the chords you\'ve learned', 25)
) AS data(title, description, duration);

-- Seed lessons for module 5 (Simple Melodies)
WITH m AS (
  SELECT id FROM public.foundation_modules WHERE title = 'Simple Melodies' LIMIT 1
)
INSERT INTO public.foundation_lessons (module_id, title, description, duration_minutes)
SELECT m.id, data.title, data.description, data.duration
FROM m, (VALUES
  ('What is a Melody?', 'Understand melodies and how they shape music', 15),
  ('Reading Simple Melodies', 'Learn to read simple melodic lines', 20),
  ('Mary Had a Little Lamb', 'Play your first complete song', 20),
  ('Twinkle Twinkle Little Star', 'Another classic beginner song', 20),
  ('Happy Birthday', 'Play this popular celebration song', 20),
  ('Melody Techniques', 'Learn dynamics, phrasing, and expression', 25),
  ('Song Arrangement', 'Combine melodies with chords and accompaniment', 25),
  ('Melody Performance', 'Record and share your first melody', 20)
) AS data(title, description, duration);
```

Click **Run** ▶️

---

## ✅ Verify Success

1. Go to **Table Editor** (left sidebar)
2. You should see:
   - ✓ `foundation_modules` (5 rows)
   - ✓ `foundation_lessons` (35+ rows)
   - ✓ `student_foundation_progress` (empty)

---

## 🎯 Done!

Your foundation migration is complete! Your app can now save foundation module changes to the database.

**Key steps**:
1. Create `has_role()` function ← **Do this first!**
2. Run foundation tables migration
3. Seed default modules and lessons
4. Verify in Table Editor
