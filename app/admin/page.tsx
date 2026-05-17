import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/format";
import { AdminLiveMap } from "@/components/admin/admin-live-map";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabaseClient();

  const [profilesRes, driversRes, ridesRes, paymentsRes] = await Promise.all([
    supabase.from("profiles").select("id, role"),
    supabase.from("drivers").select("status"),
    supabase
      .from("rides")
      .select("status, fare_minor, currency, requested_at")
      .order("requested_at", { ascending: false })
      .limit(500),
    supabase.from("payments").select("status, amount_minor, currency"),
  ]);

  const profiles = profilesRes.data ?? [];
  const drivers = driversRes.data ?? [];
  const rides = ridesRes.data ?? [];
  const payments = paymentsRes.data ?? [];

  const counts = {
    riders: profiles.filter((p) => p.role === "rider").length,
    drivers: profiles.filter((p) => p.role === "driver").length,
    onlineDrivers: drivers.filter((d) => d.status === "online").length,
    activeRides: rides.filter(
      (r) => !["completed", "cancelled"].includes(r.status),
    ).length,
    completedRides: rides.filter((r) => r.status === "completed").length,
  };

  const revenueByCurrency = payments
    .filter((p) => p.status === "paid")
    .reduce<Record<string, number>>((acc, p) => {
      acc[p.currency] = (acc[p.currency] ?? 0) + p.amount_minor;
      return acc;
    }, {});

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Stat label="Riders" value={counts.riders} />
        <Stat label="Drivers" value={counts.drivers} />
        <Stat label="Online drivers" value={counts.onlineDrivers} accent />
        <Stat label="Active rides" value={counts.activeRides} accent />
        <Stat label="Completed rides" value={counts.completedRides} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {Object.entries(revenueByCurrency).map(([currency, total]) => (
          <Card key={currency} className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted">
              Total revenue · {currency}
            </span>
            <span className="text-2xl font-semibold">
              {formatMoney(total, currency)}
            </span>
          </Card>
        ))}
        {Object.keys(revenueByCurrency).length === 0 && (
          <Card className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted">
              Revenue
            </span>
            <span className="text-sm">No paid trips yet.</span>
          </Card>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/5 px-4 py-3">
          <span className="text-sm font-semibold">Live driver map</span>
        </div>
        <div className="h-[420px]">
          <AdminLiveMap />
        </div>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card className="flex flex-col">
      <span className="text-xs uppercase tracking-wide text-muted">{label}</span>
      <span
        className={`text-3xl font-semibold ${accent ? "text-accent" : "text-white"}`}
      >
        {value}
      </span>
    </Card>
  );
}
