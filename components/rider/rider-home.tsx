"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { MaterialIcon } from "@/components/ui/material-icon";
import { RiderShell } from "@/components/shared/role-shell";
import type { NotificationItem } from "@/components/shared/notifications-button";
import { cn } from "@/lib/utils/cn";
import { useGeolocation } from "@/lib/maps/use-geolocation";

import { LocationStack } from "./location-stack";
import { RiderHomeMapBackground } from "./rider-home-map-background";
import { TierCard } from "./tier-card";

import type { Profile, Ride, RideTier } from "@/lib/supabase/types";
import type { PlaceSuggestion } from "@/lib/maps/types";

interface RiderHomeProps {
  profile: Profile | null;
  tiers: RideTier[];
  /** Last few completed trips — power the "Recent" quick-chips. */
  recentTrips?: Pick<Ride, "id" | "drop_address" | "drop_lat" | "drop_lng">[];
  /** Items shown inside the notifications sheet from the top app bar. */
  notifications?: NotificationItem[];
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

export function RiderHome({
  profile,
  tiers,
  recentTrips = [],
  notifications,
}: RiderHomeProps) {
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
  const [city, setCity] = useState<string | null>(null);
  const [autoFillingPickup, setAutoFillingPickup] = useState(false);

  // We only ask for the user's location once at mount and only if they
  // haven't already chosen a pickup. The hook itself triggers the
  // permission prompt; ignored gracefully if denied.
  const geo = useGeolocation({ enabled: !pickup });

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

  // Reverse-geocode the GPS fix into a real address and auto-fill pickup.
  useEffect(() => {
    if (geo.status !== "ready" || pickup) return;
    const { coords } = geo;
    let cancelled = false;
    setAutoFillingPickup(true);
    fetch(`/api/geocode/reverse?lat=${coords.lat}&lng=${coords.lng}`)
      .then((r) => r.json())
      .then((data: { result: PlaceSuggestion | null }) => {
        if (cancelled) return;
        if (data.result) {
          setPickup(data.result);
          setCity(extractCity(data.result.label));
        } else {
          // Even without a label, seed pickup with raw coords so the user
          // can immediately get a quote.
          setPickup({
            label: `My location · ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
            address: `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
            lat: coords.lat,
            lng: coords.lng,
          });
        }
      })
      .catch(() => undefined)
      .finally(() => !cancelled && setAutoFillingPickup(false));
    return () => {
      cancelled = true;
    };
  }, [geo, pickup]);

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

  // Quick-pick suggestions: profile's saved Home + the rider's most recent
  // unique destinations. Deduped by address.
  const quickChips = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; icon: string; label: string; place: PlaceSuggestion }[] = [];
    if (profile?.home_lat != null && profile?.home_lng != null && profile.home_address) {
      list.push({
        id: "home",
        icon: "home",
        label: "Home",
        place: {
          label: profile.home_address,
          address: profile.home_address,
          lat: profile.home_lat,
          lng: profile.home_lng,
        },
      });
      seen.add(profile.home_address);
    }
    for (const t of recentTrips) {
      if (!t.drop_address || seen.has(t.drop_address)) continue;
      seen.add(t.drop_address);
      list.push({
        id: `recent-${t.id}`,
        icon: "history",
        label: shortLabel(t.drop_address),
        place: {
          label: t.drop_address,
          address: t.drop_address,
          lat: t.drop_lat,
          lng: t.drop_lng,
        },
      });
      if (list.length >= 5) break;
    }
    return list;
  }, [profile, recentTrips]);

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

  const geoStatusLabel = (() => {
    if (autoFillingPickup) return "Locating you…";
    if (geo.status === "loading") return "Detecting your location…";
    if (geo.status === "ready" && city) return city;
    if (geo.status === "ready") return "Location detected";
    if (geo.status === "denied") return "Location off · type manually";
    if (geo.status === "unavailable" || geo.status === "error")
      return "Location unavailable";
    return null;
  })();

  return (
    <RiderShell profile={profile} notifications={notifications}>
      <RiderHomeMapBackground
        center={
          geo.status === "ready"
            ? geo.coords
            : pickup
              ? { lat: pickup.lat, lng: pickup.lng }
              : null
        }
      />

      <div className="relative z-10 flex flex-col gap-lg">
        {/* Hero greeting */}
        <section className="flex flex-col gap-sm">
          <Greeting name={profile?.full_name ?? null} />
          <h2 className="font-display-lg text-[40px] leading-tight text-on-surface font-extrabold tracking-tight max-w-[300px]">
            Where to{profile?.full_name ? `, ${firstName(profile.full_name)}` : ""}?
          </h2>
          {geoStatusLabel && (
            <div className="inline-flex w-fit items-center gap-xs glass-panel rounded-full px-md py-xs">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  geo.status === "ready"
                    ? "bg-primary-container neon-glow-primary animate-pulse-soft"
                    : geo.status === "loading"
                      ? "bg-primary-container/60 animate-pulse-soft"
                      : "bg-on-surface-variant/60",
                )}
              />
              <span className="font-label-sm text-label-sm text-on-surface line-clamp-1">
                {geoStatusLabel}
              </span>
            </div>
          )}
          {!isAuthed && (
            <p className="text-body-md text-on-surface-variant">
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

        {/* Quick chips */}
        {quickChips.length > 0 && (
          <section
            className="flex gap-sm overflow-x-auto no-scrollbar -mx-margin-mobile px-margin-mobile"
            aria-label="Saved destinations"
          >
            {quickChips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDrop(c.place)}
                className={cn(
                  "shrink-0 inline-flex items-center gap-xs rounded-full pl-sm pr-md py-xs transition-all active:scale-95 backdrop-blur",
                  drop?.label === c.place.label
                    ? "bg-primary-container text-on-primary-container shadow-glow"
                    : "glass-panel-strong text-on-surface hover:bg-white/10",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full",
                    drop?.label === c.place.label
                      ? "bg-on-primary-container/10 text-on-primary-container"
                      : "bg-primary-container/10 text-primary-container",
                  )}
                >
                  <MaterialIcon name={c.icon} className="text-[16px]" />
                </span>
                <span className="font-label-md text-label-md font-bold">
                  {c.label}
                </span>
              </button>
            ))}
          </section>
        )}

        {/* Mode toggle */}
        <div className="flex justify-center">
          <div className="glass-panel-strong p-xs rounded-full flex w-full max-w-[320px]">
            <button
              type="button"
              onClick={() => setMode("driver")}
              className={cn(
                "flex-1 py-sm rounded-full font-label-md text-label-md transition-all",
                mode === "driver"
                  ? "bg-primary-container text-on-primary-container font-bold shadow-[0_4px_24px_rgba(57,255,20,0.35)]"
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
                  ? "bg-primary-container text-on-primary-container font-bold shadow-[0_4px_24px_rgba(57,255,20,0.35)]"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              Package
            </button>
          </div>
        </div>

        {/* Pickup + destination */}
        <LocationStack
          pickup={pickup}
          drop={drop}
          onPickupChange={setPickup}
          onDropChange={setDrop}
        />

        {/* Ride carousel */}
        <section>
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
          <div className="flex gap-md overflow-x-auto pb-sm no-scrollbar snap-x -mx-margin-mobile px-margin-mobile">
            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                active={tier.id === selectedTierId}
                onClick={() => setSelectedTierId(tier.id)}
                fareMinor={fareByTier.get(tier.id)}
                etaMin={durationMin}
                loading={loadingQuote && pickup !== null && drop !== null}
              />
            ))}
          </div>
        </section>

        {error && (
          <p className="font-label-md text-label-md text-error" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canRequest || requesting}
          onClick={requestRide}
          className={cn(
            "mt-sm w-full py-md rounded-full font-headline-md text-headline-md font-extrabold uppercase tracking-tight transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2 disabled:cursor-not-allowed",
            canRequest && !requesting
              ? "bg-primary-container text-on-primary-container shadow-[0_10px_40px_rgba(57,255,20,0.45)] neon-glow-primary"
              : "bg-surface-container-highest/80 text-on-surface-variant backdrop-blur",
          )}
        >
          {requestLabel}
        </button>
      </div>
    </RiderShell>
  );
}

function Greeting({ name }: { name: string | null }) {
  // Use a stable greeting once mounted to avoid SSR/CSR hydration mismatch
  // — derived from local clock on the client.
  const [g, setG] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    setG(
      h < 5
        ? "Working late"
        : h < 12
          ? "Good morning"
          : h < 17
            ? "Good afternoon"
            : h < 22
              ? "Good evening"
              : "Good night",
    );
  }, []);
  if (!g) return null;
  const display = name ? `${g}, ${firstName(name)}` : g;
  return (
    <span className="font-label-md text-label-md uppercase tracking-[0.16em] text-primary-container/90">
      {display}
    </span>
  );
}

function firstName(full: string) {
  return full.split(" ")[0] ?? full;
}

/** Trim long addresses to a chip-friendly label (first comma-separated part). */
function shortLabel(addr: string) {
  const first = addr.split(",")[0]?.trim() ?? addr;
  return first.length > 24 ? `${first.slice(0, 22)}…` : first;
}

/** Pick something city-ish out of a Nominatim display name. */
function extractCity(label: string): string | null {
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  // Nominatim usually orders specific → general, so the third/fourth
  // segment is typically the city/area.
  return parts[2] ?? parts[1] ?? parts[0] ?? null;
}
