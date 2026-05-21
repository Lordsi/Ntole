import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { DriverShell } from "@/components/shared/role-shell";
import { ApplicationWizard } from "@/components/driver/application-wizard";
import type { Driver, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverApplyPage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const [driverRes, tiersRes, vehicleRes] = await Promise.all([
    supabase
      .from("drivers")
      .select("*")
      .eq("profile_id", profile!.id)
      .maybeSingle<Driver>(),
    supabase
      .from("ride_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("vehicles")
      .select("make, model, plate_number, color, seats, tier_id")
      .eq("driver_id", profile!.id)
      .maybeSingle(),
  ]);

  const driver = driverRes.data;
  const vehicle = vehicleRes.data;

  return (
    <DriverShell profile={profile!}>
      <PageHeader
        title="Driver application"
        subtitle="Complete your profile for admin review before you can go online."
        icon="badge"
      />
      <ApplicationWizard
        profile={profile!}
        driver={driver}
        tiers={(tiersRes.data ?? []) as RideTier[]}
        initialVehicle={vehicle}
      />
    </DriverShell>
  );
}
