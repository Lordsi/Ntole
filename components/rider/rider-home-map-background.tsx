"use client";

import dynamic from "next/dynamic";

import type { LatLng } from "@/lib/maps/types";

const RideMap = dynamic(() => import("@/components/map/ride-map"), {
  ssr: false,
  loading: () => null,
});

/**
 * Ambient map that sits behind the rider home form. Fixed to the viewport,
 * non-interactive, dimmed, and with a top→bottom mask that fades into the
 * background so the chrome (top app bar + bottom nav) doesn't look like
 * it's slapped over an unrelated image.
 *
 * Re-centers on the user's GPS coordinates as soon as they're known.
 */
export function RiderHomeMapBackground({ center }: { center: LatLng | null }) {
  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-60 saturate-50">
        <RideMap
          center={center ?? undefined}
          recenterTo={center}
          markersHidden
          className="h-full w-full"
          zoom={center ? 14 : 12}
        />
      </div>
      {/* Top fade keeps the greeting card readable; bottom fade lets the
          tier carousel + CTA breathe into solid background. */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-background via-background/85 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background via-background/85 to-transparent" />
      {/* Subtle neon ambience to tie the map into the brand palette. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(57,255,20,0.10),transparent_55%),radial-gradient(circle_at_85%_75%,rgba(57,255,20,0.07),transparent_45%)]" />
    </div>
  );
}
