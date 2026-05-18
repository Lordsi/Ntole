# Ntole Handoff

Last updated: 2026-05-17

## 1. Goal

**Ntole** is an Uber-style ride-hailing PWA for Malawi (currency: MWK). Three audiences in one Next.js app:

- **Rider** — request a ride or send a package, see fare quotes per tier (Standard / Comfort / Lux), live driver tracking, in-trip chat, post-trip rating.
- **Driver** — go online, accept incoming requests, run trip status (`en_route → in_progress → completed`), publish location every ~5s, view earnings.
- **Admin** — live overview of active rides on a map, users/drivers tables, KYC, pricing config editor that writes to `ride_tiers`.

Pricing model is Uber-style: `base + per_km × distance + per_min × duration`, with surge multiplier and a minimum-fare floor, configurable per tier. UI follows the dark / bright-green design from the reference screenshots.

## 2. Current state of the code

### Stack

- **Frontend**: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
- **PWA**: custom `public/sw.js` + `public/manifest.webmanifest` + install prompt component (no `next-pwa`)
- **Backend**: Supabase — Postgres, Auth (email magic-link), Realtime, Storage, RLS on every table
- **Maps**: Leaflet via `react-leaflet` (OSM tiles), routing via OSRM (`router.project-osrm.org`), geocoding via Nominatim
- **Payments**: `lib/payments/provider.ts` interface with `MockProvider` (default) and `StripeProvider`. Currently running with `PAYMENT_PROVIDER=mock`.

### Repository

- Git remote: `https://github.com/Lordsi/Ntole.git`
- Branch: `main`
- Latest commit: `0a44c6d feat(auth): allow anonymous browsing of rider home; gate hailing behind sign-in`
- Working tree is clean; pushed to `origin/main`.

### What is built (all done)

- Database schema + RLS + triggers + helper SQL functions in `supabase/migrations/0001_init.sql` (~549 lines), seed tiers in `supabase/seed.sql`.
- Email magic-link auth, `/auth/callback` handler, `requireUser` / `requireRole` server helpers, role-aware middleware.
- Shared UI primitives in `components/ui/*` styled to match the design.
- Rider: home page, location autocomplete, live quotes, ride request, live ride view (waiting → driver arriving → in trip → completed → cancelled panels), real-time map, in-trip chat, history, profile, post-trip rating.
- Driver: online toggle with location publishing, incoming-request sheet, trip panel, earnings, profile + vehicle, chat.
- Admin: overview map, users, drivers, rides table with filters, pricing config editor.
- API routes: `/api/quote`, `/api/geocode`, `/api/rides`, `/api/rides/[id]`, `/api/rides/[id]/rate`, `/api/payments/intent`, `/api/payments/webhook`.
- PWA shell with install prompt + service-worker register components.
- Docs: `README.md`, `DEPLOYMENT.md`.

### What just changed (this session)

Anonymous-browsing feature shipped in commit `0a44c6d`:

- `/` and `/rider` are now public — guests can preview routes and live fare quotes without an account.
- `/rider/history`, `/rider/profile`, `/rider/ride/[id]`, all `/driver/*`, all `/admin/*` still require sign-in.
- Clicking **Request ride** when not signed in persists `mode/pickup/drop/selectedTierId` to `sessionStorage`, then routes to `/login?next=/rider`. After magic-link sign-in, the form is restored automatically by a `useEffect` keyed off `isAuthed`.
- Header swaps the avatar for a green "Sign in" pill when the visitor is anonymous; greeting card becomes a "Browsing as a guest" banner.

### Local dev

- Dev server is running on `http://localhost:3000` (shell `215132`, PID 1100).
- `.env.local` has working `NEXT_PUBLIC_SUPABASE_URL` + anon + service-role keys for project `crnkjhyicdfsbaacottb.supabase.co`.
- Verified in-browser: anon visitor on `/` → renders `/rider` home (Standard / Comfort / Lux tiers visible). `/rider/history` → 302 to `/login?next=%2Frider%2Fhistory`.

### Deployment

- **Supabase**: project URL is set; migrations status **uncertain — must be confirmed by the user** (the agent's Supabase MCP was authed to a different org and got "permission denied" against `crnkjhyicdfsbaacottb`). Suggested path: paste `supabase/migrations/0001_init.sql` then `supabase/seed.sql` into the SQL editor manually.
- **Render**: user is configuring service in the dashboard. Detailed env-var checklist is in `DEPLOYMENT.md`. After first deploy: update `NEXT_PUBLIC_SITE_URL` to the live URL and add it to Supabase's Auth → URL Configuration redirect allowlist.

## 3. Files most recently edited (this session)

All committed in `0a44c6d`:

- `lib/auth/routing.ts` — added `/` and `/rider` to `PUBLIC_EXACT`; `isPublicPath` matches exact paths plus `/auth/` prefix; `canAccess` unchanged for role-gated segments.
- `app/page.tsx` — anonymous → redirect to `/rider`; signed-in → role home via `resolveHomePath`.
- `app/rider/layout.tsx` — dropped `requireRole`; layout no longer enforces auth.
- `app/rider/page.tsx` — fetches `profile` only when a user is present; passes `Profile | null` to `RiderHome`.
- `components/rider/rider-home.tsx` — handles `profile: Profile | null`, guest banner, sessionStorage form persistence, "Sign in to request ride" CTA.

Open in editor at the time of writing: `app/rider/ride/[id]/page.tsx` (auth-gated, untouched this session — still calls `requireRole("rider", "admin")`).

## 4. Things tried that failed (and how they were resolved)

| # | Problem | Fix |
|---|---------|-----|
| 1 | `next@15.0.3` + `react@19 RC` dependency conflict | Bumped to `next@^15.1.7`, `react@^19.0.0`, `react-dom@^19.0.0`, `react-leaflet@^5.0.0`, `eslint-config-next@^15.1.7` |
| 2 | Build error: `(rider)`, `(driver)`, `(admin)` route groups all collapsed to `/`, causing a "two parallel pages resolve to the same path" error | Renamed to flat folders `app/rider`, `app/driver`, `app/admin` |
| 3 | ESLint `@typescript-eslint/no-require-imports` in `lib/supabase/server.ts` | Replaced lazy `require("@supabase/supabase-js")` with top-level `import { createClient }` |
| 4 | Unused `useRef` import in `components/driver/driver-home.tsx` | Removed |
| 5 | Build-time SSR of `/login` failed with `Your project's URL and Key are required to create a Supabase client!` because env vars were empty during static prerender | Added `export const dynamic = "force-dynamic"` to `app/(auth)/login/page.tsx` and moved `createBrowserSupabaseClient()` inside the form's `handleSubmit` so it only runs on user interaction |
| 6 | Supabase MCP returned "permission denied" for the user's project (MCP authed to a different org) | Could not auto-apply migrations; user has to paste SQL into the Supabase dashboard manually (or re-auth the MCP) |
| 7 | App crashed at runtime: `NEXT_PUBLIC_SUPABASE_ANON_KEY` empty — user had pasted keys into `.env.example` instead of `.env.local`, and the JWTs were truncated | Reverted `.env.example` to placeholders, moved keys to `.env.local`, asked user to re-paste the un-truncated values |
| 8 | Port 3000 stuck after dev-server restarts (orphan Node processes) | `Get-NetTCPConnection -LocalPort 3000` → `Stop-Process -Force` to free the port |
| 9 | First `git commit` attempt with bash-style heredoc failed under PowerShell (`&&` and `<<` are not valid) | Wrote message to `.git/COMMIT_MSG_TMP.txt` and committed with `git commit -F` |

### Caveats still open (not failures, just things not finished)

- **Migrations not yet confirmed applied to the live Supabase project** — needs human verification.
- **Stripe is in mock mode** (`PAYMENT_PROVIDER=mock`). Real keys + webhook endpoint config still required for production.
- **OSRM / Nominatim**: dev is using the public demo hosts. They rate-limit aggressively and aren't licensed for production traffic. Need to either self-host or buy a managed routing/geocoding provider.
- **Auth restoration UX** is implemented but has only been verified up to "anonymous user sees the right CTA". The full round-trip (anon → click Request → magic-link email → click link → form restored → ride created) was not end-to-end tested because magic-link delivery requires a real inbox.
- **PWA installability** has not been smoke-tested on real devices (iOS Safari / mobile Chrome).
- **`render.yaml` Blueprint** was offered but not yet generated.

## 5. Next step I'd take

In priority order:

1. **Confirm Supabase schema is applied.** Open the Supabase SQL Editor for project `crnkjhyicdfsbaacottb`, paste `supabase/migrations/0001_init.sql`, run, then paste `supabase/seed.sql` and run. Then in **Authentication → URL Configuration** add `http://localhost:3000` and the production Render URL to the redirect allow-list, with `/auth/callback` as a redirect URL. Without this, no magic link will work.
2. **End-to-end test the anonymous → sign-in → ride flow locally** with a real email: visit `http://localhost:3000`, fill in pickup/drop, click **Sign in to request ride**, click the magic link in the inbox, verify the form is restored, and verify the ride is created and routed to `/rider/ride/[id]`. This validates both the new feature and the underlying ride-creation flow against the live DB.
3. **Generate `render.yaml`** at the repo root so the Render service is reproducible from a Blueprint instead of a hand-filled dashboard form. Commit it on `main` so future redeploys are config-as-code.
4. **Switch `PAYMENT_PROVIDER` to `stripe`** once the user has live keys, and configure the Stripe webhook to hit `<site>/api/payments/webhook` with the secret in `STRIPE_WEBHOOK_SECRET`.
5. **Production hardening pass**: replace OSRM/Nominatim demo hosts with a paid/self-hosted provider, raise Supabase to a paid tier if needed for real-time concurrency, add Sentry or similar, and run a Lighthouse + PWA install check on a real Android device.
