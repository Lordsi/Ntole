"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "./types";

export type GeolocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" | "unavailable" | "error"; message: string }
  | { status: "ready"; coords: LatLng; accuracyM: number };

interface UseGeolocationOptions {
  /** Skip the request entirely (e.g. user has already chosen a pickup). */
  enabled?: boolean;
  /** ms before we give up on a geolocation response. */
  timeoutMs?: number;
  /** Re-fetch when this value changes (use to retry). */
  reloadKey?: number;
}

/**
 * Thin wrapper around `navigator.geolocation.getCurrentPosition`. Returns a
 * state machine the UI can react to: idle → loading → ready / denied /
 * unavailable / error.
 *
 * Deliberately one-shot — for a hailing UX the user picks a pickup once and
 * then commits. Continuously moving the marker on top of the form would be
 * noise, not signal.
 */
export function useGeolocation({
  enabled = true,
  timeoutMs = 10_000,
  reloadKey = 0,
}: UseGeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({ status: "idle" });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setState({
        status: "unavailable",
        message: "Geolocation is not supported by this browser.",
      });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setState({
          status: "ready",
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracyM: pos.coords.accuracy,
        });
      },
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) {
          setState({ status: "denied", message: "Location permission denied." });
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setState({
            status: "unavailable",
            message: "Location unavailable right now.",
          });
        } else {
          setState({ status: "error", message: err.message });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 60_000,
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, timeoutMs, reloadKey]);

  return state;
}
