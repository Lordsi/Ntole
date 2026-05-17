"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { MenuIcon, BellIcon, SteeringWheelIcon } from "@/components/ui/icons";
import { RatingStars } from "@/components/ui/rating-stars";
import { formatDistance, formatDuration, formatMoney } from "@/lib/utils/format";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useDriverLocationPublisher } from "@/lib/realtime/use-driver-location";
import type { Driver, Profile, Ride, RideTier, Vehicle } from "@/lib/supabase/types";

interface DriverHomeProps {
  profile: Profile;
  driver: Driver | null;
  vehicle: Vehicle | null;
  tiers: RideTier[];
  activeRideId: string | null;
}

export function DriverHome({
  profile,
  driver,
  vehicle,
  tiers,
  activeRideId,
}: DriverHomeProps) {
  const router = useRouter();
  const [online, setOnline] = useState(driver?.status === "online");
  const [busy, setBusy] = useState(false);
  const [incoming, setIncoming] = useState<Ride[]>([]);

  // Push location to Supabase while online.
  useDriverLocationPublisher({ driverId: profile.id, enabled: online });

  // Subscribe to incoming requests in this tier (or any tier if no vehicle).
  useEffect(() => {
    if (!online) {
      setIncoming([]);
      return;
    }
    const supabase = createBrowserSupabaseClient();
    const tierId = vehicle?.tier_id;

    void supabase
      .from("rides")
      .select("*")
      .eq("status", "requested")
      .order("requested_at", { ascending: true })
      .then(({ data }) =>
        setIncoming(((data ?? []) as Ride[]).filter((r) => !tierId || r.tier_id === tierId)),
      );

    const channel = supabase
      .channel("driver-incoming")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          const newRow = (payload.new ?? payload.old) as Ride | undefined;
          if (!newRow) return;
          if (tierId && newRow.tier_id !== tierId) return;
          setIncoming((prev) => {
            const without = prev.filter((p) => p.id !== newRow.id);
            if (payload.eventType === "INSERT" && newRow.status === "requested") {
              return [...without, newRow];
            }
            if (
              payload.eventType === "UPDATE" &&
              newRow.status === "requested"
            ) {
              return [...without, newRow];
            }
            return without;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [online, vehicle?.tier_id]);

  async function toggleOnline() {
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const next = online ? "offline" : "online";
      // Upsert ensures the driver row exists even on first sign-in.
      await supabase.from("drivers").upsert(
        {
          profile_id: profile.id,
          status: next,
          last_seen_at: new Date().toISOString(),
          vehicle_id: vehicle?.id ?? null,
        },
        { onConflict: "profile_id" },
      );
      setOnline(!online);
    } finally {
      setBusy(false);
    }
  }

  async function accept(rideId: string) {
    const res = await fetch(`/api/rides/${rideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    if (res.ok) {
      router.push(`/driver/ride/${rideId}`);
    } else {
      setIncoming((prev) => prev.filter((r) => r.id !== rideId));
    }
  }

  function decline(rideId: string) {
    setIncoming((prev) => prev.filter((r) => r.id !== rideId));
  }

  const tierById = useMemo(() => new Map(tiers.map((t) => [t.id, t])), [tiers]);

  return (
    <div className="flex min-h-screen flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between">
        <IconButton aria-label="Menu">
          <MenuIcon className="h-5 w-5" />
        </IconButton>
        <div className="flex items-center gap-3">
          <IconButton aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
          </IconButton>
          <Link href="/driver/profile">
            <Avatar name={profile.full_name} src={profile.avatar_url} size={44} />
          </Link>
        </div>
      </header>

      <Card className="flex items-center gap-4">
        <div className="flex flex-1 flex-col">
          <span className="text-xs uppercase tracking-wide text-muted">
            {online ? "You are online" : "You are offline"}
          </span>
          <span className="mt-1 text-lg font-semibold">
            {profile.full_name || "Driver"}
          </span>
          <RatingStars value={profile.rating} showValue className="mt-1" />
          {vehicle && (
            <span className="mt-2 text-xs text-muted">
              {vehicle.make} {vehicle.model} · {vehicle.plate_number}
            </span>
          )}
        </div>
        <button
          onClick={toggleOnline}
          disabled={busy}
          className={`grid h-20 w-20 place-items-center rounded-full font-semibold transition-colors ${
            online
              ? "bg-accent text-background"
              : "bg-surface-2 text-white ring-1 ring-white/10"
          }`}
        >
          <SteeringWheelIcon className="h-6 w-6" />
          <span className="text-[10px] uppercase tracking-wide">
            {online ? "Online" : "Go online"}
          </span>
        </button>
      </Card>

      {activeRideId && (
        <Link href={`/driver/ride/${activeRideId}`}>
          <Card className="flex items-center justify-between bg-accent/10 ring-accent/40 hover:bg-accent/15">
            <span className="text-sm font-semibold text-accent">
              Resume active trip
            </span>
            <span className="text-xs text-accent">Open →</span>
          </Card>
        </Link>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          {online
            ? incoming.length === 0
              ? "Waiting for ride requests..."
              : "Incoming requests"
            : "Go online to receive requests"}
        </h2>
        {incoming.map((ride) => {
          const tier = tierById.get(ride.tier_id);
          return (
            <Card key={ride.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {tier?.name ?? "Trip"}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDistance(ride.quoted_distance_km)} ·{" "}
                    {formatDuration(ride.quoted_duration_min)}
                  </span>
                </div>
                <span className="text-base font-semibold">
                  {formatMoney(ride.fare_minor, ride.currency)}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="line-clamp-1">
                  <span className="text-muted">Pickup</span> · {ride.pickup_address || "—"}
                </span>
                <span className="line-clamp-1">
                  <span className="text-muted">Drop</span> · {ride.drop_address || "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => decline(ride.id)}
                >
                  Decline
                </Button>
                <Button fullWidth onClick={() => accept(ride.id)}>
                  Accept
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Link href="/driver/earnings" className="mt-auto">
        <Card className="flex items-center justify-between hover:bg-surface-2">
          <span className="text-sm font-semibold">Earnings</span>
          <span className="text-xs text-muted">View →</span>
        </Card>
      </Link>
    </div>
  );
}
