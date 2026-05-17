# Deployment

This guide walks through deploying Ntole end to end.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`.
3. (Optional) Promote your account to admin by running:
   ```sql
   update profiles set role = 'admin' where id = '<your-auth-user-id>';
   ```
4. In **Auth → URL Configuration**, set:
   - **Site URL** → your production URL (e.g. `https://ntole.app`).
   - **Redirect URLs** → add `https://ntole.app/auth/callback` and `http://localhost:3000/auth/callback`.
5. Copy `Project URL`, `anon` key, and `service_role` key into your env vars (next step).

## 2. Application (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Add the following environment variables (also see [.env.example](.env.example)):

   | name | required | notes |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | yes | e.g. `https://ntole.app` |
   | `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | yes | server-only |
   | `OSRM_BASE_URL` | optional | defaults to public OSRM demo |
   | `NOMINATIM_BASE_URL` | optional | defaults to public Nominatim |
   | `PAYMENT_PROVIDER` | yes | `mock` or `stripe` |
   | `STRIPE_SECRET_KEY` | if Stripe | `sk_test_...` or `sk_live_...` |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | if Stripe | `pk_test_...` |
   | `STRIPE_WEBHOOK_SECRET` | if Stripe | `whsec_...` |
   | `NEXT_PUBLIC_DEFAULT_CURRENCY` | optional | defaults to `MWK` |
   | `NEXT_PUBLIC_DEFAULT_LAT` | optional | defaults to Lilongwe |
   | `NEXT_PUBLIC_DEFAULT_LNG` | optional | defaults to Lilongwe |
   | `NEXT_PUBLIC_DRIVER_LOCATION_INTERVAL_MS` | optional | default `5000` |
   | `RIDE_MATCH_RADIUS_KM` | optional | default `8` |

3. Deploy. After the first deploy, visit `/login`, sign in with email, and Supabase will create your `profiles` row automatically.

## 3. Stripe webhook

If you set `PAYMENT_PROVIDER=stripe`:

1. In the Stripe dashboard go to **Developers → Webhooks → Add endpoint**.
2. URL: `https://<your-domain>/api/payments/webhook`.
3. Events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `payment_intent.requires_action`
4. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` and redeploy.

## 4. Production hardening checklist

- **OSRM**: the public demo (`router.project-osrm.org`) is rate limited and not for production. Self-host OSRM (Docker image: `osrm/osrm-backend`) or use a paid alternative, then set `OSRM_BASE_URL`.
- **Nominatim**: the public instance has strict usage limits and requires a `User-Agent`. For production traffic, self-host Nominatim or swap for Photon / Mapbox / Google Geocoding (only `lib/maps/nominatim.ts` needs to change).
- **Geo matching**: the MVP uses haversine distance for nearby-driver matching. At scale, install the PostGIS extension on Supabase and switch the `find_nearby_drivers` RPC to use a spatial index.
- **Phone auth**: to add phone OTP, configure the [Supabase Send-SMS Hook](https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook) and proxy to Africa's Talking (Malawi).
- **Stripe in Malawi**: Stripe currently has limited merchant onboarding for Malawi-based businesses. If your account is rejected, swap `lib/payments/stripe.ts` for a `PayChangu` or `Airtel Money` provider — both implement the same `PaymentProvider` interface.
- **Service worker**: only enabled in `NODE_ENV=production`. Clear it from DevTools when developing locally.

## 5. Smoke-test the deployed app

1. Sign up two riders and one driver via magic link, then in the SQL editor run:
   ```sql
   update profiles set role = 'driver' where id = '<driver-auth-id>';
   ```
2. Add a vehicle for the driver under `/driver/profile`.
3. Open `/driver` on one phone and tap **Go online**.
4. Open `/rider` on another phone, request a ride, watch it appear on the driver's home, and tap **Accept**.
5. Walk through the status transitions; the rider should see the live driver marker and the trip should complete with a payment intent created.

## 6. Backups & monitoring

- Enable **Daily backups** in Supabase.
- Add Vercel Analytics or a similar provider.
- Pipe Stripe webhook events to Datadog / Sentry to catch payment failures early.
