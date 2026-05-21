import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils/format";
import { AdminLiveMap } from "@/components/admin/admin-live-map";
import { MaterialIcon } from "@/components/ui/material-icon";

export const dynamic = "force-dynamic";

type RecentRide = {
  id: string;
  status: string;
  drop_address: string | null;
  rider: { full_name: string | null } | null;
};

type TopDriver = {
  full_name: string;
  trip_count: number;
  rating: number;
  revenue_minor: number;
  currency: string;
};

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabaseClient();

  const [profilesRes, driversRes, ridesRes, paymentsRes, recentRidesRes] =
    await Promise.all([
      supabase.from("profiles").select("id, role, full_name, rating, trip_count"),
      supabase.from("drivers").select("profile_id, status"),
      supabase
        .from("rides")
        .select("status, fare_minor, currency, requested_at, driver_id")
        .order("requested_at", { ascending: false })
        .limit(500),
      supabase
        .from("payments")
        .select("status, amount_minor, currency, driver_id"),
      supabase
        .from("rides")
        .select(
          "id, status, drop_address, rider:profiles!rides_rider_id_fkey(full_name)",
        )
        .order("requested_at", { ascending: false })
        .limit(8),
    ]);

  const profiles = profilesRes.data ?? [];
  const drivers = driversRes.data ?? [];
  const rides = ridesRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const recentRides = (recentRidesRes.data ?? []) as unknown as RecentRide[];

  const counts = {
    riders: profiles.filter((p) => p.role === "rider").length,
    drivers: profiles.filter((p) => p.role === "driver").length,
    onlineDrivers: drivers.filter((d) => d.status === "online").length,
    activeRides: rides.filter(
      (r) => !["completed", "cancelled"].includes(r.status),
    ).length,
    completedRides: rides.filter((r) => r.status === "completed").length,
  };

  // Revenue: sum paid payments by currency. We show the dominant currency (MWK)
  // in the headline KPI; full breakdown is in the chart card.
  const revenueByCurrency = payments
    .filter((p) => p.status === "paid")
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + p.amount_minor;
      return acc;
    }, {});
  const headlineCurrency =
    Object.keys(revenueByCurrency).sort(
      (a, b) => (revenueByCurrency[b] ?? 0) - (revenueByCurrency[a] ?? 0),
    )[0] ?? "MWK";
  const headlineRevenue = revenueByCurrency[headlineCurrency] ?? 0;

  // Top drivers leaderboard: aggregate completed rides + revenue per driver.
  const driverFromProfileId = new Map(
    profiles
      .filter((p) => p.role === "driver")
      .map((p) => [
        p.id,
        { full_name: p.full_name ?? "Driver", rating: p.rating ?? 5, trip_count: p.trip_count ?? 0 },
      ]),
  );
  const revenueByDriver = new Map<string, { minor: number; currency: string }>();
  for (const p of payments) {
    if (p.status !== "paid" || !p.driver_id) continue;
    const row = revenueByDriver.get(p.driver_id) ?? {
      minor: 0,
      currency: p.currency,
    };
    row.minor += p.amount_minor;
    revenueByDriver.set(p.driver_id, row);
  }
  const topDrivers: TopDriver[] = Array.from(revenueByDriver.entries())
    .map(([driverId, rev]) => {
      const d = driverFromProfileId.get(driverId);
      return {
        full_name: d?.full_name ?? "Driver",
        trip_count: d?.trip_count ?? 0,
        rating: d?.rating ?? 5,
        revenue_minor: rev.minor,
        currency: rev.currency,
      };
    })
    .sort((a, b) => b.revenue_minor - a.revenue_minor)
    .slice(0, 5);

  return (
    <>
      {/* Page header */}
      <div className="mb-xl">
        <h2 className="font-headline-lg text-headline-lg text-primary">
          Admin Overview
        </h2>
        <p className="text-on-surface-variant font-body-md">
          Real-time platform performance and operational metrics.
        </p>
      </div>

      {/* KPI Tiles Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
        <KpiTile
          icon="person"
          label="Active Riders"
          value={counts.riders.toString()}
          accent="primary"
          delta={`${counts.riders > 0 ? "+" : ""}${counts.riders}`}
        />
        <KpiTile
          icon="local_taxi"
          label="Online Drivers"
          value={counts.onlineDrivers.toString()}
          accent="tertiary"
          delta="Live"
        />
        <KpiTile
          icon="route"
          label="Active Rides"
          value={counts.activeRides.toString()}
          accent="primary-fixed"
          delta="Active"
        />
        <KpiTile
          icon="payments"
          label={`Revenue · ${headlineCurrency}`}
          value={formatShortMoney(headlineRevenue, headlineCurrency)}
          accent="primary"
          delta={`${counts.completedRides} trips`}
          highlighted
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Live Fleet Map */}
        <section className="lg:col-span-2 glass-panel rounded-lg overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-lg flex justify-between items-center border-b border-white/5">
            <h3 className="font-headline-md text-headline-md flex items-center gap-sm">
              <span className="w-3 h-3 rounded-full bg-primary-container animate-pulse" />
              Live Fleet Map
            </h3>
            <div className="flex gap-sm">
              <span className="px-md py-xs rounded-full bg-surface-container-highest text-label-sm font-label-sm">
                Lilongwe · Blantyre
              </span>
            </div>
          </div>
          <div className="flex-1 relative bg-[#0a0a0a]">
            <AdminLiveMap />
            {/* Map Overlay Stats */}
            <div className="absolute bottom-md left-md glass-panel p-md rounded-lg flex gap-lg pointer-events-none">
              <div className="text-center">
                <p className="text-label-sm font-label-sm text-on-surface-variant">
                  Available
                </p>
                <p className="font-headline-md text-headline-md text-primary-container">
                  {counts.onlineDrivers}
                </p>
              </div>
              <div className="text-center border-l border-white/10 pl-lg">
                <p className="text-label-sm font-label-sm text-on-surface-variant">
                  Active Rides
                </p>
                <p className="font-headline-md text-headline-md text-on-surface">
                  {counts.activeRides}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Revenue chart + recent rides stack */}
        <section className="space-y-lg">
          <RevenueChart
            currency={headlineCurrency}
            total={headlineRevenue}
            completed={counts.completedRides}
          />

          <div className="glass-panel rounded-lg flex-1">
            <div className="p-lg border-b border-white/5 flex justify-between items-center">
              <h3 className="font-headline-md text-headline-md">Latest Rides</h3>
              <Link
                href="/admin/rides"
                className="text-primary-container font-label-md text-label-md hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="overflow-y-auto max-h-[300px]">
              <table className="w-full text-left">
                <thead className="bg-surface-container-highest/50 sticky top-0">
                  <tr>
                    <th className="py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Rider
                    </th>
                    <th className="py-md px-lg font-label-sm text-label-sm text-on-surface-variant uppercase text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentRides.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-lg px-lg text-center text-label-sm font-label-sm text-on-surface-variant"
                      >
                        No rides yet.
                      </td>
                    </tr>
                  )}
                  {recentRides.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-md px-lg">
                        <p className="font-label-md text-label-md text-on-surface">
                          {r.rider?.full_name ?? "Rider"}
                        </p>
                        <p className="text-label-sm font-label-sm text-on-surface-variant opacity-60 line-clamp-1">
                          To {r.drop_address ?? "—"}
                        </p>
                      </td>
                      <td className="py-md px-lg text-right">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Asymmetric Detail Section */}
      <section className="mt-xl grid grid-cols-1 md:grid-cols-2 gap-lg">
        {/* Driver leaderboard */}
        <div className="glass-panel p-lg rounded-lg">
          <div className="flex justify-between items-center mb-lg">
            <h3 className="font-headline-md text-headline-md">
              Top Performing Drivers
            </h3>
            <MaterialIcon name="stars" className="text-primary-container" />
          </div>
          <div className="space-y-md">
            {topDrivers.length === 0 && (
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                No driver revenue yet.
              </p>
            )}
            {topDrivers.map((d, i) => {
              const top = i === 0;
              const initials = initialsOf(d.full_name);
              return (
                <div
                  key={d.full_name + i}
                  className={
                    top
                      ? "flex items-center justify-between p-md rounded-lg bg-surface-container-highest/30 border border-white/5"
                      : "flex items-center justify-between p-md rounded-lg hover:bg-surface-container-highest/20 transition-colors border border-transparent"
                  }
                >
                  <div className="flex items-center gap-md">
                    <div
                      className={
                        top
                          ? "w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center font-bold text-primary-container"
                          : "w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold"
                      }
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-label-md text-label-md">{d.full_name}</p>
                      <div className="flex items-center gap-xs">
                        <MaterialIcon
                          name="star"
                          filled
                          className="text-[14px] text-primary-container"
                        />
                        <span className="text-label-sm font-label-sm text-on-surface-variant">
                          {d.rating.toFixed(2)} · {d.trip_count} Rides
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        top
                          ? "font-label-md text-label-md text-primary-container"
                          : "font-label-md text-label-md"
                      }
                    >
                      {formatShortMoney(d.revenue_minor, d.currency)}
                    </p>
                    <p className="text-[10px] uppercase text-on-surface-variant tracking-widest">
                      Revenue
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick action bento */}
        <div className="grid grid-cols-2 gap-md">
          <Link
            href="/admin/users"
            className="glass-panel p-lg rounded-lg flex flex-col justify-between items-start hover:bg-primary-container/10 transition-all group border-primary-container/10"
          >
            <MaterialIcon
              name="add_circle"
              className="text-primary-container p-sm rounded-md bg-primary-container/10 group-hover:scale-110 transition-transform"
            />
            <div className="mt-xl">
              <p className="font-headline-md text-headline-md leading-tight">
                Onboard Driver
              </p>
              <p className="text-label-sm font-label-sm text-on-surface-variant">
                Add new partner
              </p>
            </div>
          </Link>
          <Link
            href="/admin/pricing"
            className="glass-panel p-lg rounded-lg flex flex-col justify-between items-start hover:bg-tertiary-container/10 transition-all group border-tertiary-container/10"
          >
            <MaterialIcon
              name="campaign"
              className="text-tertiary-container p-sm rounded-md bg-tertiary-container/10 group-hover:scale-110 transition-transform"
            />
            <div className="mt-xl">
              <p className="font-headline-md text-headline-md leading-tight">
                Pricing
              </p>
              <p className="text-label-sm font-label-sm text-on-surface-variant">
                Tune tiers & surge
              </p>
            </div>
          </Link>
          <Link
            href="/admin/rides"
            className="glass-panel p-lg rounded-lg flex flex-col justify-between items-start hover:bg-white/10 transition-all group col-span-2"
          >
            <div className="flex justify-between w-full">
              <MaterialIcon
                name="monitoring"
                className="text-on-surface p-sm rounded-md bg-surface-container-highest group-hover:scale-110 transition-transform"
              />
              <MaterialIcon
                name="arrow_forward"
                className="text-on-surface-variant"
              />
            </div>
            <div className="mt-lg">
              <p className="font-headline-md text-headline-md leading-tight">
                View Full Operational Report
              </p>
              <p className="text-label-sm font-label-sm text-on-surface-variant">
                Detailed breakdown of fleet performance and revenue trends.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* KPI tile                                                            */
/* ------------------------------------------------------------------ */

type KpiAccent = "primary" | "tertiary" | "primary-fixed";

function KpiTile({
  icon,
  label,
  value,
  delta,
  accent,
  highlighted,
}: {
  icon: string;
  label: string;
  value: string;
  delta: string;
  accent: KpiAccent;
  highlighted?: boolean;
}) {
  const accentClasses = {
    primary: "text-primary-container bg-primary-container/10",
    tertiary: "text-tertiary-fixed-dim bg-tertiary-fixed-dim/10",
    "primary-fixed": "text-primary-fixed-dim bg-primary-fixed-dim/10",
  };
  const deltaColor = {
    primary: "text-primary-container",
    tertiary: "text-tertiary-fixed-dim",
    "primary-fixed": "text-primary-fixed-dim",
  };
  return (
    <div
      className={
        highlighted
          ? "glass-panel p-lg rounded-lg border border-primary-container/25"
          : "glass-panel p-lg rounded-lg"
      }
    >
      <div className="flex justify-between items-start mb-md">
        <MaterialIcon
          name={icon}
          className={`p-sm rounded-md ${accentClasses[accent]}`}
        />
        <span className={`font-label-sm text-label-sm ${deltaColor[accent]}`}>
          {delta}
        </span>
      </div>
      <p className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
        {label}
      </p>
      <h3 className="font-headline-lg text-headline-lg text-on-surface mt-xs">
        {value}
      </h3>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Revenue mini chart                                                  */
/* ------------------------------------------------------------------ */

function RevenueChart({
  currency,
  total,
  completed,
}: {
  currency: string;
  total: number;
  completed: number;
}) {
  // Stable pseudo-distribution over a "weekly" silhouette. Replace with real
  // 7-day rollups when the analytics table is available — keeping the shape
  // matches the Stitch mock 1:1.
  const heights = [40, 60, 55, 80, 70, 90, 100];
  return (
    <div className="glass-panel p-lg rounded-lg flex flex-col h-[280px]">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h3 className="font-headline-md text-headline-md">Revenue</h3>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            {formatShortMoney(total, currency)} · {completed} trips
          </p>
        </div>
        <select className="bg-transparent border-none text-label-sm font-label-sm text-on-surface-variant focus:ring-0 cursor-pointer">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>
      <div className="flex-1 flex items-end gap-xs">
        {heights.map((h, i) => {
          const last = i === heights.length - 1;
          return (
            <div
              key={i}
              className={
                last
                  ? "flex-1 bg-primary-container/40 border-t-2 border-primary-container rounded-t-sm"
                  : "flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm"
              }
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-sm">
        <span className="text-label-sm font-label-sm text-on-surface-variant">
          Mon
        </span>
        <span className="text-label-sm font-label-sm text-on-surface-variant">
          Sun
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status badge for the recent-rides table                            */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; dot?: boolean }> = {
    requested: {
      bg: "bg-primary-container/10",
      text: "text-primary-container",
      dot: true,
    },
    accepted: {
      bg: "bg-tertiary-fixed-dim/10",
      text: "text-tertiary-fixed-dim",
    },
    en_route_to_pickup: {
      bg: "bg-tertiary-fixed-dim/10",
      text: "text-tertiary-fixed-dim",
    },
    in_progress: {
      bg: "bg-primary-fixed-dim/10",
      text: "text-primary-fixed-dim",
    },
    completed: {
      bg: "bg-on-surface-variant/10",
      text: "text-on-surface-variant",
    },
    cancelled: { bg: "bg-error/10", text: "text-error" },
  };
  const s = styles[status] ?? styles.completed;
  return (
    <span
      className={`px-sm py-xs rounded-full ${s.bg} ${s.text} text-[10px] font-bold uppercase tracking-tighter inline-flex items-center justify-end gap-xs`}
    >
      {s.dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
      )}
      {status.replaceAll("_", " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DR"
  );
}

/** Compact money: 850000 MWK → "MWK 850k", 120000 → "MWK 120k". */
function formatShortMoney(minor: number, currency: string) {
  const major = minor / 100;
  if (major >= 1_000_000)
    return `${currency} ${(major / 1_000_000).toFixed(1)}m`;
  if (major >= 1_000) return `${currency} ${Math.round(major / 1_000)}k`;
  return formatMoney(minor, currency);
}
