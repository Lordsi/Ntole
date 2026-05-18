"use client";

import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { formatDuration } from "@/lib/utils/format";
import type { Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface DriverArrivingPanelProps {
  ride: Ride;
  tier: RideTier;
  driver: Profile;
  vehicle: Vehicle | null;
}

/**
 * Bottom-sheet driver arrival panel from Stitch's rider_trip_status mock.
 * Pulsing neon strip at the top ("driver will arrive in N mins"), driver
 * portrait with rating badge, white pill plate, and an action row of
 * Chat / Call / Cancel.
 */
export function DriverArrivingPanel({
  ride,
  tier,
  driver,
  vehicle,
}: DriverArrivingPanelProps) {
  const plate = vehicle?.plate_number ?? "AB6299ZG";
  const carLabel = vehicle ? `${vehicle.make} ${vehicle.model}` : "Honda CR-V";
  const eta = formatDuration(ride.quoted_duration_min);
  const rating = driver.rating ? driver.rating.toFixed(1) : "5.0";

  return (
    <div className="relative bg-surface-container-low rounded-t-lg shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-white/5">
      {/* Drag handle */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-outline-variant/40" />

      {/* Arrival header strip with a pulsing dot */}
      <div className="flex items-center justify-center gap-sm py-sm border-b border-outline-variant/20">
        <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse shadow-[0_0_8px_#39ff14]" />
        <span className="text-label-md font-label-md text-primary-fixed">
          The driver will arrive in {eta}
        </span>
      </div>

      <div className="px-margin-mobile pt-lg pb-xl space-y-lg">
        {/* Driver row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-md">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-outline-variant">
                <Avatar
                  name={driver.full_name ?? "Driver"}
                  src={driver.avatar_url}
                  size={60}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-surface-container-highest rounded-full px-sm border border-outline-variant">
                <p className="text-[10px] font-bold text-primary-container">
                  {rating}★
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface">
                {driver.full_name?.split(" ")[0] ?? "Your driver"}
              </h2>
              <p className="text-body-md font-body-md text-on-surface-variant">
                {carLabel} • {tier.name}
              </p>
            </div>
          </div>

          {/* License plate */}
          <div className="bg-white px-md py-xs rounded-full shadow-lg">
            <p className="text-black font-bold font-label-md tracking-widest">
              {plate}
            </p>
          </div>
        </div>

        {/* Action row */}
        <div className="flex gap-md">
          <Link
            href={`/rider/ride/${ride.id}/chat`}
            className="flex-1 bg-surface-container-highest text-on-surface py-md rounded-full font-headline-md text-center active:scale-95 transition-all border border-outline-variant/30 flex items-center justify-center gap-sm"
          >
            <MaterialIcon name="chat_bubble" className="text-[20px]" />
            Chat with driver
          </Link>
          <button
            type="button"
            aria-label="Call driver"
            className="w-14 h-14 bg-surface-container-highest rounded-full flex items-center justify-center border border-outline-variant/30 active:scale-95 transition-all"
          >
            <MaterialIcon name="call" className="text-on-surface" />
          </button>
          <CancelRideButton rideId={ride.id} />
        </div>
      </div>
    </div>
  );
}

/**
 * Red circular cancel button. Posts to /api/rides/{id} with action: "cancel"
 * and lets the realtime subscription update the parent view automatically.
 */
function CancelRideButton({ rideId }: { rideId: string }) {
  async function cancel() {
    await fetch(`/api/rides/${rideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
  }
  return (
    <button
      type="button"
      aria-label="Cancel ride"
      onClick={cancel}
      className="w-14 h-14 bg-error-container/20 rounded-full flex items-center justify-center border border-error/20 active:scale-95 transition-all"
    >
      <MaterialIcon name="close" className="text-error" />
    </button>
  );
}
