"use client";

import { cn } from "@/lib/utils/cn";
import { SwapIcon } from "@/components/ui/icons";
import type { PlaceSuggestion } from "@/lib/maps/types";

import { LocationInput } from "./location-input";

interface LocationStackProps {
  pickup: PlaceSuggestion | null;
  drop: PlaceSuggestion | null;
  onPickupChange: (value: PlaceSuggestion | null) => void;
  onDropChange: (value: PlaceSuggestion | null) => void;
  className?: string;
}

/**
 * Apple Maps-style grouped destination input: two flush rows sharing a single
 * surface, with a fine divider between them and the swap button slotted into
 * the divider track on the right.
 */
export function LocationStack({
  pickup,
  drop,
  onPickupChange,
  onDropChange,
  className,
}: LocationStackProps) {
  function swap() {
    onPickupChange(drop);
    onDropChange(pickup);
  }

  return (
    <div
      className={cn(
        "relative rounded-3xl glass shadow-card overflow-hidden",
        className,
      )}
    >
      <LocationInput
        flush
        variant="pickup"
        placeholder="Add a pick-up location"
        value={pickup}
        onChange={onPickupChange}
      />

      {/* Hairline divider, indented under the indicator column. */}
      <div className="ml-[52px] h-px bg-white/10" />

      <LocationInput
        flush
        variant="drop"
        placeholder="Add your destination"
        value={drop}
        onChange={onDropChange}
      />

      <button
        type="button"
        onClick={swap}
        aria-label="Swap pickup and destination"
        className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-surface-2/90 text-white ring-1 ring-white/10 backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-surface-3 active:scale-95"
      >
        <SwapIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
