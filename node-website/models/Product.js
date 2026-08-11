const pool = require('../database/pool');

const RATINGS_JOIN = `
  LEFT JOIN (
    SELECT product_id, AVG(rating) AS avg_rating, COUNT(*) AS review_count
    FROM reviews GROUP BY product_id
  ) r ON r.product_id = p.id
  LEFT JOIN (
    SELECT product_id, SUM(quantity) AS units_sold
    FROM order_items GROUP BY product_id
  ) s ON s.product_id = p.id
`;

const SELECT_COLUMNS = `
  p.*,
  COALESCE(r.avg_rating, 0)::numeric(3,2) AS avg_rating,
  COALESCE(r.review_count, 0)::int AS review_count,
  COALESCE(s.units_sold, 0)::int AS units_sold
`;

const SORTS = {
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  bestselling: 'units_sold DESC NULLS LAST, p.id ASC',
  newest: 'p.created_at DESC',
  recommended: '(p.badge IS NOT NULL) DESC, p.is_bestseller DESC, p.id ASC'
};

async function list(filters = {}) {
  const where = ['p.is_active = true'];
  const params = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    where.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`);
  }
  if (filters.minPrice) {
    params.push(filters.minPrice);
    where.push(`p.price >= $${params.length}`);
  }
  if (filters.maxPrice) {
    params.push(filters.maxPrice);
    where.push(`p.price <= $${params.length}`);
  }
  if (filters.minBalls) {
    params.push(filters.minBalls);
    where.push(`p.total_balls >= $${params.length}`);
  }
  if (filters.brand) {
    params.push(filters.brand);
    where.push(`p.brand = $${params.length}`);
  }
  if (filters.speed) {
    params.push(filters.speed);
    where.push(`p.speed_rating = $${params.length}`);
  }
  if (filters.bestsellerOnly) {
    where.push('p.is_bestseller = true');
  }
  if (filters.inStockOnly) {
    where.push('p.stock > 0');
  }

  const orderBy = SORTS[filters.sort] || SORTS.recommended;
  const sql = `SELECT ${SELECT_COLUMNS} FROM products p ${RATINGS_JOIN} WHERE ${where.join(' AND ')} ORDER BY ${orderBy}`;
  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getBySlug(slug) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM products p ${RATINGS_JOIN} WHERE p.slug = $1 AND p.is_active = true`,
    [slug]
  );
  return rows[0] || null;
}

async function getById(id) {
  const { rows } = await pool.query(`SELECT ${SELECT_COLUMNS} FROM products p ${RATINGS_JOIN} WHERE p.id = $1`, [id]);
  return rows[0] || null;
}

async function getRelated(productId, limit = 3) {
  const { rows } = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM products p ${RATINGS_JOIN}
     WHERE p.id != $1 AND p.is_active = true
     ORDER BY p.is_bestseller DESC, random() LIMIT $2`,
    [productId, limit]
  );
  return rows;
}

async function distinctBrands() {
  const { rows } = await pool.query('SELECT DISTINCT brand FROM products WHERE is_active = true ORDER BY brand');
  return rows.map((r) => r.brand);
}

async function priceRange() {
  const { rows } = await pool.query('SELECT MIN(price) AS min, MAX(price) AS max FROM products WHERE is_active = true');
  return rows[0];
}

async function decrementStock(productId, quantity, client = pool) {
  const { rows } = await client.query(
    'UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2 RETURNING stock',
    [productId, quantity]
  );
  return rows[0] || null;
}

// --- admin ---

async function adminList() {
  const { rows } = await pool.query(`SELECT ${SELECT_COLUMNS} FROM products p ${RATINGS_JOIN} ORDER BY p.created_at DESC`);
  return rows;
}

async function lowStock(threshold = 5) {
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE is_active = true AND stock <= $1 ORDER BY stock ASC',
    [threshold]
  );
  return rows;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function adminCreate(data) {
  const totalBalls = data.cans * data.ballsPerCan;
  const { rows } = await pool.query(
    `INSERT INTO products
       (slug, name, description, cans, balls_per_can, total_balls, price, compare_at_price,
        brand, ball_type, durability_rating, speed_rating, recommended_use, badge, image_path,
        stock, is_bestseller, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      slugify(data.name), data.name, data.description, data.cans, data.ballsPerCan, totalBalls,
      data.price, data.compareAtPrice || null, data.brand || 'SkyPadel', data.ballType || 'Padel',
      data.durabilityRating || 'Medium', data.speedRating || 'Medium', data.recommendedUse || 'Club play',
      data.badge || null, data.imagePath, data.stock || 0, Boolean(data.isBestseller), data.isActive !== false
    ]
  );
  return rows[0];
}

async function adminUpdate(id, data) {
  const totalBalls = data.cans * data.ballsPerCan;
  const { rows } = await pool.query(
    `UPDATE products SET
       name=$2, description=$3, cans=$4, balls_per_can=$5, total_balls=$6, price=$7,
       compare_at_price=$8, brand=$9, ball_type=$10, durability_rating=$11, speed_rating=$12,
       recommended_use=$13, badge=$14, stock=$15, is_bestseller=$16, is_active=$17,
       image_path = COALESCE($18, image_path), updated_at = now()
     WHERE id = $1 RETURNING *`,
    [
      id, data.name, data.description, data.cans, data.ballsPerCan, totalBalls, data.price,
      data.compareAtPrice || null, data.brand || 'SkyPadel', data.ballType || 'Padel',
      data.durabilityRating || 'Medium', data.speedRating || 'Medium', data.recommendedUse || 'Club play',
      data.badge || null, data.stock || 0, Boolean(data.isBestseller), data.isActive !== false,
      data.imagePath || null
    ]
  );
  return rows[0];
}

async function adminDelete(id) {
  await pool.query('UPDATE products SET is_active = false WHERE id = $1', [id]);
}

module.exports = {
  list,
  getBySlug,
  getById,
  getRelated,
  distinctBrands,
  priceRange,
  decrementStock,
  adminList,
  lowStock,
  adminCreate,
  adminUpdate,
  adminDelete,
  slugify
};
