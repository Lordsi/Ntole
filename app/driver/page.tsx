import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { DriverHome } from "@/components/driver/driver-home";
import { buildUserNotifications } from "@/lib/notifications/user";
import type { Driver, RideTier, Vehicle } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverHomePage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const [driverRes, vehicleRes, tiersRes, activeRideRes, notifs] = await Promise.all([
    supabase
      .from("drivers")
      .select("*")
      .eq("profile_id", profile!.id)
      .maybeSingle<Driver>(),
    supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", profile!.id)
      .maybeSingle<Vehicle>(),
    supabase
      .from("ride_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("rides")
      .select("id")
      .eq("driver_id", profile!.id)
      .in("status", ["accepted", "en_route_to_pickup", "in_progress"])
      .maybeSingle<{ id: string }>(),
    buildUserNotifications(supabase, profile!.id, "driver"),
  ]);

  return (
    <DriverHome
      profile={profile!}
      driver={driverRes.data}
      vehicle={vehicleRes.data}
      tiers={(tiersRes.data ?? []) as RideTier[]}
      activeRideId={activeRideRes.data?.id ?? null}
      notifications={notifs}
    />
  );
}
