import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RiderHome } from "@/components/rider/rider-home";
import type { Profile, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RiderHomePage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>();
    profile = data ?? null;
  }

  // ride_tiers has a public RLS read policy for active tiers, so this works
  // for anonymous browsers too.
  const { data: tiers } = await supabase
    .from("ride_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return <RiderHome profile={profile} tiers={(tiers ?? []) as RideTier[]} />;
}
