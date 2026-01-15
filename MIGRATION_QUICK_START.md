# 🚀 QUICK START: Run Foundation Migration NOW

## Fastest Way (Copy & Paste)

```bash
# 1. Navigate to project
cd /Users/jammiverse/Documents/GitHub/miraimusic-f27bfe1a

# 2. Run the automated migration script
bash scripts/run_foundation_migration.sh
```

That's it! The script will:
1. ✅ Check if you're authenticated (login if needed)
2. ✅ Link your project
3. ✅ Show pending migrations
4. ✅ Push migrations to Supabase
5. ✅ Confirm everything worked

---

## What Gets Created

After running the script, these database tables are created:

### 📚 foundation_modules (5 default)
- Welcome to Piano
- Reading Notes
- Rhythm Basics
- Your First Chords
- Simple Melodies

### 📖 foundation_lessons
- Lessons for each module
- Each with title, description, duration

### 📊 student_foundation_progress
- Tracks student progress through modules
- Stores completed_lessons and progress_percent

---

## Verify It Worked

After the script completes:

1. Go to https://app.supabase.com
2. Select your project: **ugpgsctazvnhkasqpclg**
3. Click **Table Editor** (left sidebar)
4. You should see:
   - ✓ `foundation_modules` table (5 rows)
   - ✓ `foundation_lessons` table (lessons)
   - ✓ `student_foundation_progress` table

---

## Alternative: Using npm

```bash
# If you prefer npm commands
npm run db:link              # Link project (first time only)
npm run migrate:foundation   # Push migrations
npm run migrate:status       # Check status
```

---

## Troubleshooting

**Error: "Not authenticated"**
```bash
supabase login
# Then run the script again
```

**Error: "Permission denied"**
- Make sure you have admin access to the Supabase project
- Try logging out and in again: `supabase logout` → `supabase login`

**Error: "Already applied"**
- This is fine! Migrations were already run
- Check: `supabase status`

---

## What This Enables

Now your frontend can:
- ✅ Save foundation module changes to database
- ✅ Track student progress on modules
- ✅ Query lessons and module data
- ✅ Update student progress automatically

---

**Status**: Ready to run!  
**Estimated time**: 2-5 minutes  
**Next step**: Run the migration script above
