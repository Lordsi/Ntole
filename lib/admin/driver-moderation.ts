import type { DriverModerationAction } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function logModerationEvent(
  supabase: SupabaseClient,
  params: {
    driverId: string;
    adminId: string;
    action: DriverModerationAction;
    notes?: string;
    payload?: Record<string, unknown>;
  },
) {
  await supabase.from("driver_moderation_events").insert({
    driver_id: params.driverId,
    admin_id: params.adminId,
    action: params.action,
    notes: params.notes ?? null,
    payload: params.payload ?? {},
  });
}

export async function upsertBannedIdentifiers(
  supabase: SupabaseClient,
  params: {
    profileId: string;
    adminId: string;
    nationalId: string | null;
    licenseNumber: string | null;
    reason: string;
  },
) {
  const normalize = (raw: string | null) =>
    raw
      ? raw.toUpperCase().replace(/[^A-Z0-9]/g, "")
      : null;

  const nid = normalize(params.nationalId);
  const lid = normalize(params.licenseNumber);

  if (nid) {
    await supabase.from("banned_identifiers").upsert(
      {
        national_id_normalized: nid,
        banned_profile_id: params.profileId,
        banned_by: params.adminId,
        reason: params.reason,
      },
      { onConflict: "national_id_normalized" },
    );
  }
  if (lid) {
    await supabase.from("banned_identifiers").upsert(
      {
        license_number_normalized: lid,
        banned_profile_id: params.profileId,
        banned_by: params.adminId,
        reason: params.reason,
      },
      { onConflict: "license_number_normalized" },
    );
  }
}
