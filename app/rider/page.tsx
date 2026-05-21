import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RiderHome } from "@/components/rider/rider-home";
import { buildUserNotifications } from "@/lib/notifications/user";
import type { Profile, Ride, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RiderHomePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let recentTrips: Pick<Ride, "id" | "drop_address" | "drop_lat" | "drop_lng">[] = [];
  let notifications: Awaited<ReturnType<typeof buildUserNotifications>> = [];
  if (user) {
    const [profileRes, recentRes, notifs] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle<Profile>(),
      supabase
        .from("rides")
        .select("id, drop_address, drop_lat, drop_lng")
        .eq("rider_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(6),
      buildUserNotifications(supabase, user.id, "rider"),
    ]);
    profile = profileRes.data ?? null;
    recentTrips = (recentRes.data ?? []) as typeof recentTrips;
    notifications = notifs;
  }

  // ride_tiers has a public RLS read policy for active tiers, so this works
  // for anonymous browsers too.
  const { data: tiers } = await supabase
    .from("ride_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <RiderHome
      profile={profile}
      tiers={(tiers ?? []) as RideTier[]}
      recentTrips={recentTrips}
      notifications={notifications}
    />
  );
}
