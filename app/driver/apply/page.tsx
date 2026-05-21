import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { DriverShell, RiderShell } from "@/components/shared/role-shell";
import { ApplicationWizard } from "@/components/driver/application-wizard";
import type { Driver, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverApplyPage() {
  const { profile } = await requireUser();
  if (!profile) {
    redirect("/login?next=/driver/apply");
  }

  const supabase = await createServerSupabaseClient();

  const [driverRes, tiersRes, vehicleRes] = await Promise.all([
    supabase
      .from("drivers")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle<Driver>(),
    supabase
      .from("ride_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("vehicles")
      .select("make, model, plate_number, color, seats, tier_id")
      .eq("driver_id", profile.id)
      .maybeSingle(),
  ]);

  const driver = driverRes.data;
  const vehicle = vehicleRes.data;

  // Already-approved drivers bounce straight to the dashboard — the
  // application is done, the wizard would only be confusing.
  if (driver?.approval_status === "approved") {
    redirect("/driver");
  }

  // Pick the chrome based on the user's *current* role. A rider applying
  // to drive should keep their rider nav (Home / Activity / Wallet /
  // Profile) so they have a sensible exit if they bail mid-application.
  // An existing driver / admin keeps the driver chrome.
  const isRiderApplicant = profile.role === "rider";
  const Shell = isRiderApplicant ? RiderShell : DriverShell;

  return (
    <Shell profile={profile}>
      <PageHeader
        title={isRiderApplicant ? "Apply to drive" : "Driver application"}
        subtitle={
          isRiderApplicant
            ? "Submit your details for review. We'll switch your account over and let you know once an admin approves."
            : "Complete your profile for admin review before you can go online."
        }
        icon="badge"
      />
      <ApplicationWizard
        profile={profile}
        driver={driver}
        tiers={(tiersRes.data ?? []) as RideTier[]}
        initialVehicle={vehicle}
      />
    </Shell>
  );
}
