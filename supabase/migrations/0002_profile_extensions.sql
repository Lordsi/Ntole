-- =============================================================================
-- Ntole — profile extensions
-- =============================================================================
-- Adds:
--   profiles.home_lat / home_lng / home_address (saved "home" pin)
--   favorite_drivers table + RLS (rider can favourite drivers they've ridden
--     with)
--   storage.avatars bucket + RLS for self-served avatar uploads
-- Safe to re-apply: every statement is idempotent.
-- =============================================================================

-- --------- profiles: home location ---------
alter table profiles
  add column if not exists home_lat double precision,
  add column if not exists home_lng double precision,
  add column if not exists home_address text;

-- --------- favorite_drivers ---------
create table if not exists favorite_drivers (
  rider_id   uuid not null references profiles(id) on delete cascade,
  driver_id  uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rider_id, driver_id)
);

create index if not exists favorite_drivers_rider_idx
  on favorite_drivers (rider_id, created_at desc);

alter table favorite_drivers enable row level security;

drop policy if exists favorite_drivers_self_read on favorite_drivers;
create policy favorite_drivers_self_read on favorite_drivers
  for select using (rider_id = auth.uid() or is_admin());

drop policy if exists favorite_drivers_self_write on favorite_drivers;
create policy favorite_drivers_self_write on favorite_drivers
  for all using (rider_id = auth.uid()) with check (rider_id = auth.uid());

-- --------- avatar storage bucket ---------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- Public read of avatars.
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

-- Users may upload / overwrite / delete only files under their own user id.
-- We expect the path convention `<auth.uid()>/<filename>`.
drop policy if exists "avatars self write" on storage.objects;
create policy "avatars self write" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars self update" on storage.objects;
create policy "avatars self update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars self delete" on storage.objects;
create policy "avatars self delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
