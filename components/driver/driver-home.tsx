"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { RideMap } from "@/components/map";
import { MaterialIcon } from "@/components/ui/material-icon";
import { DriverShell } from "@/components/shared/role-shell";
import { cn } from "@/lib/utils/cn";
import { formatDistance, formatDuration, formatMoney } from "@/lib/utils/format";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useDriverLocationPublisher } from "@/lib/realtime/use-driver-location";
import type {
  Driver,
  Profile,
  Ride,
  RideTier,
  Vehicle,
} from "@/lib/supabase/types";

interface DriverHomeProps {
  profile: Profile;
  driver: Driver | null;
  vehicle: Vehicle | null;
  tiers: RideTier[];
  activeRideId: string | null;
  activeRideDrop?: string | null;
  dailyEarningsMinor: number;
  dailyEarningsCurrency: string;
}

export function DriverHome({
  profile,
  driver,
  vehicle,
  tiers,
  activeRideId,
  activeRideDrop,
  dailyEarningsMinor,
  dailyEarningsCurrency,
}: DriverHomeProps) {
  const router = useRouter();
  const [online, setOnline] = useState(driver?.status === "online");
  const [busy, setBusy] = useState(false);
  const [incoming, setIncoming] = useState<Ride[]>([]);

  useDriverLocationPublisher({ driverId: profile.id, enabled: online });

  // Subscribe to incoming requests in this tier.
  useEffect(() => {
    if (!online) {
      setIncoming([]);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const tierId = vehicle?.tier_id;

    void supabase
      .from("rides")
      .select("*")
      .eq("status", "requested")
      .order("requested_at", { ascending: true })
      .then(({ data }) =>
        setIncoming(
          ((data ?? []) as Ride[]).filter((r) => !tierId || r.tier_id === tierId),
        ),
      );

    const channel = supabase
      .channel("driver-incoming")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          const newRow = (payload.new ?? payload.old) as Ride | undefined;
          if (!newRow) return;
          if (tierId && newRow.tier_id !== tierId) return;
          setIncoming((prev) => {
            const without = prev.filter((p) => p.id !== newRow.id);
            if (payload.eventType === "INSERT" && newRow.status === "requested") {
              return [...without, newRow];
            }
            if (
              payload.eventType === "UPDATE" &&
              newRow.status === "requested"
            ) {
              return [...without, newRow];
            }
            return without;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [online, vehicle?.tier_id]);

  async function toggleOnline() {
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const next = online ? "offline" : "online";
      await supabase.from("drivers").upsert(
        {
          profile_id: profile.id,
          status: next,
          last_seen_at: new Date().toISOString(),
          vehicle_id: vehicle?.id ?? null,
        },
        { onConflict: "profile_id" },
      );
      setOnline(!online);
    } finally {
      setBusy(false);
    }
  }

  async function accept(rideId: string) {
    const res = await fetch(`/api/rides/${rideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    if (res.ok) {
      router.push(`/driver/ride/${rideId}`);
    } else {
      setIncoming((prev) => prev.filter((r) => r.id !== rideId));
    }
  }

  function decline(rideId: string) {
    setIncoming((prev) => prev.filter((r) => r.id !== rideId));
  }

  const tierById = useMemo(
    () => new Map(tiers.map((t) => [t.id, t])),
    [tiers],
  );

  const carLabel = vehicle
    ? `${vehicle.color ? `${vehicle.color} ` : ""}${vehicle.make} ${vehicle.model}`
    : "Vehicle pending";

  const mapLayer = (
    <div className="absolute inset-0">
      <RideMap className="h-full w-full" />
      <div className="absolute inset-0 map-gradient-overlay lg:hidden pointer-events-none" />
      <div className="absolute inset-0 map-edge-vignette hidden lg:block pointer-events-none" />
    </div>
  );

  return (
    <DriverShell profile={profile} layout="map-first" mapSlot={mapLayer}>
        <div className="flex flex-col gap-lg mt-sm">
          <p className="hidden lg:block font-label-sm text-label-sm text-primary-container/90 uppercase tracking-[0.2em]">
            Driver console
          </p>

          <section className="glass-panel rounded-xl p-lg flex flex-col gap-lg lg:gap-md">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">
                  {profile.full_name || "Driver"}
                </h2>
                <div className="flex items-center gap-xs mt-xs">
                  <MaterialIcon
                    name="star"
                    filled
                    className="text-primary-container text-sm"
                  />
                  <span className="font-label-md text-label-md text-on-surface">
                    {(profile.rating ?? 5).toFixed(2)}
                  </span>
                  <span className="mx-xs text-outline-variant">•</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {carLabel}
                  </span>
                </div>
              </div>
              <TierBadge tier={vehicle ? tierById.get(vehicle.tier_id) : undefined} />
            </div>

            <div className="flex flex-col items-center justify-center py-xl lg:py-md lg:flex-row lg:justify-between lg:items-center lg:gap-lg">
              <button
                type="button"
                disabled={busy}
                onClick={toggleOnline}
                className={cn(
                  "rounded-full flex flex-col items-center justify-center gap-xs transition-all duration-300 active:scale-95 disabled:opacity-60",
                  "w-48 h-48 lg:w-28 lg:h-28 lg:shrink-0",
                  online
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(57,255,20,0.3)]"
                    : "bg-surface-container-highest text-on-surface border border-outline-variant/30",
                )}
              >
                <MaterialIcon
                  name="power_settings_new"
                  filled
                  className="text-5xl lg:text-3xl font-black"
                />
                <span className="font-display-lg text-headline-lg-mobile lg:hidden uppercase tracking-tighter">
                  {online ? "Online" : "Go Online"}
                </span>
              </button>
              <div className="lg:flex-1 lg:text-left text-center">
                <p className="font-headline-md text-headline-md text-on-surface hidden lg:block">
                  {online ? "You’re online" : "You’re offline"}
                </p>
                <p
                  className={cn(
                    "mt-lg lg:mt-xs font-label-md text-label-md text-on-surface-variant",
                    online && "lg:animate-none animate-pulse",
                  )}
                >
                  {online
                    ? incoming.length === 0
                      ? "Waiting for ride requests…"
                      : `${incoming.length} request${incoming.length === 1 ? "" : "s"} nearby`
                    : "Go online to receive requests"}
                </p>
                <p className="hidden lg:block mt-sm font-label-sm text-label-sm text-primary-container">
                  Today: {formatMoney(dailyEarningsMinor, dailyEarningsCurrency)}
                </p>
              </div>
            </div>
          </section>

          {/* Active Trip Banner */}
          {activeRideId && (
            <Link href={`/driver/ride/${activeRideId}`}>
              <div className="glass-panel rounded-lg p-md border-l-4 border-primary-container flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                    <MaterialIcon
                      name="route"
                      className="text-primary-container"
                    />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      ACTIVE TRIP
                    </p>
                    <p className="font-body-md text-body-md font-semibold line-clamp-1">
                      {activeRideDrop
                        ? `Resume trip to ${activeRideDrop}`
                        : "Resume your current trip"}
                    </p>
                  </div>
                </div>
                <MaterialIcon
                  name="chevron_right"
                  className="text-primary-container"
                />
              </div>
            </Link>
          )}

          {/* Incoming Requests Header */}
          <div className="flex items-center justify-between mt-sm">
            <h3 className="font-headline-md text-headline-md text-primary">
              Live Requests
            </h3>
            <span className="font-label-sm text-label-sm bg-surface-container-high px-sm py-xs rounded text-on-surface-variant">
              {incoming.length} NEARBY
            </span>
          </div>

          {/* Request List */}
          <div className="flex flex-col gap-md">
            {!online && (
              <div className="glass-panel rounded-lg p-lg text-center">
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Go online to receive ride requests.
                </p>
              </div>
            )}
            {online && incoming.length === 0 && (
              <div className="glass-panel rounded-lg p-lg text-center">
                <p className="font-label-md text-label-md text-on-surface-variant">
                  No requests yet — sit tight, we&rsquo;re scanning the city.
                </p>
              </div>
            )}
            {incoming.map((ride) => {
              const tier = tierById.get(ride.tier_id);
              return (
                <div
                  key={ride.id}
                  className="glass-panel rounded-lg p-md flex flex-col gap-md"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-sm">
                      <MaterialIcon
                        name="electric_car"
                        filled
                        className="text-primary-container"
                      />
                      <span className="font-label-md text-label-md font-bold uppercase tracking-wider text-primary">
                        {tier?.name ?? "Trip"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-headline-md text-headline-md text-primary-container">
                        {formatMoney(ride.fare_minor, ride.currency)}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        Est. {formatDuration(ride.quoted_duration_min)}
                      </p>
                    </div>
                  </div>

                  <div className="relative pl-lg py-sm flex flex-col gap-lg">
                    <div className="absolute left-0 top-3 bottom-3 w-[2px] border-l-2 border-dotted border-outline-variant" />
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-surface-variant border border-outline" />
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        PICKUP
                      </p>
                      <p className="font-body-md text-body-md line-clamp-1">
                        {formatDistance(ride.quoted_distance_km)} away ·{" "}
                        {ride.pickup_address || "Pickup"}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-primary-container neon-glow-primary" />
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        DESTINATION
                      </p>
                      <p className="font-body-md text-body-md line-clamp-1">
                        {ride.drop_address || "Destination"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-md mt-sm">
                    <button
                      type="button"
                      onClick={() => decline(ride.id)}
                      className="flex-1 py-md rounded-full bg-surface-container-highest text-on-surface font-headline-md text-label-md active:scale-95 transition-transform"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => accept(ride.id)}
                      className="flex-[2] w-full py-md rounded-full bg-primary-container text-on-primary-container font-headline-md text-label-md font-bold neon-glow-primary active:scale-95 transition-transform"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Earnings Link */}
          <Link
            href="/driver/earnings"
            className="mt-xl flex items-center justify-center gap-sm p-lg rounded-xl glass-panel text-primary-container font-label-md text-label-md hover:bg-white/[0.07] transition-colors"
          >
            <MaterialIcon name="payments" />
            View Daily Earnings:{" "}
            {formatMoney(dailyEarningsMinor, dailyEarningsCurrency)}
            <MaterialIcon name="arrow_forward" />
          </Link>
        </div>
    </DriverShell>
  );
}

/** Right-aligned "SILVER TIER" pill in the status card. */
function TierBadge({ tier }: { tier: RideTier | undefined }) {
  if (!tier) return null;
  return (
    <span className="px-sm py-xs bg-primary-container/10 text-primary-container rounded-full font-label-sm text-label-sm border border-primary-container/20 uppercase tracking-wider">
      {tier.name} tier
    </span>
  );
}
