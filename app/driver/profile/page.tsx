import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { ProfileStats } from "@/components/shared/profile-stats";
import { DriverShell } from "@/components/shared/role-shell";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { VehicleForm } from "@/components/driver/vehicle-form";
import type { Driver, RideTier, Vehicle } from "@/lib/supabase/types";
import { formatMoney } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface RideRow {
  status: string;
  actual_distance_km: number | null;
  quoted_distance_km: number;
  fare_minor: number;
  currency: string;
}

export default async function DriverProfilePage() {
  const { profile } = await requireRole("driver", "admin");
  if (!profile) return null;
  const supabase = await createServerSupabaseClient();

  const [driverRes, vehicleRes, tiersRes, ridesRes] = await Promise.all([
    supabase
      .from("drivers")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle<Driver>(),
    supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", profile.id)
      .maybeSingle<Vehicle>(),
    supabase
      .from("ride_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("rides")
      .select(
        "status, actual_distance_km, quoted_distance_km, fare_minor, currency",
      )
      .eq("driver_id", profile.id),
  ]);

  const rides = (ridesRes.data ?? []) as RideRow[];
  const completed = rides.filter((r) => r.status === "completed");
  const completedKm = completed.reduce(
    (acc, r) => acc + (r.actual_distance_km ?? r.quoted_distance_km ?? 0),
    0,
  );
  const earningsByCurrency = completed.reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.currency] = (acc[r.currency] ?? 0) + r.fare_minor;
      return acc;
    },
    {},
  );
  const headlineCurrency =
    Object.keys(earningsByCurrency).sort(
      (a, b) => (earningsByCurrency[b] ?? 0) - (earningsByCurrency[a] ?? 0),
    )[0] ?? "MWK";
  const headlineEarnings = earningsByCurrency[headlineCurrency] ?? 0;

  return (
    <DriverShell profile={profile}>
      <PageHeader title="Profile" subtitle="Account, vehicle, and stats." />

      <section className="mb-lg">
        <ProfileStats
          stats={[
            {
              icon: "route",
              label: "Trips",
              value: completed.length.toString(),
              hint: "Completed",
            },
            {
              icon: "speed",
              label: "Miles",
              value: kmToMiles(completedKm).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              }),
              hint: `${completedKm.toFixed(1)} km`,
            },
            {
              icon: "star",
              label: "Rating",
              value: profile.rating.toFixed(2),
              hint: "Out of 5.00",
            },
            {
              icon: "payments",
              label: "Earnings",
              value: formatMoney(headlineEarnings, headlineCurrency),
              hint: "Lifetime",
            },
          ]}
        />
      </section>

      <section className="mb-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Account
        </h2>
        <ProfileForm profile={profile} redirectAfterDelete="/login" />
      </section>

      <section className="mb-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Vehicle
        </h2>
        <VehicleForm
          driverId={profile.id}
          vehicle={vehicleRes.data ?? null}
          tiers={(tiersRes.data ?? []) as RideTier[]}
          approvalStatus={driverRes.data?.approval_status ?? "draft"}
          assignedTierId={driverRes.data?.admin_assigned_tier_id}
          requestedTierId={driverRes.data?.requested_tier_id}
        />
      </section>

      <section className="mb-lg">
        <SignOutButton />
      </section>
    </DriverShell>
  );
}

function kmToMiles(km: number) {
  return km * 0.621371;
}
