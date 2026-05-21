import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileStats } from "@/components/shared/profile-stats";
import { RiderShell } from "@/components/shared/role-shell";
import { FavoriteDriverToggle } from "@/components/rider/favorite-driver-toggle";
import {
  formatDistance,
  formatDuration,
  formatMoney,
} from "@/lib/utils/format";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TINT: Record<string, string> = {
  completed: "text-primary-container",
  cancelled: "text-error",
  in_progress: "text-secondary-container",
  driver_assigned: "text-secondary-container",
  driver_arriving: "text-secondary-container",
  arrived_pickup: "text-secondary-container",
  searching: "text-on-surface-variant",
  requested: "text-on-surface-variant",
};

export default async function RiderHistoryPage() {
  const { profile } = await requireRole("rider", "admin");
  if (!profile) return null;
  const supabase = await createServerSupabaseClient();

  const [ridesRes, favoritesRes] = await Promise.all([
    supabase
      .from("rides")
      .select("*")
      .eq("rider_id", profile.id)
      .order("requested_at", { ascending: false })
      .limit(50),
    supabase
      .from("favorite_drivers")
      .select("driver_id")
      .eq("rider_id", profile.id),
  ]);

  const list = (ridesRes.data ?? []) as Ride[];
  const favoriteIds = new Set(
    ((favoritesRes.data ?? []) as { driver_id: string }[]).map(
      (r) => r.driver_id,
    ),
  );

  const completed = list.filter((r) => r.status === "completed");
  const totalKm = completed.reduce(
    (acc, r) => acc + (r.actual_distance_km ?? r.quoted_distance_km ?? 0),
    0,
  );

  return (
    <RiderShell profile={profile}>
      <PageHeader
        title="Activity"
        subtitle={`${list.length} ride${list.length === 1 ? "" : "s"}`}
        icon="history"
      />

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
              value: kmToMiles(totalKm).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              }),
              hint: `${totalKm.toFixed(1)} km`,
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

      {list.length === 0 ? (
        <div className="glass-panel rounded-md p-lg flex flex-col items-center text-center gap-sm">
          <MaterialIcon
            name="route"
            className="text-on-surface-variant text-[40px]"
          />
          <p className="font-body-md text-body-md text-on-surface-variant">
            No trips yet — your first ride will show up here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-sm">
          {list.map((ride) => (
            <li key={ride.id} className="relative">
              <Link
                href={`/rider/ride/${ride.id}`}
                className="glass-panel rounded-md p-md flex items-center gap-md transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container/10 text-primary-container">
                  <MaterialIcon name="location_on" />
                </span>
                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    {ride.drop_address || "Trip"}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {new Date(ride.requested_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ·{" "}
                    {formatDistance(
                      ride.actual_distance_km ?? ride.quoted_distance_km,
                    )}{" "}
                    ·{" "}
                    {formatDuration(
                      ride.actual_duration_min ?? ride.quoted_duration_min,
                    )}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm uppercase tracking-[0.12em] mt-1 ${
                      STATUS_TINT[ride.status] ?? "text-on-surface-variant"
                    }`}
                  >
                    {ride.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-xs shrink-0">
                  <span className="font-label-md text-label-md font-bold text-on-surface">
                    {formatMoney(ride.fare_minor, ride.currency)}
                  </span>
                  {ride.status === "completed" && ride.driver_id && (
                    <FavoriteDriverToggle
                      riderId={profile.id}
                      driverId={ride.driver_id}
                      initialFavorited={favoriteIds.has(ride.driver_id)}
                    />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RiderShell>
  );
}

function kmToMiles(km: number) {
  return km * 0.621371;
}
