# SkyPadel — Padel & Tennis Ball Shop (Node.js, Express & EJS)

A storefront for a single house brand of padel and tennis balls, sold in bundles (tube / match pack / club case).

Bundle data still lives in [routes/index.js](routes/index.js) as placeholder objects (MongoDB-backed bundle management is in progress). Checkout/payment processing doesn't exist yet — the "Add to Cart" button is a front-end demo. Accounts, admin roles, and news are real and backed by Clerk and Sanity respectively (see setup sections below).

## Pages
* `/` — Home, hero + featured bundles
* `/shop` — Full padel and tennis ball bundle catalog
* `/about` — Brand story
* `/contact` — Contact form (preview only, not yet wired to send)
* `/news` — SkyPadel Updates (from Sanity CMS) + live padel/tennis headlines from The Guardian, BBC Sport and ESPN
* `/news/updates/:slug` — Full SkyPadel Update, hosted on-site
* `/sign-in`, `/sign-up` — Account sign-in/sign-up (email+password, Google OAuth, forgot password — all via Clerk)
* `/account` — Signed-in client area: profile + order history (order history is a placeholder until checkout is built)
* `/admin` — Admin dashboard (bundles/news management coming soon; admin invite/removal is live)
* `/admin/admins` — Invite or remove other admins

## Document
* Clone this repo: ``` git clone https://github.com/bhanushalimahesh3/node-website.git ```
* Install dependencies using [npm](https://www.npmjs.com/) javascript package manager: ``` npm install ```
* Start node server with [nodemon](https://nodemon.io/): ``` nodemon start ```
* Tune to url: ``` http://localhost:3000 ```

All boilerplate code managed by [express generator](https://expressjs.com/en/starter/generator.html) framework adhering to DRY rule. Routes are defined in routes/index.js file, view pages are in the views folder using partials (head, menu, footer, script) to avoid markup duplication with the EJS view engine. CSS and JavaScript live in the public folder.

## SkyPadel Updates (Sanity CMS) setup

"SkyPadel Updates" on the `/news` page is powered by [Sanity](https://www.sanity.io), a headless CMS with a generous free tier. The site runs fine without it configured (that section just stays hidden), but here's how to turn it on:

1. **Create your Sanity project.** From the `studio/` folder, run:
   ```
   cd studio
   npx sanity login
   ```
   This opens a browser to sign in/sign up (free). Then run:
   ```
   npx sanity init --bare --project-name "SkyPadel" --dataset-default -y
   ```
   `--bare` creates the project and a public "production" dataset, then just prints your **Project ID** — it won't touch the studio files already in this folder (the schema is already written for you).

2. **Configure the studio.** Copy `studio/.env.example` to `studio/.env` and fill in the project ID it just gave you:
   ```
   SANITY_STUDIO_PROJECT_ID=your-project-id
   SANITY_STUDIO_DATASET=production
   ```

3. **Configure the website.** Copy `.env.example` (repo root) to `.env` and fill in the same project ID:
   ```
   SANITY_PROJECT_ID=your-project-id
   SANITY_DATASET=production
   ```

4. **Run the studio** (the content editor UI, separate from the website):
   ```
   cd studio
   npm install
   npm run dev
   ```
   Open the URL it prints (usually `http://localhost:3333`), create a "SkyPadel Update" post, and publish it.

5. **Restart the website** (`nodemon start` from the repo root) — your published post will appear under "SkyPadel Updates" on `/news`, with its own full-content page on-site (no third-party link needed).

You can also deploy the studio as a hosted editor anyone on your team can use, without running it locally: `cd studio && npx sanity deploy`.

## Accounts & admin dashboard (Clerk) setup

Sign-in, sign-up, Google OAuth and forgot-password are all handled by [Clerk](https://clerk.com), a managed auth provider with a free tier. Without it configured, `/sign-in`, `/sign-up`, `/admin` and `/account` all show a friendly "not set up yet" page — nothing else on the site is affected.

1. **Create a free Clerk account and application** at [dashboard.clerk.com](https://dashboard.clerk.com) (this needs your own browser login — there's no CLI step to run here).
2. **Enable Google sign-in** somewhere in that application's user/authentication settings (look for social connections / SSO providers) — it's a toggle, Clerk handles the rest.
3. **Copy your API keys** from the dashboard's "API Keys" page into `.env` (repo root):
   ```
   CLERK_SECRET_KEY=sk_...
   CLERK_PUBLISHABLE_KEY=pk_...
   ADMIN_EMAILS=you@example.com
   ```
   `ADMIN_EMAILS` is how your *first* admin gets created: the moment you sign in with a matching email, you're auto-promoted to admin. Every admin after that gets invited from inside `/admin/admins` — no env var editing needed.
4. **Restart the website.** Go to `/sign-up`, create an account with the email you put in `ADMIN_EMAILS`, and you'll land in the admin dashboard.

Bundle and news management inside the dashboard are still being built (they need MongoDB and a Sanity write token respectively) — admin invite/removal is fully working today.
