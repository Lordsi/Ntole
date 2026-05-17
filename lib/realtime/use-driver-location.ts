"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface Args {
  driverId: string;
  enabled: boolean;
}

/**
 * While `enabled`, requests the device's geolocation and pushes
 * `{ current_lat, current_lng, last_seen_at }` to the driver's row at the
 * configured cadence (default 5s). Cleans up on unmount or when disabled.
 */
export function useDriverLocationPublisher({ driverId, enabled }: Args) {
  useEffect(() => {
    if (!enabled || !driverId) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    const intervalMs = Number(
      process.env.NEXT_PUBLIC_DRIVER_LOCATION_INTERVAL_MS ?? 5000,
    );
    const supabase = createBrowserSupabaseClient();
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const push = (lat: number, lng: number) => {
      void supabase
        .from("drivers")
        .update({
          current_lat: lat,
          current_lng: lng,
          last_seen_at: new Date().toISOString(),
        })
        .eq("profile_id", driverId);
    };

    function getOnce() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          push(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Permission denied or unavailable — ignore and retry next tick.
        },
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 4000 },
      );
    }

    getOnce();
    timer = setInterval(getOnce, intervalMs);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [driverId, enabled]);
}
