"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  ChatIcon,
  ChevronsRightIcon,
  SeatIcon,
  SteeringWheelIcon,
} from "@/components/ui/icons";
import { formatDuration, formatMoney } from "@/lib/utils/format";
import type { Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface DriverArrivingPanelProps {
  ride: Ride;
  tier: RideTier;
  driver: Profile;
  vehicle: Vehicle | null;
}

/**
 * Bottom-anchored arrival card shown after a driver accepts but before the
 * trip starts. The card "peeks" from the bottom of the viewport with a
 * curved top edge, a neon-green header strip announcing the ETA, a glassy
 * driver summary, and a dark pill-shaped action row for chatting.
 */
export function DriverArrivingPanel({
  ride,
  tier,
  driver,
  vehicle,
}: DriverArrivingPanelProps) {
  const plate = vehicle?.plate_number ?? "AB6299ZG";
  const carLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : "Honda CRV";

  return (
    <div className="overflow-hidden rounded-t-3xl glass-strong shadow-sheet">
      {/* Neon header strip: arrival announcement + ETA pill. */}
      <div className="flex items-center justify-between bg-accent px-5 py-3 text-black">
        <span className="text-[14px] font-semibold tracking-[-0.01em]">
          The driver will arrive in
        </span>
        <span className="rounded-full bg-black/90 px-3 py-1 text-[12px] font-bold tracking-tight text-accent">
          {formatDuration(ride.quoted_duration_min)}
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* Driver identity block with prominent plate badge. */}
        <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/[0.04]">
          <Avatar name={driver.full_name} src={driver.avatar_url} size={48} />
          <div className="flex flex-1 flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              {driver.full_name || "Your driver"}
            </span>
            <span className="text-[12px] text-muted">{carLabel}</span>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 font-mono text-[12px] font-bold tracking-[0.08em] text-background shadow-[0_2px_8px_rgba(255,255,255,0.18)]">
            {plate}
          </span>
        </div>

        {/* Ride summary row: tier + ETA + seats + price badge. */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/5 ring-1 ring-white/5">
              <SteeringWheelIcon className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-[-0.01em]">
              {tier.name}
            </span>
            <span className="text-muted">•</span>
            <span className="text-muted">
              {formatDuration(ride.quoted_duration_min)}
            </span>
            <span className="ml-1 inline-flex items-center gap-1 text-muted">
              <SeatIcon className="h-3.5 w-3.5" />
              <span>{tier.seats}</span>
            </span>
          </div>
          <span className="rounded-full bg-accent px-3 py-1.5 text-[13px] font-bold tracking-tight text-black shadow-glow">
            {formatMoney(ride.fare_minor, ride.currency)}
          </span>
        </div>

        {/* Action row: full-width dark pill with green chat circle + swipe
            chevrons. Distinct from a primary CTA: this is a tertiary action
            that doubles as a "tap to chat" affordance. */}
        <Link
          href={`/rider/ride/${ride.id}/chat`}
          className="group flex h-14 items-center justify-between rounded-full bg-white/[0.06] pl-2 pr-5 ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.09]"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-black shadow-glow">
              <ChatIcon className="h-4 w-4" />
            </span>
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-white">
              Chat with driver
            </span>
          </span>
          <ChevronsRightIcon className="h-5 w-5 text-muted transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
