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
      <Card className="flex items-center justify-between">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">
          Your driver will arrive in
        </span>
        <span className="rounded-full bg-accent px-3 py-1 text-[13px] font-semibold text-black">
          {formatDuration(ride.quoted_duration_min)}
        </span>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={driver.full_name} src={driver.avatar_url} size={44} />
          <div className="flex flex-1 flex-col">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              {driver.full_name || "Your driver"}
            </span>
            <span className="text-[13px] text-muted">
              {vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"}
            </span>
          </div>
          {vehicle?.plate_number && (
            <span className="rounded-md bg-surface-2 px-2.5 py-1 font-mono text-[12px] font-semibold tracking-wider text-white">
              {vehicle.plate_number}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-2 text-[14px]">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2">
              <SteeringWheelIcon className="h-4 w-4" />
            </span>
            <span className="font-medium">{tier.name}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">
              {formatDuration(ride.quoted_duration_min)}
            </span>
          </div>
          <span className="text-[15px] font-bold tracking-[-0.02em]">
            {formatMoney(ride.fare_minor, ride.currency)}
          </span>
        </div>
      </Card>

      <Link
        href={`/rider/ride/${ride.id}/chat`}
        className="flex h-[52px] items-center justify-between rounded-full bg-accent px-5 text-black transition-[background-color,transform] duration-150 hover:bg-accent-hover active:scale-[0.98]"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black/10">
            <ChatIcon className="h-4 w-4" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            Chat with driver
          </span>
        </span>
        <span className="flex items-center">
          <ArrowRightIcon className="h-4 w-4" />
          <ArrowRightIcon className="-ml-2 h-4 w-4 opacity-50" />
          <ArrowRightIcon className="-ml-2 h-4 w-4 opacity-25" />
        </span>
      </Link>
    </div>
  );
}
