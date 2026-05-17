import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PricingEditor } from "@/components/admin/pricing-editor";
import type { RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("ride_tiers")
    .select("*")
    .order("sort_order");
  return <PricingEditor tiers={(data ?? []) as RideTier[]} />;
}
