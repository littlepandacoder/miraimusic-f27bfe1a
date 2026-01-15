# Foundation Modules Migration Guide

## Quick Start (TL;DR)

Run foundation module migrations on Supabase:

```bash
# 1. Login to Supabase (one-time setup)
supabase login

# 2. Link your project
supabase link --project-ref ugpgsctazvnhkasqpclg

# 3. Run all pending migrations
supabase db push

# Done! ✅ Foundation tables created and seeded
```

---

## What Gets Created

This migration creates the following tables in your PostgreSQL database:

### 1. **foundation_modules**
Stores foundation course modules (e.g., "Welcome to Piano", "Reading Notes")
```
- id (UUID) - Primary key
- title (TEXT) - Module name
- description (TEXT) - Module overview
- level (TEXT) - Difficulty level (beginner, intermediate, etc.)
- xp_reward (INTEGER) - Experience points for completing
- created_at, updated_at (TIMESTAMP)
```

**Default Modules Seeded**:
- Welcome to Piano (100 XP)
- Reading Notes (150 XP)
- Rhythm Basics (125 XP)
- Your First Chords (175 XP)
- Simple Melodies (200 XP)

### 2. **foundation_lessons**
Individual lessons within each module
```
- id (UUID) - Primary key
- module_id (UUID) - Foreign key to foundation_modules
- title (TEXT) - Lesson name
- description (TEXT) - Lesson details
- duration_minutes (INTEGER) - Estimated duration
- content (JSONB) - Rich content (lessons, exercises, etc.)
- created_at, updated_at (TIMESTAMP)
```

**Example Lessons for "Welcome to Piano" Module**:
- Introduction to Piano
- Proper Posture & Seating
- Hand Position & Technique
- Warm-up Exercises
- ...and more

### 3. **student_foundation_progress**
Tracks student progress through modules
```
- id (UUID) - Primary key
- student_id (UUID) - Foreign key to auth.users
- module_id (UUID) - Foreign key to foundation_modules
- completed_lessons (INTEGER) - Number of completed lessons
- progress_percent (NUMERIC) - Overall progress (0-100)
- created_at, updated_at (TIMESTAMP)
- UNIQUE constraint on (student_id, module_id)
```

---

## Step-by-Step Instructions

### Step 1: Authenticate with Supabase

First time only - link your Supabase account:

```bash
supabase login
```

You'll be prompted to:
1. Visit a URL in your browser
2. Authorize the Supabase CLI
3. Return to terminal (token auto-saved)

### Step 2: Link Your Project

Connect to your specific Supabase project:

```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

Or let Supabase detect your project:

```bash
cd /Users/jammiverse/Documents/GitHub/miraimusic-f27bfe1a
supabase link
# Select your project from the list
```

**Output**:
```
✓ Linked to project ugpgsctazvnhkasqpclg
✓ Saved config in ./supabase/.env.local
```

### Step 3: Push Migrations to Supabase

Run all pending migrations (including foundation tables):

```bash
supabase db push
```

**What happens**:
- Checks for new migration files in `supabase/migrations/`
- Displays which migrations will be applied
- Prompts for confirmation
- Applies migrations to your remote Supabase database
- Returns migration status

**Expected Output**:
```
┌────────────────────────────────────────────┐
│  The following migrations will be applied: │
├────────────────────────────────────────────┤
│ 20260112_add_foundation_tables.sql         │
│ 20260112_add_progress_tables.sql           │
│ 20260112_update_foundation_lessons_meta.sql│
└────────────────────────────────────────────┘

Apply migrations? [y/n] y

✓ Foundation tables created
✓ Policies applied
✓ Default modules and lessons seeded
✓ All migrations applied successfully
```

---

## Verification

### Verify Tables Exist

Check that tables were created in Supabase:

**Via Supabase Dashboard**:
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** or **Tables**
4. You should see:
   - `foundation_modules`
   - `foundation_lessons`
   - `student_foundation_progress`

**Via psql (if you have PostgreSQL client)**:
```bash
psql "postgresql://[user]:[password]@[host]:[port]/postgres" \
  -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'foundation%';"
```

### Verify Seed Data

Check that default modules and lessons were inserted:

**Via Supabase Dashboard**:
1. Go to **Table Editor**
2. Select `foundation_modules`
3. Should see 5 modules:
   - Welcome to Piano
   - Reading Notes
   - Rhythm Basics
   - Your First Chords
   - Simple Melodies

**Via SQL Query**:
```sql
SELECT title, level, xp_reward FROM foundation_modules;
```

Expected result:
```
title                    | level     | xp_reward
-------------------------+-----------+---------
Welcome to Piano         | beginner  | 100
Reading Notes            | beginner  | 150
Rhythm Basics            | beginner  | 125
Your First Chords        | beginner  | 175
Simple Melodies          | beginner  | 200
```

### Verify Row Level Security (RLS) Policies

Check that access control policies were applied:

**Via Supabase Dashboard**:
1. Select table: `foundation_modules`
2. Go to **Authentication** tab
3. Should see policies:
   - "Admins can manage foundation modules"
   - "Teachers and Admins can view foundation modules"

---

## Rollback (If Needed)

If something goes wrong, you can rollback migrations:

### Option 1: Reset to Previous State (Dangerous - Deletes Data)

```bash
supabase db reset
```

⚠️ **WARNING**: This deletes all data and resets to the last migration point. Only use in development!

### Option 2: Manual Rollback (Keep Data)

If a migration has a syntax error, fix it manually:

1. Open the migration file in your editor
2. Fix the SQL syntax
3. Run again: `supabase db push`

### Option 3: Create Inverse Migration

Create a new migration to undo the changes:

```bash
supabase migration new drop_foundation_tables

# Edit the new file and add:
DROP TABLE IF EXISTS public.student_foundation_progress;
DROP TABLE IF EXISTS public.foundation_lessons;
DROP TABLE IF EXISTS public.foundation_modules;

# Push it
supabase db push
```

---

## Troubleshooting

### Error: "Not authenticated"

**Problem**: `Error: You must be authenticated to use this command`

**Solution**:
```bash
supabase login
# Follow the browser authorization flow
```

### Error: "Project not linked"

**Problem**: `Error: No project linked`

**Solution**:
```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

### Error: "Permission denied" on migration

**Problem**: `Error: PG error: permission denied for schema public`

**Solution**:
1. Verify you're using an admin/owner account
2. Check Supabase project permissions
3. Contact Supabase support if needed

### Error: "Relation already exists"

**Problem**: `Error: relation "foundation_modules" already exists`

**Solution**: Migrations already applied! Run:
```bash
supabase status
# Check which migrations have been applied
```

### Migrations don't apply to local dev

**Problem**: Local dev database doesn't have foundation tables

**Solution**: Run migrations on local Supabase instance:
```bash
supabase start           # Start local Supabase
supabase db push --local # Push to local database
supabase stop            # Stop when done
```

---

## Working with Foundation Tables in Your App

### Reading Foundation Modules (Admin/Teacher)

```typescript
// src/integrations/supabase/client.ts
import { supabase } from '@/integrations/supabase/client';

// Get all modules
const { data: modules } = await supabase
  .from('foundation_modules')
  .select('*')
  .order('created_at', { ascending: true });

// Get specific module with lessons
const { data: module } = await supabase
  .from('foundation_modules')
  .select('*, foundation_lessons(*)')
  .eq('id', moduleId)
  .single();
```

### Updating Module Progress (Student)

```typescript
// Update student progress
const { data: progress } = await supabase
  .from('student_foundation_progress')
  .upsert({
    student_id: userId,
    module_id: moduleId,
    completed_lessons: 2,
    progress_percent: 50
  });
```

### Reading Student Progress

```typescript
// Get student's progress across all modules
const { data: progress } = await supabase
  .from('student_foundation_progress')
  .select('*, foundation_modules(title)')
  .eq('student_id', userId);
```

---

## File Structure

```
supabase/
├── migrations/
│   ├── 20260112_add_foundation_tables.sql      ← Creates tables & seeds
│   ├── 20260112_add_progress_tables.sql        ← Progress tracking
│   └── 20260112_update_foundation_lessons_meta.sql ← Metadata updates
├── config.toml                                  ← Project config
└── functions/                                   ← Edge functions (optional)
```

---

## Next Steps

After migration is complete:

1. ✅ Verify tables exist in Supabase dashboard
2. ✅ Check seed data (5 modules, lessons)
3. ✅ Test RLS policies with different user roles
4. ✅ Update frontend to query foundation tables
5. ✅ Test creating/updating student progress
6. ✅ Deploy to production

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `supabase login` | Authenticate with Supabase |
| `supabase link --project-ref ugpgsctazvnhkasqpclg` | Link your project |
| `supabase db push` | Apply pending migrations |
| `supabase db pull` | Download latest schema |
| `supabase status` | Check migration status |
| `supabase start` | Start local Supabase |
| `supabase stop` | Stop local Supabase |
| `supabase migration new <name>` | Create new migration |

---

## Support

If you encounter issues:
1. Check Supabase docs: https://supabase.com/docs
2. Review migration files in `supabase/migrations/`
3. Check Supabase dashboard for error logs
4. Run in development first, then production

---

**Project ID**: `ugpgsctazvnhkasqpclg`  
**Migrations Directory**: `supabase/migrations/`  
**Status**: Ready to run
