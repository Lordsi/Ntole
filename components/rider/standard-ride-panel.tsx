"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import {
  CarTopDownIcon,
  ChatIcon,
  ChevronsRightIcon,
  CompassIcon,
  SeatIcon,
  StarIcon,
} from "@/components/ui/icons";
import type { Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface StandardRidePanelProps {
  ride: Ride;
  tier: RideTier;
  driver: Profile;
  vehicle: Vehicle | null;
}

/**
 * Expanded bottom sheet shown once the driver has arrived / the trip is
 * underway. Fills roughly the bottom 60% of the viewport with a glass
 * surface, driver spotlight, a large top-down sedan illustration, an info
 * matrix (seats + lifetime trips) and a safety-rating bar.
 */
export function StandardRidePanel({
  ride,
  tier,
  driver,
  vehicle,
}: StandardRidePanelProps) {
  const plate = vehicle?.plate_number ?? "AB6299ZG";
  const carLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : "Honda CRV";
  const safety = Math.max(10, Math.min(100, driver.safety_rating ?? 98));

  return (
    <div className="overflow-hidden rounded-t-lg glass-panel-strong shadow-sheet">
      {/* Drag handle */}
      <div className="flex justify-center pt-2.5">
        <span className="h-1 w-10 rounded-full bg-white/15" />
      </div>

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 flex-col gap-4">
            <h2 className="text-[28px] font-bold leading-none tracking-[-0.03em]">
              {tier.name}
            </h2>

            <div className="flex items-center gap-3">
              <Avatar
                name={driver.full_name}
                src={driver.avatar_url}
                size={52}
              />
              <div className="flex flex-col leading-tight">
                <span className="text-[15px] font-semibold tracking-[-0.01em]">
                  {driver.full_name || "Your driver"}
                </span>
                <span className="text-[12px] text-muted">{carLabel}</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-[0.08em] text-background">
                    {plate}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-white">
                    <StarIcon className="h-3 w-3 text-accent" />
                    {(driver.rating ?? 4.9).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top-down sedan illustration — visual centerpiece on the right. */}
          <CarTopDownIcon className="h-[120px] w-[72px] shrink-0 text-white drop-shadow-[0_8px_24px_rgba(40,199,111,0.18)]" />
        </div>

        {/* Info matrix: two square blocks on the left. */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock
            icon={<SeatIcon className="h-4 w-4" />}
            value={`${tier.seats}`}
            label="Seat"
          />
          <InfoBlock
            icon={<CompassIcon className="h-4 w-4" />}
            value={`${driver.trip_count ?? 482}`}
            label="Trip"
          />
        </div>

        {/* Safety indicator: horizontal progress pill with neon fill. */}
        <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.04]">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-semibold tracking-[-0.01em]">
              <span className="text-accent">{safety}%</span> user safety rating
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em] text-muted">
              Verified
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-accent shadow-[0_0_12px_rgba(40,199,111,0.55)] transition-[width] duration-500"
              style={{ width: `${safety}%` }}
            />
          </div>
        </div>

        {/* Sticky action bar — matches State 2 dark pill. */}
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

function InfoBlock({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-white/[0.04] p-3.5 ring-1 ring-white/[0.04]">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/5 text-muted-strong">
        {icon}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[20px] font-bold tracking-[-0.03em]">
          {value}
        </span>
        <span className="text-[12px] text-muted">{label}</span>
      </div>
    </div>
  );
}
