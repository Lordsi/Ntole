# Ntole

An Uber-style ride hailing PWA for Malawi. One Next.js app ships three audience surfaces — Rider, Driver, and Admin — sharing a Supabase backend, OpenStreetMap routing, and an Uber-style fare model (base + per-km + per-minute).

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS, packaged as a PWA.
- **Backend**: Supabase (Postgres + Auth + Realtime + Storage). Row Level Security enforces rider/driver/admin separation.
- **Maps**: `react-leaflet` + OpenStreetMap; OSRM for routing.
- **Payments**: Stripe Payment Intents, abstracted behind a `PaymentProvider` interface (mock provider for dev).
- **Currency**: MWK (Malawian Kwacha) by default, configurable.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and keys. For local development you can leave `PAYMENT_PROVIDER=mock` and skip Stripe entirely.

### 3. Apply the database schema

Apply [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) and [supabase/seed.sql](supabase/seed.sql) to your Supabase project (via the Supabase SQL editor or the Supabase CLI).

### 4. Run the dev server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Routes

- `/login` — magic-link sign in (email).
- `/` — auto-redirects based on the signed-in user's role.
- `/(rider)` — rider home, ride flow, history, profile.
- `/(driver)` — driver dashboard, accepted trip flow, earnings.
- `/(admin)` — overview, users, drivers, rides, pricing.

## Pricing model

The fare for a ride is computed as:

```
fare = max(min_fare, (base_fare + per_km × distance_km + per_minute × duration_min) × surge)
```

Tiers (Standard, Comfort, Lux) and rates are stored in the `ride_tiers` table and editable from the admin dashboard.

## Caveats for production

- **OSRM**: the public demo router (`https://router.project-osrm.org`) is rate-limited and not for production. Self-host OSRM or swap to a paid provider — only [lib/maps/osrm.ts](lib/maps/osrm.ts) needs to change.
- **Stripe in Malawi**: Stripe supports MWK but Malawi merchant onboarding is limited. The `PaymentProvider` interface lets you swap in PayChangu or Airtel Money if Stripe is unavailable.
- **Phone auth**: the MVP uses email magic links because Supabase phone auth in Malawi requires a custom SMS hook (e.g. Africa's Talking).
- **Geo matching**: simple haversine radius for the MVP. For scale, migrate to PostGIS.

## Scripts

| script | description |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run build` | production build |
| `npm start` | run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm test` | run the unit tests (pricing engine) |

## Project structure

```
app/                 Next.js routes (rider, driver, admin, auth, api)
components/          UI primitives, map, chat, surface-specific components
lib/
  auth/              Routing helpers
  maps/              OSRM routing + Nominatim geocoding
  payments/          PaymentProvider interface + Stripe & mock implementations
  pricing/           Fare quote engine
  realtime/          Supabase Realtime channel helpers
  supabase/          Browser + server Supabase clients, generated types
supabase/
  migrations/        SQL migrations (run on your Supabase project)
  seed.sql           Sample tiers + test data
public/              Static assets, PWA icons + manifest
```
