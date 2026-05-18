"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { RiderShell } from "@/components/shared/role-shell";
import { cn } from "@/lib/utils/cn";

import { LocationStack } from "./location-stack";
import { TierCard } from "./tier-card";

import type { Profile, RideTier } from "@/lib/supabase/types";
import type { PlaceSuggestion } from "@/lib/maps/types";

interface RiderHomeProps {
  profile: Profile | null;
  tiers: RideTier[];
}

interface QuoteRow {
  tier: RideTier;
  fare: { total_minor: number; currency: string };
}

const PENDING_RIDE_STORAGE_KEY = "ntole.pendingRide";

interface PendingRide {
  mode: "driver" | "package";
  pickup: PlaceSuggestion | null;
  drop: PlaceSuggestion | null;
  selectedTierId: string;
}

export function RiderHome({ profile, tiers }: RiderHomeProps) {
  const router = useRouter();
  const isAuthed = profile !== null;

  const [mode, setMode] = useState<"driver" | "package">("driver");
  const [pickup, setPickup] = useState<PlaceSuggestion | null>(null);
  const [drop, setDrop] = useState<PlaceSuggestion | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string>(
    tiers[0]?.id ?? "",
  );
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [durationMin, setDurationMin] = useState<number | undefined>();
  const [distanceKm, setDistanceKm] = useState<number | undefined>();
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore in-progress form after a sign-in round-trip.
  useEffect(() => {
    if (!isAuthed || typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(PENDING_RIDE_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as PendingRide;
      if (saved.mode) setMode(saved.mode);
      if (saved.pickup) setPickup(saved.pickup);
      if (saved.drop) setDrop(saved.drop);
      if (saved.selectedTierId) setSelectedTierId(saved.selectedTierId);
    } catch {
      // ignore malformed storage
    }
    window.sessionStorage.removeItem(PENDING_RIDE_STORAGE_KEY);
  }, [isAuthed]);

  useEffect(() => {
    if (!pickup || !drop) {
      setQuotes([]);
      setDurationMin(undefined);
      setDistanceKm(undefined);
      return;
    }
    const ctrl = new AbortController();
    setLoadingQuote(true);
    setError(null);
    fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickup: { lat: pickup.lat, lng: pickup.lng },
        drop: { lat: drop.lat, lng: drop.lng },
      }),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuotes(data.quotes ?? []);
        setDistanceKm(data.distanceKm);
        setDurationMin(data.durationMin);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoadingQuote(false));
    return () => ctrl.abort();
  }, [pickup, drop]);

  const fareByTier = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of quotes) map.set(q.tier.id, q.fare.total_minor);
    return map;
  }, [quotes]);

  function persistPendingRide() {
    if (typeof window === "undefined") return;
    const payload: PendingRide = { mode, pickup, drop, selectedTierId };
    window.sessionStorage.setItem(
      PENDING_RIDE_STORAGE_KEY,
      JSON.stringify(payload),
    );
  }

  async function requestRide() {
    if (!pickup || !drop || !selectedTierId) return;

    if (!isAuthed) {
      persistPendingRide();
      router.push("/login?next=/rider");
      return;
    }

    setRequesting(true);
    setError(null);
    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup: { lat: pickup.lat, lng: pickup.lng, address: pickup.label },
          drop: { lat: drop.lat, lng: drop.lng, address: drop.label },
          tierId: selectedTierId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to request ride");
      router.push(`/rider/ride/${data.ride.id}`);
    } catch (err) {
      setError((err as Error).message);
      setRequesting(false);
    }
  }

  const canRequest = Boolean(pickup && drop && selectedTierId);
  const requestLabel = !isAuthed
    ? mode === "driver"
      ? "Sign in to request ride"
      : "Sign in to send package"
    : requesting
      ? "Requesting…"
      : mode === "driver"
        ? "Request Ride"
        : "Send Package";

  return (
    <RiderShell profile={profile}>
        {/* Hero Section */}
        <section className="mb-xl">
          <h2 className="font-display-lg text-[40px] leading-tight text-primary font-extrabold tracking-tight max-w-[280px]">
            Where do you want to go?
          </h2>
          {!isAuthed && (
            <p className="mt-sm text-body-md text-on-surface-variant">
              Preview fares as a guest.{" "}
              <Link
                href="/login?next=/rider"
                className="text-primary-container hover:underline"
              >
                Sign in
              </Link>{" "}
              to book.
            </p>
          )}
        </section>

        {/* Main Interaction Hub */}
        <div className="flex flex-col gap-lg">
          {/* Ride/Package Toggle */}
          <div className="flex justify-center">
            <div className="bg-surface-container-highest p-xs rounded-full flex w-full max-w-[320px]">
              <button
                type="button"
                onClick={() => setMode("driver")}
                className={cn(
                  "flex-1 py-sm rounded-full font-label-md text-label-md transition-all",
                  mode === "driver"
                    ? "bg-primary-container text-on-primary-container font-bold shadow-lg shadow-primary-container/20"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => setMode("package")}
                className={cn(
                  "flex-1 py-sm rounded-full font-label-md text-label-md transition-all",
                  mode === "package"
                    ? "bg-primary-container text-on-primary-container font-bold shadow-lg shadow-primary-container/20"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                Package
              </button>
            </div>
          </div>

          {/* LocationStack Card */}
          <LocationStack
            pickup={pickup}
            drop={drop}
            onPickupChange={setPickup}
            onDropChange={setDrop}
          />

          {/* Ride Carousel Section */}
          <section className="mt-md">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-label-sm text-label-sm text-on-surface-variant tracking-widest uppercase">
                Choose a Ride
              </h3>
              {distanceKm !== undefined && durationMin !== undefined && (
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {distanceKm.toFixed(1)} km · {Math.round(durationMin)} min
                </span>
              )}
            </div>
            <div className="flex gap-md overflow-x-auto pb-md no-scrollbar snap-x">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  active={tier.id === selectedTierId}
                  onClick={() => setSelectedTierId(tier.id)}
                  fareMinor={fareByTier.get(tier.id)}
                  loading={loadingQuote && pickup !== null && drop !== null}
                />
              ))}
            </div>
          </section>

          {error && (
            <p
              className="font-label-md text-label-md text-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Primary CTA sits inline at the end of the form so it never
              overlaps the destination input or tier cards. The bottom nav
              still floats above it because MobileShell reserves bottom
              padding via pb-32 on <main>. */}
          <button
            type="button"
            disabled={!canRequest || requesting}
            onClick={requestRide}
            className={cn(
              "mt-md w-full py-md rounded-full font-headline-md text-headline-md font-extrabold uppercase tracking-tight transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2 disabled:cursor-not-allowed",
              canRequest && !requesting
                ? "bg-primary-container text-on-primary-container shadow-[0_10px_30px_rgba(57,255,20,0.3)] neon-glow-primary"
                : "bg-surface-container-highest text-on-surface-variant",
            )}
          >
            {requestLabel}
          </button>
        </div>
    </RiderShell>
  );
}

