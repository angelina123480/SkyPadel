const pool = require('../database/pool');

async function listAll() {
  const { rows } = await pool.query('SELECT * FROM delivery_zones ORDER BY name ASC');
  return rows;
}

async function listEnabledNames() {
  const { rows } = await pool.query('SELECT name FROM delivery_zones WHERE enabled = true ORDER BY name ASC');
  return rows.map((r) => r.name);
}

async function setEnabled(id, enabled) {
  const { rows } = await pool.query('UPDATE delivery_zones SET enabled = $2 WHERE id = $1 RETURNING *', [id, enabled]);
  return rows[0];
}

async function isEnabled(name) {
  const { rows } = await pool.query('SELECT 1 FROM delivery_zones WHERE name = $1 AND enabled = true', [name]);
  return rows.length > 0;
}

module.exports = { listAll, listEnabledNames, setEnabled, isEnabled };
