-- =============================================================================
-- Seed data.
-- Run this AFTER applying 0001_init.sql.
-- All money values are in minor units. MWK has no commonly-used minor unit
-- (tambala are unused in practice) so we treat 1 MWK = 1 minor unit here.
--
-- This file is idempotent: re-running it is safe (uses ON CONFLICT and stable
-- UUIDs everywhere).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ride tiers (Malawian Kwacha)
-- -----------------------------------------------------------------------------
insert into ride_tiers (
  name, description,
  base_fare_minor, per_km_minor, per_minute_minor, min_fare_minor,
  currency, seats, sort_order
)
values
  ('Standard', 'Affordable rides for up to 4 people.',
    1500, 600, 120, 2500, 'MWK', 4, 0),
  ('Comfort',  'Newer cars with more legroom.',
    2500, 850, 160, 4000, 'MWK', 4, 1),
  ('Lux',      'Premium vehicles with top-rated drivers.',
    5000, 1400, 250, 7500, 'MWK', 4, 2)
on conflict (name) do update set
  description       = excluded.description,
  base_fare_minor   = excluded.base_fare_minor,
  per_km_minor      = excluded.per_km_minor,
  per_minute_minor  = excluded.per_minute_minor,
  min_fare_minor    = excluded.min_fare_minor,
  currency          = excluded.currency,
  seats             = excluded.seats,
  sort_order        = excluded.sort_order;

-- =============================================================================
-- Demo accounts
-- -----------------------------------------------------------------------------
-- Three role-specific users you can log in as for development / demos.
--
--   rider@ntole.test    Password123!   role = rider
--   driver@ntole.test   Password123!   role = driver  (+ vehicle + drivers row)
--   admin@ntole.test    Password123!   role = admin
--
-- Implementation: we insert directly into auth.users + auth.identities, which
-- is the standard Supabase pattern for local seed data. The `handle_new_user`
-- trigger automatically materialises a matching row in public.profiles; we
-- then UPDATE those rows to set the desired role + name.
--
-- For production / hosted environments, prefer creating users through the
-- Supabase Admin API instead of running raw SQL against the auth schema.
-- =============================================================================

-- Stable UUIDs so the seed is idempotent across runs.
-- (Generated once; do not change without also clearing existing rows.)
--   rider  = 11111111-1111-1111-1111-111111111111
--   driver = 22222222-2222-2222-2222-222222222222
--   admin  = 33333333-3333-3333-3333-333333333333

create extension if not exists "pgcrypto";

do $$
declare
  rider_id  uuid := '11111111-1111-1111-1111-111111111111';
  driver_id uuid := '22222222-2222-2222-2222-222222222222';
  admin_id  uuid := '33333333-3333-3333-3333-333333333333';
  hashed_pw text := crypt('Password123!', gen_salt('bf'));
begin
  -- ---- auth.users ----------------------------------------------------------
  -- The auth schema requires a number of housekeeping columns (tokens etc.)
  -- to be non-null; we set them to empty strings.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  values
    ('00000000-0000-0000-0000-000000000000', rider_id,
      'authenticated', 'authenticated',
      'rider@ntole.test', hashed_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rider Demo"}'::jsonb,
      now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', driver_id,
      'authenticated', 'authenticated',
      'driver@ntole.test', hashed_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Ucok Behel"}'::jsonb,
      now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', admin_id,
      'authenticated', 'authenticated',
      'admin@ntole.test', hashed_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin Demo"}'::jsonb,
      now(), now(), '', '', '', '')
  on conflict (id) do update set
    encrypted_password   = excluded.encrypted_password,
    email_confirmed_at   = excluded.email_confirmed_at,
    raw_app_meta_data    = excluded.raw_app_meta_data,
    raw_user_meta_data   = excluded.raw_user_meta_data,
    updated_at           = now();

  -- ---- auth.identities -----------------------------------------------------
  -- One email identity per user so signInWithPassword can locate them.
  insert into auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  values
    (gen_random_uuid(), rider_id::text, rider_id,
      jsonb_build_object('sub', rider_id::text, 'email', 'rider@ntole.test', 'email_verified', true),
      'email', now(), now(), now()),
    (gen_random_uuid(), driver_id::text, driver_id,
      jsonb_build_object('sub', driver_id::text, 'email', 'driver@ntole.test', 'email_verified', true),
      'email', now(), now(), now()),
    (gen_random_uuid(), admin_id::text, admin_id,
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@ntole.test', 'email_verified', true),
      'email', now(), now(), now())
  on conflict (provider, provider_id) do update set
    identity_data = excluded.identity_data,
    updated_at    = now();

  -- ---- public.profiles -----------------------------------------------------
  -- handle_new_user() trigger creates rows automatically on auth.users insert,
  -- but only on INSERT (not on conflict updates). The inserts below are no-ops
  -- when re-seeding; we then UPDATE to enforce role + name regardless.
  insert into public.profiles (id, role, full_name)
  values
    (rider_id,  'rider',  'Rider Demo'),
    (driver_id, 'driver', 'Ucok Behel'),
    (admin_id,  'admin',  'Admin Demo')
  on conflict (id) do update set
    role      = excluded.role,
    full_name = excluded.full_name;

  -- ---- Driver: vehicle + drivers row --------------------------------------
  -- Give the driver a Standard-tier Honda CRV with plate AB6299ZG (matches
  -- the design-system mock) and mark them online at the default map center
  -- (Lilongwe, Malawi) so rider matching can find them.
  insert into public.vehicles (
    id, driver_id, tier_id, make, model, plate_number, color, seats
  )
  select
    '44444444-4444-4444-4444-444444444444'::uuid,
    driver_id,
    rt.id,
    'Honda', 'CRV', 'AB6299ZG', 'Silver', 4
  from public.ride_tiers rt
  where rt.name = 'Standard'
  on conflict (id) do update set
    driver_id    = excluded.driver_id,
    tier_id      = excluded.tier_id,
    make         = excluded.make,
    model        = excluded.model,
    plate_number = excluded.plate_number,
    color        = excluded.color,
    seats        = excluded.seats;

  insert into public.drivers (
    profile_id, vehicle_id, status, current_lat, current_lng,
    last_seen_at, license_number, is_verified
  )
  values (
    driver_id,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'online',
    -13.9626, 33.7741,
    now(),
    'MW-DL-000482',
    true
  )
  on conflict (profile_id) do update set
    vehicle_id     = excluded.vehicle_id,
    status         = excluded.status,
    current_lat    = excluded.current_lat,
    current_lng    = excluded.current_lng,
    last_seen_at   = excluded.last_seen_at,
    license_number = excluded.license_number,
    is_verified    = excluded.is_verified;

  -- A nicer-looking starter profile for the driver (high trip count, etc.).
  update public.profiles
  set trip_count = 482, rating = 4.9, safety_rating = 98
  where id = driver_id;
end$$;
