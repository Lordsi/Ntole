import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { RiderShell } from "@/components/shared/role-shell";
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
  const supabase = await createServerSupabaseClient();
  const { data: rides } = await supabase
    .from("rides")
    .select("*")
    .eq("rider_id", profile!.id)
    .order("requested_at", { ascending: false })
    .limit(50);

  const list = (rides ?? []) as Ride[];

  return (
    <RiderShell profile={profile}>
      <PageHeader
        title="Activity"
        subtitle={`${list.length} ride${list.length === 1 ? "" : "s"}`}
        icon="history"
      />

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
            <li key={ride.id}>
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
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  {formatMoney(ride.fare_minor, ride.currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RiderShell>
  );
}
