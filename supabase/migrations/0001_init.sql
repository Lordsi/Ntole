-- =============================================================================
-- Ntole — initial schema
-- =============================================================================
-- Tables:  profiles, vehicles, drivers, ride_tiers, rides, messages, payments,
--          ratings, app_config
-- Enums:   user_role, driver_status, ride_status, payment_status
-- Money:   stored as integer minor units (e.g. tambala for MWK).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('rider', 'driver', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'driver_status') then
    create type driver_status as enum ('offline', 'online', 'on_trip');
  end if;
  if not exists (select 1 from pg_type where typname = 'ride_status') then
    create type ride_status as enum (
      'requested',
      'accepted',
      'en_route_to_pickup',
      'in_progress',
      'completed',
      'cancelled'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'authorized', 'paid', 'failed', 'refunded');
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'rider',
  full_name   text not null default '',
  phone       text,
  avatar_url  text,
  rating      numeric(3, 2) not null default 5.00,
  trip_count  integer not null default 0,
  safety_rating integer not null default 98,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on profiles (role);

-- -----------------------------------------------------------------------------
-- ride_tiers
-- -----------------------------------------------------------------------------
create table if not exists ride_tiers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  description         text not null default '',
  base_fare_minor     bigint not null default 0,
  per_km_minor        bigint not null default 0,
  per_minute_minor    bigint not null default 0,
  min_fare_minor      bigint not null default 0,
  currency            text not null default 'MWK',
  surge_multiplier    numeric(4, 2) not null default 1.00,
  seats               integer not null default 4,
  sort_order          integer not null default 0,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists ride_tiers_active_idx on ride_tiers (is_active, sort_order);

-- -----------------------------------------------------------------------------
-- vehicles
-- -----------------------------------------------------------------------------
create table if not exists vehicles (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid not null references profiles(id) on delete cascade,
  tier_id       uuid not null references ride_tiers(id),
  make          text not null,
  model         text not null,
  plate_number  text not null,
  color         text not null default '',
  seats         integer not null default 4,
  created_at    timestamptz not null default now()
);

create index if not exists vehicles_driver_idx on vehicles (driver_id);

-- -----------------------------------------------------------------------------
-- drivers
-- -----------------------------------------------------------------------------
create table if not exists drivers (
  profile_id     uuid primary key references profiles(id) on delete cascade,
  vehicle_id     uuid references vehicles(id) on delete set null,
  status         driver_status not null default 'offline',
  current_lat    double precision,
  current_lng    double precision,
  last_seen_at   timestamptz,
  license_number text,
  is_verified    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists drivers_status_idx on drivers (status);
create index if not exists drivers_location_idx on drivers (current_lat, current_lng);

-- -----------------------------------------------------------------------------
-- rides
-- -----------------------------------------------------------------------------
create table if not exists rides (
  id                    uuid primary key default gen_random_uuid(),
  rider_id              uuid not null references profiles(id) on delete cascade,
  driver_id             uuid references profiles(id) on delete set null,
  vehicle_id            uuid references vehicles(id) on delete set null,
  tier_id               uuid not null references ride_tiers(id),
  status                ride_status not null default 'requested',
  pickup_lat            double precision not null,
  pickup_lng            double precision not null,
  pickup_address        text not null default '',
  drop_lat              double precision not null,
  drop_lng              double precision not null,
  drop_address          text not null default '',
  quoted_distance_km    numeric(8, 2) not null default 0,
  quoted_duration_min   numeric(8, 2) not null default 0,
  actual_distance_km    numeric(8, 2),
  actual_duration_min   numeric(8, 2),
  fare_minor            bigint not null default 0,
  currency              text not null default 'MWK',
  surge_multiplier      numeric(4, 2) not null default 1.00,
  requested_at          timestamptz not null default now(),
  accepted_at           timestamptz,
  arrived_at            timestamptz,
  started_at            timestamptz,
  completed_at          timestamptz,
  cancelled_at          timestamptz,
  cancelled_by          uuid references profiles(id) on delete set null,
  cancellation_reason   text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists rides_rider_idx on rides (rider_id, requested_at desc);
create index if not exists rides_driver_idx on rides (driver_id, requested_at desc);
create index if not exists rides_status_idx on rides (status);
create index if not exists rides_open_idx on rides (status, tier_id) where status = 'requested';

-- -----------------------------------------------------------------------------
-- messages (in-ride chat)
-- -----------------------------------------------------------------------------
create table if not exists messages (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references rides(id) on delete cascade,
  sender_id   uuid not null references profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists messages_ride_idx on messages (ride_id, created_at);

-- -----------------------------------------------------------------------------
-- payments
-- -----------------------------------------------------------------------------
create table if not exists payments (
  id                  uuid primary key default gen_random_uuid(),
  ride_id             uuid not null references rides(id) on delete cascade,
  rider_id            uuid not null references profiles(id) on delete cascade,
  provider            text not null default 'mock',
  provider_intent_id  text,
  amount_minor        bigint not null,
  currency            text not null default 'MWK',
  status              payment_status not null default 'pending',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists payments_ride_idx on payments (ride_id);
create unique index if not exists payments_intent_idx on payments (provider_intent_id) where provider_intent_id is not null;

-- -----------------------------------------------------------------------------
-- ratings
-- -----------------------------------------------------------------------------
create table if not exists ratings (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references rides(id) on delete cascade,
  rater_id    uuid not null references profiles(id) on delete cascade,
  ratee_id    uuid not null references profiles(id) on delete cascade,
  stars       integer not null check (stars between 1 and 5),
  comment     text not null default '',
  created_at  timestamptz not null default now(),
  unique (ride_id, rater_id)
);

create index if not exists ratings_ratee_idx on ratings (ratee_id);

-- -----------------------------------------------------------------------------
-- app_config (single-row admin-editable settings)
-- -----------------------------------------------------------------------------
create table if not exists app_config (
  id                    integer primary key default 1,
  default_currency      text not null default 'MWK',
  match_radius_km       numeric(6, 2) not null default 8.00,
  driver_ping_seconds   integer not null default 5,
  surge_multiplier      numeric(4, 2) not null default 1.00,
  updated_at            timestamptz not null default now(),
  constraint app_config_singleton check (id = 1)
);

insert into app_config (id) values (1) on conflict (id) do nothing;

-- =============================================================================
-- Helpers / triggers
-- =============================================================================

-- updated_at touch
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_profiles_touch on profiles;
create trigger trg_profiles_touch before update on profiles
  for each row execute function touch_updated_at();

drop trigger if exists trg_drivers_touch on drivers;
create trigger trg_drivers_touch before update on drivers
  for each row execute function touch_updated_at();

drop trigger if exists trg_ride_tiers_touch on ride_tiers;
create trigger trg_ride_tiers_touch before update on ride_tiers
  for each row execute function touch_updated_at();

drop trigger if exists trg_rides_touch on rides;
create trigger trg_rides_touch before update on rides
  for each row execute function touch_updated_at();

drop trigger if exists trg_payments_touch on payments;
create trigger trg_payments_touch before update on payments
  for each row execute function touch_updated_at();

-- Auto-create profile row when a new auth user is created.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', new.phone)
  )
  on conflict (id) do nothing;
  return new;
end$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Recompute a user's average rating after a new rating is inserted.
create or replace function recompute_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles p
  set rating = (select coalesce(avg(stars), 5) from ratings where ratee_id = p.id)
  where p.id = new.ratee_id;
  return new;
end$$;

drop trigger if exists trg_recompute_rating on ratings;
create trigger trg_recompute_rating after insert on ratings
  for each row execute function recompute_rating();

-- Increment trip_count on both sides when a ride completes.
create or replace function increment_trip_counts() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    update profiles set trip_count = trip_count + 1 where id = new.rider_id;
    if new.driver_id is not null then
      update profiles set trip_count = trip_count + 1 where id = new.driver_id;
    end if;
  end if;
  return new;
end$$;

drop trigger if exists trg_increment_trip_counts on rides;
create trigger trg_increment_trip_counts after update on rides
  for each row execute function increment_trip_counts();

-- =============================================================================
-- Helper functions
-- =============================================================================

-- Haversine distance in km. Used for radius search of online drivers.
create or replace function haversine_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql immutable as $$
  select 6371 * 2 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians(lng2 - lng1) / 2), 2)
    )
  );
$$;

-- Find the N nearest online drivers in a given tier within a radius.
create or replace function find_nearby_drivers(
  origin_lat double precision,
  origin_lng double precision,
  target_tier_id uuid,
  radius_km double precision default 8,
  max_results integer default 20
) returns table (
  profile_id uuid,
  full_name text,
  rating numeric,
  current_lat double precision,
  current_lng double precision,
  distance_km double precision,
  vehicle_id uuid,
  vehicle_label text
)
language sql stable security definer set search_path = public as $$
  select
    d.profile_id,
    p.full_name,
    p.rating,
    d.current_lat,
    d.current_lng,
    haversine_km(origin_lat, origin_lng, d.current_lat, d.current_lng) as distance_km,
    v.id as vehicle_id,
    coalesce(v.make || ' ' || v.model, '') as vehicle_label
  from drivers d
  join profiles p on p.id = d.profile_id
  left join vehicles v on v.id = d.vehicle_id
  where d.status = 'online'
    and d.current_lat is not null
    and d.current_lng is not null
    and (target_tier_id is null or v.tier_id = target_tier_id)
    and haversine_km(origin_lat, origin_lng, d.current_lat, d.current_lng) <= radius_km
  order by distance_km asc
  limit max_results;
$$;

-- Atomic ride acceptance. Returns true if the calling driver successfully
-- claimed the ride. Used to handle the race when many drivers see the
-- same incoming request and tap accept simultaneously.
create or replace function accept_ride(ride uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  driver uuid := auth.uid();
  rows_updated integer;
  veh uuid;
begin
  if driver is null then
    return false;
  end if;

  select vehicle_id into veh from drivers where profile_id = driver;

  update rides
  set
    driver_id = driver,
    vehicle_id = coalesce(veh, vehicle_id),
    status = 'accepted',
    accepted_at = now()
  where id = ride and status = 'requested';

  get diagnostics rows_updated = row_count;

  if rows_updated = 1 then
    update drivers set status = 'on_trip' where profile_id = driver;
    return true;
  end if;

  return false;
end$$;

-- Returns true if the caller is an admin. Used in RLS policies.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table profiles    enable row level security;
alter table ride_tiers  enable row level security;
alter table vehicles    enable row level security;
alter table drivers     enable row level security;
alter table rides       enable row level security;
alter table messages    enable row level security;
alter table payments    enable row level security;
alter table ratings     enable row level security;
alter table app_config  enable row level security;

-- profiles: users see their own row + a limited public view of any user
-- they share a ride with. Admins see everything.
drop policy if exists profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_admin());

drop policy if exists profiles_ride_partner_read on profiles;
create policy profiles_ride_partner_read on profiles
  for select using (
    exists (
      select 1 from rides r
      where (r.rider_id = auth.uid() and r.driver_id = profiles.id)
         or (r.driver_id = auth.uid() and r.rider_id = profiles.id)
    )
  );

drop policy if exists profiles_self_update on profiles;
create policy profiles_self_update on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_write on profiles;
create policy profiles_admin_write on profiles
  for all using (is_admin()) with check (is_admin());

-- ride_tiers: world-readable when active, admin-writable.
drop policy if exists ride_tiers_read on ride_tiers;
create policy ride_tiers_read on ride_tiers for select using (is_active or is_admin());

drop policy if exists ride_tiers_admin_write on ride_tiers;
create policy ride_tiers_admin_write on ride_tiers
  for all using (is_admin()) with check (is_admin());

-- vehicles: drivers manage their own vehicles. Riders see vehicles they
-- are or have been on a ride with. Admins see all.
drop policy if exists vehicles_owner on vehicles;
create policy vehicles_owner on vehicles
  for all using (driver_id = auth.uid()) with check (driver_id = auth.uid());

drop policy if exists vehicles_ride_partner_read on vehicles;
create policy vehicles_ride_partner_read on vehicles
  for select using (
    exists (
      select 1 from rides r where r.vehicle_id = vehicles.id and r.rider_id = auth.uid()
    )
  );

drop policy if exists vehicles_admin on vehicles;
create policy vehicles_admin on vehicles for all using (is_admin()) with check (is_admin());

-- drivers: read their own row; riders can read minimal info via
-- find_nearby_drivers (security definer). Admins read all.
drop policy if exists drivers_self on drivers;
create policy drivers_self on drivers
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists drivers_admin on drivers;
create policy drivers_admin on drivers for all using (is_admin()) with check (is_admin());

-- rides: rider and driver of a ride can read; either can update certain fields.
drop policy if exists rides_participant_read on rides;
create policy rides_participant_read on rides
  for select using (rider_id = auth.uid() or driver_id = auth.uid() or is_admin());

drop policy if exists rides_rider_insert on rides;
create policy rides_rider_insert on rides
  for insert with check (rider_id = auth.uid());

drop policy if exists rides_participant_update on rides;
create policy rides_participant_update on rides
  for update using (rider_id = auth.uid() or driver_id = auth.uid() or is_admin())
  with check (rider_id = auth.uid() or driver_id = auth.uid() or is_admin());

drop policy if exists rides_admin_all on rides;
create policy rides_admin_all on rides for all using (is_admin()) with check (is_admin());

-- messages: only ride participants can read or send.
drop policy if exists messages_participant_read on messages;
create policy messages_participant_read on messages
  for select using (
    exists (
      select 1 from rides r
      where r.id = messages.ride_id
        and (r.rider_id = auth.uid() or r.driver_id = auth.uid() or is_admin())
    )
  );

drop policy if exists messages_participant_insert on messages;
create policy messages_participant_insert on messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from rides r
      where r.id = messages.ride_id
        and (r.rider_id = auth.uid() or r.driver_id = auth.uid())
    )
  );

-- payments: rider sees their own; driver sees rides they completed.
drop policy if exists payments_rider_read on payments;
create policy payments_rider_read on payments
  for select using (
    rider_id = auth.uid()
    or exists (select 1 from rides r where r.id = payments.ride_id and r.driver_id = auth.uid())
    or is_admin()
  );

drop policy if exists payments_admin_write on payments;
create policy payments_admin_write on payments for all using (is_admin()) with check (is_admin());

-- ratings: ride participants can rate each other once per ride.
drop policy if exists ratings_participant_read on ratings;
create policy ratings_participant_read on ratings
  for select using (
    rater_id = auth.uid() or ratee_id = auth.uid() or is_admin()
  );

drop policy if exists ratings_participant_insert on ratings;
create policy ratings_participant_insert on ratings
  for insert with check (
    rater_id = auth.uid()
    and exists (
      select 1 from rides r
      where r.id = ratings.ride_id
        and r.status = 'completed'
        and (r.rider_id = auth.uid() or r.driver_id = auth.uid())
    )
  );

-- app_config: world-readable, admin-writable.
drop policy if exists app_config_read on app_config;
create policy app_config_read on app_config for select using (true);

drop policy if exists app_config_admin_write on app_config;
create policy app_config_admin_write on app_config for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- Realtime publication
-- =============================================================================
alter publication supabase_realtime add table rides;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table drivers;
