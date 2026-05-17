"use client";

import { cn } from "@/lib/utils/cn";
import { formatMoney, formatDuration } from "@/lib/utils/format";
import { SeatIcon, SteeringWheelIcon } from "@/components/ui/icons";
import type { RideTier } from "@/lib/supabase/types";

interface TierCardProps {
  tier: RideTier;
  fareMinor?: number;
  durationMin?: number;
  active?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export function TierCard({
  tier,
  fareMinor,
  durationMin,
  active,
  loading,
  onClick,
}: TierCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-44 shrink-0 flex-col gap-3 rounded-3xl p-4 text-left transition-colors",
        active
          ? "bg-accent text-background ring-2 ring-accent"
          : "bg-surface text-white ring-1 ring-white/5 hover:bg-surface-2",
      )}
    >
      <div className="flex flex-col">
        <span className="text-base font-semibold">{tier.name}</span>
        <span
          className={cn(
            "text-xs",
            active ? "text-background/70" : "text-muted",
          )}
        >
          {durationMin ? formatDuration(durationMin) : "—"}
        </span>
      </div>
      <div
        className={cn(
          "inline-flex items-center gap-1 text-xs",
          active ? "text-background/80" : "text-muted-strong",
        )}
      >
        <SeatIcon className="h-3.5 w-3.5" />
        <span>{tier.seats}</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full",
            active ? "bg-background/15" : "bg-surface-2",
          )}
        >
          <SteeringWheelIcon
            className={cn(
              "h-4 w-4",
              active ? "text-background" : "text-white",
            )}
          />
        </span>
        <span className="text-base font-semibold">
          {loading
            ? "..."
            : fareMinor !== undefined
              ? formatMoney(fareMinor, tier.currency)
              : "—"}
        </span>
      </div>
    </button>
  );
}
