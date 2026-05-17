"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { RideMap } from "@/components/map";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon, MapPinIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";

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

export function RiderRideView({ initialRide, tier, riderId }: RiderRideViewProps) {
  const ride = useRide(initialRide);
  const router = useRouter();

  const [driver, setDriver] = useState<Profile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const driverCoords = useDriverLocation(ride.driver_id);

  // Fetch driver + vehicle info once a driver has accepted.
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

  const showStandardPanel = useMemo(
    () => ride.status === "in_progress" || ride.status === "en_route_to_pickup",
    [ride.status],
  );

  // State 3 ("in-trip") gets a more zoomed-in / immersive look. Earlier
  // states keep the floating top route summary visible above the map.
  const showFloatingRouteSummary =
    ride.status === "requested" || ride.status === "accepted";

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-0 -z-0">
        <RideMap
          pickup={pickup}
          drop={drop}
          driver={driverCoords}
          className="h-full w-full"
        />
        {/* Soft top/bottom vignette to anchor the floating UI without a hard
            edge that fights the map. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-transparent to-background/60" />
      </div>

      <header className="z-10 flex items-center justify-between p-5">
        <Link href="/rider">
          <IconButton aria-label="Back" size={44}>
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
        </Link>
        <span className="rounded-full ring-1 ring-white/10">
          <Avatar name="You" size={44} />
        </span>
      </header>

      {showFloatingRouteSummary && (
        <FloatingRouteSummary
          pickupAddress={ride.pickup_address}
          dropAddress={ride.drop_address}
        />
      )}

      <div className="z-10 mt-auto flex flex-col gap-3 p-4">
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
  );
}

/**
 * Minimized version of the home screen's LocationStack — used as a floating
 * pill over the map so the route is always glanceable while you're waiting
 * for or meeting your driver.
 */
function FloatingRouteSummary({
  pickupAddress,
  dropAddress,
}: {
  pickupAddress?: string | null;
  dropAddress?: string | null;
}) {
  return (
    <div className="z-10 mx-4 mt-1 overflow-hidden rounded-3xl glass shadow-card">
      <Row
        indicator={
          <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(40,199,111,0.2)]" />
        }
        label={pickupAddress || "Pickup location"}
      />
      <div className="ml-[52px] h-px bg-white/10" />
      <Row
        indicator={<MapPinIcon className="h-3.5 w-3.5 text-white" />}
        label={dropAddress || "Destination"}
      />
    </div>
  );
}

function Row({
  indicator,
  label,
}: {
  indicator: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex h-12 items-center gap-3 px-4">
      <span className="grid h-6 w-6 shrink-0 place-items-center">
        {indicator}
      </span>
      <span className="line-clamp-1 flex-1 text-[14px] font-medium text-white">
        {label}
      </span>
    </div>
  );
}

async function cancelRide(rideId: string, router: ReturnType<typeof useRouter>) {
  await fetch(`/api/rides/${rideId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel" }),
  });
  router.push("/rider");
}
