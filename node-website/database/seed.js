require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const pool = require('./pool');

const PASSWORD = 'Password123!';

const PRODUCTS = [
  {
    slug: 'starter-tube', name: 'Starter Tube', cans: 3, ballsPerCan: 3, price: 15.00, compareAtPrice: null,
    badge: null, isBestseller: false, stock: 60, durability: 'Medium', speed: 'Medium',
    recommendedUse: 'Casual players & first-timers', image: '/images/products/starter-tube.svg',
    description: 'Three pressurised tubes of SkyPadel balls — the easiest way to try the house brand before committing to a bigger case. Consistent bounce, tour-grade felt, ready for your first session on court.'
  },
  {
    slug: 'duo-pack', name: 'Duo Pack', cans: 2, ballsPerCan: 3, price: 11.00, compareAtPrice: null,
    badge: null, isBestseller: false, stock: 35, durability: 'Low', speed: 'Medium',
    recommendedUse: 'Quick top-ups & gifting', image: '/images/products/duo-pack.svg',
    description: 'A compact two-tube pack for when you just need a quick top-up between orders, or a light, giftable intro to SkyPadel balls.'
  },
  {
    slug: 'training-bundle', name: 'Training Bundle', cans: 6, ballsPerCan: 3, price: 27.00, compareAtPrice: 30.00,
    badge: 'Most Popular', isBestseller: true, stock: 42, durability: 'Medium', speed: 'Medium',
    recommendedUse: 'Weekly training sessions', image: '/images/products/training-bundle.svg',
    description: 'Six tubes built for regular training — the bundle most SkyPadel players keep coming back for. Even bounce and steady durability across every can.'
  },
  {
    slug: 'club-bundle', name: 'Club Bundle', cans: 12, ballsPerCan: 3, price: 48.00, compareAtPrice: 60.00,
    badge: 'Best Value', isBestseller: true, stock: 4, durability: 'High', speed: 'Fast',
    recommendedUse: 'Club play & group sessions', image: '/images/products/club-bundle.svg',
    description: 'Twelve tubes at the best price-per-ball on the site — built for clubs stocking multiple courts or players who don’t want to reorder every month.'
  },
  {
    slug: 'academy-case',
    name: 'Academy Case', cans: 18, ballsPerCan: 3, price: 68.00, compareAtPrice: 90.67,
    badge: 'New', isBestseller: false, stock: 0, durability: 'High', speed: 'Medium',
    recommendedUse: 'Academies & coaching programs', image: '/images/products/academy-case.svg',
    description: 'Our largest case built for coaching programs and academies running multiple courts a day. High-durability felt holds up through back-to-back drills.'
  },
  {
    slug: 'tournament-bundle', name: 'Tournament Bundle', cans: 24, ballsPerCan: 3, price: 85.00, compareAtPrice: 121.43,
    badge: 'Pro Choice', isBestseller: true, stock: 15, durability: 'High', speed: 'Fast',
    recommendedUse: 'Tournaments & competitive play', image: '/images/products/tournament-bundle.svg',
    description: 'Tournament-grade pressure and the fastest speed rating in the range, boxed in bulk for organisers running a full bracket.'
  }
];

const CUSTOMERS = [
  { firstName: 'Maya', lastName: 'Chen', email: 'maya@example.com' },
  { firstName: 'Diego', lastName: 'Fernandez', email: 'diego@example.com' },
  { firstName: 'Amira', lastName: 'Haddad', email: 'amira@example.com' },
  { firstName: 'Lucas', lastName: 'Novak', email: 'lucas@example.com' },
  { firstName: 'Priya', lastName: 'Nair', email: 'priya@example.com' }
];

async function main() {
  if (!pool) {
    console.error('DATABASE_URL is not set in .env — cannot seed.');
    process.exit(1);
  }

  console.log('Wiping existing data...');
  await pool.query('TRUNCATE reviews, order_items, orders, cart_items, carts, password_resets, addresses, products, users RESTART IDENTITY CASCADE');

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  console.log('Seeding admin...');
  const { rows: [admin] } = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,'admin') RETURNING *`,
    ['Sky', 'Admin', 'admin@skypadel.com', passwordHash]
  );

  console.log('Seeding customers...');
  const customers = [];
  for (const c of CUSTOMERS) {
    const { rows } = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES ($1,$2,$3,$4,'customer') RETURNING *`,
      [c.firstName, c.lastName, c.email, passwordHash]
    );
    customers.push(rows[0]);
  }

  console.log('Seeding products...');
  const products = [];
  for (const p of PRODUCTS) {
    const { rows } = await pool.query(
      `INSERT INTO products
         (slug, name, description, cans, balls_per_can, total_balls, price, compare_at_price,
          brand, ball_type, durability_rating, speed_rating, recommended_use, badge, image_path,
          stock, is_bestseller, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'SkyPadel','Padel',$9,$10,$11,$12,$13,$14,$15,true)
       RETURNING *`,
      [
        p.slug, p.name, p.description, p.cans, p.ballsPerCan, p.cans * p.ballsPerCan, p.price, p.compareAtPrice,
        p.durability, p.speed, p.recommendedUse, p.badge, p.image, p.stock, p.isBestseller
      ]
    );
    products.push(rows[0]);
  }

  console.log('Seeding orders...');
  const statuses = ['delivered', 'delivered', 'delivered', 'shipped', 'shipped', 'processing', 'processing', 'confirmed', 'pending', 'cancelled'];
  const addresses = [
    { country: 'United States', city: 'Austin', addressLine: '412 Riverside Dr', postal: '78701' },
    { country: 'United States', city: 'Miami', addressLine: '88 Ocean Ave', postal: '33139' },
    { country: 'Spain', city: 'Barcelona', addressLine: 'Carrer de Mallorca 210', postal: '08008' },
    { country: 'United Kingdom', city: 'London', addressLine: '19 Baker Street', postal: 'NW1 6XE' },
    { country: 'Canada', city: 'Toronto', addressLine: '77 Queen St W', postal: 'M5H 2M8' }
  ];

  const orders = [];
  for (let i = 0; i < statuses.length; i += 1) {
    const customer = customers[i % customers.length];
    const address = addresses[i % addresses.length];
    const status = statuses[i];
    const daysAgo = statuses.length - i;

    const items = [products[i % products.length], products[(i + 2) % products.length]].filter((p) => p.price);
    let subtotal = 0;
    let discountTotal = 0;
    const lineItems = items.map((p) => {
      const qty = (i % 3) + 1;
      const listPrice = Number(p.compare_at_price || p.price);
      const actual = Number(p.price);
      subtotal += listPrice * qty;
      discountTotal += (listPrice - actual) * qty;
      return { product: p, qty, unitPrice: actual, lineTotal: actual * qty };
    });
    const shippingTotal = subtotal - discountTotal >= 50 ? 0 : 5.99;
    const total = subtotal - discountTotal + shippingTotal;

    const { rows: [order] } = await pool.query(
      `INSERT INTO orders
         (user_id, status, subtotal, discount_total, shipping_total, total,
          first_name, last_name, email, phone, country, city, address_line, apartment, postal_code,
          card_last4, card_brand, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now() - ($18 || ' days')::interval, now() - ($18 || ' days')::interval)
       RETURNING *`,
      [
        customer.id, status, subtotal.toFixed(2), discountTotal.toFixed(2), shippingTotal.toFixed(2), total.toFixed(2),
        customer.first_name, customer.last_name, customer.email, '+1 555 010 0000',
        address.country, address.city, address.addressLine, null, address.postal,
        '4242', 'Visa', daysAgo
      ]
    );
    const orderNumber = `PAD-${new Date(order.created_at).getFullYear()}-${String(order.id).padStart(5, '0')}`;
    await pool.query('UPDATE orders SET order_number = $2 WHERE id = $1', [order.id, orderNumber]);
    order.order_number = orderNumber;

    for (const li of lineItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_slug, unit_price, quantity, line_total)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, li.product.id, li.product.name, li.product.slug, li.unitPrice.toFixed(2), li.qty, li.lineTotal.toFixed(2)]
      );
    }
    orders.push({ order, customer, lineItems });
  }

  console.log('Seeding reviews...');
  const reviewText = [
    { rating: 5, comment: 'Great bounce consistency across every can — this is our club’s go-to now.' },
    { rating: 4, comment: 'Held up well through a full weekend tournament, slightly less lively by the last set.' },
    { rating: 5, comment: 'Ordered again after finishing the first case, exactly what we needed for weekly training.' },
    { rating: 4, comment: 'Good value for the size of the bundle, delivery was quick.' },
    { rating: 5, comment: 'Best padel balls we’ve used for coaching sessions so far.' }
  ];
  let reviewIdx = 0;
  const reviewedPairs = new Set();
  for (const { order, customer, lineItems } of orders) {
    if (order.status === 'cancelled') continue;
    for (const li of lineItems) {
      const key = `${customer.id}-${li.product.id}`;
      if (reviewedPairs.has(key) || reviewIdx >= reviewText.length) continue;
      reviewedPairs.add(key);
      const r = reviewText[reviewIdx];
      reviewIdx += 1;
      await pool.query(
        'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES ($1,$2,$3,$4)',
        [li.product.id, customer.id, r.rating, r.comment]
      );
    }
  }

  console.log('\nSeed complete.');
  console.log('Admin login:    admin@skypadel.com / ' + PASSWORD);
  console.log('Customer login: maya@example.com / ' + PASSWORD + ' (all seeded customers share this password)');
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
