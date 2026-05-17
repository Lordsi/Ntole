import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { RiderRideView } from "@/components/rider/rider-ride-view";
import type { Ride, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RiderRidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole("rider", "admin");
  const supabase = await createServerSupabaseClient();

  const { data: ride } = await supabase
    .from("rides")
    .select("*")
    .eq("id", id)
    .maybeSingle<Ride>();
  if (!ride) notFound();
  if (ride.rider_id !== profile!.id && profile!.role !== "admin") redirect("/rider");

  const { data: tier } = await supabase
    .from("ride_tiers")
    .select("*")
    .eq("id", ride.tier_id)
    .single<RideTier>();

  return <RiderRideView initialRide={ride} tier={tier!} riderId={profile!.id} />;
}
