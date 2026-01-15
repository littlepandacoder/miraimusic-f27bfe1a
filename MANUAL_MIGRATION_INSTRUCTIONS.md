# 🎹 Manual Foundation Migration - Copy & Paste Instructions

## Why Manual?

The Supabase CLI is having connection issues. The quickest way is to run the SQL directly in the Supabase web console.

---

## 📋 Step 1: Go to Supabase Web Console

1. Open: https://app.supabase.com
2. Select your project: **musicable**
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

---

## 📝 Step 2: Copy & Paste the SQL

### Migration 1: Create Foundation Tables

Copy this entire SQL and paste into the SQL Editor:

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

Then click **Run** ▶️

---

## 🌱 Step 3: Seed Default Modules and Lessons

Paste this SQL into a **new query** and run:

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

## ✅ Step 4: Verify Success

After both queries run successfully:

1. Go to **Table Editor** (left sidebar)
2. You should see these new tables:
   - `foundation_modules` (5 rows)
   - `foundation_lessons` (35+ rows)
   - `student_foundation_progress` (empty, for tracking)

3. Click on `foundation_modules` and verify you see:
   - Welcome to Piano
   - Reading Notes
   - Rhythm Basics
   - Your First Chords
   - Simple Melodies

---

## 🎯 What This Creates

✅ **foundation_modules** - 5 music learning modules  
✅ **foundation_lessons** - Detailed lessons for each module  
✅ **student_foundation_progress** - Tracks student progress  
✅ **Row Level Security** - Access control policies  
✅ **Seed Data** - All modules and lessons ready to use  

---

## 💻 Your App Can Now:

After these migrations run:

```typescript
// Query modules
const { data: modules } = await supabase
  .from('foundation_modules')
  .select('*');

// Save changes
await supabase
  .from('foundation_modules')
  .update({ title: 'New Title' })
  .eq('id', moduleId);

// Track progress
await supabase
  .from('student_foundation_progress')
  .upsert({
    student_id: userId,
    module_id: moduleId,
    completed_lessons: 2,
    progress_percent: 50
  });
```

---

## 🎉 Done!

Your foundation module database is ready. Foundation module changes will now be saved to the database!

**Time to complete**: ~2 minutes  
**Next step**: Test in your app and deploy to production
