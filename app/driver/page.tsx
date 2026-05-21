import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { DriverHome } from "@/components/driver/driver-home";
import { buildUserNotifications } from "@/lib/notifications/user";
import type { Driver, RideTier, Vehicle } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverHomePage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    driverRes,
    vehicleRes,
    tiersRes,
    activeRideRes,
    todayRidesRes,
    notifications,
  ] = await Promise.all([
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
      .select("id, drop_address")
      .eq("driver_id", profile!.id)
      .in("status", ["accepted", "en_route_to_pickup", "in_progress"])
      .maybeSingle<{ id: string; drop_address: string | null }>(),
    supabase
      .from("rides")
      .select("fare_minor, currency")
      .eq("driver_id", profile!.id)
      .eq("status", "completed")
      .gte("completed_at", startOfDay.toISOString()),
    buildUserNotifications(supabase, profile!.id, "driver"),
  ]);

  const todayRides = todayRidesRes.data ?? [];
  const dailyEarningsMinor = todayRides.reduce(
    (sum, r) => sum + (r.fare_minor ?? 0),
    0,
  );
  const dailyEarningsCurrency = todayRides[0]?.currency ?? "MWK";

  return (
    <DriverHome
      profile={profile!}
      driver={driverRes.data}
      vehicle={vehicleRes.data}
      tiers={(tiersRes.data ?? []) as RideTier[]}
      activeRideId={activeRideRes.data?.id ?? null}
      activeRideDrop={activeRideRes.data?.drop_address ?? null}
      dailyEarningsMinor={dailyEarningsMinor}
      dailyEarningsCurrency={dailyEarningsCurrency}
      notifications={notifications}
    />
  );
}
