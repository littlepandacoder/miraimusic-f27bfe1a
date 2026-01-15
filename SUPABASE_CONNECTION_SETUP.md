# 🔐 Supabase PostgreSQL Connection Setup

## Your Connection Details

**Project ID**: `ugpgsctazvnhkasqpclg`  
**Database Host**: `db.tychkyunjfbkksyxknhn.supabase.co`  
**Port**: `5432`  
**Database**: `postgres`  
**User**: `postgres`

---

## ⚠️ IMPORTANT: Secure Password Management

Your PostgreSQL URI contains your password. **Never commit this to Git!**

```
postgresql://postgres:[YOUR-PASSWORD]@db.tychkyunjfbkksyxknhn.supabase.co:5432/postgres
```

### How to Handle Securely:

**Option 1: Environment Variables (Recommended)**

1. Create `.env.local` (already in .gitignore):
```bash
# .env.local (LOCAL DEVELOPMENT ONLY)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tychkyunjfbkksyxknhn.supabase.co:5432/postgres
SUPABASE_URL=https://ugpgsctazvnhkasqpclg.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

2. Add to `.gitignore` (if not already):
```
.env.local
.env*.local
supabase/.env.local
```

**Option 2: Supabase CLI (Recommended for Production)**

The Supabase CLI handles authentication securely:
```bash
supabase login
supabase link --project-ref ugpgsctazvnhkasqpclg
```

This stores credentials in:
- `~/.supabase/access-token` (your machine only)
- `supabase/.env.local` (project-specific, not committed)

---

## 🚀 Running Foundation Migration with Your Database

### Step 1: Authenticate with Supabase CLI

```bash
supabase login
```

You'll be prompted to authorize in your browser. This is **secure** - credentials stored locally.

### Step 2: Link Your Project

```bash
supabase link --project-ref ugpgsctazvnhkasqpclg
```

This creates `supabase/.env.local` with your connection details (safe, not committed).

### Step 3: Run the Migration

```bash
bash scripts/run_foundation_migration.sh
```

The script will:
- Use your authenticated connection
- Show pending migrations
- Push foundation tables to **your** database
- Create tables in your Supabase project

---

## ✅ Verify Connection

### Test PostgreSQL Connection

```bash
# Using psql (if installed)
psql "postgresql://postgres:[YOUR-PASSWORD]@db.tychkyunjfbkksyxknhn.supabase.co:5432/postgres" \
  -c "SELECT version();"
```

### Test via Supabase CLI

```bash
# This verifies connection is working
supabase status
```

Expected output:
```
Project: ugpgsctazvnhkasqpclg
Connected: true

Migrations status:
 • (Pending or applied migrations listed)
```

---

## 📊 After Migration

Your Supabase project will have:

**Tables Created**:
- `foundation_modules` (5 default modules)
- `foundation_lessons` (lessons for each)
- `student_foundation_progress` (student tracking)

**View in Dashboard**:
1. Go to https://app.supabase.com
2. Select your project
3. Click **Table Editor**
4. See your new tables with data

---

## 💻 Using in Your App

### Connection via Supabase Client (Recommended)

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: true },
    db: { schema: 'public' }
  }
);

export { supabase };
```

### Direct PostgreSQL (Backend Only)

For server-side operations (Node.js/Edge Functions):

```typescript
// server/index.cjs
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

client.connect();
```

---

## 🔄 Migration Command Reference

| Command | Purpose |
|---------|---------|
| `supabase login` | Authenticate (first time) |
| `supabase link --project-ref ugpgsctazvnhkasqpclg` | Link project |
| `bash scripts/run_foundation_migration.sh` | Run migrations |
| `supabase status` | Check migration status |
| `supabase db push` | Push all pending migrations |
| `supabase db pull` | Download latest schema |

---

## 🛡️ Security Best Practices

### ✅ DO:
- ✅ Use Supabase CLI for authentication (`supabase login`)
- ✅ Store passwords in `.env.local` (not committed)
- ✅ Use connection pooling in production
- ✅ Enable RLS (Row Level Security) policies ✓ Already configured
- ✅ Rotate passwords regularly via Supabase dashboard

### ❌ DON'T:
- ❌ Commit `.env.local` to Git
- ❌ Share your password in chat/email
- ❌ Hardcode credentials in code
- ❌ Use Postgres user for frontend (use JWT with Supabase Auth)
- ❌ Expose DATABASE_URL on frontend

---

## 🚨 If Password is Compromised

1. **Immediately**: Go to https://app.supabase.com
2. **Select your project**
3. **Go to Settings → Database**
4. **Reset password** (creates new password)
5. **Update `.env.local`** with new password
6. **Restart your app**

---

## 📝 Environment Variables Setup

### Development (.env.local)

```bash
# Supabase Client (for frontend)
VITE_SUPABASE_URL=https://ugpgsctazvnhkasqpclg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# PostgreSQL (for backend/server)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tychkyunjfbkksyxknhn.supabase.co:5432/postgres

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Production (Vercel/Environment Variables)

In your hosting platform (Vercel, Railway, etc.):
```
VITE_SUPABASE_URL=https://ugpgsctazvnhkasqpclg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.tychkyunjfbkksyxknhn.supabase.co:5432/postgres
```

⚠️ **Production passwords should be rotated regularly and managed by DevOps/SecOps team**

---

## ✅ Quick Checklist

Before running migration:

- [ ] Saved your PostgreSQL URI securely
- [ ] Created `.env.local` with DATABASE_URL (not committed)
- [ ] Ran `supabase login` successfully
- [ ] Ran `supabase link --project-ref ugpgsctazvnhkasqpclg`
- [ ] Verified `supabase status` shows connected
- [ ] Ready to run `bash scripts/run_foundation_migration.sh`

---

## 🎯 Next Steps

1. **Setup environment**: Follow Development (.env.local) section above
2. **Verify connection**: Run `supabase status`
3. **Run migration**: `bash scripts/run_foundation_migration.sh`
4. **Verify tables**: Check https://app.supabase.com Table Editor
5. **Test app**: Sign in and create/update modules
6. **Deploy**: Push to production with secure env vars

---

## 📚 Related Documentation

- `FOUNDATION_MIGRATION_STEPS.md` - How to run migration
- `MIGRATION_QUICK_START.md` - Quick reference
- `FOUNDATION_SETUP_COMPLETE.md` - Complete setup overview

---

**Connection Status**: ✅ Ready  
**Project**: `ugpgsctazvnhkasqpclg`  
**Next**: Run migration with `bash scripts/run_foundation_migration.sh`
