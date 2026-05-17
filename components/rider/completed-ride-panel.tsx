"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDistance, formatDuration } from "@/lib/utils/format";
import type { Ride, RideTier } from "@/lib/supabase/types";

interface CompletedRidePanelProps {
  ride: Ride;
  tier: RideTier;
  riderId: string;
}

export function CompletedRidePanel({ ride, tier, riderId }: CompletedRidePanelProps) {
  const router = useRouter();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kick off the payment intent on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPaying(true);
        const res = await fetch(`/api/payments/intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rideId: ride.id }),
        });
        const data = await res.json();
        if (!cancelled) {
          if (!res.ok) throw new Error(data.error ?? "Payment failed");
          setPaymentStatus(data.status);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setPaying(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ride.id]);

  async function submitRating() {
    if (!ride.driver_id) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/rides/${ride.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stars, comment, raterId: riderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit rating");
      setSubmitted(true);
      setTimeout(() => router.push("/rider"), 1200);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted">Trip complete</span>
            <span className="text-xl font-semibold">
              {formatMoney(ride.fare_minor, ride.currency)}
            </span>
          </div>
          <span className="rounded-pill bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            {paying ? "Charging..." : paymentStatus === "paid" ? "Paid" : (paymentStatus ?? "Pending")}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Detail
            label="Distance"
            value={formatDistance(ride.actual_distance_km ?? ride.quoted_distance_km)}
          />
          <Detail
            label="Time"
            value={formatDuration(ride.actual_duration_min ?? ride.quoted_duration_min)}
          />
          <Detail label="Tier" value={tier.name} />
          <Detail label="From" value={ride.pickup_address || "Pickup"} />
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-sm font-semibold">How was your ride?</p>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < stars;
            return (
              <button
                key={i}
                onClick={() => setStars(i + 1)}
                aria-label={`${i + 1} stars`}
                className="text-2xl"
              >
                {filled ? "★" : "☆"}
              </button>
            );
          })}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Optional comment"
          className="min-h-[64px] resize-none rounded-2xl bg-surface-2 p-3 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <Button onClick={submitRating} disabled={submitting || submitted}>
          {submitted ? "Thanks!" : submitting ? "Submitting..." : "Submit rating"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-2xl bg-surface-2 p-3">
      <span className="text-[11px] uppercase tracking-wide text-muted">{label}</span>
      <span className="line-clamp-1 text-sm font-semibold">{value}</span>
    </div>
  );
}
