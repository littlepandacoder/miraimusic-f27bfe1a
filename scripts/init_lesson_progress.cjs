#!/usr/bin/env node
/**
 * Initialize lesson_progress rows for existing students or a specific user.
 *
 * Usage (dry-run default):
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/init_lesson_progress.cjs --dry-run
 * To apply:
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/init_lesson_progress.cjs --apply
 * To run for a specific user:
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/init_lesson_progress.cjs --user <user_id> --apply
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const userArgIndex = argv.indexOf('--user');
const TARGET_USER = userArgIndex !== -1 ? argv[userArgIndex + 1] : null;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '500', 10);
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || '100', 10);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log('Initializing lesson_progress', APPLY ? '(APPLY)' : '(DRY RUN)');

  // Fetch lessons
  const { data: lessons, error: lessonsErr } = await supabase.from('module_lessons').select('id');
  if (lessonsErr) {
    console.error('Failed to fetch module_lessons:', lessonsErr);
    process.exit(1);
  }
  const lessonIds = (lessons || []).map(l => l.id);
  if (lessonIds.length === 0) {
    console.log('No lessons found. Exiting.');
    return;
  }

  // Determine target users: either a provided user or all users with role 'student'
  let studentIds = [];
  if (TARGET_USER) {
    studentIds = [TARGET_USER];
  } else {
    // Query user_roles to find student users
    const { data: rolesData, error: rolesErr } = await supabase.from('user_roles').select('user_id').eq('role', 'student');
    if (rolesErr) {
      console.error('Failed to fetch user_roles:', rolesErr);
      process.exit(1);
    }
    studentIds = (rolesData || []).map(r => r.user_id);
  }

  if (studentIds.length === 0) {
    console.log('No student users found. Exiting.');
    return;
  }

  console.log(`Preparing to initialize progress for ${studentIds.length} users and ${lessonIds.length} lessons.`);

  // Batch per user to avoid single huge requests; this makes the script safe for large
  // lesson/user counts. We'll upsert in chunks of BATCH_SIZE and wait a short delay
  // between batches to avoid hitting rate limits.
  function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
  }

  for (const sid of studentIds) {
    try {
      // Check if user already has any progress
      const { data: existing, error: existErr } = await supabase.from('lesson_progress').select('id').eq('student_id', sid).limit(1);
      if (existErr) {
        console.warn('Error checking existing progress for user', sid, existErr);
        continue;
      }
      if (existing && existing.length > 0) {
        console.log(`Skipping user ${sid} (already has progress)`);
        continue;
      }

      console.log(`User ${sid} has no progress. Preparing ${lessonIds.length} progress rows.`);

      const allPayload = lessonIds.map(lid => ({ lesson_id: lid, student_id: sid, completed: false, watched_seconds: 0 }));
      const chunks = chunkArray(allPayload, BATCH_SIZE);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!APPLY) {
          console.log(`DRY RUN: would insert batch ${i + 1}/${chunks.length} for user ${sid} - ${chunk.length} rows`);
          continue;
        }

        console.log(`Inserting batch ${i + 1}/${chunks.length} for user ${sid} (${chunk.length} rows) ...`);
        const { error: insertErr } = await supabase.from('lesson_progress').upsert(chunk, { onConflict: ['lesson_id', 'student_id'] });
        if (insertErr) {
          console.error('Failed to insert progress batch for user', sid, insertErr);
          // continue to next user but log the failure
          break;
        }

        // small delay between batches
        if (i < chunks.length - 1) await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }

      if (APPLY) console.log(`Inserted progress rows for user ${sid}`);

    } catch (e) {
      console.error('Error processing user', sid, e);
    }
  }

  console.log('Init finished. If applied, verify in staging.');
}

main().catch(e => { console.error(e); process.exit(1); });
