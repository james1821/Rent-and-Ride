# Vehicle Rentals — Car & Motorcycle Rental Booking System

A full-stack car and motorcycle rental platform: a modern black-and-white
storefront plus an admin dashboard, built as a single Nuxt 4 application on
top of Firebase. (Converted from a camera-rental system; the rental,
availability, pricing and admin architecture is unchanged.)

**Author:** Mark James Espinosa

## Tech Stack

**Frontend:** Nuxt 4, Vue 3, TypeScript, Tailwind CSS, Nuxt UI
**Backend:** Nuxt 4's Nitro server (`server/api/*`) for all business logic,
pricing, availability, and privileged operations
**Data/Auth:** Firebase Authentication, Cloud Firestore. Uploaded images are stored on the server's disk (`UPLOAD_DIR`) — no Firebase Storage.
**Architecture:**

```
Browser ──(Firebase Web SDK)──► Firebase        (auth, low-stakes cart/favorites, public reads)
Browser ──(fetch)──► Nitro API ──(Admin SDK)──► Firebase   (pricing, availability, rentals, admin ops)
```

See `docs/database-schema.md` for the full Firestore data model and
`docs/api.md` for the API reference.

---

## Project Structure

```
app/                  Nuxt 4 app directory (pages, components, composables, layouts)
server/api/           Nitro API routes — all privileged/business logic
server/utils/         Availability engine, pricing engine, auth, search indexing
docs/                 Database schema + API documentation
scripts/seed.ts       Sample vehicles + admin account seeding
scripts/migrate-legacy-data.ts  One-off cleanup for databases created by the old camera version
firestore.rules       Firestore security rules
firestore.indexes.json Composite indexes required by the queries in server/api
```

---

## 1. Prerequisites

- Node.js 20+
- A Firebase project (create one at https://console.firebase.google.com)
- (Optional) The Firebase CLI: `npm install -g firebase-tools`, for deploying
  rules/indexes and running local emulators

## 2. Firebase Setup

1. **Create a Firebase project** in the console.
2. **Enable Authentication** → Sign-in method → enable **Email/Password**.
3. **Enable Cloud Firestore** → create a database (start in production mode;
   this repo's `firestore.rules` will be deployed over it).
4. *(Firebase Storage is not used.)*
5. **Get your Web SDK config**: Project Settings → General → Your apps → add
   a Web app → copy the config values into `NUXT_PUBLIC_FIREBASE_*` in `.env`.
6. **Get an Admin SDK service account key**: Project Settings → Service
   Accounts → Generate new private key → copy `project_id`, `client_email`,
   and `private_key` into `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` /
   `FIREBASE_PRIVATE_KEY` in `.env`. Keep the `\n` sequences in the private
   key literal — the app converts them to real newlines at runtime.

```bash
cp .env.example .env
# then fill in the values described above
```

### Deploying security rules and indexes

```bash
firebase login
firebase use --add          # select your Firebase project
firebase deploy --only firestore:rules,firestore:indexes
```

Firestore will also prompt you to create missing composite indexes the first
time a query needs one during development — `firestore.indexes.json` covers
every query this app makes, so a clean deploy avoids that entirely.

## 3. Install & Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### Local development with Firebase Emulators (optional)

To develop without touching a real Firebase project:

```bash
firebase emulators:start
```

...and set `NUXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env`. The Admin SDK
side (`server/utils/firebaseAdmin.ts`) still needs real service account
credentials even when the client uses emulators, unless you also set the
standard `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` environment
variables, which the Admin SDK respects automatically.

## 4. Seed Sample Data & Create the Admin Account

```bash
npm run seed
```

This creates:
- 7 sample categories and 11 sample vehicles (cars + motorcycles, PHP pricing, placeholder photos — replace them from Admin → Vehicles)
- A disabled promotional popup config (`popups/promo`)
- A `settings/general` document
- **One admin account**: `admin@example.com` / `ChangeMe123!` (or the
  values of `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`, if set)

**Change the admin password after first login** — sign in at `/login` with
the seeded credentials, then update the password from the Firebase Console
(Authentication → Users) or build a password-change flow before going live.

To create additional admin/staff accounts later, either re-run the seed
script with different `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` values, or
manually set `role: 'admin'` on a `users/{uid}` document in Firestore for an
existing account.

## 5. Production Deployment

This is a standard Nuxt 4 app — deploy it anywhere Nuxt/Nitro runs (Vercel,
Netlify, Cloud Run, a Node server, etc.):

```bash
npm run build
node .output/server/index.mjs   # or deploy .output/ per your platform's Nuxt preset
```

Set the same environment variables from `.env` in your hosting platform's
environment configuration — **never** commit `.env` or expose
`FIREBASE_PRIVATE_KEY` to the client bundle. Only
`NUXT_PUBLIC_*` variables are safe to expose; everything else is server-only
by construction (see `nuxt.config.ts`'s `runtimeConfig`).

Before going live:
- Deploy `firestore.rules` and `firestore.indexes.json`
- Seed real (not sample) catalog data, or adapt `scripts/seed.ts`
- Change the seeded admin password
- Review `docs/database-schema.md`'s security notes per collection

---

## What's Implemented vs. Explicitly Deferred

**Fully implemented, real, server-validated:**
availability engine, pricing engine (server-only, never trusts client
totals), rental status workflow with audit trail, Firestore-friendly search
(prefix-based, no external search service), full storefront and admin CRUD,
per-vehicle inventory tracking (plate / chassis no.), a first-visit promotional popup managed from the admin,, Firestore security rules.

**Deliberately deferred (not faked):**
- **Payment gateway** — `payments` documents model manually-reconciled
  entries (cash/GCash reference numbers) rather than a live payment gateway
  integration, since no specific processor was specified.
- **Customer ID verification upload UI** — the data model
  (`customers.idVerification`) supports it; the upload
  component itself is not built in this phase.

---

## Branding

Set the site name with `NUXT_PUBLIC_SITE_NAME` in `.env`. Contact details in
the footer and Contact page come from **Admin → Settings**.

## Image uploads

Admin uploads (vehicle photos, popup and banner images) are saved to the server's
disk in `UPLOAD_DIR` (default `./uploads`) and served at `/uploads/...`. Use a
persistent directory in production — on hosts with an ephemeral filesystem
(e.g. most serverless platforms) uploaded files would be lost on redeploy; use
image URLs there, or mount a volume.

## Promotional popup

**Admin → Promotional Popup** controls the first-visit popup: enable/disable,
image upload, title, description, small text, button text + link, frequency
(once / per session / daily / weekly), first-time visitors only, delay, and an
optional start/end schedule, with a live preview. The storefront fetches it from
`GET /api/popup`; if that request fails, the popup is simply not shown. The
popup is skipped on cart, checkout, login and register.

## Upgrading an existing (camera) database

Existing documents are not touched automatically. Run

```bash
npm run migrate:legacy            # dry run: reports what it would change
npm run migrate:legacy -- --apply # removes leftover sync fields (never deletes documents)
```

then archive the old camera products, deactivate the old categories and
remove the old hero banners from the admin. Also delete the now-unused
`ERP_*` / `HUBSHAKE_*` variables from your hosting environment.

---

## Documentation Index

- `docs/database-schema.md` — full Firestore data model
- `docs/api.md` — API endpoint reference
#   R e n t - a n d - R i d e  
 