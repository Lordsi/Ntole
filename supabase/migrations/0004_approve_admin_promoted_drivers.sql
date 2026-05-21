-- =============================================================================
-- Ntole — backfill admin-promoted drivers
-- =============================================================================
-- Earlier versions of components/admin/user-role-select.tsx upserted a
-- `drivers` row with `approval_status = 'draft'` when an admin promoted a
-- user to driver. The auth middleware then bounced those users to
-- /driver/apply, forcing them to re-submit an application despite the
-- admin having already vetted them.
--
-- This migration retroactively approves rows that look like
-- admin-created shells: status still 'draft', and none of the wizard
-- fields ever filled in (no national ID, no license, no vehicle, no
-- documents). They get the same pre-approved treatment new admin
-- promotions now receive.
--
-- Safe to re-apply.
-- =============================================================================

update drivers
set
  approval_status = 'approved',
  is_verified = true,
  updated_at = now()
where approval_status = 'draft'
  and national_id is null
  and license_number is null
  and vehicle_id is null
  and (license_front_path is null or license_front_path = '')
  and (license_back_path is null or license_back_path = '')
  and coalesce(array_length(car_photo_paths, 1), 0) = 0;
