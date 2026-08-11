const pool = require('../database/pool');

let cache = null;

async function loadCache() {
  const { rows } = await pool.query('SELECT key, value FROM site_settings');
  cache = {};
  rows.forEach((row) => { cache[row.key] = row.value; });
  return cache;
}

async function getAll() {
  if (!cache) await loadCache();
  return cache;
}

async function get(key) {
  const all = await getAll();
  return all[key] || null;
}

async function set(key, value) {
  await pool.query(
    `INSERT INTO site_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, value]
  );
  await loadCache();
}

async function remove(key) {
  await pool.query('DELETE FROM site_settings WHERE key = $1', [key]);
  await loadCache();
}

module.exports = { get, set, remove, getAll };
