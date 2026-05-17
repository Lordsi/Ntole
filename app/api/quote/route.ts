import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { haversineKm, routeBetween } from "@/lib/maps/osrm";
import { quoteFare } from "@/lib/pricing/fare";
import type { RideTier } from "@/lib/supabase/types";

export const runtime = "nodejs";

const Body = z.object({
  pickup: z.object({ lat: z.number(), lng: z.number() }),
  drop: z.object({ lat: z.number(), lng: z.number() }),
  /** If omitted, returns a quote for every active tier. */
  tierId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { pickup, drop, tierId } = parsed.data;

  const supabase = await createServerSupabaseClient();
  const tiersQuery = supabase
    .from("ride_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  const { data: tiers, error } = tierId
    ? await tiersQuery.eq("id", tierId)
    : await tiersQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!tiers || tiers.length === 0) {
    return NextResponse.json({ error: "No active tiers" }, { status: 404 });
  }

  let distanceKm: number;
  let durationMin: number;
  let polyline: string | null = null;
  let coordinates: [number, number][] = [];
  try {
    const route = await routeBetween(pickup, drop);
    distanceKm = route.distanceKm;
    durationMin = route.durationMin;
    polyline = route.polyline;
    coordinates = route.coordinates;
  } catch {
    // Fall back to crow-flies + 30 km/h average if OSRM is unreachable.
    distanceKm = haversineKm(pickup, drop);
    durationMin = (distanceKm / 30) * 60;
  }

  const quotes = (tiers as RideTier[]).map((tier) => ({
    tier,
    fare: quoteFare({ tier, distanceKm, durationMin }),
  }));

  return NextResponse.json({
    distanceKm,
    durationMin,
    polyline,
    coordinates,
    quotes,
  });
}
