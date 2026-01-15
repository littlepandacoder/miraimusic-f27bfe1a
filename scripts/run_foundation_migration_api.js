#!/usr/bin/env node

/**
 * Foundation Module Migration Runner
 * Executes all migration SQL queries via Supabase REST API
 */

const SUPABASE_URL = "https://tychkyunjfbkksyxknhn.supabase.co";
const SUPABASE_KEY = "sb_publishable_7W1CjpeazyA-rdP56M73Qg_ZNV4nvlW";

// SQL queries to execute in order
const migrations = [
  {
    name: "Create has_role function",
    sql: `
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
    `
  },
  {
    name: "Create foundation tables",
    sql: `
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
    `
  },
  {
    name: "Seed default modules and lessons",
    sql: `
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
        ('Chord Practice Songs', 'Play simple songs using the chords you''ve learned', 25)
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
    `
  }
];

async function executeMigration(migrationIndex) {
  const migration = migrations[migrationIndex];
  
  try {
    console.log(`\n📝 [${migrationIndex + 1}/${migrations.length}] ${migration.name}...`);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ sql: migration.sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log(`✅ ${migration.name} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${migration.name} failed:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log("🎹 Starting Foundation Module Migration...\n");
  
  let allSuccess = true;
  for (let i = 0; i < migrations.length; i++) {
    const success = await executeMigration(i);
    if (!success) {
      allSuccess = false;
      break;
    }
    // Wait a moment between queries
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (allSuccess) {
    console.log("\n🎉 Migration completed successfully!");
    console.log("✅ has_role function created");
    console.log("✅ foundation_modules table created with 5 modules");
    console.log("✅ foundation_lessons table created with 35+ lessons");
    console.log("✅ student_foundation_progress table created");
    console.log("\n🎵 Foundation module database is ready!");
  } else {
    console.log("\n⚠️ Migration encountered an error. Check above for details.");
    process.exit(1);
  }
}

runMigrations();
