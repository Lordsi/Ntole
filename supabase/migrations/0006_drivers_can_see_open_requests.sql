-- =============================================================================
-- Ntole — let approved drivers see open ride requests
-- =============================================================================
-- The original migration 0001 added a single SELECT policy on `rides`:
--
--   rides_participant_read: rider_id = auth.uid()
--                        OR driver_id = auth.uid()
--                        OR is_admin()
--
-- A freshly-inserted ride has driver_id = null, so no driver matches the
-- policy. The driver dashboard can't list open requests, and Supabase
-- Realtime can't deliver INSERT events to driver clients (it respects
-- RLS). The net effect: rider taps Request Ride → the row exists but
-- no driver sees it.
--
-- We add a second SELECT policy that grants visibility specifically for
-- rows in `status = 'requested'` to approved drivers. Approved drivers
-- can see (and therefore accept) open requests; once they call the
-- atomic `accept_ride` RPC the row flips to `accepted` with driver_id
-- set, at which point the original participant policy keeps gating who
-- can read the rest of the lifecycle.
--
-- The policy intentionally checks `drivers.approval_status = 'approved'`
-- so banned / rejected / draft / submitted drivers never see the queue.
--
-- Safe to re-apply.
-- =============================================================================

drop policy if exists rides_open_for_drivers on rides;
create policy rides_open_for_drivers on rides
  for select using (
    status = 'requested'
    and exists (
      select 1 from drivers
      where drivers.profile_id = auth.uid()
        and drivers.approval_status = 'approved'
    )
  );
