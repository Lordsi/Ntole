import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { ProfileStats } from "@/components/shared/profile-stats";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { formatMoney } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

interface RideRow {
  status: string;
  actual_distance_km: number | null;
  quoted_distance_km: number;
  fare_minor: number;
  currency: string;
}

interface ProfileRow {
  role: string;
}

export default async function AdminProfilePage() {
  const { profile } = await requireRole("admin");
  if (!profile) return null;

  const supabase = await createServerSupabaseClient();

  const [ridesRes, profilesRes] = await Promise.all([
    supabase
      .from("rides")
      .select(
        "status, actual_distance_km, quoted_distance_km, fare_minor, currency",
      )
      .limit(5000),
    supabase.from("profiles").select("role"),
  ]);

  const rides = (ridesRes.data ?? []) as RideRow[];
  const completed = rides.filter((r) => r.status === "completed");
  const totalKm = completed.reduce(
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
  const headlineRevenue = earningsByCurrency[headlineCurrency] ?? 0;
  const allProfiles = (profilesRes.data ?? []) as ProfileRow[];

  return (
    <>
      <PageHeader title="My Profile" subtitle="Personal admin account." />

      <section className="glass-panel rounded-md p-md flex items-center gap-md mb-lg">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={72} />
        <div className="flex flex-col">
          <span className="font-headline-md text-headline-md text-on-surface">
            {profile.full_name || "Admin"}
          </span>
          <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-primary-container inline-flex items-center gap-xs">
            <MaterialIcon
              name="verified"
              filled
              className="text-[16px] text-primary-container"
            />
            Administrator
          </span>
          {profile.phone && (
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              {profile.phone}
            </span>
          )}
        </div>
      </section>

      <section className="mb-lg">
        <ProfileStats
          stats={[
            {
              icon: "group",
              label: "Users",
              value: allProfiles.length.toString(),
              hint: "Total accounts",
            },
            {
              icon: "route",
              label: "Trips",
              value: completed.length.toString(),
              hint: "Completed",
            },
            {
              icon: "speed",
              label: "Miles",
              value: kmToMiles(totalKm).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              }),
              hint: `${totalKm.toFixed(1)} km`,
            },
            {
              icon: "payments",
              label: "Revenue",
              value: formatMoney(headlineRevenue, headlineCurrency),
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
        <SignOutButton />
      </section>
    </>
  );
}

function kmToMiles(km: number) {
  return km * 0.621371;
}
