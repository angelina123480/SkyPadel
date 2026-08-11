require('dotenv').config({ quiet: true });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set — database-backed features (accounts, cart, orders, admin) will fail until it is configured in .env.');
}

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false }
    })
  : null;

module.exports = pool;
