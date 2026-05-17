import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { RiderHome } from "@/components/rider/rider-home";
import type { RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RiderHomePage() {
  const { profile } = await requireRole("rider", "admin");
  const supabase = await createServerSupabaseClient();
  const { data: tiers } = await supabase
    .from("ride_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  return <RiderHome profile={profile!} tiers={(tiers ?? []) as RideTier[]} />;
}
