Supabase deploy runbook

This repo includes a GitHub Actions workflow to apply DB migrations and deploy the `create-user` edge function.

Required GitHub repository secrets (add in Settings → Secrets):
- SUPABASE_ACCESS_TOKEN  — a Supabase CLI access token (from `supabase login` or a machine token)
- SUPABASE_PROJECT_REF   — your Supabase project ref (e.g., `your-project-ref`)
- SUPABASE_SERVICE_ROLE_KEY (optional) — service role key; if provided, it's set as a project secret

How to run the workflow
1. Add the required secrets to the repository.
2. Go to Actions → "Supabase migrations & function deploy" → Run workflow → choose branch and run.

How to run locally (alternative)
1. Install Supabase CLI: `npm i -g supabase`
2. Login: `supabase login` (or export `SUPABASE_ACCESS_TOKEN`)
3. Apply migrations:
   - `supabase db push --project-ref <PROJECT_REF> --file supabase/migrations/20260111_fix_profiles_bookings_policies.sql`
   - `supabase db push --project-ref <PROJECT_REF> --file supabase/migrations/20260111_add_schools_and_assignments.sql`
   - `supabase db push --project-ref <PROJECT_REF> --file supabase/migrations/20260111_ensure_teacher_students.sql`
4. Deploy function:
   - `supabase functions deploy create-user --project-ref <PROJECT_REF>`
   - `supabase functions deploy autosave-foundation --project-ref <PROJECT_REF>`
   - `supabase functions deploy progress-api --project-ref <PROJECT_REF>`

6. Apply the new progress migration:
   - `supabase db push --project-ref <PROJECT_REF> --file supabase/migrations/20260112_add_progress_tables.sql`

5. Apply the new foundation migration(s):
   - `supabase db push --project-ref <PROJECT_REF> --file supabase/migrations/20260112_add_foundation_tables.sql`
   - `supabase db push --project-ref <PROJECT_REF> --file supabase/migrations/20260112_update_foundation_lessons_meta.sql`

Notes & verification
- After running the workflow, verify:
  - profiles/bookings policies require auth via Supabase SQL or Dashboard.
  - `teacher_students` table exists: `
    SELECT table_name FROM information_schema.tables WHERE table_name = 'teacher_students';`
  - The `create-user` function is deployed and requires Authorization header (test with an admin token).

If you want, I can also add an integration test that runs after deployment to verify the RLS behavior.
