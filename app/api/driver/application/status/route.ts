import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import type { Driver } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();
  const { data: driver, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", profile!.id)
    .maybeSingle<Driver>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!driver) {
    return NextResponse.json({
      approval_status: "draft",
      is_verified: false,
      rejection_reason: null,
      ban_reason: null,
    });
  }

  return NextResponse.json({
    approval_status: driver.approval_status,
    is_verified: driver.is_verified,
    rejection_reason: driver.rejection_reason,
    ban_reason: driver.ban_reason,
    admin_assigned_tier_id: driver.admin_assigned_tier_id,
    requested_tier_id: driver.requested_tier_id,
  });
}
