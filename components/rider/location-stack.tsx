"use client";

import { MaterialIcon } from "@/components/ui/material-icon";
import type { PlaceSuggestion } from "@/lib/maps/types";

import { LocationInput } from "./location-input";

interface LocationStackProps {
  pickup: PlaceSuggestion | null;
  drop: PlaceSuggestion | null;
  onPickupChange: (value: PlaceSuggestion | null) => void;
  onDropChange: (value: PlaceSuggestion | null) => void;
}

/**
 * The pickup / destination input stack from Stitch's rider_request_a_ride
 * mock. Renders a glass-panel container with two rows: a hollow grey
 * pickup indicator connected by a dotted line to a solid neon-green
 * destination indicator. A circular swap button is anchored to the
 * right edge.
 */
export function LocationStack({
  pickup,
  drop,
  onPickupChange,
  onDropChange,
}: LocationStackProps) {
  function swap() {
    onPickupChange(drop);
    onDropChange(pickup);
  }

  return (
    <div className="glass-panel rounded-lg p-lg relative overflow-hidden">
      <div className="flex flex-col gap-md">
        {/* Pickup */}
        <div className="flex items-center gap-md">
          <div className="w-6 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full border-2 border-outline-variant bg-surface" />
            <div className="w-px h-10 border-l-2 border-dotted border-outline-variant my-xs" />
          </div>
          <div className="flex-1">
            <LocationInput
              variant="pickup"
              label="Pickup Location"
              placeholder="Add a pick-up location"
              value={pickup}
              onChange={onPickupChange}
            />
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-md">
          <div className="w-6 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-primary-container neon-glow-primary" />
          </div>
          <div className="flex-1">
            <LocationInput
              variant="drop"
              label="Destination"
              placeholder="Add your destination"
              value={drop}
              onChange={onDropChange}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={swap}
        aria-label="Swap pickup and destination"
        className="absolute right-gutter top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-panel flex items-center justify-center text-primary-container border-primary-container/40 active:scale-90 transition-transform"
      >
        <MaterialIcon name="swap_vert" />
      </button>
    </div>
  );
}
