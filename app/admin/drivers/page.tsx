import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import type { Driver, Profile, Vehicle } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

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

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 text-left">Driver</th>
            <th className="px-4 py-3 text-left">Vehicle</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Verified</th>
            <th className="px-4 py-3 text-left">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {((drivers ?? []) as Driver[]).map((d) => {
            const p = profileMap.get(d.profile_id);
            const v = d.vehicle_id ? vehicleMap.get(d.vehicle_id) : null;
            return (
              <tr key={d.profile_id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {p?.full_name || "—"}
                    </span>
                    <span className="text-xs text-muted">{p?.phone}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {v ? (
                    <div className="flex flex-col">
                      <span>
                        {v.make} {v.model}
                      </span>
                      <span className="text-xs text-muted">
                        {v.plate_number}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">No vehicle</span>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{d.status}</td>
                <td className="px-4 py-3">{d.is_verified ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-xs text-muted">
                  {d.last_seen_at
                    ? new Date(d.last_seen_at).toLocaleString()
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
