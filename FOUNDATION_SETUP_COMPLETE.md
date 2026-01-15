# 🎹 Foundation Module Migration - Complete Setup

## 📋 Summary

You now have everything you need to run foundation module migrations and save changes to your database.

---

## 🚀 Three Ways to Run the Migration

### **Option 1: Automated Script (Easiest) ⭐ RECOMMENDED**

```bash
bash scripts/run_foundation_migration.sh
```

This script handles everything:
- Checks authentication
- Links your project
- Shows pending migrations
- Pushes to Supabase
- Confirms success

### **Option 2: npm Scripts (Easy)**

```bash
# First time only - link project
npm run db:link

# Then push migrations
npm run migrate:foundation

# Check status anytime
npm run migrate:status
```

### **Option 3: Supabase CLI (Manual)**

```bash
supabase login
supabase link --project-ref ugpgsctazvnhkasqpclg
supabase db push
```

---

## 📚 What Gets Created

### Tables

**foundation_modules**
- Stores course modules (5 defaults seeded)
- Includes: title, description, level, xp_reward

**foundation_lessons**  
- Stores individual lessons within modules
- Includes: title, description, duration, content

**student_foundation_progress**
- Tracks student progress through modules
- Includes: completed_lessons, progress_percent

### Default Data (Seeded Automatically)

5 Foundation Modules:
1. **Welcome to Piano** (100 XP) - 4 lessons
2. **Reading Notes** (150 XP) - lessons included
3. **Rhythm Basics** (125 XP) - lessons included
4. **Your First Chords** (175 XP) - lessons included
5. **Simple Melodies** (200 XP) - lessons included

---

## ✅ How to Verify

### After running migration:

1. **Check logs** - Look for success message in terminal
2. **Check Supabase Dashboard**:
   - Go to https://app.supabase.com
   - Select project: `ugpgsctazvnhkasqpclg`
   - Go to Table Editor
   - See 3 new tables with data

3. **Check migration status**:
   ```bash
   supabase status
   ```
   Should show: "All migrations applied"

---

## 💻 Using in Your App

### Query Modules

```typescript
const { data: modules } = await supabase
  .from('foundation_modules')
  .select('*')
  .order('created_at');
```

### Save Changes to Database

```typescript
// Update module
const { data } = await supabase
  .from('foundation_modules')
  .update({ title: 'New Title' })
  .eq('id', moduleId);

// Track student progress
const { data } = await supabase
  .from('student_foundation_progress')
  .upsert({
    student_id: userId,
    module_id: moduleId,
    completed_lessons: 2,
    progress_percent: 50
  });
```

---

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `MIGRATION_QUICK_START.md` | **START HERE** - Fastest way to run |
| `FOUNDATION_MIGRATION_STEPS.md` | Step-by-step instructions with verification |
| `FOUNDATION_MIGRATION_GUIDE.md` | Detailed technical reference |
| `scripts/run_foundation_migration.sh` | Automated bash script |

---

## 🎯 Next Steps

1. **Run the migration** (choose one method above)
2. **Verify in Supabase dashboard**
3. **Test in development** - Sign in and create/update modules
4. **Deploy to production** - App will now persist changes
5. **Monitor** - Check for any issues

---

## ⏱️ Time Requirements

| Step | Time |
|------|------|
| Authenticate | 1-2 min (first time) |
| Link project | < 1 min |
| Run migration | 1-2 min |
| Verify | < 1 min |
| **Total** | **~3-5 minutes** |

---

## 🔒 Security

✅ Row Level Security (RLS) policies applied:
- Admins can manage all foundation data
- Teachers can view and manage
- Students can only view progress

---

## ❓ FAQ

**Q: What if migration fails?**  
A: Check error message, see Troubleshooting in detailed docs

**Q: Can I rollback?**  
A: Yes - `supabase db reset` (development only)

**Q: What if I already ran it?**  
A: Running again is safe - already applied migrations are skipped

**Q: Do I need to do this for local development?**  
A: No - tables exist in production, but you can run `npm run migrate:foundation:local` for local testing

---

## 🚨 Important Files

**To Run Migration**:
- `scripts/run_foundation_migration.sh` - The script
- `supabase/migrations/*.sql` - Migration files
- `package.json` - npm scripts

**To Understand**:
- `MIGRATION_QUICK_START.md` - Quick reference
- `FOUNDATION_MIGRATION_STEPS.md` - Detailed steps
- `FOUNDATION_MIGRATION_GUIDE.md` - Technical details

---

## 📊 Success Checklist

After migration, verify:

- [ ] No errors in terminal output
- [ ] 3 new tables in Supabase Table Editor
- [ ] `foundation_modules` has 5 rows
- [ ] `foundation_lessons` has lessons
- [ ] Can query tables from app
- [ ] Can create/update modules
- [ ] Student progress tracked

---

## 🎉 You're Ready!

Everything is set up. Just run:

```bash
bash scripts/run_foundation_migration.sh
```

Then verify in https://app.supabase.com

**Questions?** Check the documentation files above.

---

**Project**: Miraimusic  
**Database**: Supabase PostgreSQL  
**Project ID**: `ugpgsctazvnhkasqpclg`  
**Status**: ✅ Ready to deploy  
**Date**: January 15, 2026
