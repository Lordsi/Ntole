"use client";

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/utils/format";
import type { RideTier } from "@/lib/supabase/types";

interface TierCardProps {
  tier: RideTier;
  fareMinor?: number;
  active?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

/** Pick a Material Symbol that fits the tier. */
function iconFor(name: string): string {
  const k = name.toLowerCase();
  if (k.includes("lux") || k.includes("premium")) return "star";
  if (k.includes("comfort") || k.includes("plus")) return "minor_crash";
  return "directions_car";
}

/** Pick the small uppercase badge text shown in the top-right of each card. */
function badgeFor(name: string): string | null {
  const k = name.toLowerCase();
  if (k.includes("lux") || k.includes("premium")) return "PREMIUM";
  if (k.includes("comfort") || k.includes("plus")) return "COMFORT";
  return "ECONOMY";
}

/**
 * Stitch ride carousel card. Two visual states:
 *   - active   → neon-tinted glass-panel with primary-container border/icon
 *   - inactive → plain glass-panel with on-surface-variant icon
 */
export function TierCard({
  tier,
  fareMinor,
  active,
  loading,
  onClick,
}: TierCardProps) {
  const symbol = iconFor(tier.name);
  const badge = badgeFor(tier.name);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "snap-center min-w-[160px] lg:min-w-0 lg:w-full glass-panel p-md rounded-xl flex flex-col gap-sm lg:flex-row lg:items-center lg:gap-md text-left transition-all duration-200 active:scale-[0.98] hover:border-white/20",
        active && "border-primary-container/40 bg-primary-container/5 ring-1 ring-primary-container/20",
      )}
    >
      <div className="flex justify-between items-start lg:contents">
        <MaterialIcon
          name={symbol}
          filled={active}
          className={cn(
            "text-[32px] lg:shrink-0",
            active ? "text-primary-container" : "text-on-surface-variant",
          )}
        />
        {badge && active && (
          <span className="bg-primary-container/20 text-primary-container px-sm py-[2px] rounded-full text-[10px] font-bold tracking-wider lg:hidden">
            {badge}
          </span>
        )}
      </div>
      <div className="lg:flex-1 lg:min-w-0">
        <p className="font-headline-md text-headline-md text-on-surface">
          {tier.name}
        </p>
        <div className="flex items-center gap-xs text-on-surface-variant">
          <MaterialIcon name="group" className="text-[14px]" />
          <span className="text-label-sm font-label-sm">{tier.seats}</span>
          {badge && active && (
            <span className="hidden lg:inline bg-primary-container/20 text-primary-container px-sm py-[2px] rounded-full text-[10px] font-bold tracking-wider ml-sm">
              {badge}
            </span>
          )}
        </div>
      </div>
      <p
        className={cn(
          "font-data text-label-md mt-sm lg:mt-0 font-semibold lg:ml-auto lg:text-right lg:shrink-0",
          active ? "text-primary-container" : "text-on-surface",
        )}
      >
        {loading
          ? "…"
          : fareMinor !== undefined
            ? formatMoney(fareMinor, tier.currency)
            : "—"}
      </p>
    </button>
  );
}
