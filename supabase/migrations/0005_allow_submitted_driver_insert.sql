-- =============================================================================
-- Ntole — allow first-time applicants to insert a `submitted` driver row
-- =============================================================================
-- Migration 0003 tightened the drivers INSERT RLS policy to only accept
-- rows in `approval_status = 'draft'`. That blocked the apply-as-rider
-- flow: when a rider opens the wizard for the first time and clicks
-- "Submit application", the upsert performs an INSERT with
-- approval_status = 'submitted' (because there is no existing draft row
-- to UPDATE). The policy rejected it with:
--
--   "new row violates row-level security policy for table 'drivers'"
--
-- Both 'draft' and 'submitted' are user-controlled states by design (the
-- update flow already lets a draft row transition to submitted), so it's
-- safe to accept either at INSERT time too. The guard_driver_self_update
-- trigger still prevents non-admins from skipping ahead to approved,
-- banned, or rejected.
--
-- Safe to re-apply.
-- =============================================================================

drop policy if exists drivers_self_insert on drivers;
create policy drivers_self_insert on drivers
  for insert with check (
    profile_id = auth.uid()
    and approval_status in ('draft', 'submitted')
  );
