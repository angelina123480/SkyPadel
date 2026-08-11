# SkyPadel — Padel Ball Bundle Store (Node.js, Express, EJS & PostgreSQL)

A fully functional e-commerce storefront that sells one house brand of padel balls, exclusively in bundles (tube / training / club / academy / tournament sizes). Browsing, cart, checkout, accounts, order tracking, reviews and an admin dashboard are all real and backed by PostgreSQL — nothing here is a static mockup.

## Pages

* `/` — Home, hero + featured bundles + best sellers
* `/shop` — Full bundle catalog: search, filters (price, bundle size, brand, speed, best sellers, in-stock), sort, and a bundle comparison table
* `/shop/:slug` — Product detail: specs, "what's included," quantity selector, Add to Cart / Buy Now, "you may also like," reviews
* `/cart` — Live shopping cart (server-persisted, works for guests and signed-in users)
* `/checkout` — Shipping + mock/test payment, order summary (signed-in customers only)
* `/orders`, `/orders/:id` — Order history and order detail with a status timeline
* `/register`, `/login`, `/forgot-password`, `/reset-password/:token` — Accounts (email + password, bcrypt-hashed)
* `/account`, `/account/profile`, `/account/settings` — Customer dashboard (order stats, profile, saved address, password/notification settings)
* `/admin` — Admin dashboard: sales stats, 14-day sales chart, low-stock warnings, recent orders
* `/admin/products`, `/admin/orders`, `/admin/customers`, `/admin/inventory` — Full product/order/customer/inventory management
* `/about`, `/contact` — Brand story and contact form (contact form is a front-end preview only, not wired to send)
* `/news`, `/news/updates/:slug` — SkyPadel Updates (from Sanity CMS) + live padel/tennis headlines from The Guardian, BBC Sport and ESPN

## Getting started

1. Clone this repo and install dependencies:
   ```
   cd node-website
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `SESSION_SECRET` (see below).
3. Create the schema and seed demo data:
   ```
   npm run db:migrate
   npm run db:seed
   ```
4. Start the server:
   ```
   npm start
   ```
   Visit `http://localhost:3000`.

## Database (PostgreSQL) setup

This app needs a real Postgres database — there's no SQLite/mock fallback, since the spec calls for a proper relational store.

1. **Get a Postgres connection string.** Any of these work:
   * A free cloud instance: [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) — create a project and copy the connection string it gives you.
   * A local Postgres install.
2. **Paste it into `.env`:**
   ```
   DATABASE_URL=postgres://user:password@host:5432/database?sslmode=require
   SESSION_SECRET=<any long random string>
   ```
   Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. **Apply the schema and seed data** (see above). `npm run db:seed` wipes and repopulates all tables, so only run it against a database you're okay resetting.

### Seeded accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@skypadel.com` | `Password123!` |
| Customer (5 seeded) | `maya@example.com`, `diego@example.com`, `amira@example.com`, `lucas@example.com`, `priya@example.com` | `Password123!` |

Seed data includes 6 bundles with varied stock levels (including one low-stock and one out-of-stock, for testing admin warnings), ~10 orders spanning every status, and a handful of reviews.

### First admin without seeding

If you register your own account instead of using the seed script, add your email to `ADMIN_EMAILS` in `.env` (comma-separated) — you're auto-promoted to admin the moment you register or sign in. Every admin after that is promoted from `/admin/customers`, no env var editing needed.

## Deploying to Vercel

The app runs as a Vercel Serverless Function: `api/index.js` exports the same Express `app` used locally, and `vercel.json` rewrites every request to it. `bin/www` (used by `npm start`) is untouched, so local dev is unaffected.

1. **Set the project's Root Directory to `node-website`** in Vercel → Project Settings → General (the repo root only contains the `node-website/` app folder, not a top-level `package.json`).
2. **Add the Blob storage integration** (Project → Storage → Blob → Connect) — this provisions `BLOB_READ_WRITE_TOKEN` automatically, which admin product-image uploads require. There is no local-disk fallback for uploads: Vercel's serverless filesystem is read-only/ephemeral at runtime, so uploaded images are pushed to Vercel Blob instead (`services/imageStorage.js`) and referenced by their public URL. Seed-data images are unaffected — those are static files in `public/images/products/` served directly.
3. **Set the same environment variables as `.env`** (`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAILS`, `BLOB_READ_WRITE_TOKEN`, optionally `SANITY_*`/`SMTP_*`) under Project Settings → Environment Variables.
4. If your Postgres provider is Neon, use its **pooled** connection string (the one with `-pooler` in the hostname) for `DATABASE_URL` — it's built for exactly this kind of many-short-lived-connections serverless workload.
5. Redeploy. Locally, nothing changes — `npm start` still runs the app the normal way via `bin/www`.

## Payments

Checkout runs in **test mode only** — clearly labeled on the checkout page. It validates card format (number length, expiry, CVV) but never stores a full card number, only the last 4 digits and a guessed brand. No real charge is ever made. Swapping in a real processor (e.g. Stripe) would mean replacing the validation in `middleware/validate.js` and the order-creation call in `controllers/checkoutController.js` with a real payment intent — the rest of the checkout/order flow doesn't need to change.

## Password reset emails (optional)

Without SMTP configured, forgot-password links are shown directly on the page and logged to the console instead of emailed, so the flow still works end-to-end locally. To send real emails, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` in `.env`.

## SkyPadel Updates (Sanity CMS) setup — optional

"SkyPadel Updates" on the `/news` page is powered by [Sanity](https://www.sanity.io), a headless CMS with a generous free tier. The site runs fine without it configured (that section just stays hidden). See `studio/` for the content schema.

1. From the `studio/` folder: `npx sanity login`, then `npx sanity init --bare --project-name "SkyPadel" --dataset-default -y`.
2. Copy `studio/.env.example` to `studio/.env` and fill in the project ID it prints.
3. Fill in the same `SANITY_PROJECT_ID` / `SANITY_DATASET` in the repo-root `.env`.
4. `cd studio && npm install && npm run dev` to run the content editor, publish a "SkyPadel Update" post, then restart the website.

## Architecture

* **Frontend**: server-rendered EJS views (Bootstrap 3 grid + a custom `--sky-*` design system in `public/stylesheets/style.css`), vanilla JavaScript with `fetch()` for all cart/shop/checkout/admin interactivity (`public/javascripts/`).
* **Backend**: Node.js + Express, organized as `routes/` (thin route definitions) → `controllers/` (request handling) → `models/` (SQL query modules, one per table) — no ORM, raw `pg` queries with parameterized SQL throughout.
* **Database**: PostgreSQL. Schema in `database/schema.sql`, applied via `npm run db:migrate`; demo data in `database/seed.js`.
* **Sessions**: `express-session` backed by `connect-pg-simple` (sessions table in the same Postgres database), so sessions survive server restarts.
* **Auth**: custom email/password accounts, passwords hashed with `bcryptjs`. Roles are `customer` / `admin`, stored on `users.role`.
* **Cart**: persisted server-side (`carts` / `cart_items` tables), keyed by a cart id in the session cookie — works for guests, and merges into the user's cart on login.
* **Orders**: `Order.createFromCart` (`models/Order.js`) runs stock check, order + order_items insert, stock decrement, and cart clear inside a single SQL transaction, so a checkout can't partially succeed.

### Database schema

```
users, addresses, password_resets, products, carts, cart_items,
orders, order_items, reviews
```
See `database/schema.sql` for full column definitions, constraints and indexes.

## Security notes

* Passwords hashed with bcrypt; never logged or stored in plaintext.
* All SQL uses parameterized queries (no string-concatenated SQL).
* Admin routes are gated by session-based `requireAdmin` middleware; order/account pages check resource ownership (a customer can't view another customer's order by guessing its id).
* No real payment data is ever stored — see "Payments" above.
* Secrets (`DATABASE_URL`, `SESSION_SECRET`, SMTP credentials) live only in `.env`, which is git-ignored; `.env.example` documents the required variables without values.
