const pool = require('../database/pool');
const { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING } = require('./Cart');

class CheckoutError extends Error {}

async function createFromCart({ userId, cartId, shipping, card }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: items } = await client.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.slug, p.price, p.compare_at_price, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1 FOR UPDATE OF p`,
      [cartId]
    );

    if (items.length === 0) {
      throw new CheckoutError('Your cart is empty.');
    }
    for (const item of items) {
      if (item.quantity > item.stock) {
        throw new CheckoutError(`Sorry, only ${item.stock} left of "${item.name}" — please update your cart.`);
      }
    }

    let subtotal = 0;
    let discountTotal = 0;
    const lineItems = items.map((item) => {
      const listPrice = Number(item.compare_at_price || item.price);
      const actualPrice = Number(item.price);
      const lineOriginal = listPrice * item.quantity;
      const lineActual = actualPrice * item.quantity;
      subtotal += lineOriginal;
      discountTotal += lineOriginal - lineActual;
      return { ...item, unitPrice: actualPrice, lineTotal: lineActual };
    });

    const shippingTotal = subtotal - discountTotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
    const total = subtotal - discountTotal + shippingTotal;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders
         (user_id, status, subtotal, discount_total, shipping_total, total,
          first_name, last_name, email, phone, country, city, address_line, apartment, postal_code,
          card_last4, card_brand)
       VALUES ($1,'confirmed',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        userId, subtotal.toFixed(2), discountTotal.toFixed(2), shippingTotal.toFixed(2), total.toFixed(2),
        shipping.firstName, shipping.lastName, shipping.email, shipping.phone, shipping.country,
        shipping.city, shipping.addressLine, shipping.apartment || null, shipping.postalCode,
        card.last4, card.brand
      ]
    );
    const order = orderRows[0];

    const orderNumber = `PAD-${new Date().getFullYear()}-${String(order.id).padStart(5, '0')}`;
    await client.query('UPDATE orders SET order_number = $2 WHERE id = $1', [order.id, orderNumber]);
    order.order_number = orderNumber;

    for (const item of lineItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_slug, unit_price, quantity, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, item.product_id, item.name, item.slug, item.unitPrice.toFixed(2), item.quantity, item.lineTotal.toFixed(2)]
      );
      await client.query('UPDATE products SET stock = stock - $2 WHERE id = $1', [item.product_id, item.quantity]);
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listByUser(userId) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return rows;
}

async function getById(id) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (!rows[0]) return null;
  const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC', [id]);
  return { ...rows[0], items };
}

async function adminList({ status, search } = {}) {
  const where = [];
  const params = [];
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(order_number ILIKE $${params.length} OR email ILIKE $${params.length} OR last_name ILIKE $${params.length})`);
  }
  const sql = `SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function updateStatus(id, status) {
  const { rows } = await pool.query(
    'UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
    [id, status]
  );
  return rows[0];
}

async function statsForAdmin() {
  const [{ rows: totals }, { rows: customers }, { rows: recent }, { rows: salesByDay }] = await Promise.all([
    pool.query(`
      SELECT COUNT(*)::int AS total_orders, COALESCE(SUM(total), 0)::numeric AS total_sales
      FROM orders WHERE status != 'cancelled'
    `),
    pool.query(`SELECT COUNT(*)::int AS total_customers FROM users WHERE role = 'customer'`),
    pool.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 8'),
    pool.query(`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, SUM(total)::numeric AS sales
      FROM orders WHERE status != 'cancelled' AND created_at > now() - interval '14 days'
      GROUP BY day ORDER BY day
    `)
  ]);
  return {
    totalOrders: totals[0].total_orders,
    totalSales: Number(totals[0].total_sales),
    totalCustomers: customers[0].total_customers,
    recentOrders: recent,
    salesByDay: salesByDay.map((r) => ({ day: r.day, sales: Number(r.sales) }))
  };
}

module.exports = {
  CheckoutError,
  createFromCart,
  listByUser,
  getById,
  adminList,
  updateStatus,
  statsForAdmin,
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING
};
