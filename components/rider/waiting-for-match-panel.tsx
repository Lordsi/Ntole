"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDistance, formatDuration } from "@/lib/utils/format";
import type { Ride, RideTier } from "@/lib/supabase/types";

interface WaitingForMatchPanelProps {
  ride: Ride;
  tier: RideTier;
  onCancel: () => void;
}

export function WaitingForMatchPanel({ ride, tier, onCancel }: WaitingForMatchPanelProps) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="relative grid h-12 w-12 place-items-center rounded-full bg-accent/15">
          <span className="absolute inset-0 animate-pulse-soft rounded-full bg-accent/20" />
          <span className="relative h-3 w-3 rounded-full bg-accent" />
        </span>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-semibold">Looking for nearby drivers...</span>
          <span className="text-xs text-muted">
            {tier.name} · {formatDistance(ride.quoted_distance_km)} ·{" "}
            {formatDuration(ride.quoted_duration_min)}
          </span>
        </div>
        <span className="text-base font-semibold">
          {formatMoney(ride.fare_minor, ride.currency)}
        </span>
      </div>
      <Button variant="secondary" fullWidth onClick={onCancel}>
        Cancel request
      </Button>
    </Card>
  );
}
