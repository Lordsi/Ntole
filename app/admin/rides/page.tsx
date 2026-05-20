import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { formatMoney } from "@/lib/utils/format";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUSES = [
  "all",
  "requested",
  "accepted",
  "en_route_to_pickup",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const STATUS_TINT: Record<string, string> = {
  completed:
    "bg-primary-container/15 text-primary-container ring-primary-container/30",
  cancelled: "bg-error/15 text-error ring-error/30",
  in_progress:
    "bg-secondary-container/20 text-secondary-container ring-secondary-container/30",
  accepted:
    "bg-secondary-container/20 text-secondary-container ring-secondary-container/30",
  en_route_to_pickup:
    "bg-secondary-container/20 text-secondary-container ring-secondary-container/30",
  requested:
    "bg-white/[0.05] text-on-surface-variant ring-white/[0.08]",
};

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

  const rides = (data ?? []) as Ride[];

  return (
    <>
      <PageHeader
        title="Rides"
        subtitle={`${rides.length} ride${rides.length === 1 ? "" : "s"}${status ? ` · ${status.replace(/_/g, " ")}` : ""}`}
        icon="route"
      />

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-xs mb-md">
        {STATUSES.map((s) => {
          const href = s === "all" ? "/admin/rides" : `/admin/rides?status=${s}`;
          const active = (status ?? "all") === s;
          return (
            <Link
              key={s}
              href={href}
              className={`px-md py-xs rounded-full font-label-sm text-label-sm uppercase tracking-[0.12em] ring-1 transition-colors ${
                active
                  ? "bg-primary-container text-on-primary-container ring-primary-container shadow-glow"
                  : "bg-surface-container-low text-on-surface-variant ring-white/[0.08] hover:text-on-surface hover:bg-surface-container-high"
              }`}
            >
              {s.replace(/_/g, " ")}
            </Link>
          );
        })}
      </div>

      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] font-body-md text-body-md">
          <thead>
            <tr className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm uppercase tracking-[0.12em]">
              <th className="px-md py-sm text-left">When</th>
              <th className="px-md py-sm text-left">From</th>
              <th className="px-md py-sm text-left">To</th>
              <th className="px-md py-sm text-left">Status</th>
              <th className="px-md py-sm text-right">Fare</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((r) => {
              const tint =
                STATUS_TINT[r.status] ??
                "bg-white/[0.05] text-on-surface-variant ring-white/[0.08]";
              return (
                <tr
                  key={r.id}
                  className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-md py-md font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">
                    {new Date(r.requested_at).toLocaleString()}
                  </td>
                  <td className="px-md py-md text-on-surface max-w-[260px] truncate">
                    {r.pickup_address || "—"}
                  </td>
                  <td className="px-md py-md text-on-surface max-w-[260px] truncate">
                    {r.drop_address || "—"}
                  </td>
                  <td className="px-md py-md">
                    <span
                      className={`inline-flex items-center rounded-full px-sm py-0.5 font-label-sm text-label-sm uppercase tracking-[0.12em] ring-1 ${tint}`}
                    >
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-md py-md text-right font-label-md text-label-md font-bold text-on-surface">
                    {formatMoney(r.fare_minor, r.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
