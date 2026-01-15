# Running Foundation Module Migration - Step by Step

## 🎯 Goal
Run database migrations to create foundation tables in Supabase so that foundation module changes are saved to the database.

## ✅ Prerequisites

Before starting, make sure you have:
- ✓ Supabase CLI installed (`which supabase` returns a path)
- ✓ Internet connection
- ✓ Access to Supabase account/project
- ✓ Git repo cloned and updated

---

## 🚀 Execution Steps

### Option A: Using Bash Script (Recommended - Easiest)

**Step 1: Run the automated script**

```bash
cd /Users/jammiverse/Documents/GitHub/miraimusic-f27bfe1a
bash scripts/run_foundation_migration.sh
```

**Expected Output**:
```
🎹 Foundation Modules Migration Script
======================================

✓ Supabase CLI found

📝 Step 1: Checking authentication...
✓ Already authenticated

🔗 Step 2: Linking project...
✓ Project already linked

📋 Step 3: Checking migration status...
   Pending migrations:
   • 20260112_add_foundation_tables.sql

🚀 Step 4: Pushing migrations to Supabase...
   This will create foundation tables and seed default data

✅ Migration completed successfully!

📊 Created tables:
   • foundation_modules (5 default modules)
   • foundation_lessons (lessons for each module)
   • student_foundation_progress (student tracking)

🔒 Row Level Security policies applied

📖 View your data:
   1. Go to https://app.supabase.com
   2. Select your project: ugpgsctazvnhkasqpclg
   3. Go to Table Editor → foundation_modules

🎯 Next steps:
   • Deploy your app
   • Frontend will now save foundation module changes to database
   • Student progress will be tracked automatically
```

**That's it! Migration complete.** ✅

---

### Option B: Using npm Scripts (Easy)

**Step 1: Authenticate with Supabase** (first time only)

```bash
supabase login
```

Follow the browser authorization flow.

**Step 2: Link your project** (first time only)

```bash
cd /Users/jammiverse/Documents/GitHub/miraimusic-f27bfe1a
npm run db:link
```

**Step 3: Push migrations**

```bash
npm run migrate:foundation
```

---

### Option C: Manual Supabase CLI Commands (Advanced)

**Step 1: Authenticate**

```bash
supabase login
```

**Step 2: Link project**

```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

**Step 3: Check migration status**

```bash
supabase status
```

Should show pending migrations like:
```
Project: ugpgsctazvnhkasqpclg
Connected: true

Migrations status:
 • 20260112_add_foundation_tables.sql (pending)
 • 20260112_add_progress_tables.sql (pending)
 • 20260112_update_foundation_lessons_meta.sql (pending)
```

**Step 4: Push migrations**

```bash
supabase db push
```

You'll see a prompt:
```
┌──────────────────────────────────────────────┐
│  The following migrations will be applied:   │
├──────────────────────────────────────────────┤
│ 20260112_add_foundation_tables.sql           │
│ 20260112_add_progress_tables.sql             │
│ 20260112_update_foundation_lessons_meta.sql  │
└──────────────────────────────────────────────┘

Apply migrations? [y/n]
```

**Step 5: Confirm**

Type `y` and press Enter:
```
y
```

**Done!** Wait for confirmation:
```
✓ Migrations applied successfully
✓ Tables created: foundation_modules, foundation_lessons, student_foundation_progress
✓ Seed data inserted: 5 modules + lessons
✓ Row Level Security policies applied
```

---

## 🔍 Verification Steps

### Verify in Supabase Dashboard

1. Go to https://app.supabase.com
2. Select project: **ugpgsctazvnhkasqpclg**
3. Go to **Table Editor** (left sidebar)
4. You should see new tables:
   - ✓ `foundation_modules` (5 rows with default modules)
   - ✓ `foundation_lessons` (lessons for each module)
   - ✓ `student_foundation_progress` (empty, will track student progress)

### Verify Seed Data

Click on `foundation_modules` table and verify these 5 default modules exist:

| Title | Level | XP Reward |
|-------|-------|-----------|
| Welcome to Piano | beginner | 100 |
| Reading Notes | beginner | 150 |
| Rhythm Basics | beginner | 125 |
| Your First Chords | beginner | 175 |
| Simple Melodies | beginner | 200 |

### Verify Lessons

Click on `foundation_lessons` and verify lessons exist for each module.

Example for "Welcome to Piano":
- Introduction to Piano (15 min)
- Proper Posture & Seating (20 min)
- Hand Position & Technique (20 min)
- Warm-up Exercises (15 min)

---

## ✅ Completion Checklist

After migration completes, verify:

- [ ] No errors shown in terminal
- [ ] All 3 tables appear in Supabase Table Editor
- [ ] `foundation_modules` has 5 modules
- [ ] `foundation_lessons` has lessons for each module
- [ ] `student_foundation_progress` table exists (empty)
- [ ] Row Level Security policies visible in table settings
- [ ] Can access tables from frontend (test in dev server)

---

## 🎯 What This Enables

After migration, the following now work:

### Frontend Can Save Data

```typescript
// Update a foundation module
const { data, error } = await supabase
  .from('foundation_modules')
  .update({ title: 'New Title' })
  .eq('id', moduleId);
```

### Track Student Progress

```typescript
// Save student progress
const { data } = await supabase
  .from('student_foundation_progress')
  .upsert({
    student_id: userId,
    module_id: moduleId,
    completed_lessons: 2,
    progress_percent: 50
  });
```

### Query Lessons

```typescript
// Get all lessons for a module
const { data: lessons } = await supabase
  .from('foundation_lessons')
  .select('*')
  .eq('module_id', moduleId);
```

---

## ❌ Troubleshooting

### Problem: "Not authenticated"

```
Error: You must be authenticated to use this command
```

**Solution**:
```bash
supabase login
# Follow the browser authorization
```

### Problem: "Project not linked"

```
Error: No project linked
```

**Solution**:
```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

### Problem: "Already applied"

```
Error: Migration already applied
```

**This is OK!** It means the migration was already run previously. Check:
```bash
supabase status
# Should show: All migrations applied
```

### Problem: "Permission denied"

```
Error: Permission denied for schema public
```

**Solution**:
1. Verify you're logged in to the correct Supabase account
2. Verify account has admin access to project
3. Run: `supabase logout` then `supabase login` again

### Problem: "Network error"

```
Error: Failed to connect to database
```

**Solution**:
1. Check internet connection
2. Wait a moment and try again
3. Verify Supabase project is not down (check https://status.supabase.com)

---

## 📊 Migration Files

The migration creates these SQL files (in order):

| File | Purpose |
|------|---------|
| `20260112_add_foundation_tables.sql` | Creates foundation_modules, foundation_lessons, and seed data |
| `20260112_add_progress_tables.sql` | Creates student_foundation_progress table |
| `20260112_update_foundation_lessons_meta.sql` | Updates lesson metadata |

All files are in: `supabase/migrations/`

---

## 🔄 Rollback (If Needed)

If you need to undo the migration:

```bash
# Option 1: Reset entire database (development only)
supabase db reset

# Option 2: Create reverse migration
supabase migration new drop_foundation_tables
# Edit the file to drop the tables
supabase db push
```

---

## 📝 Next Steps After Migration

1. ✅ Verify migration (see Verification Steps above)
2. 📱 Test frontend against new tables
3. 🚀 Deploy app to production
4. 📊 Monitor for any issues
5. 📖 Update app documentation if needed

---

## 💡 Quick Command Reference

```bash
# All-in-one (recommended)
bash scripts/run_foundation_migration.sh

# Or use npm scripts
npm run db:link                 # Link project
npm run migrate:foundation      # Push migrations
npm run migrate:status          # Check status

# Or use supabase CLI directly
supabase login
supabase link --project-ref ugpgsctazvnhkasqpclg
supabase db push
```

---

## ❓ Still Have Questions?

See: `FOUNDATION_MIGRATION_GUIDE.md` for detailed technical information

**Project ID**: `ugpgsctazvnhkasqpclg`  
**Status**: Ready to run  
**Time to complete**: ~2-5 minutes
