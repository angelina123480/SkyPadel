const pool = require('../database/pool');

async function getDefaultForUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM addresses WHERE user_id = $1 AND is_default = true ORDER BY id DESC LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

async function upsertDefault(userId, fields) {
  const existing = await getDefaultForUser(userId);
  const { firstName, lastName, country, city, addressLine, apartment, postalCode, phone } = fields;
  if (existing) {
    const { rows } = await pool.query(
      `UPDATE addresses SET first_name=$2, last_name=$3, country=$4, city=$5,
         address_line=$6, apartment=$7, postal_code=$8, phone=$9
       WHERE id = $1 RETURNING *`,
      [existing.id, firstName, lastName, country, city, addressLine, apartment || null, postalCode, phone || null]
    );
    return rows[0];
  }
  const { rows } = await pool.query(
    `INSERT INTO addresses (user_id, first_name, last_name, country, city, address_line, apartment, postal_code, phone, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true) RETURNING *`,
    [userId, firstName, lastName, country, city, addressLine, apartment || null, postalCode, phone || null]
  );
  return rows[0];
}

module.exports = { getDefaultForUser, upsertDefault };
