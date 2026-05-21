"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { RideMap } from "@/components/map";
import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";

import { DriverArrivingPanel } from "./driver-arriving-panel";
import { StandardRidePanel } from "./standard-ride-panel";
import { CompletedRidePanel } from "./completed-ride-panel";
import { WaitingForMatchPanel } from "./waiting-for-match-panel";
import { CancelledRidePanel } from "./cancelled-ride-panel";

import { useDriverLocation, useRide } from "@/lib/realtime/use-ride";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface RiderRideViewProps {
  initialRide: Ride;
  tier: RideTier;
  riderId: string;
}

export function RiderRideView({
  initialRide,
  tier,
  riderId,
}: RiderRideViewProps) {
  const ride = useRide(initialRide);
  const router = useRouter();

  const [driver, setDriver] = useState<Profile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const driverCoords = useDriverLocation(ride.driver_id);

  useEffect(() => {
    if (!ride.driver_id) {
      setDriver(null);
      setVehicle(null);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    void supabase
      .from("profiles")
      .select("*")
      .eq("id", ride.driver_id)
      .maybeSingle<Profile>()
      .then(({ data }) => setDriver(data ?? null));
    if (ride.vehicle_id) {
      void supabase
        .from("vehicles")
        .select("*")
        .eq("id", ride.vehicle_id)
        .maybeSingle<Vehicle>()
        .then(({ data }) => setVehicle(data ?? null));
    }
  }, [ride.driver_id, ride.vehicle_id]);

  const pickup = { lat: ride.pickup_lat, lng: ride.pickup_lng };
  const drop = { lat: ride.drop_lat, lng: ride.drop_lng };

  // Fetch the OSRM-driven route geometry once per pickup/drop pair so the
  // map can draw an animated polyline between the two pins. /api/quote
  // already calls OSRM and returns the decoded coordinates, so we reuse
  // that endpoint instead of duplicating the OSRM logic on the client.
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(
    null,
  );
  useEffect(() => {
    if (!Number.isFinite(pickup.lat) || !Number.isFinite(drop.lat)) return;
    const ctrl = new AbortController();
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pickup, drop, tierId: tier.id }),
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
    // We deliberately depend on the primitive coordinates so the effect
    // doesn't refire on every re-render of the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup.lat, pickup.lng, drop.lat, drop.lng, tier.id]);

  const showStandardPanel =
    ride.status === "in_progress" || ride.status === "en_route_to_pickup";

  // The minimized top "Current → Dest" summary is shown while we're waiting
  // for a driver and during the arrival phase. It hides during the in-trip
  // and terminal states where the bottom panel takes over the screen.
  const showFloatingRouteSummary =
    ride.status === "requested" || ride.status === "accepted";

  return (
    <div className="fixed inset-0 z-0 overflow-hidden font-body-md text-on-surface lg:flex">
      <div className="absolute inset-0 z-0 lg:flex-1">
        <RideMap
          pickup={pickup}
          drop={drop}
          driver={driverCoords}
          route={routeCoords}
          className="h-full w-full"
        />
        <div className="absolute inset-0 map-edge-vignette hidden lg:block pointer-events-none" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 px-margin-mobile py-md flex justify-between items-center bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm lg:hidden">
        <Link
          href="/rider"
          className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high/80 backdrop-blur-md border border-white/10 active:scale-95 transition-transform"
          aria-label="Back"
        >
          <MaterialIcon name="arrow_back" className="text-on-surface" />
        </Link>
        <Link
          href="/rider/profile"
          className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-container neon-glow-primary block"
        >
          <Avatar name="You" size={44} />
        </Link>
      </header>

      {/* Always-visible floating minimize. Pinned top-right of the
          viewport on every breakpoint so the rider can never get
          trapped on the trip map. */}
      <Link
        href="/rider"
        aria-label="Exit trip map"
        title="Exit"
        className="hidden lg:inline-flex fixed top-4 right-4 z-[60] h-12 w-12 items-center justify-center rounded-full bg-surface text-on-surface ring-2 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:bg-surface-container-high active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
      >
        <MaterialIcon name="close" className="text-[22px]" />
      </Link>

      {/* Top summary glass card — only while waiting / accepted. */}
      {showFloatingRouteSummary && (
        <FloatingRouteSummary
          pickupAddress={ride.pickup_address}
          dropAddress={ride.drop_address}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-50 lg:static lg:flex lg:items-end lg:justify-center lg:p-6 lg:w-[min(520px,40vw)] lg:shrink-0 lg:z-10">
        <div className="w-full lg:desktop-float-card lg:overflow-hidden lg:rounded-2xl">
        {ride.status === "requested" && (
          <WaitingForMatchPanel
            ride={ride}
            tier={tier}
            onCancel={() => cancelRide(ride.id, router)}
          />
        )}
        {ride.status === "accepted" && driver && (
          <DriverArrivingPanel
            ride={ride}
            tier={tier}
            driver={driver}
            vehicle={vehicle}
          />
        )}
        {showStandardPanel && driver && (
          <StandardRidePanel
            ride={ride}
            tier={tier}
            driver={driver}
            vehicle={vehicle}
          />
        )}
        {ride.status === "completed" && (
          <CompletedRidePanel ride={ride} tier={tier} riderId={riderId} />
        )}
        {ride.status === "cancelled" && <CancelledRidePanel ride={ride} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Floating "Current → Destination" glass card hovering near the top of the
 * viewport. Two-dot-with-dotted-line indicator on the left, two address
 * rows on the right, "expand" affordance on the far right.
 */
function FloatingRouteSummary({
  pickupAddress,
  dropAddress,
}: {
  pickupAddress?: string | null;
  dropAddress?: string | null;
}) {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-40px)] max-w-[400px] lg:left-auto lg:right-[calc(min(520px,40vw)+2rem)] lg:translate-x-0 lg:top-8">
      <div className="glass-card rounded-lg p-md flex items-center gap-md">
        <div className="flex flex-col items-center gap-xs">
          <div className="w-2 h-2 rounded-full bg-outline" />
          <div className="w-0.5 h-6 bg-outline-variant/30" />
          <div className="w-2 h-2 rounded-full bg-primary-container" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-label-sm font-label-sm text-on-surface-variant line-clamp-1">
            Current: {pickupAddress || "Pickup location"}
          </p>
          <p className="text-label-sm font-label-sm text-on-surface line-clamp-1 font-bold">
            Dest: {dropAddress || "Destination"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Expand details"
          className="p-sm text-on-surface-variant hover:text-primary-container transition-colors"
        >
          <MaterialIcon name="expand_more" />
        </button>
      </div>
    </div>
  );
}

async function cancelRide(
  rideId: string,
  router: ReturnType<typeof useRouter>,
) {
  await fetch(`/api/rides/${rideId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel" }),
  });
  router.push("/rider");
}
