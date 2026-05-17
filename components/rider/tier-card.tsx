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
        "flex w-40 shrink-0 flex-col gap-3 rounded-3xl p-4 text-left transition-[background-color,transform,color] duration-200 ease-out active:scale-[0.98]",
        active
          ? "bg-accent text-black"
          : "bg-surface text-white hover:bg-surface-2",
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold tracking-[-0.01em]">
          {tier.name}
        </span>
        <span
          className={cn(
            "text-[12px]",
            active ? "text-black/65" : "text-muted",
          )}
        >
          {durationMin ? formatDuration(durationMin) : "—"}
        </span>
      </div>
      <div
        className={cn(
          "inline-flex items-center gap-1 text-[12px] font-medium",
          active ? "text-black/75" : "text-muted-strong",
        )}
      >
        <SeatIcon className="h-3.5 w-3.5" />
        <span>{tier.seats}</span>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full",
            active ? "bg-black/10" : "bg-surface-2",
          )}
        >
          <SteeringWheelIcon
            className={cn("h-4 w-4", active ? "text-black" : "text-white")}
          />
        </span>
        <span className="text-[17px] font-bold tracking-[-0.02em]">
          {loading
            ? "…"
            : fareMinor !== undefined
              ? formatMoney(fareMinor, tier.currency)
              : "—"}
        </span>
      </div>
    </button>
  );
}
