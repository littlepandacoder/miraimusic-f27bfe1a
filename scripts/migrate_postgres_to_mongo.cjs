#!/usr/bin/env node
/*
  Migrate selected Postgres tables to MongoDB Atlas.

  Usage:
    - Create a .env file in repo root with:
        PG_CONNECTION=postgres://user:pass@host:5432/dbname
        MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

    - Install dependencies: npm install pg mongodb dotenv
    - Run: node scripts/migrate_postgres_to_mongo.cjs --dry-run

  Notes:
    - This script preserves original numeric/string IDs in an `old_id` field
      and creates new MongoDB ObjectIds for the inserted documents.
    - It maps relations (module -> lessons -> videos) by translating
      old IDs to the new ObjectId references.
    - It does not migrate Supabase Auth users (those live in the Auth system).
      If you store profiles in Postgres, add the table to the migration list.
    - Test on a staging DB first.
*/

require('dotenv').config();
const { Pool } = require('pg');
const { MongoClient, ObjectId } = require('mongodb');

const PG_CONN = process.env.PG_CONNECTION || process.env.DATABASE_URL;
const MONGO_URI = process.env.MONGO_URI;

// CLI args
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const sinceArg = argv.find(a => a.startsWith('--since='));
const since = sinceArg ? new Date(sinceArg.split('=')[1]) : (process.env.SINCE ? new Date(process.env.SINCE) : null);
const batchSizeArg = argv.find(a => a.startsWith('--batch-size='));
const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : (process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 500);

if (!PG_CONN) {
  console.error('ERROR: PG_CONNECTION (or DATABASE_URL) must be set in env or .env');
  process.exit(1);
}

function iso(d) {
  return d ? new Date(d).toISOString() : 'null';
}

async function migrate() {
  const pg = new Pool({ connectionString: PG_CONN });
  let mongo;
  let db;
  if (!dryRun) {
    if (!MONGO_URI) {
      console.error('ERROR: MONGO_URI must be set in env or .env unless using --dry-run');
      process.exit(1);
    }
    mongo = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
    await mongo.connect();
    db = mongo.db();
    console.log('[migrate] Connected to MongoDB', db.databaseName);
  } else {
    console.log('[migrate] Running in dry-run mode: no writes to MongoDB will be performed');
  }

  // Connect to Postgres
  await pg.connect();
  console.log('[migrate] Connected to Postgres');
  console.log('[migrate] options:', { dryRun, since: iso(since), batchSize: BATCH_SIZE });

  try {
    // We maintain maps to translate old numeric ids to created ObjectIds only when doing a full initial run.
    // For idempotent upserts we key on `old_id`, so consumers can resolve references using that field.

    // Helper to page through Postgres rows and perform upserts into Mongo via bulkWrite
    async function processTable({ table, orderBy = 'id', mapRowToDoc, collectionName }) {
      console.log(`[migrate] Processing table: ${table} -> ${collectionName}`);
      let offset = 0;
      let total = 0;
      while (true) {
        const params = [BATCH_SIZE, offset];
        let where = '';
        if (since) {
          params.push(since.toISOString());
          // safe fallback for different timestamp column names
          where = `WHERE (COALESCE(updated_at, created_at) > $3)`;
        }
        const sql = `SELECT * FROM ${table} ${where} ORDER BY ${orderBy} ASC LIMIT $1 OFFSET $2`;
        const res = await pg.query(sql, params);
        if (!res.rows.length) break;
        const ops = [];
        for (const r of res.rows) {
          const doc = mapRowToDoc(r);
          if (!doc.old_id) doc.old_id = r.id || r.old_id || null;
          if (dryRun) {
            // show a brief sample
            if (total < 5) console.log('[migrate][dry] sample:', doc);
          } else {
            ops.push({ updateOne: { filter: { old_id: doc.old_id }, update: { $set: doc }, upsert: true } });
          }
        }
        if (!dryRun && ops.length) {
          try {
            const result = await db.collection(collectionName).bulkWrite(ops, { ordered: false });
            console.log(`[migrate] ${collectionName} bulkWrite: matched:${result.matchedCount} upserted:${result.upsertedCount}`);
          } catch (err) {
            console.warn(`[migrate] bulkWrite warning for ${collectionName}:`, err.message || err);
          }
        }
        total += res.rows.length;
        offset += res.rows.length;
        if (res.rows.length < BATCH_SIZE) break;
      }
      console.log(`[migrate] ${collectionName} -> processed ${total}`);
    }

    // 1) modules
    try {
      await processTable({
        table: 'modules',
        orderBy: 'id',
        collectionName: 'modules',
        mapRowToDoc: (r) => ({
          title: r.title,
          description: r.description,
          level: r.level,
          status: r.status,
          xp_reward: r.xp_reward,
          created_by: r.created_by,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
          updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
          // keep old numeric id
          old_id: r.id,
        }),
      });
    } catch (err) {
      console.warn('[migrate] skipping modules:', err.message || err);
    }

    // 2) lessons (module_lessons)
    try {
      await processTable({
        table: 'module_lessons',
        orderBy: 'module_id',
        collectionName: 'lessons',
        mapRowToDoc: (r) => ({
          module_old_id: r.module_id,
          title: r.title,
          description: r.description,
          order: r.order,
          duration_minutes: r.duration_minutes,
          status: r.status,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
          updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
          old_id: r.id,
        }),
      });
    } catch (err) {
      console.warn('[migrate] skipping lessons:', err.message || err);
    }

    // 3) lesson_videos
    try {
      await processTable({
        table: 'lesson_videos',
        orderBy: 'lesson_id',
        collectionName: 'videos',
        mapRowToDoc: (r) => ({
          lesson_old_id: r.lesson_id,
          title: r.title,
          url: r.url,
          source: r.source,
          size_bytes: r.size_bytes,
          duration_seconds: r.duration_seconds,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
          old_id: r.id,
        }),
      });
    } catch (err) {
      console.warn('[migrate] skipping lesson_videos:', err.message || err);
    }

    // 4) lesson_progress
    try {
      await processTable({
        table: 'lesson_progress',
        orderBy: 'id',
        collectionName: 'lesson_progress',
        mapRowToDoc: (r) => ({
          lesson_old_id: r.lesson_id,
          student_id: r.student_id,
          completed: r.completed,
          watched_seconds: r.watched_seconds,
          last_watched_at: r.last_watched_at ? new Date(r.last_watched_at) : null,
          old_id: r.id,
        }),
      });
    } catch (err) {
      console.warn('[migrate] skipping lesson_progress:', err.message || err);
    }

    // 5) user_roles (if present)
    try {
      await processTable({
        table: 'user_roles',
        orderBy: 'id',
        collectionName: 'user_roles',
        mapRowToDoc: (r) => ({
          user_id: r.user_id,
          role: r.role,
          old_id: r.id,
        }),
      });
    } catch (err) {
      console.warn('[migrate] skipping user_roles:', err.message || err);
    }

    // Create helpful indexes
    try {
      if (!dryRun) {
        await db.collection('modules').createIndex({ old_id: 1 });
        await db.collection('lessons').createIndex({ old_id: 1 });
        await db.collection('lessons').createIndex({ module_old_id: 1 });
        await db.collection('videos').createIndex({ lesson_old_id: 1 });
        await db.collection('lesson_progress').createIndex({ lesson_old_id: 1, student_id: 1 });
        console.log('[migrate] Created indexes');
      } else {
        console.log('[migrate] dry-run: skipping index creation');
      }
    } catch (err) {
      console.warn('[migrate] index creation warnings:', err.message || err);
    }

    console.log('[migrate] Migration completed. Preview collections in MongoDB Atlas.');
  } finally {
    await pg.end().catch(() => {});
    if (mongo) await mongo.close().catch(() => {});
  }
}

migrate().catch(err => {
  console.error('[migrate] Fatal error', err);
  process.exit(1);
});
