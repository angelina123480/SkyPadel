const pool = require('../database/pool');

const FREE_SHIPPING_THRESHOLD = 50;
const FLAT_SHIPPING = 5.99;

function computeTotals(items) {
  let subtotal = 0;
  let discountTotal = 0;
  items.forEach((item) => {
    const listPrice = Number(item.compare_at_price || item.price);
    const actualPrice = Number(item.price);
    subtotal += listPrice * item.quantity;
    discountTotal += (listPrice - actualPrice) * item.quantity;
  });
  const shippingTotal = subtotal - discountTotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : FLAT_SHIPPING;
  const total = subtotal - discountTotal + shippingTotal;
  return { subtotal, discountTotal, shippingTotal, total };
}

async function create(userId = null) {
  const { rows } = await pool.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING *', [userId]);
  return rows[0];
}

async function getById(cartId) {
  if (!cartId) return null;
  const { rows } = await pool.query('SELECT * FROM carts WHERE id = $1', [cartId]);
  return rows[0] || null;
}

async function getByUser(userId) {
  const { rows } = await pool.query('SELECT * FROM carts WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
  return rows[0] || null;
}

async function getOrCreateForUser(userId) {
  const existing = await getByUser(userId);
  if (existing) return existing;
  return create(userId);
}

async function addItem(cartId, productId, quantity) {
  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
    [cartId, productId, quantity]
  );
  await pool.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);
}

async function setItemQuantity(cartId, productId, quantity) {
  if (quantity <= 0) {
    return removeItem(cartId, productId);
  }
  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, $3)
     ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
    [cartId, productId, quantity]
  );
  await pool.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);
}

async function removeItem(cartId, productId) {
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
}

async function getItemsWithProducts(cartId) {
  if (!cartId) return [];
  const { rows } = await pool.query(
    `SELECT ci.id AS item_id, ci.quantity, ci.product_id, p.*
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1 ORDER BY ci.id ASC`,
    [cartId]
  );
  return rows;
}

async function countItems(cartId) {
  if (!cartId) return 0;
  const { rows } = await pool.query('SELECT COALESCE(SUM(quantity), 0)::int AS count FROM cart_items WHERE cart_id = $1', [cartId]);
  return rows[0].count;
}

async function clear(cartId) {
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
}

async function mergeGuestIntoUser(guestCartId, userId) {
  if (!guestCartId) return getOrCreateForUser(userId);
  const guestCart = await getById(guestCartId);
  if (!guestCart || guestCart.user_id === userId) return getOrCreateForUser(userId);

  const userCart = await getOrCreateForUser(userId);
  const guestItems = await pool.query('SELECT product_id, quantity FROM cart_items WHERE cart_id = $1', [guestCartId]);
  for (const item of guestItems.rows) {
    await addItem(userCart.id, item.product_id, item.quantity);
  }
  await pool.query('DELETE FROM carts WHERE id = $1', [guestCartId]);
  return userCart;
}

module.exports = {
  create,
  getById,
  getByUser,
  getOrCreateForUser,
  addItem,
  setItemQuantity,
  removeItem,
  getItemsWithProducts,
  countItems,
  clear,
  mergeGuestIntoUser,
  computeTotals,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING
};
