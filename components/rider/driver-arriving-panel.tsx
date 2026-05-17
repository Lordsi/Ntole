"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArrowRightIcon, ChatIcon, SteeringWheelIcon } from "@/components/ui/icons";
import { formatDuration, formatMoney } from "@/lib/utils/format";
import type { Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface DriverArrivingPanelProps {
  ride: Ride;
  tier: RideTier;
  driver: Profile;
  vehicle: Vehicle | null;
}

export function DriverArrivingPanel({
  ride,
  tier,
  driver,
  vehicle,
}: DriverArrivingPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between bg-surface">
        <div className="flex flex-col">
          <span className="text-xs text-muted">Status</span>
          <span className="text-sm font-semibold">The driver will arrive in</span>
        </div>
        <span className="rounded-pill bg-accent px-3 py-1 text-sm font-semibold text-background">
          {formatDuration(ride.quoted_duration_min)}
        </span>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={driver.full_name} src={driver.avatar_url} size={48} />
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">{driver.full_name || "Your driver"}</span>
            <span className="text-xs text-muted">
              {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
            </span>
          </div>
          {vehicle?.plate_number && (
            <span className="rounded-pill bg-surface-2 px-3 py-1 text-xs font-semibold tracking-wide">
              {vehicle.plate_number}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2">
              <SteeringWheelIcon className="h-4 w-4" />
            </span>
            <span>
              {tier.name}{" "}
              <span className="text-muted">· {formatDuration(ride.quoted_duration_min)}</span>
            </span>
          </div>
          <span className="rounded-pill bg-surface-2 px-3 py-1 text-sm font-semibold">
            {formatMoney(ride.fare_minor, ride.currency)}
          </span>
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
