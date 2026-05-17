"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  ArrowRightIcon,
  ChatIcon,
  CompassIcon,
  SeatIcon,
} from "@/components/ui/icons";
import { RatingStars } from "@/components/ui/rating-stars";
import { formatDuration } from "@/lib/utils/format";
import type { Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface StandardRidePanelProps {
  ride: Ride;
  tier: RideTier;
  driver: Profile;
  vehicle: Vehicle | null;
}

export function StandardRidePanel({
  ride,
  tier,
  driver,
  vehicle,
}: StandardRidePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="px-2 text-2xl font-semibold">{tier.name}</h2>

      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={driver.full_name} src={driver.avatar_url} size={48} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{driver.full_name || "Driver"}</span>
              <span className="text-xs text-muted">
                {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
              </span>
            </div>
          </div>
          <CarIllustration />
        </div>

        <div className="flex items-center gap-2">
          {vehicle?.plate_number && (
            <span className="rounded-pill bg-surface-2 px-3 py-1 text-xs font-semibold tracking-wide">
              {vehicle.plate_number}
            </span>
          )}
          <RatingStars value={driver.rating} showValue />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat icon={<SeatIcon className="h-4 w-4" />} label={`${tier.seats} Seat`} />
          <Stat
            icon={<CompassIcon className="h-4 w-4" />}
            label={`${driver.trip_count} Trip${driver.trip_count === 1 ? "" : "s"}`}
          />
        </div>

        <div className="rounded-2xl bg-surface-2 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{driver.safety_rating}% user safety rating</span>
            <span className="text-muted">{formatDuration(ride.quoted_duration_min)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${Math.max(10, Math.min(100, driver.safety_rating))}%`,
              }}
            />
          </div>
        </div>
      </Card>

      <Link
        href={`/rider/ride/${ride.id}/chat`}
        className="flex items-center justify-between rounded-pill bg-accent px-5 py-3 text-background"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-background/10">
            <ChatIcon className="h-4 w-4 text-background" />
          </span>
          <span className="text-sm font-semibold">Chat with driver</span>
        </span>
        <span className="flex items-center gap-1">
          <ArrowRightIcon className="h-4 w-4" />
          <ArrowRightIcon className="h-4 w-4 -ml-2 opacity-60" />
          <ArrowRightIcon className="h-4 w-4 -ml-2 opacity-30" />
        </span>
      </Link>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-surface-2 px-3 py-2">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-surface">{icon}</span>
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}

function CarIllustration() {
  return (
    <svg
      viewBox="0 0 96 60"
      className="h-12 w-20 text-white"
      fill="currentColor"
      aria-hidden
    >
      <path d="M82 32H66l-6-10H36l-6 10H14l-4 6v8h8a4 4 0 0 0 8 0h44a4 4 0 0 0 8 0h8v-8l-4-6Zm-46 0 4-6h20l4 6H36Z" />
    </svg>
  );
}
