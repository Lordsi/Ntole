import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { ProfileStats } from "@/components/shared/profile-stats";
import { RiderShell } from "@/components/shared/role-shell";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { FavoriteDriversList } from "@/components/rider/favorite-drivers-list";
import type { FavoriteDriverRow } from "@/components/rider/favorite-drivers-list";

export const dynamic = "force-dynamic";

interface RideRow {
  status: string;
  actual_distance_km: number | null;
  quoted_distance_km: number;
}

interface FavoriteRow {
  driver_id: string;
  driver:
    | {
        full_name: string | null;
        avatar_url: string | null;
        rating: number;
        trip_count: number;
      }
    | null;
}

export default async function RiderProfilePage() {
  const { profile } = await requireRole("rider", "admin");
  if (!profile) return null;

  const supabase = await createServerSupabaseClient();

  const [ridesRes, favoritesRes] = await Promise.all([
    supabase
      .from("rides")
      .select("status, actual_distance_km, quoted_distance_km")
      .eq("rider_id", profile.id),
    supabase
      .from("favorite_drivers")
      .select(
        "driver_id, driver:profiles!favorite_drivers_driver_id_fkey(full_name, avatar_url, rating, trip_count)",
      )
      .eq("rider_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const rides = (ridesRes.data ?? []) as RideRow[];
  const completedKm = rides
    .filter((r) => r.status === "completed")
    .reduce(
      (acc, r) => acc + (r.actual_distance_km ?? r.quoted_distance_km ?? 0),
      0,
    );
  const completedRides = rides.filter((r) => r.status === "completed").length;

  const favorites: FavoriteDriverRow[] = (
    (favoritesRes.data ?? []) as unknown as FavoriteRow[]
  )
    .filter((row) => row.driver != null)
    .map((row) => ({
      driver_id: row.driver_id,
      full_name: row.driver!.full_name,
      avatar_url: row.driver!.avatar_url,
      rating: row.driver!.rating,
      trip_count: row.driver!.trip_count,
    }));

  return (
    <RiderShell profile={profile}>
      <PageHeader
        title="Profile"
        subtitle="Account details, history, and favorites."
      />

      <section className="mb-lg">
        <ProfileStats
          stats={[
            {
              icon: "route",
              label: "Trips",
              value: completedRides.toString(),
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
          ]}
        />
      </section>

      <section className="mb-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Account
        </h2>
        <ProfileForm profile={profile} redirectAfterDelete="/rider" />
      </section>

      <section className="mb-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Favorite drivers
        </h2>
        <FavoriteDriversList riderId={profile.id} initialFavorites={favorites} />
      </section>

      <section className="mb-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Shortcuts
        </h2>
        <Link
          href="/rider/history"
          className="glass-panel rounded-md p-md flex items-center justify-between gap-md transition-colors hover:bg-white/5"
        >
          <span className="flex items-center gap-md">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container/10 text-primary-container">
              <MaterialIcon name="history" />
            </span>
            <span className="flex flex-col">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                Trip history
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                View past rides and receipts
              </span>
            </span>
          </span>
          <MaterialIcon
            name="chevron_right"
            className="text-on-surface-variant"
          />
        </Link>
      </section>

      <section className="mb-lg">
        <SignOutButton />
      </section>
    </RiderShell>
  );
}

function kmToMiles(km: number) {
  return km * 0.621371;
}
