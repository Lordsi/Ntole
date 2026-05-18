"use client";

import {
  formatMoney,
  formatDistance,
  formatDuration,
} from "@/lib/utils/format";
import type { Ride, RideTier } from "@/lib/supabase/types";

interface WaitingForMatchPanelProps {
  ride: Ride;
  tier: RideTier;
  onCancel: () => void;
}

/**
 * "Looking for nearby drivers" panel — used while ride.status === "requested".
 * Pulsing neon orb, ride summary, and a Cancel action.
 */
export function WaitingForMatchPanel({
  ride,
  tier,
  onCancel,
}: WaitingForMatchPanelProps) {
  return (
    <div className="relative bg-surface-container-low rounded-t-lg shadow-[0_-10px_40px_rgba(0,0,0,0.6)] border-t border-white/5">
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-outline-variant/40" />

      <div className="px-margin-mobile pt-lg pb-xl flex flex-col gap-lg">
        <div className="flex items-center gap-md">
          <span className="relative grid h-12 w-12 place-items-center rounded-full bg-primary-container/15">
            <span className="absolute inset-0 animate-pulse-soft rounded-full bg-primary-container/25" />
            <span className="relative h-3 w-3 rounded-full bg-primary-container shadow-[0_0_12px_#39ff14]" />
          </span>
          <div className="flex flex-1 flex-col leading-tight">
            <span className="font-headline-md text-headline-md text-on-surface">
              Looking for nearby drivers…
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {tier.name} · {formatDistance(ride.quoted_distance_km)} ·{" "}
              {formatDuration(ride.quoted_duration_min)}
            </span>
          </div>
          <span className="font-label-md text-label-md font-bold text-primary-container">
            {formatMoney(ride.fare_minor, ride.currency)}
          </span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-md rounded-full bg-surface-container-highest text-on-surface font-headline-md text-label-md active:scale-95 transition-transform border border-outline-variant/30"
        >
          Cancel request
        </button>
      </div>
    </div>
  );
}
