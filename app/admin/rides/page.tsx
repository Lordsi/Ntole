import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/format";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminRidesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("rides")
    .select("*")
    .order("requested_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data } = await query;

  const STATUSES = [
    "all",
    "requested",
    "accepted",
    "en_route_to_pickup",
    "in_progress",
    "completed",
    "cancelled",
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const href = s === "all" ? "/admin/rides" : `/admin/rides?status=${s}`;
          const active = (status ?? "all") === s;
          return (
            <a
              key={s}
              href={href}
              className={`rounded-pill px-3 py-1 text-xs ${
                active ? "bg-accent text-background" : "bg-surface text-muted-strong"
              }`}
            >
              {s.replace(/_/g, " ")}
            </a>
          );
        })}
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 text-left">When</th>
              <th className="px-4 py-3 text-left">From</th>
              <th className="px-4 py-3 text-left">To</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Fare</th>
            </tr>
          </thead>
          <tbody>
            {((data ?? []) as Ride[]).map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(r.requested_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">{r.pickup_address || "—"}</td>
                <td className="px-4 py-3">{r.drop_address || "—"}</td>
                <td className="px-4 py-3 capitalize">
                  {r.status.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatMoney(r.fare_minor, r.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
