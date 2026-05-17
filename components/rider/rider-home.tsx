"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { PillToggle } from "@/components/ui/pill-toggle";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  BellIcon,
  MenuIcon,
  PackageIcon,
  SteeringWheelIcon,
} from "@/components/ui/icons";

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

// Form state we persist across the sign-in round-trip so anonymous users
// don't have to re-enter pickup/drop after they log in.
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

  // After signing in, restore any ride form the user was building.
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

  // Stash the in-progress form so it survives the trip through /login.
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
      ? "Requesting..."
      : mode === "driver"
        ? "Request ride"
        : "Send package";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-5 pb-6 pt-5">
      <header className="flex items-center justify-between">
        <IconButton aria-label="Menu" size={44}>
          <MenuIcon className="h-[18px] w-[18px]" />
        </IconButton>
        <div className="flex items-center gap-2.5">
          <IconButton aria-label="Notifications" size={44}>
            <BellIcon className="h-[18px] w-[18px]" />
          </IconButton>
          {isAuthed ? (
            <Link href="/rider/profile" aria-label="Profile" className="rounded-full ring-1 ring-white/10">
              <Avatar
                name={profile.full_name || "Rider"}
                src={profile.avatar_url}
                size={44}
              />
            </Link>
          ) : (
            <Link
              href="/login?next=/rider"
              className="inline-flex h-11 items-center rounded-full bg-accent px-4 text-[14px] font-semibold tracking-[-0.01em] text-black shadow-glow transition-colors hover:bg-accent-hover"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-[40px] font-bold leading-[1.02] tracking-[-0.03em]">
          Where do you{" "}
          <span className="text-muted-strong/80">want to go?</span>
        </h1>
        {!isAuthed && (
          <p className="text-[15px] text-muted">
            Preview fares as a guest.{" "}
            <Link
              href="/login?next=/rider"
              className="text-accent transition-colors hover:text-accent-hover"
            >
              Sign in
            </Link>{" "}
            to book.
          </p>
        )}
      </div>

      {/* Optional active-driver banner — shown for authenticated riders as a
          quick reminder that they have a previous driver they liked. Hidden
          for guests so the empty state stays clean. */}
      {isAuthed && <ActiveDriverBanner name={profile.full_name} />}

      <LocationStack
        pickup={pickup}
        drop={drop}
        onPickupChange={setPickup}
        onDropChange={setDrop}
      />

      <PillToggle
        value={mode}
        onChange={setMode}
        options={[
          {
            value: "driver",
            label: "Driver",
            icon: <SteeringWheelIcon className="h-4 w-4" />,
          },
          {
            value: "package",
            label: "Package",
            icon: <PackageIcon className="h-4 w-4" />,
          },
        ]}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted">
            Choose a Ride
          </h2>
          {distanceKm !== undefined && durationMin !== undefined && (
            <span className="text-[12px] text-muted">
              {distanceKm.toFixed(1)} km · {Math.round(durationMin)} min
            </span>
          )}
        </div>
        <div className="-mx-5 overflow-x-auto px-5 no-scrollbar">
          <div className="flex gap-3 pb-1">
            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                active={tier.id === selectedTierId}
                onClick={() => setSelectedTierId(tier.id)}
                fareMinor={fareByTier.get(tier.id)}
                durationMin={durationMin}
                loading={loadingQuote && pickup !== null && drop !== null}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-auto pt-2">
        <Button
          fullWidth
          size="lg"
          disabled={!canRequest || requesting}
          onClick={requestRide}
        >
          {requestLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * Compact "you recently rode with…" banner. Pure presentational right now —
 * a future iteration can pull the most recent completed ride from the API.
 */
function ActiveDriverBanner({ name }: { name?: string | null }) {
  const firstName = name?.split(" ")[0] ?? "there";
  return (
    <div className="flex items-center gap-3 rounded-2xl glass px-3 py-2.5 shadow-card">
      <Avatar name="Ucok Behel" size={36} />
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-[13px] font-semibold tracking-[-0.01em]">
          Welcome back, {firstName}
        </span>
        <span className="text-[11px] text-muted">
          Last ride · Ucok Behel · Honda CRV
        </span>
      </div>
      <RatingStars value={5} size={11} />
    </div>
  );
}
