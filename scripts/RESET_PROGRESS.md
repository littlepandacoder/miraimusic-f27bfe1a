Reset lesson progress helper

This script helps you reset `lesson_progress` rows for specific users.

Files
- `scripts/reset_user_progress.cjs` - Node script. Supports dry-run and apply modes.

Usage examples

- Dry-run for a single email (safe):
  ```bash
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  node scripts/reset_user_progress.cjs --email ethanbrown2016@icloud.com
  ```

- Apply for a single email:
  ```bash
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  node scripts/reset_user_progress.cjs --email ethanbrown2016@icloud.com --apply
  ```

- Dry-run for all users created after a date:
  ```bash
  SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/reset_user_progress.cjs --created-after 2025-01-01
  ```

- Apply for all users (CAUTION):
  ```bash
  SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/reset_user_progress.cjs --all --apply
  ```

Notes
- Script uses the `profiles` table to find `user_id` by email or created_at ranges. It updates only the `lesson_progress` table, setting `completed=false`, `watched_seconds=0`, and `last_watched_at=null`.
- Always run dry-run first.
- Requires Supabase service role key to update other users' progress.
