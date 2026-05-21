import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Today's completed-trip earnings for the signed-in driver. */
export async function GET() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("rides")
    .select("fare_minor, currency, completed_at")
    .eq("driver_id", profile!.id)
    .eq("status", "completed")
    .gte("completed_at", startOfDay.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rides = data ?? [];
  const total_minor = rides.reduce((sum, r) => sum + (r.fare_minor ?? 0), 0);
  const currency = rides[0]?.currency ?? "MWK";

  return NextResponse.json({
    total_minor,
    currency,
    trip_count: rides.length,
  });
}
