import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { driverDisplayRating } from "@/lib/supabase/types";
import type { Driver, DriverApprovalStatus, Profile, Vehicle } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TINT: Record<string, string> = {
  online:
    "bg-primary-container/15 text-primary-container ring-primary-container/30",
  on_trip:
    "bg-secondary-container/20 text-secondary-container ring-secondary-container/30",
  offline: "bg-white/[0.05] text-on-surface-variant ring-white/[0.08]",
};

const APPROVAL_TINT: Record<DriverApprovalStatus, string> = {
  approved: "text-primary-container",
  submitted: "text-secondary-container",
  draft: "text-on-surface-variant",
  rejected: "text-error",
  banned: "text-error",
};

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function AdminDriversPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase.from("drivers").select("*");
  if (filter === "pending") {
    query = query.eq("approval_status", "submitted");
  } else if (filter === "approved") {
    query = query.eq("approval_status", "approved");
  } else if (filter === "banned") {
    query = query.eq("approval_status", "banned");
  }
  const { data: drivers } = await query.order("last_seen_at", {
    ascending: false,
    nullsFirst: false,
  });

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

      <div className="flex gap-sm mb-md flex-wrap">
        <FilterTab href="/admin/drivers" label="All" active={!filter} />
        <FilterTab
          href="/admin/drivers?filter=pending"
          label="Pending"
          active={filter === "pending"}
        />
        <FilterTab
          href="/admin/drivers?filter=approved"
          label="Approved"
          active={filter === "approved"}
        />
        <FilterTab
          href="/admin/drivers?filter=banned"
          label="Banned"
          active={filter === "banned"}
        />
      </div>

      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm uppercase tracking-[0.12em]">
                <th className="px-md py-sm text-left">Driver</th>
                <th className="px-md py-sm text-left">Vehicle</th>
                <th className="px-md py-sm text-left">Approval</th>
                <th className="px-md py-sm text-left">Rating</th>
                <th className="px-md py-sm text-left">Trips</th>
                <th className="px-md py-sm text-left">Status</th>
                <th className="px-md py-sm text-right w-10" />
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const p = profileMap.get(d.profile_id);
                const v = d.vehicle_id ? vehicleMap.get(d.vehicle_id) : null;
                const tint = STATUS_TINT[d.status] ?? STATUS_TINT.offline;
                const rating = p ? driverDisplayRating(d, p) : null;
                return (
                  <tr
                    key={d.profile_id}
                    className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-md py-md">
                      <Link
                        href={`/admin/drivers/${d.profile_id}`}
                        className="flex flex-col group"
                      >
                        <span className="font-semibold text-on-surface group-hover:text-primary-container">
                          {p?.full_name || "—"}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {p?.phone || "no phone"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-md py-md">
                      {v ? (
                        <span className="text-on-surface">
                          {v.make} {v.model}
                        </span>
                      ) : (
                        <span className="font-label-sm text-on-surface-variant">
                          No vehicle
                        </span>
                      )}
                    </td>
                    <td className="px-md py-md">
                      <span
                        className={`font-label-sm uppercase ${APPROVAL_TINT[d.approval_status]}`}
                      >
                        {d.approval_status}
                      </span>
                    </td>
                    <td className="px-md py-md text-on-surface">
                      {rating !== null ? rating.toFixed(2) : "—"}
                    </td>
                    <td className="px-md py-md text-on-surface">
                      {p?.trip_count ?? 0}
                    </td>
                    <td className="px-md py-md">
                      <span
                        className={`inline-flex items-center rounded-full px-sm py-0.5 font-label-sm uppercase ring-1 ${tint}`}
                      >
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-md py-md text-right">
                      <Link
                        href={`/admin/drivers/${d.profile_id}`}
                        className="text-on-surface-variant hover:text-primary-container"
                        aria-label="View driver"
                      >
                        ›
                      </Link>
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

function FilterTab({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "px-md py-sm rounded-full bg-primary-container text-on-primary-container font-label-sm font-bold"
          : "px-md py-sm rounded-full bg-surface-container text-on-surface-variant font-label-sm hover:bg-white/10"
      }
    >
      {label}
    </Link>
  );
}
