"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon, ChatIcon } from "@/components/ui/icons";
import { RatingStars } from "@/components/ui/rating-stars";
import { RideMap } from "@/components/map";
import { useRide } from "@/lib/realtime/use-ride";
import { useDriverLocationPublisher } from "@/lib/realtime/use-driver-location";
import { formatDistance, formatDuration, formatMoney } from "@/lib/utils/format";
import type { Profile, Ride, RideStatus, RideTier } from "@/lib/supabase/types";

interface DriverRideViewProps {
  initialRide: Ride;
  tier: RideTier;
  rider: Profile;
  driverId: string;
}

const NEXT_ACTION: Record<RideStatus, { action: string; label: string } | null> = {
  requested: null,
  accepted: { action: "arrive", label: "I'm at the pickup" },
  en_route_to_pickup: { action: "start", label: "Start trip" },
  in_progress: { action: "complete", label: "End trip" },
  completed: null,
  cancelled: null,
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

  // Keep publishing location while on a trip.
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
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-0 -z-0">
        <RideMap
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
          drop={{ lat: ride.drop_lat, lng: ride.drop_lng }}
          className="h-full w-full"
        />
      </div>

      <header className="z-10 flex items-center justify-between p-5">
        <Link href="/driver">
          <IconButton aria-label="Back">
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
        </Link>
        <span className="rounded-pill bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/5">
          {ride.status.replace(/_/g, " ")}
        </span>
      </header>

      <div className="z-10 mt-auto flex flex-col gap-3 p-4">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={rider.full_name} src={rider.avatar_url} size={48} />
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-semibold">
                {rider.full_name || "Rider"}
              </span>
              <RatingStars value={rider.rating} showValue />
            </div>
            <span className="text-base font-semibold">
              {formatMoney(ride.fare_minor, ride.currency)}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <span className="line-clamp-1">
              <span className="text-muted">Pickup</span> · {ride.pickup_address || "—"}
            </span>
            <span className="line-clamp-1">
              <span className="text-muted">Drop</span> · {ride.drop_address || "—"}
            </span>
            <span className="text-muted">
              {tier.name} · {formatDistance(ride.quoted_distance_km)} ·{" "}
              {formatDuration(ride.quoted_duration_min)}
            </span>
          </div>
        </Card>

        <Link
          href={`/driver/ride/${ride.id}/chat`}
          className="flex items-center justify-between rounded-pill bg-surface px-5 py-3 ring-1 ring-white/5"
        >
          <span className="flex items-center gap-3 text-sm font-semibold">
            <ChatIcon className="h-4 w-4 text-accent" /> Chat with rider
          </span>
          <span className="text-xs text-muted">Open</span>
        </Link>

        {next && (
          <Button size="lg" fullWidth onClick={() => advance(next.action)}>
            {next.label}
          </Button>
        )}
        {ride.status !== "completed" && ride.status !== "cancelled" && (
          <Button variant="secondary" onClick={cancel}>
            Cancel ride
          </Button>
        )}
      </div>
    </div>
  );
}
