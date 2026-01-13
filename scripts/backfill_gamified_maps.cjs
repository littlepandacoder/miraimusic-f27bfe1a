#!/usr/bin/env node
/**
 * Backfill script to create Foundation `modules` and `module_lessons` from existing
 * `gamified_maps` rows.
 *
 * Usage (dry-run safe):
 *   SUPABASE_URL="https://..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/backfill_gamified_maps.cjs --dry-run
 * To actually apply changes, run without --dry-run (be careful):
 *   SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/backfill_gamified_maps.cjs --apply
 *
 * NOTES & ASSUMPTIONS:
 * - Assumes your Supabase DB has tables `gamified_maps`, `modules`, and `module_lessons`.
 * - The script will skip a map if a `foundation_module_id` is already present on the gamified_map row.
 * - The exact column names for modules/module_lessons are assumed (title, description, module_id, position, video_url).
 * - Use staging first. This script supports a dry-run mode and will not write unless --apply is provided.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const argv = process.argv.slice(2);
const DRY_RUN = !argv.includes('--apply');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log('Starting gamified_maps backfill', DRY_RUN ? '(DRY RUN)' : '(APPLY)');

  const { data: maps, error } = await supabase.from('gamified_maps').select('*');
  if (error) {
    console.error('Failed to query gamified_maps:', error);
    process.exit(1);
  }

  if (!maps || maps.length === 0) {
    console.log('No gamified_maps found. Nothing to do.');
    return;
  }

  for (const map of maps) {
    try {
      // If the map already has foundation_module_id, skip
      if (map.foundation_module_id) {
        console.log(`Skipping map id=${map.id} (already linked to foundation module ${map.foundation_module_id})`);
        continue;
      }

      const moduleTitle = map.name || map.title || `Gamified Map ${map.id}`;
      const modulePayload = {
        title: moduleTitle,
        description: map.description || null,
        // created_by: null // if you have an owner id on the map, you can set it here
      };

      console.log(`Preparing to create module for map id=${map.id} title="${moduleTitle}"`);

      if (DRY_RUN) {
        console.log('DRY RUN: would insert module:', JSON.stringify(modulePayload));
      } else {
        const { data: insertedModules, error: insertErr } = await supabase.from('modules').insert(modulePayload).select('id').limit(1);
        if (insertErr) {
          console.error('Failed to insert module for map id=', map.id, insertErr);
          continue;
        }
        const newModuleId = insertedModules[0].id;
        console.log(`Created module id=${newModuleId} for map id=${map.id}`);

        // Update the gamified_map row to point to the new foundation module id
        const { error: updateErr } = await supabase.from('gamified_maps').update({ foundation_module_id: newModuleId }).eq('id', map.id);
        if (updateErr) console.warn('Warning: failed to update gamified_map.foundation_module_id', updateErr);

        // Create lessons if the map has modules array
        if (Array.isArray(map.modules) && map.modules.length > 0) {
          let position = 0;
          for (const lesson of map.modules) {
            position += 1;
            const lessonPayload = {
              module_id: newModuleId,
              title: lesson.name || lesson.title || `Lesson ${position}`,
              description: lesson.description || null,
              position,
              video_url: (lesson.video && lesson.video.url) || lesson.video_url || null
            };
            const { error: lessonErr } = await supabase.from('module_lessons').insert(lessonPayload);
            if (lessonErr) console.error('Failed to create module_lesson for module', newModuleId, lessonErr);
            else console.log(`Inserted lesson '${lessonPayload.title}' for module ${newModuleId}`);
          }
        } else {
          console.log('No lessons array on map; skipping lesson creation for this map.');
        }
      }

    } catch (e) {
      console.error('Error processing map id=', map.id, e);
    }
  }

  console.log('Backfill finished. If you ran with --apply, validate the new modules/lessons in staging.');
}

main().catch((err) => {
  console.error('Fatal error in backfill script:', err);
  process.exit(1);
});
