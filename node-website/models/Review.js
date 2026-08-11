const pool = require('../database/pool');

async function listForProduct(productId) {
  const { rows } = await pool.query(
    `SELECT r.*, u.first_name, u.last_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1 ORDER BY r.created_at DESC`,
    [productId]
  );
  return rows;
}

async function hasUserPurchased(userId, productId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1 AND oi.product_id = $2 AND o.status != 'cancelled' LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

async function hasUserReviewed(userId, productId) {
  const { rows } = await pool.query('SELECT 1 FROM reviews WHERE user_id = $1 AND product_id = $2', [userId, productId]);
  return rows.length > 0;
}

async function create({ productId, userId, rating, comment }) {
  const { rows } = await pool.query(
    'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1,$2,$3,$4) RETURNING *',
    [productId, userId, rating, comment]
  );
  return rows[0];
}

module.exports = { listForProduct, hasUserPurchased, hasUserReviewed, create };
