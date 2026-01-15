# 🎯 COMPLETE GUIDE: Run Foundation Migration with Your Supabase Database

## 📋 Your Setup Summary

**Project ID**: `ugpgsctazvnhkasqpclg`  
**PostgreSQL Host**: `db.tychkyunjfbkksyxknhn.supabase.co`  
**Database**: `postgres`  
**Port**: `5432`  

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Setup Authentication (1 min)

```bash
supabase login
```

Follow the browser authorization flow. This securely stores your credentials.

### Step 2: Link Your Project (1 min)

```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

Creates `supabase/.env.local` (safe, not committed to Git).

### Step 3: Run Migration (2-3 min)

```bash
bash scripts/run_foundation_migration.sh
```

This will:
- ✅ Connect to your Supabase database
- ✅ Create 3 new tables
- ✅ Seed 5 foundation modules
- ✅ Setup Row Level Security
- ✅ Confirm success

### Step 4: Verify (1 min)

Go to https://app.supabase.com → Your Project → Table Editor

You should see:
- `foundation_modules` (5 rows)
- `foundation_lessons` (lessons)
- `student_foundation_progress` (empty)

---

## 📚 What Gets Created in Your Database

### foundation_modules
5 default music learning modules:
1. Welcome to Piano (100 XP)
2. Reading Notes (150 XP)
3. Rhythm Basics (125 XP)
4. Your First Chords (175 XP)
5. Simple Melodies (200 XP)

### foundation_lessons
Individual lessons for each module with:
- Title, description, duration
- Rich content (JSONB for flexibility)

### student_foundation_progress
Tracks student progress:
- student_id (who)
- module_id (which module)
- completed_lessons (progress)
- progress_percent (0-100)

---

## 🔒 Environment Setup (For Local Development)

### Create `.env.local`

Copy the template:
```bash
cp server/.env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://ugpgsctazvnhkasqpclg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-supabase
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.tychkyunjfbkksyxknhn.supabase.co:5432/postgres
PORT=3001
NODE_ENV=development
```

**Getting your keys**:
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings → API**
4. Copy `Project URL` → VITE_SUPABASE_URL
5. Copy `anon public` → VITE_SUPABASE_ANON_KEY
6. Get postgres password from **Database** section

---

## 💻 Using Foundation Tables in Your App

### Query Modules
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data: modules } = await supabase
  .from('foundation_modules')
  .select('*')
  .order('created_at');
```

### Save Changes
```typescript
// Update a module
await supabase
  .from('foundation_modules')
  .update({ title: 'New Title' })
  .eq('id', moduleId);

// Track student progress
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

## ✅ Command Reference

| Command | Purpose |
|---------|---------|
| `supabase login` | Authenticate (first time) |
| `supabase link --project-ref ugpgsctazvnhkasqpclg` | Link project |
| `bash scripts/run_foundation_migration.sh` | Run migrations |
| `npm run migrate:foundation` | Alternative: npm script |
| `npm run migrate:status` | Check migration status |
| `npm run db:link` | Link project via npm |

---

## 🔍 Verify Your Database

### Via Supabase Dashboard

1. https://app.supabase.com → Select your project
2. Click **Table Editor**
3. See `foundation_modules`, `foundation_lessons`, `student_foundation_progress`

### Via CLI

```bash
supabase status
```

Output should show:
```
Project: ugpgsctazvnhkasqpclg
Connected: true
(All migrations applied)
```

### Via SQL Query

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'foundation%';
```

---

## 🛡️ Security Checklist

- ✅ `.env.local` created and never committed
- ✅ Password stored securely (not in code)
- ✅ Supabase CLI authenticated locally
- ✅ Row Level Security policies applied
- ✅ Frontend uses anon key (safe)
- ✅ Backend uses DATABASE_URL (backend only)
- ✅ `.gitignore` includes `.env.local`

---

## 📋 Files You'll Work With

| File | Purpose |
|------|---------|
| `.env.local` | Your local credentials (not committed) |
| `MIGRATION_QUICK_START.md` | Quick reference |
| `FOUNDATION_MIGRATION_STEPS.md` | Detailed steps |
| `FOUNDATION_MIGRATION_GUIDE.md` | Technical deep-dive |
| `SUPABASE_CONNECTION_SETUP.md` | Connection security |
| `scripts/run_foundation_migration.sh` | Automated script |
| `supabase/migrations/*.sql` | Migration files |

---

## 🎯 Flow Diagram

```
You provide:
  PostgreSQL URI with password
       ↓
Supabase CLI (authenticated)
  ├─ Store credentials securely
  ├─ Link to your project
  └─ Connect to your database
       ↓
Migration Script
  ├─ Read migration files
  ├─ Create 3 tables
  ├─ Seed 5 modules
  └─ Apply Row Level Security
       ↓
Your Supabase Database
  ├─ foundation_modules
  ├─ foundation_lessons
  └─ student_foundation_progress
       ↓
Your App Can Now
  ├─ Read foundation data
  ├─ Save changes to database
  └─ Track student progress
```

---

## ❓ FAQ

**Q: Is my password safe with Supabase CLI?**  
A: Yes! It's stored locally in `~/.supabase/access-token` and `supabase/.env.local` (not committed).

**Q: What if I lose my password?**  
A: You can reset it in Supabase dashboard → Settings → Database → Reset Password.

**Q: Can I test locally first?**  
A: Yes! Run `supabase start` for local development database.

**Q: Will this break my existing data?**  
A: No! Migration only adds new tables. Existing data is untouched.

**Q: What if migration fails?**  
A: The script shows the error. Common causes:
- Not authenticated (`supabase login`)
- Not linked (`supabase link`)
- Already applied (run `supabase status`)

---

## 🚨 If Something Goes Wrong

### Issue: "Not authenticated"
```bash
supabase login
# Authorize in browser, then try again
```

### Issue: "Project not linked"
```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

### Issue: "Permission denied"
```bash
# Log out and back in
supabase logout
supabase login
```

### Issue: "Already applied"
```bash
# This is fine! Tables already exist
supabase status  # Verify
```

---

## ✨ What You Can Do Now

After migration completes:

✅ **Frontend**: Save foundation module edits to database  
✅ **Backend**: Query foundation data via API  
✅ **Tracking**: Persist student progress automatically  
✅ **Queries**: Complex joins with lessons and progress  
✅ **Scalability**: Database handles all data persistence  

---

## 📈 Next Steps

1. ✅ Run migration: `bash scripts/run_foundation_migration.sh`
2. ✅ Verify in dashboard: https://app.supabase.com
3. ✅ Update your app code to query tables
4. ✅ Test: Sign in, create/edit modules
5. ✅ Deploy: Push to production

---

## 📞 Support

- **Connection issues?** → See `SUPABASE_CONNECTION_SETUP.md`
- **Migration steps?** → See `FOUNDATION_MIGRATION_STEPS.md`
- **Technical details?** → See `FOUNDATION_MIGRATION_GUIDE.md`
- **Quick reference?** → See `MIGRATION_QUICK_START.md`

---

**Status**: ✅ Ready to run  
**Time**: ~5 minutes  
**Result**: Foundation tables in your Supabase database  
**Next**: `bash scripts/run_foundation_migration.sh`
