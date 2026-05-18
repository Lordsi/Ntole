import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { PricingEditor } from "@/components/admin/pricing-editor";
import type { RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("ride_tiers")
    .select("*")
    .order("sort_order");
  const tiers = (data ?? []) as RideTier[];

  return (
    <>
      <PageHeader
        title="Pricing"
        subtitle={`${tiers.length} active ride tier${tiers.length === 1 ? "" : "s"}. Changes apply immediately.`}
        icon="paid"
      />
      <PricingEditor tiers={tiers} />
    </>
  );
}
