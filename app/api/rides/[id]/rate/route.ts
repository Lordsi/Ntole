import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Ride } from "@/lib/supabase/types";

export const runtime = "nodejs";

const Body = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: ride } = await supabase
    .from("rides")
    .select("rider_id, driver_id, status")
    .eq("id", id)
    .maybeSingle<Pick<Ride, "rider_id" | "driver_id" | "status">>();
  if (!ride) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ride.status !== "completed") {
    return NextResponse.json({ error: "Ride is not complete" }, { status: 409 });
  }

  const isRider = ride.rider_id === user.id;
  const isDriver = ride.driver_id === user.id;
  if (!isRider && !isDriver) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ratee = isRider ? ride.driver_id : ride.rider_id;
  if (!ratee) return NextResponse.json({ error: "No partner" }, { status: 400 });

  const { error } = await supabase.from("ratings").insert({
    ride_id: id,
    rater_id: user.id,
    ratee_id: ratee,
    stars: parsed.data.stars,
    comment: parsed.data.comment ?? "",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
