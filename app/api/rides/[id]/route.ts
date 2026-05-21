import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { quoteFare } from "@/lib/pricing/fare";
import type { Ride, RideStatus, RideTier } from "@/lib/supabase/types";

export const runtime = "nodejs";

const PatchBody = z.object({
  action: z.enum([
    "accept",
    "arrive",
    "start",
    "complete",
    "cancel",
  ]),
  reason: z.string().optional(),
  actualDistanceKm: z.number().optional(),
  actualDurationMin: z.number().optional(),
});

const TARGET_STATUS: Record<
  z.infer<typeof PatchBody>["action"],
  RideStatus
> = {
  accept: "accepted",
  arrive: "en_route_to_pickup",
  start: "in_progress",
  complete: "completed",
  cancel: "cancelled",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: ride, error } = await supabase
    .from("rides")
    .select("*")
    .eq("id", id)
    .maybeSingle<Ride>();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!ride) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ride });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = PatchBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { action, reason, actualDistanceKm, actualDurationMin } = body.data;

  // Accept uses the SECURITY DEFINER RPC for atomicity across drivers.
  if (action === "accept") {
    const { data: ok, error } = await supabase.rpc("accept_ride", { ride: id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!ok) {
      return NextResponse.json(
        { error: "This ride is no longer available" },
        { status: 409 },
      );
    }
    const { data: ride } = await supabase
      .from("rides")
      .select("*")
      .eq("id", id)
      .single<Ride>();
    return NextResponse.json({ ride });
  }

  const patch: Partial<Ride> & Record<string, unknown> = {
    status: TARGET_STATUS[action],
  };
  const now = new Date().toISOString();

  if (action === "arrive") patch.arrived_at = now;
  if (action === "start") patch.started_at = now;
  if (action === "cancel") {
    patch.cancelled_at = now;
    patch.cancelled_by = user.id;
    if (reason) patch.cancellation_reason = reason;
    // Free the driver up so they can accept new requests. Without this
    // a driver who cancels mid-trip stays stuck in `on_trip` and won't
    // see incoming ride requests until they manually toggle offline /
    // online.
    await supabase
      .from("drivers")
      .update({ status: "online" })
      .eq("profile_id", user.id);
  }
  if (action === "complete") {
    patch.completed_at = now;
    if (actualDistanceKm != null) patch.actual_distance_km = actualDistanceKm;
    if (actualDurationMin != null) patch.actual_duration_min = actualDurationMin;

    // Recompute the final fare from actual distance/duration if provided.
    if (actualDistanceKm != null && actualDurationMin != null) {
      const { data: ride } = await supabase
        .from("rides")
        .select("tier_id, surge_multiplier")
        .eq("id", id)
        .single<Pick<Ride, "tier_id" | "surge_multiplier">>();
      if (ride) {
        const { data: tier } = await supabase
          .from("ride_tiers")
          .select("*")
          .eq("id", ride.tier_id)
          .single<RideTier>();
        if (tier) {
          const fare = quoteFare({
            tier,
            distanceKm: actualDistanceKm,
            durationMin: actualDurationMin,
            surge: ride.surge_multiplier,
          });
          patch.fare_minor = fare.total_minor;
          patch.currency = fare.currency;
        }
      }
    }

    // Mark driver available again.
    await supabase
      .from("drivers")
      .update({ status: "online" })
      .eq("profile_id", user.id);
  }

  const { data: updated, error } = await supabase
    .from("rides")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single<Ride>();
  if (error || !updated) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ride: updated });
}
