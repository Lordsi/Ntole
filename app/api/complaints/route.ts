import { NextResponse } from "next/server";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ComplaintBody = z.object({
  subjectDriverId: z.string().uuid(),
  rideId: z.string().uuid().optional(),
  category: z.enum(["safety", "behavior", "vehicle", "other"]),
  body: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const { profile } = await requireRole("rider", "admin");
  const parsed = ComplaintBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (parsed.data.rideId) {
    const { data: ride } = await supabase
      .from("rides")
      .select("id, rider_id, driver_id, status")
      .eq("id", parsed.data.rideId)
      .maybeSingle();

    if (!ride || ride.rider_id !== profile!.id) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }
    if (ride.driver_id !== parsed.data.subjectDriverId) {
      return NextResponse.json(
        { error: "Driver does not match this ride" },
        { status: 400 },
      );
    }
    if (ride.status !== "completed") {
      return NextResponse.json(
        { error: "Complaints can only be filed for completed rides" },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("complaints")
    .insert({
      reporter_id: profile!.id,
      subject_driver_id: parsed.data.subjectDriverId,
      ride_id: parsed.data.rideId ?? null,
      category: parsed.data.category,
      body: parsed.data.body.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
