# Admin Management API

This repo includes simple server endpoints for admin user management. They require a valid Supabase access token for the calling user and the server must be configured with `SUPABASE_SERVICE_ROLE_KEY` to perform admin operations.

Endpoints

- `GET /admin/users` - List all Supabase users. Caller must be an admin (validated via `public.user_roles`).
- `POST /admin/assign-role` - Assign a role to a user. Body: `{ user_id, role }`. Caller must be admin.

How it works

1. The server verifies the incoming request token via Supabase Auth (`/auth/v1/user`) using `requireAuth` middleware.
2. The server verifies the caller has an `admin` entry in `public.user_roles` using the Supabase REST API with the Service Role Key.
3. If authorized, the server calls Supabase Admin endpoints or inserts into `user_roles` via REST.

Environment variables (server)

- `SUPABASE_SERVICE_ROLE_KEY` - required for admin endpoints to call Supabase Admin APIs.
- `SUPABASE_URL` - your Supabase project URL.

Usage example (assign role):

```bash
curl -X POST https://your-server.example.com/admin/assign-role \
  -H "Authorization: Bearer <admin-access-token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"<user-uuid>","role":"teacher"}'
```

Make sure the calling user is in `public.user_roles` with role `admin`.
