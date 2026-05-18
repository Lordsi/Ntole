import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import type { Driver, Profile, Vehicle } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TINT: Record<string, string> = {
  online:
    "bg-primary-container/15 text-primary-container ring-primary-container/30",
  on_trip:
    "bg-secondary-container/20 text-secondary-container ring-secondary-container/30",
  offline: "bg-white/[0.05] text-on-surface-variant ring-white/[0.08]",
};

export default async function AdminDriversPage() {
  const supabase = await createServerSupabaseClient();
  const { data: drivers } = await supabase
    .from("drivers")
    .select("*")
    .order("last_seen_at", { ascending: false, nullsFirst: false });

  const ids = (drivers ?? []).map((d) => d.profile_id);
  const vehIds = (drivers ?? [])
    .map((d) => d.vehicle_id)
    .filter((x): x is string => Boolean(x));

  const [profilesRes, vehiclesRes] = await Promise.all([
    ids.length > 0
      ? supabase.from("profiles").select("*").in("id", ids)
      : Promise.resolve({ data: [] as Profile[] }),
    vehIds.length > 0
      ? supabase.from("vehicles").select("*").in("id", vehIds)
      : Promise.resolve({ data: [] as Vehicle[] }),
  ]);

  const profileMap = new Map(
    ((profilesRes.data ?? []) as Profile[]).map((p) => [p.id, p]),
  );
  const vehicleMap = new Map(
    ((vehiclesRes.data ?? []) as Vehicle[]).map((v) => [v.id, v]),
  );

  const list = (drivers ?? []) as Driver[];

  return (
    <>
      <PageHeader
        title="Drivers"
        subtitle={`${list.length} driver accounts on the platform`}
        icon="directions_car"
      />

      <div className="glass-panel rounded-lg overflow-hidden">
        <table className="w-full font-body-md text-body-md">
          <thead>
            <tr className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm uppercase tracking-[0.12em]">
              <th className="px-md py-sm text-left">Driver</th>
              <th className="px-md py-sm text-left">Vehicle</th>
              <th className="px-md py-sm text-left">Status</th>
              <th className="px-md py-sm text-left">Verified</th>
              <th className="px-md py-sm text-left">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => {
              const p = profileMap.get(d.profile_id);
              const v = d.vehicle_id ? vehicleMap.get(d.vehicle_id) : null;
              const tint =
                STATUS_TINT[d.status] ?? STATUS_TINT.offline;
              return (
                <tr
                  key={d.profile_id}
                  className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-md py-md">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">
                        {p?.full_name || "—"}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {p?.phone || "no phone"}
                      </span>
                    </div>
                  </td>
                  <td className="px-md py-md">
                    {v ? (
                      <div className="flex flex-col">
                        <span className="text-on-surface">
                          {v.make} {v.model}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {v.plate_number}
                        </span>
                      </div>
                    ) : (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        No vehicle
                      </span>
                    )}
                  </td>
                  <td className="px-md py-md">
                    <span
                      className={`inline-flex items-center rounded-full px-sm py-0.5 font-label-sm text-label-sm uppercase tracking-[0.12em] ring-1 ${tint}`}
                    >
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-md py-md text-on-surface">
                    {d.is_verified ? "Yes" : "No"}
                  </td>
                  <td className="px-md py-md font-label-sm text-label-sm text-on-surface-variant">
                    {d.last_seen_at
                      ? new Date(d.last_seen_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
