const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  if (!pool) {
    console.error('DATABASE_URL is not set in .env — cannot migrate.');
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
