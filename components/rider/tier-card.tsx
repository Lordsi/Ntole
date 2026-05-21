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
  /** Approximate ETA in minutes, derived from the route distance + speed. */
  etaMin?: number;
  onClick?: () => void;
}

function iconFor(name: string): string {
  const k = name.toLowerCase();
  if (k.includes("lux") || k.includes("premium")) return "diamond";
  if (k.includes("comfort") || k.includes("plus")) return "minor_crash";
  if (k.includes("xl") || k.includes("van") || k.includes("six"))
    return "airport_shuttle";
  return "directions_car";
}

function badgeFor(name: string): string | null {
  const k = name.toLowerCase();
  if (k.includes("lux") || k.includes("premium")) return "Premium";
  if (k.includes("comfort") || k.includes("plus")) return "Comfort";
  if (k.includes("xl") || k.includes("van") || k.includes("six")) return "XL";
  return null;
}

/**
 * Single ride-tier card in the bottom carousel of the rider home. The
 * card has three visual tiers:
 *
 *   - inactive — glass tile, muted icon, monochrome fare
 *   - active   — neon-accented border, halo glow, brighter fare
 *   - loading  — skeleton placeholder for the fare line
 *
 * Includes optional ETA + surge ribbon to give riders the same data they
 * would get from a real ride-hailing carousel.
 */
export function TierCard({
  tier,
  fareMinor,
  active,
  loading,
  etaMin,
  onClick,
}: TierCardProps) {
  const symbol = iconFor(tier.name);
  const badge = badgeFor(tier.name);
  const surging = tier.surge_multiplier > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group snap-center min-w-[170px] relative rounded-lg p-md flex flex-col gap-sm text-left transition-all duration-200 active:scale-[0.98] overflow-hidden",
        "border backdrop-blur-xl",
        active
          ? "bg-primary-container/[0.08] border-primary-container/50 shadow-[0_8px_32px_rgba(57,255,20,0.25)]"
          : "bg-white/[0.04] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      {/* Soft inner glow on the active card. */}
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_top,rgba(57,255,20,0.18),transparent_70%)]"
        />
      )}

      <div className="relative flex justify-between items-start">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full transition-colors",
            active
              ? "bg-primary-container/15 text-primary-container"
              : "bg-white/[0.05] text-on-surface-variant group-hover:text-on-surface",
          )}
        >
          <MaterialIcon
            name={symbol}
            filled={active}
            className="text-[22px]"
          />
        </span>
        <div className="flex flex-col items-end gap-xs">
          {badge && (
            <span
              className={cn(
                "px-sm py-[2px] rounded-full text-[10px] font-bold tracking-[0.12em] uppercase",
                active
                  ? "bg-primary-container/20 text-primary-container"
                  : "bg-white/[0.06] text-on-surface-variant",
              )}
            >
              {badge}
            </span>
          )}
          {surging && (
            <span className="inline-flex items-center gap-xs rounded-full bg-warning/20 px-sm py-[2px] text-[10px] font-bold tracking-[0.08em] uppercase text-warning">
              <MaterialIcon name="bolt" className="text-[12px]" />
              {tier.surge_multiplier.toFixed(1)}×
            </span>
          )}
        </div>
      </div>

      <div className="relative flex flex-col gap-xs">
        <p className="font-headline-md text-headline-md text-on-surface leading-none">
          {tier.name}
        </p>
        <div className="flex items-center gap-md text-on-surface-variant">
          <span className="inline-flex items-center gap-xs">
            <MaterialIcon name="group" className="text-[14px]" />
            <span className="font-label-sm text-label-sm">{tier.seats}</span>
          </span>
          {etaMin !== undefined && (
            <span className="inline-flex items-center gap-xs">
              <MaterialIcon name="schedule" className="text-[14px]" />
              <span className="font-label-sm text-label-sm">
                {Math.max(1, Math.round(etaMin))} min
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="relative mt-sm">
        {loading ? (
          <span className="block h-5 w-20 rounded-md bg-white/[0.08] animate-pulse-soft" />
        ) : fareMinor !== undefined ? (
          <span
            className={cn(
              "font-headline-md text-headline-md font-bold tracking-tight",
              active ? "text-primary-container" : "text-on-surface",
            )}
          >
            {formatMoney(fareMinor, tier.currency)}
          </span>
        ) : (
          <span className="font-label-md text-label-md text-on-surface-variant">
            Set a destination
          </span>
        )}
      </div>
    </button>
  );
}
