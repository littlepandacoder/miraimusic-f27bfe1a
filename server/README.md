Mongo API server
================

This small Express server provides a secure server-side API to read/write application data in MongoDB. It validates Supabase access tokens (so you can keep Supabase Auth) and performs upserts to Mongo collections.

Setup
-----

1. Copy `server/.env.example` to `server/.env` and fill in values:

   - `MONGO_URI` - your MongoDB Atlas connection string (keep secret)
   - `SUPABASE_URL` - your Supabase project URL (used to validate tokens)
   - optionally `SUPABASE_SERVICE_ROLE_KEY` for admin server actions

2. Run locally from the repo root:

```bash
# install deps if not installed already
npm install

# start the server
node server/index.cjs
```

Endpoints
---------

- `GET /health` - basic health check
- `GET /modules` - list modules (requires Authorization: Bearer <access_token>)
- `GET /modules/:oldId/lessons` - list lessons for module (old numeric id)
- `POST /lesson_progress` - upsert lesson progress, body: { lesson_old_id, completed, watched_seconds }

Usage notes
-----------

- Do not expose `MONGO_URI` to the browser. Always call the server from the frontend and send the user's access token.
- This server uses `old_id` fields (numeric Postgres ids) to keep mapping simple post-migration. You can later map these to ObjectId references.
