#!/usr/bin/env node
/*
  Incremental sync scaffold: reads Postgres rows updated since last sync and upserts them into Mongo.
  - Requires PG_CONNECTION and MONGO_URI in env or .env
  - Stores last sync timestamp in Mongo collection `migration_meta` with key 'last_sync_at'
  - Use: node scripts/sync_changes_to_mongo.cjs
*/

require('dotenv').config();
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

const PG_CONN = process.env.PG_CONNECTION || process.env.DATABASE_URL;
const MONGO_URI = process.env.MONGO_URI;
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE, 10) : 500;

if (!PG_CONN || !MONGO_URI) {
  console.error('ERROR: PG_CONNECTION and MONGO_URI must be set in env or .env');
  process.exit(1);
}

async function sync() {
  const pg = new Pool({ connectionString: PG_CONN });
  const mongo = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await mongo.connect();
  const db = mongo.db();

  try {
    await pg.connect();
    // Read last sync time
    const meta = await db.collection('migration_meta').findOne({ _id: 'last_sync_at' });
    const lastSync = meta && meta.value ? new Date(meta.value) : new Date(0);
    console.log('[sync] last sync at', lastSync.toISOString());

    async function upsertTable({ table, collectionName, mapRow }) {
      console.log(`[sync] upserting ${table} -> ${collectionName}`);
      let offset = 0;
      let total = 0;
      while (true) {
        const sql = `SELECT * FROM ${table} WHERE COALESCE(updated_at, created_at) > $1 ORDER BY id ASC LIMIT $2 OFFSET $3`;
        const res = await pg.query(sql, [lastSync.toISOString(), BATCH_SIZE, offset]);
        if (!res.rows.length) break;
        const ops = res.rows.map(r => ({ updateOne: { filter: { old_id: r.id }, update: { $set: mapRow(r) }, upsert: true } }));
        try {
          const result = await db.collection(collectionName).bulkWrite(ops, { ordered: false });
          console.log(`[sync] ${collectionName} bulkWrite: matched:${result.matchedCount} upserted:${result.upsertedCount}`);
        } catch (err) {
          console.warn('[sync] bulkWrite error', err.message || err);
        }
        total += res.rows.length;
        offset += res.rows.length;
      }
      console.log(`[sync] completed ${collectionName} -> ${total}`);
    }

    // Tables to sync (same mapping as migration)
    await upsertTable({ table: 'modules', collectionName: 'modules', mapRow: (r) => ({
      title: r.title,
      description: r.description,
      level: r.level,
      status: r.status,
      xp_reward: r.xp_reward,
      created_by: r.created_by,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
      old_id: r.id,
    })});

    await upsertTable({ table: 'module_lessons', collectionName: 'lessons', mapRow: (r) => ({
      module_old_id: r.module_id,
      title: r.title,
      description: r.description,
      order: r.order,
      duration_minutes: r.duration_minutes,
      status: r.status,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
      old_id: r.id,
    })});

    await upsertTable({ table: 'lesson_videos', collectionName: 'videos', mapRow: (r) => ({
      lesson_old_id: r.lesson_id,
      title: r.title,
      url: r.url,
      source: r.source,
      size_bytes: r.size_bytes,
      duration_seconds: r.duration_seconds,
      created_at: r.created_at ? new Date(r.created_at) : new Date(),
      old_id: r.id,
    })});

    await upsertTable({ table: 'lesson_progress', collectionName: 'lesson_progress', mapRow: (r) => ({
      lesson_old_id: r.lesson_id,
      student_id: r.student_id,
      completed: r.completed,
      watched_seconds: r.watched_seconds,
      last_watched_at: r.last_watched_at ? new Date(r.last_watched_at) : null,
      old_id: r.id,
    })});

    // Update last sync time to now
    const now = new Date();
    await db.collection('migration_meta').updateOne({ _id: 'last_sync_at' }, { $set: { value: now.toISOString() } }, { upsert: true });
    console.log('[sync] updated last_sync_at to', now.toISOString());
  } finally {
    await pg.end().catch(() => {});
    await mongo.close().catch(() => {});
  }
}

sync().catch(err => {
  console.error('[sync] Fatal error', err);
  process.exit(1);
});
