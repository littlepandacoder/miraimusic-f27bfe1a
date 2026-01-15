#!/usr/bin/env node

/**
 * Bulk user registration script.
 * Reads a small list of users and creates them via Supabase Admin API, then assigns roles in public.user_roles.
 * Requires SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL set in environment.
 */

const users = [
  { email: 'teacher1@example.com', password: 'TeachPass123!', role: 'teacher' },
  { email: 'student1@example.com', password: 'StudentPass123!', role: 'student' }
];

async function run() {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment');
      process.exit(1);
    }

    const fetch = globalThis.fetch || (await import('node-fetch')).default;

    for (const u of users) {
      console.log('Creating', u.email);
      const resp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({ email: u.email, password: u.password, email_confirm: true })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        console.error('Failed to create', u.email, txt);
        continue;
      }

      const user = await resp.json();
      const userId = user.id || user.user?.id;
      console.log('Created user id', userId);

      // assign role in DB
      const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify([{ user_id: userId, role: u.role }])
      });

      if (!insertResp.ok) {
        const txt = await insertResp.text();
        console.error('Failed to insert role for', u.email, txt);
      } else {
        console.log('Assigned role', u.role, 'to', u.email);
      }
    }

    console.log('Done');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
