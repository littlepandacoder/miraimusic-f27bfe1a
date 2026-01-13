require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const PORT = process.env.PORT || 3001;

if (!MONGO_URI || !SUPABASE_URL) {
  console.error('MONGO_URI and SUPABASE_URL are required in environment variables. See server/.env.example');
  process.exit(1);
}

let db;
async function connectMongo() {
  const client = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB:', db.databaseName);
}
connectMongo().catch(err => { console.error('Mongo connection failed', err); process.exit(1); });

// Middleware: requireAuth validates Supabase access token by calling Supabase auth/user endpoint
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const token = auth.slice(7);
    // dynamic import to support environments without global fetch
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return res.status(401).json({ error: 'Invalid token' });
    const user = await resp.json();
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth check failed', err);
    res.status(500).json({ error: 'Auth verification failed' });
  }
}

app.get('/health', (req, res) => res.json({ ok: true }));

// List modules
app.get('/modules', requireAuth, async (req, res) => {
  try {
    const modules = await db.collection('modules').find({}).sort({ old_id: 1 }).toArray();
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// List lessons for a module (by old numeric id)
app.get('/modules/:oldId/lessons', requireAuth, async (req, res) => {
  try {
    const module_old_id = parseInt(req.params.oldId, 10);
    if (Number.isNaN(module_old_id)) return res.status(400).json({ error: 'invalid module id' });
    const lessons = await db.collection('lessons').find({ module_old_id }).sort({ order: 1 }).toArray();
    res.json(lessons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

// Upsert lesson progress for current user
app.post('/lesson_progress', requireAuth, async (req, res) => {
  try {
    const { lesson_old_id, completed = false, watched_seconds = 0 } = req.body;
    if (!lesson_old_id) return res.status(400).json({ error: 'lesson_old_id required' });
    const filter = { lesson_old_id, student_id: req.user?.id };
    const update = { $set: { lesson_old_id, student_id: req.user.id, completed, watched_seconds, last_watched_at: new Date() } };
    const result = await db.collection('lesson_progress').updateOne(filter, update, { upsert: true });
    res.json({ ok: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.listen(PORT, () => console.log(`Mongo API running on http://localhost:${PORT}`));
