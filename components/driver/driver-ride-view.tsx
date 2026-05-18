"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { RatingStars } from "@/components/ui/rating-stars";
import { RideMap } from "@/components/map";
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

  async function cancel() {
    await fetch(`/api/rides/${ride.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    router.push("/driver");
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Fullscreen map backdrop */}
      <div className="absolute inset-0">
        <RideMap
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
          drop={{ lat: ride.drop_lat, lng: ride.drop_lng }}
          className="h-full w-full"
        />
      </div>

      {/* Top gradient + status row */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/85 via-background/40 to-transparent"
      />

      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-margin-mobile py-md">
        <Link
          href="/driver"
          aria-label="Back to dashboard"
          className="grid h-11 w-11 place-items-center rounded-full bg-surface/80 backdrop-blur-md text-on-surface-variant hover:text-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
        >
          <MaterialIcon name="arrow_back" />
        </Link>
        <span className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md text-label-sm font-label-sm uppercase tracking-[0.12em] text-on-surface ring-1 ring-white/10">
          {statusLabel}
        </span>
        <div className="w-11" />
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
          {ride.status !== "completed" && ride.status !== "cancelled" && (
            <button
              type="button"
              onClick={cancel}
              className="w-full py-sm rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-label-md font-semibold transition-colors hover:text-error hover:bg-error/10"
            >
              Cancel ride
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
