#!/usr/bin/env node
/**
 * Reset lesson progress for a user identified by email.
 * Usage (dry-run default):
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/reset_user_progress.cjs --email user@example.com
 * To apply:
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/reset_user_progress.cjs --email user@example.com --apply
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const argv = process.argv.slice(2);
const emailArgIndex = argv.indexOf('--email');
const APPLY = argv.includes('--apply');
const ALL = argv.includes('--all');
const createdAfterIndex = argv.indexOf('--created-after');
const createdBeforeIndex = argv.indexOf('--created-before');

let email = null;
if (emailArgIndex !== -1 && argv[emailArgIndex + 1]) email = argv[emailArgIndex + 1];

let createdAfter = null;
let createdBefore = null;
if (createdAfterIndex !== -1 && argv[createdAfterIndex + 1]) createdAfter = argv[createdAfterIndex + 1];
if (createdBeforeIndex !== -1 && argv[createdBeforeIndex + 1]) createdBefore = argv[createdBeforeIndex + 1];

if (!email && !ALL && !createdAfter && !createdBefore) {
  console.error('ERROR: you must pass --email <email> OR --all OR --created-after/--created-before');
  process.exit(2);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log(`Reset progress for email=${email} (${APPLY ? 'APPLY' : 'DRY RUN'})`);

  // Build list of target user_ids
  let targets = [];

  if (email) {
    const { data: profile, error: profileErr } = await supabase.from('profiles').select('user_id,email,created_at').eq('email', email).maybeSingle();
    if (profileErr) {
      console.error('Failed to query profiles:', profileErr);
      process.exit(1);
    }
    if (!profile || !profile.user_id) {
      console.error('No profile found for email:', email);
      process.exit(1);
    }
    targets.push({ user_id: profile.user_id, email: profile.email, created_at: profile.created_at });
  } else {
    // Query profiles by created_at range or all
    let q = supabase.from('profiles').select('user_id,email,created_at');
    if (createdAfter) q = q.gte('created_at', createdAfter);
    if (createdBefore) q = q.lte('created_at', createdBefore);
    if (ALL && !createdAfter && !createdBefore) {
      // nothing to add to query; selects all
    }
    const { data: profiles, error: profilesErr } = await q;
    if (profilesErr) {
      console.error('Failed to query profiles:', profilesErr);
      process.exit(1);
    }
    if (!profiles || profiles.length === 0) {
      console.log('No profiles matched the criteria. Exiting.');
      return;
    }
    targets = (profiles || []).map(p => ({ user_id: p.user_id, email: p.email, created_at: p.created_at }));
  }

  console.log(`Found ${targets.length} target profiles`);

  for (const t of targets) {
    const uid = t.user_id;
    const { data: existing, error: countErr } = await supabase.from('lesson_progress').select('id', { count: 'exact' }).eq('student_id', uid);
    if (countErr) {
      console.error('Failed to count lesson_progress rows for', uid, countErr);
      continue;
    }
    const count = existing ? existing.length : 0;
    console.log(`User ${t.email} (${uid}) has ${count} lesson_progress rows`);

    if (!APPLY) {
      console.log(`DRY RUN: would update ${count} rows for user ${t.email} (${uid}) to completed=false, watched_seconds=0, last_watched_at=null`);
      continue;
    }

    const { data: updated, error: updateErr } = await supabase.from('lesson_progress').update({ completed: false, watched_seconds: 0, last_watched_at: null, updated_at: new Date().toISOString() }).eq('student_id', uid);
    if (updateErr) {
      console.error('Failed to update lesson_progress rows for', uid, updateErr);
      continue;
    }
    console.log(`Updated ${updated ? updated.length : 0} rows for ${t.email} (${uid})`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
