"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { RatingStars } from "@/components/ui/rating-stars";
import { RideMap } from "@/components/map";
import { CancelRideDialog } from "@/components/driver/cancel-ride-dialog";
import { useRide } from "@/lib/realtime/use-ride";
import { useDriverLocationPublisher } from "@/lib/realtime/use-driver-location";
import { cn } from "@/lib/utils/cn";
import {
  formatDistance,
  formatDuration,
  formatMoney,
} from "@/lib/utils/format";
import type {
  Profile,
  Ride,
  RideStatus,
  RideTier,
} from "@/lib/supabase/types";

interface DriverRideViewProps {
  initialRide: Ride;
  tier: RideTier;
  rider: Profile;
  driverId: string;
}

const NEXT_ACTION: Record<RideStatus, { action: string; label: string } | null> =
  {
    requested: null,
    accepted: { action: "arrive", label: "I'm at the pickup" },
    en_route_to_pickup: { action: "start", label: "Start trip" },
    in_progress: { action: "complete", label: "End trip" },
    completed: null,
    cancelled: null,
  };

const STATUS_LABEL: Partial<Record<RideStatus, string>> = {
  accepted: "Heading to pickup",
  en_route_to_pickup: "Heading to pickup",
  in_progress: "In trip",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function DriverRideView({
  initialRide,
  tier,
  rider,
  driverId,
}: DriverRideViewProps) {
  const ride = useRide(initialRide);
  const router = useRouter();
  const next = NEXT_ACTION[ride.status];

  // Same OSRM-driven animated route as the rider trip screen.
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(
    null,
  );
  useEffect(() => {
    if (!Number.isFinite(ride.pickup_lat) || !Number.isFinite(ride.drop_lat))
      return;
    const ctrl = new AbortController();
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup: { lat: ride.pickup_lat, lng: ride.pickup_lng },
        drop: { lat: ride.drop_lat, lng: ride.drop_lng },
        tierId: tier.id,
      }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) return null;
        const data = (await r.json()) as {
          coordinates?: [number, number][];
        };
        return data.coordinates ?? null;
      })
      .then((coords) => {
        if (ctrl.signal.aborted) return;
        if (coords && coords.length > 1) setRouteCoords(coords);
      })
      .catch(() => undefined);
    return () => ctrl.abort();
  }, [
    ride.pickup_lat,
    ride.pickup_lng,
    ride.drop_lat,
    ride.drop_lng,
    tier.id,
  ]);
  const statusLabel =
    STATUS_LABEL[ride.status] ?? ride.status.replace(/_/g, " ");

  useDriverLocationPublisher({
    driverId,
    enabled: ride.status !== "completed" && ride.status !== "cancelled",
  });

  async function advance(action: string) {
    const body: Record<string, unknown> = { action };
    if (action === "complete") {
      body.actualDistanceKm = ride.quoted_distance_km;
      body.actualDurationMin = ride.quoted_duration_min;
    }
    await fetch(`/api/rides/${ride.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (action === "complete") router.push("/driver/earnings");
  }

  const [cancelOpen, setCancelOpen] = useState(false);

  async function cancel(reason: string) {
    const res = await fetch(`/api/rides/${ride.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", reason }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Couldn't cancel the ride.");
    }
    setCancelOpen(false);
    router.push("/driver");
  }

  const canCancel = ride.status !== "completed" && ride.status !== "cancelled";
  const cancelStage =
    ride.status === "in_progress" ? "in_progress" : "before_pickup";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Fullscreen map backdrop */}
      <div className="absolute inset-0">
        <RideMap
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
          drop={{ lat: ride.drop_lat, lng: ride.drop_lng }}
          route={routeCoords}
          className="h-full w-full"
        />
      </div>

      {/* Top gradient + status row */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/85 via-background/40 to-transparent"
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-sm px-margin-mobile py-md">
        <Link
          href="/driver"
          aria-label="Exit map and return to dashboard"
          title="Exit to dashboard"
          className="inline-flex h-11 items-center gap-xs rounded-full bg-surface/80 backdrop-blur-md px-md text-on-surface-variant hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2 ring-1 ring-white/10 transition-colors"
        >
          <MaterialIcon name="close" className="text-[20px]" />
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-[0.08em]">
            Exit
          </span>
        </Link>
        <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md text-label-sm font-label-sm uppercase tracking-[0.12em] text-on-surface ring-1 ring-white/10">
          {statusLabel}
        </span>
        {canCancel ? (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            aria-label="Cancel ride"
            className="inline-flex h-11 items-center gap-xs rounded-full bg-error/15 backdrop-blur-md px-md text-error hover:bg-error/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-error focus-visible:outline-offset-2 ring-1 ring-error/40 transition-colors"
          >
            <MaterialIcon name="report" filled className="text-[20px]" />
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-[0.08em]">
              Cancel
            </span>
          </button>
        ) : (
          <div className="w-11" />
        )}
      </header>

      {/* Bottom panel container */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-margin-mobile">
        <section className="glass-panel-strong rounded-lg p-lg flex flex-col gap-md shadow-card">
          {/* Drag handle */}
          <div className="mx-auto -mt-1 mb-xs h-1.5 w-12 rounded-full bg-white/15" />

          {/* Rider header */}
          <div className="flex items-center gap-md">
            <div className="relative shrink-0">
              <Avatar
                name={rider.full_name}
                src={rider.avatar_url}
                size={56}
              />
              <span className="absolute -bottom-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-primary-container px-1 text-on-primary-container font-label-sm text-label-sm font-bold ring-2 ring-background">
                {rider.rating.toFixed(1)}
              </span>
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                {rider.full_name || "Rider"}
              </span>
              <RatingStars value={rider.rating} className="mt-0.5" />
            </div>
            <div className="text-right">
              <div className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                Fare
              </div>
              <div className="font-headline-md text-headline-md font-bold text-primary-container">
                {formatMoney(ride.fare_minor, ride.currency)}
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-md bg-surface-container-low/80 p-md flex flex-col gap-sm">
            <div className="flex items-start gap-md">
              <div className="mt-1 flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-primary-container" />
                <span className="my-1 h-6 w-0 border-l-2 border-dotted border-on-surface-variant/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary-container neon-glow-primary" />
              </div>
              <div className="flex flex-1 flex-col gap-md min-w-0">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                    Pickup
                  </span>
                  <span className="font-body-md text-body-md text-on-surface truncate">
                    {ride.pickup_address || "—"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
                    Destination
                  </span>
                  <span className="font-body-md text-body-md text-on-surface truncate">
                    {ride.drop_address || "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-sm font-label-sm text-label-sm text-on-surface-variant flex justify-between">
              <span>{tier.name}</span>
              <span>
                {formatDistance(ride.quoted_distance_km)} ·{" "}
                {formatDuration(ride.quoted_duration_min)}
              </span>
            </div>
          </div>

          {/* Chat affordance */}
          <Link
            href={`/driver/ride/${ride.id}/chat`}
            className="flex items-center justify-between rounded-md bg-surface-container-highest px-md py-sm transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
          >
            <span className="flex items-center gap-sm font-body-md text-body-md font-semibold text-on-surface">
              <MaterialIcon name="chat" className="text-primary-container" />
              Chat with rider
            </span>
            <MaterialIcon
              name="chevron_right"
              className="text-on-surface-variant"
            />
          </Link>

          {/* Actions */}
          {next && (
            <button
              type="button"
              onClick={() => advance(next.action)}
              className={cn(
                "w-full py-md rounded-full font-headline-md text-headline-md font-extrabold uppercase tracking-tight transition-all duration-150 active:scale-95",
                "bg-primary-container text-on-primary-container shadow-[0_10px_30px_rgba(57,255,20,0.3)] neon-glow-primary",
              )}
            >
              {next.label}
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="w-full py-sm rounded-full border border-error/30 bg-error/[0.04] text-error font-label-md text-label-md font-bold uppercase tracking-[0.08em] hover:bg-error/10 transition-colors inline-flex items-center justify-center gap-sm"
            >
              <MaterialIcon name="report" className="text-[18px]" />
              {ride.status === "in_progress" ? "End trip early" : "Cancel ride"}
            </button>
          )}
        </section>
      </div>

      <CancelRideDialog
        open={cancelOpen}
        stage={cancelStage}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
      />
    </div>
  );
}
