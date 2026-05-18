# Ntole — Site & page overview

A complete map of the product: what it is, how it routes users, and what
happens on each page.

## What the product is

Ntole is an Uber-style ride-hailing PWA targeted at Malawi. A single Next.js
15 app ships three role-specific surfaces — **Rider**, **Driver**, and
**Admin** — sharing one Supabase backend (Postgres + Auth + Realtime),
OpenStreetMap tiles, OSRM for routing/ETAs, and an Uber-style fare model
(`base + per-km × distance + per-min × duration`, clamped to `min_fare`,
multiplied by surge). Currency defaults to MWK.

## How auth + routing work

- All routes funnel through `middleware.ts` and `lib/auth/routing.ts`.
- Public paths: `/`, `/login`, `/rider`, anything under `/auth/`. Everything
  else requires a session and a role match.
- `lib/auth/routing.ts → resolveHomePath()` decides where signed-in users
  land:
  - `rider` → `/rider`
  - `driver` → `/driver`
  - `admin` → `/admin`
- `canAccess()` enforces role gating per top-level segment (a rider can't
  open `/driver`, etc.).
- Auth itself is email + password via Supabase (`signInWithPassword` /
  `signUp`). Three seeded accounts ship in `supabase/seed.sql`
  (`rider@ntole.test`, `driver@ntole.test`, `admin@ntole.test`, all
  `Password123!`).

## Top-level / shared pages

### `/` — `app/page.tsx`

Smart entry point. Reads the user's role and redirects:

- Anonymous → `/rider` (public preview).
- Rider/driver/admin → their home.

### `/login` — `app/(auth)/login/page.tsx`

Sign-in / create-account screen. Toggle between two modes:

- **Sign in** — email + password via `signInWithPassword`; on success it
  redirects to `?next=…` or the role home.
- **Create account** — adds a full-name field; uses `signUp`. If the
  Supabase project requires email confirmation, the user gets a "check your
  email" prompt; otherwise a session is returned and the app redirects
  immediately.

Also shows a "Demo accounts" disclosure listing the three seeded
credentials.

### `/auth/callback` — `app/auth/callback/route.ts`

Server route that completes any email-link flow (post-signup verification).
Exchanges the `code` for a session, then redirects to `?next=` or the role
home.

---

## Rider surface (`/rider`)

The rider surface is intentionally accessible to anonymous visitors so they
can browse and price-quote rides without an account — but **placing** a
ride requires sign-in. Layout is `app/rider/layout.tsx` (no auth wall;
sub-routes enforce their own).

### `/rider` — `app/rider/page.tsx` + `components/rider/rider-home.tsx`

**State 1 of the design.** Loads active ride tiers and the user's profile
(if signed in), then renders the main hailing screen:

- Header: menu button (left) + bell + avatar / Sign-in button (right).
- Hero title: **"Where do you want to go?"**
- Optional "recent driver" banner for authed users.
- **LocationStack** — a single glass card with two inputs ("Add a pick-up
  location" / "Add your destination") separated by a hairline divider and a
  swap button. Inputs call `/api/geocode` (Nominatim) for autocomplete.
- Pill toggle: **Driver** (active) / **Package** (alternate mode).
- "CHOOSE A RIDE" horizontal carousel: one `TierCard` per tier
  (Standard / Comfort / Lux). Each card shows the type name, seat count,
  steering-wheel badge, and price.
- As soon as both pickup and drop are set, the page hits `/api/quote`
  (POST). That endpoint calls OSRM for distance + duration, runs each tier
  through `lib/pricing/fare.ts`, and returns a `quotes[]` array so each
  card now shows a real fare.
- Bottom CTA — full-width neon-green pill:
  - Authenticated: "Request Ride" → POSTs `/api/rides`, creates a `rides`
    row in status `requested`, then routes the user to
    `/rider/ride/{id}`.
  - Anonymous: "Sign in to request ride" → persists the form to
    `sessionStorage`, sends the user to `/login?next=/rider`, then
    restores the form after sign-in.

### `/rider/ride/[id]` — `app/rider/ride/[id]/page.tsx` + `components/rider/rider-ride-view.tsx`

**State 2 + State 3 of the design.** A single page whose appearance morphs
with the ride status (subscribed to via Supabase Realtime on `rides` + the
driver's live location channel):

- Full-screen dark map with a glowing neon route line and pickup / drop /
  driver markers.
- Header: back button + user avatar.
- A minimized floating route summary card hovers at the top during
  `requested` / `accepted` (shows pickup + drop).
- A bottom panel switches based on `ride.status`:
  - **`requested`** → `WaitingForMatchPanel`: pulsing accent dot, "Looking
    for nearby drivers…", tier + distance + ETA + fare, **Cancel
    request** button (PATCHes `/api/rides/{id}` with `action: "cancel"`).
  - **`accepted`** → `DriverArrivingPanel` (the big State-2 mock): green
    header strip ("The driver will arrive in" + ETA pill), driver row
    with avatar / name / car / white-capsule plate badge, ride-details
    row, and a dark pill "Chat with driver" row that links to
    `/rider/ride/{id}/chat`.
  - **`en_route_to_pickup`** / **`in_progress`** → `StandardRidePanel`
    (the State-3 mock): 60% glass bottom sheet with "Standard" header,
    driver spotlight, top-down sedan illustration, info matrix (`4 Seat`
    / `482 Trip`), 98% safety bar, and the same dark "Chat with driver"
    pill.
  - **`completed`** → `CompletedRidePanel`: trip summary + payment kickoff
    (`POST /api/payments/intent`) + 1–5 star rating with optional
    comment (`POST /api/rides/{id}/rate`). Then redirects back to
    `/rider`.
  - **`cancelled`** → `CancelledRidePanel`: shows the cancellation reason
    and a "Back to home" link.

### `/rider/ride/[id]/chat` — `app/rider/ride/[id]/chat/page.tsx`

Server-checks that the user is the rider on this ride (or admin), then
renders the shared `RideChat` component — a Supabase-Realtime-backed
message thread reading/writing the `messages` table.

### `/rider/history` — `app/rider/history/page.tsx`

Auth-required. Lists the rider's last 50 rides (drop address, timestamp,
distance, duration, status, fare). Each row links back to
`/rider/ride/{id}`.

### `/rider/profile` — `app/rider/profile/page.tsx`

Auth-required. Avatar + name + trip count + star rating, an editable
`ProfileForm` (name / phone / avatar URL), a link to trip history, and a
sign-out button.

---

## Driver surface (`/driver`)

Layout (`app/driver/layout.tsx`) gates the entire surface with
`requireRole("driver", "admin")`.

### `/driver` — `app/driver/page.tsx` + `components/driver/driver-home.tsx`

The driver dashboard:

- Header (menu / bell / avatar that links to `/driver/profile`).
- **Status card**: shows full name + rating + vehicle, and a big circular
  **Go online / Online** button. Toggling online:
  1. Upserts the `drivers` row to `status: "online"`.
  2. Starts `useDriverLocationPublisher`, which pushes the device's
     current GPS coords to Supabase every
     `NEXT_PUBLIC_DRIVER_LOCATION_INTERVAL_MS` (5s default) so riders and
     admins see them move in real time.
  3. Subscribes to a realtime channel that listens for `rides` rows in
     status `requested` whose `tier_id` matches the driver's vehicle.
- **Resume active trip** banner if the driver has an in-progress ride.
- **Incoming requests** list — each card shows tier, distance, ETA, fare,
  pickup, drop. Tapping **Accept** PATCHes `/api/rides/{id}` with
  `action: "accept"`, which calls the `accept_ride` Postgres RPC
  (`SECURITY DEFINER`, atomic so only one driver wins the race). On
  success the driver is routed to `/driver/ride/{id}`. **Decline** just
  hides the card locally.
- "Earnings" link at the bottom.

### `/driver/ride/[id]` — `app/driver/ride/[id]/page.tsx` + `components/driver/driver-ride-view.tsx`

Mirror of the rider trip screen, from the driver's perspective. The bottom
panel exposes the state-machine button:

- `accepted` → **"I'm at the pickup"** (`action: "arrive"`, sets
  `status: en_route_to_pickup`).
- `en_route_to_pickup` → **"Start trip"** (`status: in_progress`).
- `in_progress` → **"End trip"** (`status: completed`, sets
  `completed_at`, recomputes the fare from actual distance/duration, and
  flips the driver back to `online`). After completion the driver is
  routed to `/driver/earnings`.

### `/driver/ride/[id]/chat` — `app/driver/ride/[id]/chat/page.tsx`

Same shared `RideChat` component as the rider chat, scoped to this ride.

### `/driver/profile` — `app/driver/profile/page.tsx`

Avatar + name + trips + rating, a `ProfileForm`, a `VehicleForm` (set
make/model/plate/color/seats/tier — drives matching), and sign-out.

### `/driver/earnings` — `app/driver/earnings/page.tsx`

Totals across completed rides + a list of each completed trip with
destination, timestamp, and fare.

---

## Admin surface (`/admin`)

Layout (`app/admin/layout.tsx`) gates everything with
`requireRole("admin")` and renders a top nav (Overview / Users / Drivers /
Rides / Pricing) + sign-out.

### `/admin` — `app/admin/page.tsx`

Operational overview:

- KPI tiles: rider count, driver count, **online drivers**, **active
  rides**, completed rides.
- Revenue cards, grouped by currency, summed across `payments` rows with
  `status: "paid"`.
- Live driver map (`AdminLiveMap`) showing every online driver in
  realtime.

### `/admin/users` — `app/admin/users/page.tsx`

Table of every profile: name, phone, trip count, rating, **role**. The
role cell is a `UserRoleSelect` dropdown that mutates `profiles.role` so
an admin can promote/demote users.

### `/admin/drivers` — `app/admin/drivers/page.tsx`

Table joining `drivers` + `profiles` + `vehicles`: driver name/phone,
vehicle (make/model/plate), status, verified flag, last-seen timestamp.

### `/admin/rides` — `app/admin/rides/page.tsx`

Last 200 rides with status pill filters (`requested`, `accepted`,
`en_route_to_pickup`, `in_progress`, `completed`, `cancelled`). Each row
shows time, from/to addresses, status, and fare.

### `/admin/pricing` — `app/admin/pricing/page.tsx` + `components/admin/pricing-editor.tsx`

CRUD editor for `ride_tiers`: base fare, per-km, per-minute, min fare,
surge multiplier, seat count, sort order, active flag. Saving here
changes what every rider sees in the carousel and what every quote
returns.

---

## Backend API routes (under `/api`)

These are the server endpoints the UI calls:

- `POST /api/geocode` — Nominatim forward-search for the LocationStack
  autocomplete.
- `POST /api/quote` — OSRM distance/duration + per-tier fare calculation.
  Powers the home-screen prices.
- `POST /api/rides` — creates a ride (rider only) and returns its id.
- `GET /api/rides/[id]` — fetch a single ride.
- `PATCH /api/rides/[id]` — the state-machine endpoint (`accept`,
  `arrive`, `start`, `complete`, `cancel`). `accept` goes through the
  atomic `accept_ride` RPC; `complete` recomputes the final fare and
  flips the driver back to `online`.
- `POST /api/rides/[id]/rate` — rider/driver submits 1–5 stars + comment;
  a Postgres trigger recomputes the recipient's average rating.
- `POST /api/payments/intent` — creates a payment intent through the
  `PaymentProvider` interface (`stripe` or `mock`).
- `POST /api/payments/webhook` — Stripe webhook receiver; flips the
  corresponding `payments` row to `paid` / `failed` / `refunded`.

---

## End-to-end happy path (so the pages above hang together)

1. Anonymous user lands on `/rider`, types pickup + drop, sees prices for
   Standard / Comfort / Lux. Taps **Sign in to request ride**, hits
   `/login`, signs in as `rider@ntole.test`, lands back on `/rider` with
   the form restored.
2. Taps **Request ride** → row inserted in `rides` (`requested`) →
   redirected to `/rider/ride/{id}` → sees `WaitingForMatchPanel`.
3. Driver signs in as `driver@ntole.test`, lands on `/driver`, taps **Go
   online** → driver shows up on the admin live map and starts pinging
   GPS. The seeded driver row is already `online` with vehicle `AB6299ZG`
   (Honda CRV, Standard tier) so they immediately match Standard
   requests.
4. The new request appears in **Incoming requests**. Driver hits **Accept**
   → atomic RPC claims the ride (`accepted`) → driver routed to
   `/driver/ride/{id}`.
5. Rider's page reactively swaps to `DriverArrivingPanel` (green ETA
   header + plate badge + dark "Chat with driver" pill).
6. Driver taps **I'm at the pickup** → `en_route_to_pickup`; rider's
   panel transitions to `StandardRidePanel` (60% glass sheet, top-down
   sedan, info matrix, 98% safety bar).
7. Driver taps **Start trip** → `in_progress`. Map keeps following the
   driver in real time.
8. Driver taps **End trip** → `completed`. Backend recomputes the fare
   from actual distance/duration, flips the driver back to `online`, and
   routes the driver to `/driver/earnings`.
9. Rider's panel becomes `CompletedRidePanel`: payment intent is
   auto-created, rider submits a 1–5 star rating + optional comment, then
   is sent back to `/rider`.
10. The admin watching `/admin` sees the active-rides counter tick down,
    the completed-rides counter tick up, and (after the webhook fires)
    the revenue card update.
