const pool = require('../database/pool');

async function invalidateForUser(userId) {
  await pool.query('DELETE FROM password_resets WHERE user_id = $1 AND used_at IS NULL', [userId]);
}

async function create(userId, token, expiresAt) {
  const { rows } = await pool.query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3) RETURNING *',
    [userId, token, expiresAt]
  );
  return rows[0];
}

async function findValidByToken(token) {
  const { rows } = await pool.query(
    'SELECT * FROM password_resets WHERE token = $1 AND used_at IS NULL AND expires_at > now()',
    [token]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await pool.query('UPDATE password_resets SET used_at = now() WHERE id = $1', [id]);
}

module.exports = { invalidateForUser, create, findValidByToken, markUsed };
