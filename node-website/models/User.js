const pool = require('../database/pool');

async function create({ firstName, lastName, email, passwordHash, role = 'customer' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [firstName, lastName, email.toLowerCase(), passwordHash, role]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findByGoogleId(googleId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return rows[0] || null;
}

async function createFromGoogle({ firstName, lastName, email, googleId, role = 'customer' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, google_id, role)
     VALUES ($1, $2, $3, NULL, $4, $5) RETURNING *`,
    [firstName, lastName, email.toLowerCase(), googleId, role]
  );
  return rows[0];
}

async function linkGoogleId(id, googleId) {
  const { rows } = await pool.query('UPDATE users SET google_id = $2 WHERE id = $1 RETURNING *', [id, googleId]);
  return rows[0];
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function setRole(id, role) {
  const { rows } = await pool.query('UPDATE users SET role = $2 WHERE id = $1 RETURNING *', [id, role]);
  return rows[0];
}

async function updateProfile(id, { firstName, lastName, phone }) {
  const { rows } = await pool.query(
    `UPDATE users SET first_name = $2, last_name = $3, phone = $4 WHERE id = $1 RETURNING *`,
    [id, firstName, lastName, phone || null]
  );
  return rows[0];
}

async function updatePassword(id, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [id, passwordHash]);
}

async function updateNotifyEmail(id, notifyEmail) {
  await pool.query('UPDATE users SET notify_email = $2 WHERE id = $1', [id, notifyEmail]);
}

async function listAllWithStats() {
  const { rows } = await pool.query(`
    SELECT u.*,
           COALESCE(o.order_count, 0)::int AS order_count,
           COALESCE(o.total_spent, 0)::numeric AS total_spent
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS order_count, SUM(total) AS total_spent
      FROM orders WHERE status != 'cancelled'
      GROUP BY user_id
    ) o ON o.user_id = u.id
    ORDER BY u.created_at DESC
  `);
  return rows;
}

module.exports = {
  create,
  findByEmail,
  findByGoogleId,
  createFromGoogle,
  linkGoogleId,
  findById,
  setRole,
  updateProfile,
  updatePassword,
  updateNotifyEmail,
  listAllWithStats
};
