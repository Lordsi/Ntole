import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { DriverShell } from "@/components/shared/role-shell";
import { formatMoney } from "@/lib/utils/format";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverEarningsPage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();
  const { data: rides } = await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", profile!.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const list = (rides ?? []) as Ride[];
  const total = list.reduce((sum, r) => sum + r.fare_minor, 0);
  const currency = list[0]?.currency ?? "MWK";

  return (
    <DriverShell profile={profile}>
      <PageHeader
        title="Rides"
        subtitle="Completed trips and lifetime payouts."
        icon="directions_car"
      />

      {/* Hero total tile — primary container so it reads as a money-positive
          surface. Mirrors the "GO ONLINE" hero card visually. */}
      <section className="glass-panel rounded-lg p-lg flex flex-col items-center text-center gap-xs border border-primary-container/15">
        <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Total Earned
        </span>
        <span className="font-display-lg text-display-lg font-extrabold text-primary-container">
          {formatMoney(total, currency)}
        </span>
        <span className="font-label-md text-label-md text-on-surface-variant">
          {list.length} completed trip{list.length === 1 ? "" : "s"}
        </span>
      </section>

      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Recent rides
        </h2>

        {list.length === 0 ? (
          <div className="glass-panel rounded-md p-lg flex flex-col items-center text-center gap-sm">
            <MaterialIcon
              name="route"
              className="text-on-surface-variant text-[40px]"
            />
            <p className="font-body-md text-body-md text-on-surface-variant">
              No completed rides yet. Go online to start earning.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-sm">
            {list.map((r) => (
              <li
                key={r.id}
                className="glass-panel rounded-md p-md flex items-center justify-between gap-md"
              >
                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    {r.drop_address || "Trip"}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {new Date(
                      r.completed_at ?? r.requested_at,
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className="font-label-md text-label-md font-bold text-primary-container">
                  {formatMoney(r.fare_minor, r.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DriverShell>
  );
}
