"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Ride } from "@/lib/supabase/types";

export function CancelledRidePanel({ ride }: { ride: Ride }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted">Trip cancelled</span>
        <span className="text-base font-semibold">
          {ride.cancellation_reason || "This ride was cancelled."}
        </span>
      </div>
      <Link href="/rider">
        <Button fullWidth>Back to home</Button>
      </Link>
    </Card>
  );
}
