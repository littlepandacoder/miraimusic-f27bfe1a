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

// Dry run flag: --dry-run or DRY_RUN=true will not write to Mongo; it only reports counts and sample docs.
const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run') || process.env.DRY_RUN === 'true';

if (!PG_CONN) {
  console.error('ERROR: PG_CONNECTION (or DATABASE_URL) must be set in env or .env');
  process.exit(1);
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

  try {
    // Maps old numeric IDs to new ObjectIds
    const moduleMap = new Map();
    const lessonMap = new Map();

    // 1) Migrate modules
    try {
      const modulesRes = await pg.query('SELECT * FROM modules');
      const modules = modulesRes.rows.map(r => {
        const _id = new ObjectId();
        moduleMap.set(String(r.id), _id);
        return {
          _id,
          old_id: r.id,
          title: r.title,
          description: r.description,
          level: r.level,
          status: r.status,
          xp_reward: r.xp_reward,
          created_by: r.created_by,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
          updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
        };
      });
      console.log(`[migrate] modules -> found ${modules.length}`);
      if (!dryRun && modules.length) {
        await db.collection('modules').insertMany(modules);
        console.log(`[migrate] modules -> inserted ${modules.length}`);
      }
      if (dryRun && modules.length) {
        console.log('[migrate] modules sample:', modules.slice(0, 3));
      }
    } catch (err) {
      console.warn('[migrate] skipping modules:', err.message || err);
    }

    // 2) Migrate lessons (module_lessons)
    try {
      const lessonsRes = await pg.query('SELECT * FROM module_lessons ORDER BY module_id, "order" ASC NULLS LAST');
      const lessons = lessonsRes.rows.map(r => {
        const _id = new ObjectId();
        lessonMap.set(String(r.id), _id);
        return {
          _id,
          old_id: r.id,
          module_ref: moduleMap.get(String(r.module_id)) || null,
          title: r.title,
          description: r.description,
          order: r.order,
          duration_minutes: r.duration_minutes,
          status: r.status,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
          updated_at: r.updated_at ? new Date(r.updated_at) : new Date(),
        };
      });
      console.log(`[migrate] lessons -> found ${lessons.length}`);
      if (!dryRun && lessons.length) {
        await db.collection('lessons').insertMany(lessons);
        console.log(`[migrate] lessons -> inserted ${lessons.length}`);
      }
      if (dryRun && lessons.length) {
        console.log('[migrate] lessons sample:', lessons.slice(0, 3));
      }
    } catch (err) {
      console.warn('[migrate] skipping lessons:', err.message || err);
    }

    // 3) Migrate lesson_videos
    try {
      const vidsRes = await pg.query('SELECT * FROM lesson_videos');
      const vids = vidsRes.rows.map(r => ({
        _id: new ObjectId(),
        old_id: r.id,
        lesson_ref: lessonMap.get(String(r.lesson_id)) || null,
        title: r.title,
        url: r.url,
        source: r.source,
        size_bytes: r.size_bytes,
        duration_seconds: r.duration_seconds,
        created_at: r.created_at ? new Date(r.created_at) : new Date(),
      }));
      console.log(`[migrate] lesson_videos -> found ${vids.length}`);
      if (!dryRun && vids.length) {
        await db.collection('videos').insertMany(vids);
        console.log(`[migrate] lesson_videos -> inserted ${vids.length}`);
      }
      if (dryRun && vids.length) {
        console.log('[migrate] lesson_videos sample:', vids.slice(0, 3));
      }
    } catch (err) {
      console.warn('[migrate] skipping lesson_videos:', err.message || err);
    }

    // 4) Migrate lesson_progress
    try {
      const progRes = await pg.query('SELECT * FROM lesson_progress');
      const prog = progRes.rows.map(r => ({
        _id: new ObjectId(),
        old_id: r.id,
        lesson_ref: lessonMap.get(String(r.lesson_id)) || null,
        student_id: r.student_id,
        completed: r.completed,
        watched_seconds: r.watched_seconds,
        last_watched_at: r.last_watched_at ? new Date(r.last_watched_at) : null,
      }));
      console.log(`[migrate] lesson_progress -> found ${prog.length}`);
      if (!dryRun && prog.length) {
        await db.collection('lesson_progress').insertMany(prog);
        console.log(`[migrate] lesson_progress -> inserted ${prog.length}`);
      }
      if (dryRun && prog.length) {
        console.log('[migrate] lesson_progress sample:', prog.slice(0, 3));
      }
    } catch (err) {
      console.warn('[migrate] skipping lesson_progress:', err.message || err);
    }

    // 5) Migrate user_roles (if present)
    try {
      const rolesRes = await pg.query('SELECT * FROM user_roles');
      const roles = rolesRes.rows.map(r => ({
        _id: new ObjectId(),
        old_id: r.id,
        user_id: r.user_id,
        role: r.role,
      }));
      console.log(`[migrate] user_roles -> found ${roles.length}`);
      if (!dryRun && roles.length) {
        await db.collection('user_roles').insertMany(roles);
        console.log(`[migrate] user_roles -> inserted ${roles.length}`);
      }
      if (dryRun && roles.length) {
        console.log('[migrate] user_roles sample:', roles.slice(0, 3));
      }
    } catch (err) {
      console.warn('[migrate] skipping user_roles:', err.message || err);
    }

    // Create helpful indexes
    try {
      if (!dryRun) {
        await db.collection('modules').createIndex({ old_id: 1 });
        await db.collection('lessons').createIndex({ old_id: 1 });
        await db.collection('lessons').createIndex({ module_ref: 1 });
        await db.collection('videos').createIndex({ lesson_ref: 1 });
        await db.collection('lesson_progress').createIndex({ lesson_ref: 1, student_id: 1 }, { unique: false });
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
