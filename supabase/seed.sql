-- =============================================================================
-- Seed data for ride tiers (Malawian Kwacha).
-- Run this AFTER applying 0001_init.sql.
-- All money values are in minor units. MWK has no commonly-used minor unit
-- (tambala are unused in practice) so we treat 1 MWK = 1 minor unit here.
-- =============================================================================

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
