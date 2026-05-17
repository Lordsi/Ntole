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
  SwapIcon,
} from "@/components/ui/icons";

import { LocationInput } from "./location-input";
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

  function swap() {
    setPickup(drop);
    setDrop(pickup);
  }

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
    <div className="flex min-h-screen flex-col gap-5 px-5 py-6">
      <header className="flex items-center justify-between">
        <IconButton aria-label="Menu">
          <MenuIcon className="h-5 w-5" />
        </IconButton>
        <div className="flex items-center gap-3">
          <IconButton aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
          </IconButton>
          {isAuthed ? (
            <Link href="/rider/profile" aria-label="Profile">
              <Avatar
                name={profile.full_name || "Rider"}
                src={profile.avatar_url}
                size={44}
              />
            </Link>
          ) : (
            <Link
              href="/login?next=/rider"
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black hover:bg-accent/90"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <h1 className="text-[34px] font-bold leading-[1.05] tracking-tight">
        Where do you
        <br />
        want to go?
      </h1>

      {isAuthed ? (
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-white/5">
          <Avatar
            name={profile.full_name || "Rider"}
            src={profile.avatar_url}
            size={44}
          />
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">
              {profile.full_name || "Welcome back"}
            </span>
            <span className="text-xs text-muted">
              {profile.trip_count} trips completed
            </span>
          </div>
          <RatingStars value={profile.rating} />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-white/5">
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-semibold">Browsing as a guest</span>
            <span className="text-xs text-muted">
              Preview prices freely. Sign in only when you&rsquo;re ready to ride.
            </span>
          </div>
          <Link
            href="/login?next=/rider"
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-black hover:bg-accent/90"
          >
            Sign in
          </Link>
        </div>
      )}

      <div className="relative flex flex-col gap-2">
        <LocationInput
          variant="pickup"
          placeholder="Add a pick-up location"
          value={pickup}
          onChange={setPickup}
        />
        <button
          type="button"
          onClick={swap}
          className="absolute left-1/2 top-[58px] z-10 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full bg-surface-2 ring-1 ring-white/10 hover:bg-surface-3"
          aria-label="Swap pickup and drop"
        >
          <SwapIcon className="h-4 w-4 text-white" />
        </button>
        <LocationInput
          variant="drop"
          placeholder="Add your destination"
          value={drop}
          onChange={setDrop}
        />
      </div>

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

      {distanceKm !== undefined && durationMin !== undefined && (
        <p className="text-xs text-muted">
          Estimated trip: {distanceKm.toFixed(1)} km · {Math.round(durationMin)} min
        </p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

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
