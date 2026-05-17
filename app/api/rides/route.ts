import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { haversineKm, routeBetween } from "@/lib/maps/osrm";
import { quoteFare } from "@/lib/pricing/fare";
import type { RideTier } from "@/lib/supabase/types";

export const runtime = "nodejs";

const Body = z.object({
  pickup: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
  drop: z.object({ lat: z.number(), lng: z.number(), address: z.string().optional() }),
  tierId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { pickup, drop, tierId } = parsed.data;

  const { data: tier, error: tierError } = await supabase
    .from("ride_tiers")
    .select("*")
    .eq("id", tierId)
    .eq("is_active", true)
    .maybeSingle<RideTier>();
  if (tierError || !tier) {
    return NextResponse.json({ error: "Tier not found" }, { status: 404 });
  }

  let distanceKm: number;
  let durationMin: number;
  try {
    const r = await routeBetween(pickup, drop);
    distanceKm = r.distanceKm;
    durationMin = r.durationMin;
  } catch {
    distanceKm = haversineKm(pickup, drop);
    durationMin = (distanceKm / 30) * 60;
  }

  const fare = quoteFare({ tier, distanceKm, durationMin });

  const { data: ride, error } = await supabase
    .from("rides")
    .insert({
      rider_id: user.id,
      tier_id: tier.id,
      status: "requested",
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      pickup_address: pickup.address ?? "",
      drop_lat: drop.lat,
      drop_lng: drop.lng,
      drop_address: drop.address ?? "",
      quoted_distance_km: distanceKm,
      quoted_duration_min: durationMin,
      fare_minor: fare.total_minor,
      currency: fare.currency,
      surge_multiplier: fare.surge,
    })
    .select("*")
    .single();

  if (error || !ride) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create ride" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ride });
}
