import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { DriverRideView } from "@/components/driver/driver-ride-view";
import type { Profile, Ride, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverRidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const { data: ride } = await supabase
    .from("rides")
    .select("*")
    .eq("id", id)
    .maybeSingle<Ride>();
  if (!ride) notFound();
  if (ride.driver_id !== profile!.id && profile!.role !== "admin") {
    redirect("/driver");
  }

  const [tierRes, riderRes] = await Promise.all([
    supabase
      .from("ride_tiers")
      .select("*")
      .eq("id", ride.tier_id)
      .single<RideTier>(),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", ride.rider_id)
      .single<Profile>(),
  ]);

  return (
    <DriverRideView
      initialRide={ride}
      tier={tierRes.data!}
      rider={riderRes.data!}
      driverId={profile!.id}
    />
  );
}
