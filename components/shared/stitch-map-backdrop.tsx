"use client";

import { cn } from "@/lib/utils/cn";

/**
 * Ambient "Night City" map backdrop used behind the rider home and driver
 * dashboard. Replicates the Stitch mock without fetching any third-party
 * imagery: a charcoal base, faint street grid, a few neon traffic streaks,
 * and a radial vignette that lets the centered phone column read as a
 * glowing device on top of a sleeping city.
 *
 * Render this **once** at the top of a page that uses `MobileShell` — the
 * shell already positions its content above the backdrop with z-index.
 */
export function StitchMapBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <div className="stitch-map-backdrop absolute inset-0 opacity-90" />
      <div className="stitch-map-vignette absolute inset-0" />
    </div>
  );
}
