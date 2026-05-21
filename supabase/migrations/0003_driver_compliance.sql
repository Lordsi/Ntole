-- =============================================================================
-- Ntole — driver compliance, complaints, ban registry, moderation audit
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'driver_approval_status') then
    create type driver_approval_status as enum (
      'draft', 'submitted', 'approved', 'rejected', 'banned'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'complaint_category') then
    create type complaint_category as enum ('safety', 'behavior', 'vehicle', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'complaint_status') then
    create type complaint_status as enum ('open', 'reviewed', 'dismissed');
  end if;
  if not exists (select 1 from pg_type where typname = 'driver_moderation_action') then
    create type driver_moderation_action as enum (
      'approve', 'reject', 'warn', 'ban', 'unban', 'set_tier', 'set_rating', 'verify'
    );
  end if;
end$$;

-- -----------------------------------------------------------------------------
-- Identifier normalization
-- -----------------------------------------------------------------------------
create or replace function normalize_driver_identifier(raw text)
returns text
language sql immutable as $$
  select nullif(upper(regexp_replace(coalesce(raw, ''), '[^A-Z0-9]', '', 'g')), '');
$$;

-- -----------------------------------------------------------------------------
-- Extend drivers
-- -----------------------------------------------------------------------------
alter table drivers
  add column if not exists approval_status driver_approval_status not null default 'draft',
  add column if not exists national_id text,
  add column if not exists national_id_normalized text
    generated always as (normalize_driver_identifier(national_id)) stored,
  add column if not exists license_number_normalized text
    generated always as (normalize_driver_identifier(license_number)) stored,
  add column if not exists license_front_path text,
  add column if not exists license_back_path text,
  add column if not exists car_photo_paths text[] not null default '{}',
  add column if not exists vehicle_body_type text,
  add column if not exists requested_tier_id uuid references ride_tiers(id) on delete set null,
  add column if not exists admin_assigned_tier_id uuid references ride_tiers(id) on delete set null,
  add column if not exists vehicle_year integer,
  add column if not exists rating_override numeric(3, 2),
  add column if not exists rating_override_by uuid references profiles(id) on delete set null,
  add column if not exists rating_override_at timestamptz,
  add column if not exists warning_count integer not null default 0,
  add column if not exists banned_at timestamptz,
  add column if not exists ban_reason text,
  add column if not exists rejection_reason text;

create index if not exists drivers_approval_status_idx on drivers (approval_status);
create index if not exists drivers_national_id_norm_idx on drivers (national_id_normalized);
create index if not exists drivers_license_norm_idx on drivers (license_number_normalized);

-- Backfill: previously verified drivers are approved.
update drivers
set approval_status = 'approved'
where is_verified = true and approval_status = 'draft';

-- -----------------------------------------------------------------------------
-- Ban registry
-- -----------------------------------------------------------------------------
create table if not exists banned_identifiers (
  id                        uuid primary key default gen_random_uuid(),
  national_id_normalized    text unique,
  license_number_normalized text unique,
  banned_profile_id         uuid not null references profiles(id) on delete cascade,
  banned_by                 uuid references profiles(id) on delete set null,
  reason                    text not null default '',
  created_at                timestamptz not null default now(),
  constraint banned_identifiers_has_identifier check (
    national_id_normalized is not null or license_number_normalized is not null
  )
);

create index if not exists banned_identifiers_national_idx
  on banned_identifiers (national_id_normalized) where national_id_normalized is not null;
create index if not exists banned_identifiers_license_idx
  on banned_identifiers (license_number_normalized) where license_number_normalized is not null;

alter table banned_identifiers enable row level security;

drop policy if exists banned_identifiers_admin on banned_identifiers;
create policy banned_identifiers_admin on banned_identifiers
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- Complaints
-- -----------------------------------------------------------------------------
create table if not exists complaints (
  id                 uuid primary key default gen_random_uuid(),
  reporter_id        uuid not null references profiles(id) on delete cascade,
  subject_driver_id  uuid not null references profiles(id) on delete cascade,
  ride_id            uuid references rides(id) on delete set null,
  category           complaint_category not null,
  body               text not null,
  status             complaint_status not null default 'open',
  admin_notes        text,
  reviewed_by        uuid references profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists complaints_subject_idx on complaints (subject_driver_id, created_at desc);
create index if not exists complaints_status_idx on complaints (status);

drop trigger if exists trg_complaints_touch on complaints;
create trigger trg_complaints_touch before update on complaints
  for each row execute function touch_updated_at();

alter table complaints enable row level security;

drop policy if exists complaints_reporter_insert on complaints;
create policy complaints_reporter_insert on complaints
  for insert with check (reporter_id = auth.uid());

drop policy if exists complaints_reporter_read on complaints;
create policy complaints_reporter_read on complaints
  for select using (reporter_id = auth.uid() or is_admin());

drop policy if exists complaints_subject_read on complaints;
create policy complaints_subject_read on complaints
  for select using (subject_driver_id = auth.uid() or is_admin());

drop policy if exists complaints_admin_write on complaints;
create policy complaints_admin_write on complaints
  for all using (is_admin()) with check (is_admin());

-- -----------------------------------------------------------------------------
-- Moderation audit trail
-- -----------------------------------------------------------------------------
create table if not exists driver_moderation_events (
  id         uuid primary key default gen_random_uuid(),
  driver_id  uuid not null references profiles(id) on delete cascade,
  admin_id   uuid references profiles(id) on delete set null,
  action     driver_moderation_action not null,
  payload    jsonb not null default '{}',
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists driver_moderation_events_driver_idx
  on driver_moderation_events (driver_id, created_at desc);

alter table driver_moderation_events enable row level security;

drop policy if exists driver_moderation_events_admin on driver_moderation_events;
create policy driver_moderation_events_admin on driver_moderation_events
  for all using (is_admin()) with check (is_admin());

drop policy if exists driver_moderation_events_driver_read on driver_moderation_events;
create policy driver_moderation_events_driver_read on driver_moderation_events
  for select using (driver_id = auth.uid() or is_admin());

-- -----------------------------------------------------------------------------
-- Ban check helper
-- -----------------------------------------------------------------------------
create or replace function check_banned_identifiers(
  p_national_id text,
  p_license_number text
) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from banned_identifiers b
    where (b.national_id_normalized is not null
           and b.national_id_normalized = normalize_driver_identifier(p_national_id))
       or (b.license_number_normalized is not null
           and b.license_number_normalized = normalize_driver_identifier(p_license_number))
  );
$$;

-- -----------------------------------------------------------------------------
-- Tighten drivers RLS
-- -----------------------------------------------------------------------------
drop policy if exists drivers_self on drivers;

drop policy if exists drivers_self_select on drivers;
create policy drivers_self_select on drivers
  for select using (profile_id = auth.uid() or is_admin());

drop policy if exists drivers_self_insert on drivers;
create policy drivers_self_insert on drivers
  for insert with check (
    profile_id = auth.uid()
    and approval_status = 'draft'
  );

drop policy if exists drivers_self_update on drivers;
create policy drivers_self_update on drivers
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Drivers may only mutate compliance-sensitive columns while draft/submitted;
-- approved drivers may update operational fields (status, location, vehicle link).
create or replace function guard_driver_self_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_admin() then
    return new;
  end if;

  if new.profile_id is distinct from auth.uid() then
    return old;
  end if;

  if old.approval_status = 'approved' then
    new.approval_status := old.approval_status;
    new.is_verified := old.is_verified;
    new.national_id := old.national_id;
    new.license_number := old.license_number;
    new.license_front_path := old.license_front_path;
    new.license_back_path := old.license_back_path;
    new.car_photo_paths := old.car_photo_paths;
    new.vehicle_body_type := old.vehicle_body_type;
    new.requested_tier_id := old.requested_tier_id;
    new.admin_assigned_tier_id := old.admin_assigned_tier_id;
    new.vehicle_year := old.vehicle_year;
    new.rating_override := old.rating_override;
    new.rating_override_by := old.rating_override_by;
    new.rating_override_at := old.rating_override_at;
    new.warning_count := old.warning_count;
    new.banned_at := old.banned_at;
    new.ban_reason := old.ban_reason;
    new.rejection_reason := old.rejection_reason;
  elsif old.approval_status in ('draft', 'submitted') then
    new.is_verified := old.is_verified;
    new.admin_assigned_tier_id := old.admin_assigned_tier_id;
    new.rating_override := old.rating_override;
    new.rating_override_by := old.rating_override_by;
    new.rating_override_at := old.rating_override_at;
    new.warning_count := old.warning_count;
    new.banned_at := old.banned_at;
    new.ban_reason := old.ban_reason;
    if new.approval_status not in ('draft', 'submitted') then
      new.approval_status := old.approval_status;
    end if;
  else
    new.approval_status := old.approval_status;
    new.is_verified := old.is_verified;
    new.status := old.status;
  end if;

  return new;
end$$;

drop trigger if exists trg_guard_driver_self_update on drivers;
create trigger trg_guard_driver_self_update before update on drivers
  for each row execute function guard_driver_self_update();

-- Prevent non-admins from changing their own role.
create or replace function guard_profile_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end$$;

drop trigger if exists trg_guard_profile_role on profiles;
create trigger trg_guard_profile_role before update on profiles
  for each row execute function guard_profile_role_change();

-- -----------------------------------------------------------------------------
-- Storage: private driver documents + vehicle photos
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('driver-documents', 'driver-documents', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "driver documents self read" on storage.objects;
create policy "driver documents self read" on storage.objects
  for select using (
    bucket_id = 'driver-documents'
    and (auth.uid()::text = (storage.foldername(name))[1] or is_admin())
  );

drop policy if exists "driver documents self write" on storage.objects;
create policy "driver documents self write" on storage.objects
  for insert with check (
    bucket_id = 'driver-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "driver documents self update" on storage.objects;
create policy "driver documents self update" on storage.objects
  for update using (
    bucket_id = 'driver-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'driver-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "driver documents self delete" on storage.objects;
create policy "driver documents self delete" on storage.objects
  for delete using (
    bucket_id = 'driver-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vehicle photos self read" on storage.objects;
create policy "vehicle photos self read" on storage.objects
  for select using (
    bucket_id = 'vehicle-photos'
    and (auth.uid()::text = (storage.foldername(name))[1] or is_admin())
  );

drop policy if exists "vehicle photos self write" on storage.objects;
create policy "vehicle photos self write" on storage.objects
  for insert with check (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vehicle photos self update" on storage.objects;
create policy "vehicle photos self update" on storage.objects
  for update using (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  ) with check (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "vehicle photos self delete" on storage.objects;
create policy "vehicle photos self delete" on storage.objects
  for delete using (
    bucket_id = 'vehicle-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- -----------------------------------------------------------------------------
-- Matching / acceptance gates
-- -----------------------------------------------------------------------------
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
    coalesce(d.rating_override, p.rating) as rating,
    d.current_lat,
    d.current_lng,
    haversine_km(origin_lat, origin_lng, d.current_lat, d.current_lng) as distance_km,
    v.id as vehicle_id,
    coalesce(v.make || ' ' || v.model, '') as vehicle_label
  from drivers d
  join profiles p on p.id = d.profile_id
  left join vehicles v on v.id = d.vehicle_id
  where d.status = 'online'
    and d.approval_status = 'approved'
    and d.is_verified = true
    and p.role = 'driver'
    and d.current_lat is not null
    and d.current_lng is not null
    and (target_tier_id is null or v.tier_id = target_tier_id)
    and haversine_km(origin_lat, origin_lng, d.current_lat, d.current_lng) <= radius_km
  order by distance_km asc
  limit max_results;
$$;

create or replace function accept_ride(ride uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  driver uuid := auth.uid();
  rows_updated integer;
  veh uuid;
  approved driver_approval_status;
  verified boolean;
begin
  if driver is null then
    return false;
  end if;

  select vehicle_id, approval_status, is_verified
  into veh, approved, verified
  from drivers
  where profile_id = driver;

  if approved is distinct from 'approved' or verified is not true then
    return false;
  end if;

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
