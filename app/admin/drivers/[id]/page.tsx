import Link from "next/link";
import { notFound } from "next/navigation";

import { DriverDetailActions } from "@/components/admin/driver-detail-actions";
import { DriverDocumentsGallery } from "@/components/admin/driver-documents-gallery";
import { PageHeader } from "@/components/shared/page-header";
import {
  bucketForPath,
  signedStorageUrl,
} from "@/lib/admin/signed-storage-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { driverDisplayRating } from "@/lib/supabase/types";
import type {
  Complaint,
  Driver,
  DriverModerationEvent,
  Profile,
  Rating,
  RideTier,
  Vehicle,
} from "@/lib/supabase/types";
import { formatMoney } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const APPROVAL_TINT: Record<string, string> = {
  approved: "bg-primary-container/15 text-primary-container",
  submitted: "bg-secondary-container/20 text-secondary-container",
  draft: "bg-white/[0.05] text-on-surface-variant",
  rejected: "bg-error/15 text-error",
  banned: "bg-error/20 text-error",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDriverDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: driver } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", id)
    .maybeSingle<Driver>();

  if (!driver) notFound();

  const [
    profileRes,
    vehicleRes,
    tiersRes,
    ridesRes,
    ratingsRes,
    complaintsRes,
    eventsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle<Profile>(),
    driver.vehicle_id
      ? supabase.from("vehicles").select("*").eq("id", driver.vehicle_id).maybeSingle<Vehicle>()
      : supabase.from("vehicles").select("*").eq("driver_id", id).maybeSingle<Vehicle>(),
    supabase.from("ride_tiers").select("*").order("sort_order"),
    supabase.from("rides").select("*").eq("driver_id", id),
    supabase.from("ratings").select("*").eq("ratee_id", id),
    supabase
      .from("complaints")
      .select("*")
      .eq("subject_driver_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("driver_moderation_events")
      .select("*")
      .eq("driver_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const profile = profileRes.data;
  const vehicle = vehicleRes.data;
  const tiers = (tiersRes.data ?? []) as RideTier[];
  const rides = ridesRes.data ?? [];
  const ratings = (ratingsRes.data ?? []) as Rating[];
  const complaints = (complaintsRes.data ?? []) as Complaint[];
  const events = (eventsRes.data ?? []) as DriverModerationEvent[];

  const completed = rides.filter((r) => r.status === "completed");
  const cancelled = rides.filter((r) => r.status === "cancelled");
  const offered = rides.filter((r) =>
    ["accepted", "completed", "cancelled", "in_progress", "en_route_to_pickup"].includes(
      r.status,
    ),
  );
  const revenue = completed.reduce((s, r) => s + r.fare_minor, 0);
  const currency = completed[0]?.currency ?? "MWK";
  const acceptanceRate =
    rides.length > 0
      ? Math.round((offered.length / rides.length) * 100)
      : 0;
  const cancellationRate =
    rides.length > 0 ? Math.round((cancelled.length / rides.length) * 100) : 0;

  const starDist = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: ratings.filter((r) => r.stars === stars).length,
  }));

  const licenseFrontUrl = await signedStorageUrl(
    bucketForPath(driver.license_front_path ?? ""),
    driver.license_front_path,
  );
  const licenseBackUrl = await signedStorageUrl(
    bucketForPath(driver.license_back_path ?? ""),
    driver.license_back_path,
  );
  const carUrls = await Promise.all(
    (driver.car_photo_paths ?? []).map(async (path, i) => ({
      label: `Car photo ${i + 1}`,
      url: await signedStorageUrl(bucketForPath(path), path),
    })),
  );

  const displayRating = profile
    ? driverDisplayRating(driver, profile)
    : 0;
  const assignedTierId =
    driver.admin_assigned_tier_id ?? vehicle?.tier_id ?? null;

  return (
    <>
      <Link
        href="/admin/drivers"
        className="inline-flex items-center gap-xs font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface mb-md"
      >
        ← Back to drivers
      </Link>

      <PageHeader
        title={profile?.full_name ?? "Driver"}
        subtitle={profile?.phone ?? "No phone"}
        icon="directions_car"
      />

      <div className="flex flex-wrap gap-sm mb-lg">
        <span
          className={`inline-flex rounded-full px-sm py-0.5 font-label-sm uppercase ${APPROVAL_TINT[driver.approval_status] ?? APPROVAL_TINT.draft}`}
        >
          {driver.approval_status}
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">
          {driver.status.replace(/_/g, " ")}
          {driver.is_verified ? " · verified" : ""}
        </span>
      </div>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Actions
        </h2>
        <DriverDetailActions
          driverId={id}
          approvalStatus={driver.approval_status}
          tiers={tiers}
          currentTierId={assignedTierId}
          displayRating={displayRating}
        />
      </section>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Documents
        </h2>
        <DriverDocumentsGallery
          items={[
            { label: "License front", url: licenseFrontUrl },
            { label: "License back", url: licenseBackUrl },
            ...carUrls,
          ]}
        />
        {driver.national_id && (
          <p className="mt-md font-label-sm text-label-sm text-on-surface-variant">
            National ID: {driver.national_id}
          </p>
        )}
      </section>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Vehicle & tier
        </h2>
        {vehicle ? (
          <p className="font-body-md text-body-md text-on-surface">
            {vehicle.color} {vehicle.make} {vehicle.model} · {vehicle.plate_number} ·{" "}
            {driver.vehicle_body_type ?? "—"} · {vehicle.seats} seats
          </p>
        ) : (
          <p className="text-on-surface-variant">No vehicle linked</p>
        )}
        <p className="mt-sm font-label-sm text-label-sm text-on-surface-variant">
          Assigned tier:{" "}
          {tiers.find((t) => t.id === assignedTierId)?.name ?? "—"}
        </p>
      </section>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Trips
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md font-body-md">
          <Stat label="Completed" value={String(completed.length)} />
          <Stat label="Cancellation %" value={`${cancellationRate}%`} />
          <Stat label="Acceptance %" value={`${acceptanceRate}%`} />
          <Stat label="Revenue" value={formatMoney(revenue, currency)} />
        </div>
      </section>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Reputation
        </h2>
        <p className="font-body-md text-on-surface mb-sm">
          Rating {displayRating.toFixed(2)} · {profile?.trip_count ?? 0} trips ·
          Safety {profile?.safety_rating ?? "—"}
        </p>
        <ul className="flex flex-col gap-xs font-label-sm text-label-sm text-on-surface-variant">
          {starDist.map((s) => (
            <li key={s.stars}>
              {s.stars}★: {s.count}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Complaints ({complaints.length})
        </h2>
        {complaints.length === 0 ? (
          <p className="text-on-surface-variant">No complaints.</p>
        ) : (
          <ul className="flex flex-col gap-md">
            {complaints.map((c) => (
              <li
                key={c.id}
                className="border-t border-white/[0.06] pt-md first:border-0 first:pt-0"
              >
                <div className="flex justify-between gap-sm">
                  <span className="font-label-sm uppercase text-on-surface-variant">
                    {c.category} · {c.status}
                  </span>
                  <span className="font-label-sm text-on-surface-variant">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-xs font-body-md text-on-surface">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass-panel rounded-lg p-lg mb-lg">
        <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mb-md">
          Moderation log
        </h2>
        {events.length === 0 ? (
          <p className="text-on-surface-variant">No events yet.</p>
        ) : (
          <ul className="flex flex-col gap-sm font-label-sm text-label-sm">
            {events.map((e) => (
              <li key={e.id} className="text-on-surface-variant">
                <span className="text-on-surface">{e.action}</span> ·{" "}
                {new Date(e.created_at).toLocaleString()}
                {e.notes ? ` — ${e.notes}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-on-surface-variant font-label-sm uppercase">{label}</p>
      <p className="text-on-surface font-semibold text-lg">{value}</p>
    </div>
  );
}
