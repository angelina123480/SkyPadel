-- SkyPadel schema. Safe to re-run: everything is IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  first_name     VARCHAR(80) NOT NULL,
  last_name      VARCHAR(80) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255),
  google_id      VARCHAR(255) UNIQUE,
  role           VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  phone          VARCHAR(40),
  notify_email   BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Migrations for databases created before Google sign-in was added (safe to re-run).
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

CREATE TABLE IF NOT EXISTS addresses (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name     VARCHAR(80) NOT NULL,
  last_name      VARCHAR(80) NOT NULL,
  country        VARCHAR(80) NOT NULL,
  city           VARCHAR(80) NOT NULL,
  address_line   VARCHAR(255) NOT NULL,
  apartment      VARCHAR(120),
  postal_code    VARCHAR(20) NOT NULL,
  phone          VARCHAR(40),
  is_default     BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token          VARCHAR(255) NOT NULL UNIQUE,
  expires_at     TIMESTAMPTZ NOT NULL,
  used_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id                  SERIAL PRIMARY KEY,
  slug                VARCHAR(120) NOT NULL UNIQUE,
  name                VARCHAR(120) NOT NULL,
  description         TEXT NOT NULL,
  cans                INTEGER NOT NULL CHECK (cans > 0),
  balls_per_can       INTEGER NOT NULL CHECK (balls_per_can > 0),
  total_balls         INTEGER NOT NULL CHECK (total_balls > 0),
  price               NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price    NUMERIC(10,2) CHECK (compare_at_price >= 0),
  brand               VARCHAR(80) NOT NULL DEFAULT 'SkyPadel',
  ball_type           VARCHAR(80) NOT NULL DEFAULT 'Padel',
  durability_rating   VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (durability_rating IN ('Low', 'Medium', 'High')),
  speed_rating        VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (speed_rating IN ('Slow', 'Medium', 'Fast')),
  recommended_use     VARCHAR(120) NOT NULL DEFAULT 'Club play',
  badge               VARCHAR(40),
  image_path          VARCHAR(255) NOT NULL,
  stock               INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_bestseller       BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carts (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id             SERIAL PRIMARY KEY,
  cart_id        INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  order_number      VARCHAR(40) UNIQUE,
  user_id           INTEGER NOT NULL REFERENCES users(id),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal          NUMERIC(10,2) NOT NULL,
  discount_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL,
  first_name        VARCHAR(80) NOT NULL,
  last_name         VARCHAR(80) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  phone             VARCHAR(40) NOT NULL,
  country           VARCHAR(80) NOT NULL,
  city              VARCHAR(80) NOT NULL,
  address_line      VARCHAR(255) NOT NULL,
  apartment         VARCHAR(120),
  postal_code       VARCHAR(20) NOT NULL,
  card_last4        VARCHAR(4) NOT NULL,
  card_brand        VARCHAR(20) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name   VARCHAR(120) NOT NULL,
  product_slug   VARCHAR(120) NOT NULL,
  unit_price     NUMERIC(10,2) NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  line_total     NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id             SERIAL PRIMARY KEY,
  product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(80) NOT NULL UNIQUE,
  enabled        BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lebanon's 8 governorates. Seeded enabled by default so checkout keeps working
-- immediately; admin can then restrict delivery from /admin/delivery-zones.
INSERT INTO delivery_zones (name) VALUES
  ('Beirut'), ('Mount Lebanon'), ('North Lebanon'), ('Akkar'),
  ('Beqaa'), ('Baalbek-Hermel'), ('South Lebanon'), ('Nabatieh')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_settings (
  key            VARCHAR(60) PRIMARY KEY,
  value          TEXT
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
