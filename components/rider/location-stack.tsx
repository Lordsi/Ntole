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
        "relative rounded-2xl bg-surface",
        className,
      )}
    >
      <LocationInput
        flush
        variant="pickup"
        placeholder="Pickup location"
        value={pickup}
        onChange={onPickupChange}
      />

      {/* Hairline divider, indented under the indicator column. */}
      <div className="ml-[52px] h-px bg-white/[0.08]" />

      <LocationInput
        flush
        variant="drop"
        placeholder="Where to?"
        value={drop}
        onChange={onDropChange}
      />

      <button
        type="button"
        onClick={swap}
        aria-label="Swap pickup and destination"
        className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-surface-2 text-muted-strong transition-[background-color,transform] duration-150 hover:bg-surface-3 hover:text-white active:scale-95"
      >
        <SwapIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
