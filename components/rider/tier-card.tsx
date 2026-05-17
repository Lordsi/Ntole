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
      aria-pressed={active}
      className={cn(
        "flex w-40 shrink-0 flex-col gap-4 rounded-2xl p-4 text-left transition-[background-color,transform,color,box-shadow] duration-200 ease-out active:scale-[0.98]",
        active
          ? "bg-accent text-black shadow-glow"
          : "glass text-white hover:bg-white/[0.04]",
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[16px] font-bold tracking-[-0.02em]">
          {tier.name}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-medium",
            active ? "text-black/70" : "text-muted-strong",
          )}
        >
          <SeatIcon className="h-3.5 w-3.5" />
          <span>{tier.seats} Seat</span>
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full",
            active ? "bg-black/15" : "bg-white/5 ring-1 ring-white/5",
          )}
        >
          <SteeringWheelIcon
            className={cn("h-4 w-4", active ? "text-black" : "text-white")}
          />
        </span>
        <span className="text-[20px] font-bold tracking-[-0.03em]">
          {loading
            ? "…"
            : fareMinor !== undefined
              ? formatMoney(fareMinor, tier.currency)
              : durationMin
                ? formatDuration(durationMin)
                : "—"}
        </span>
      </div>
    </button>
  );
}
