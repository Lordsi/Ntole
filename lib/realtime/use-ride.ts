"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/supabase/types";

/**
 * Subscribes to live updates for a single ride. Returns the latest row.
 *
 * Postgres-changes Realtime subscription is filtered to the ride row, so a
 * client only receives updates relevant to it. RLS is still enforced so
 * a non-participant won't get any payload.
 */
export function useRide(initial: Ride): Ride {
  const [ride, setRide] = useState<Ride>(initial);
  const supabaseRef = useRef(createBrowserSupabaseClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`ride:${initial.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${initial.id}`,
        },
        (payload) => setRide(payload.new as Ride),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [initial.id]);

  return ride;
}

/**
 * Subscribes to a driver's location row for live updates while in-trip.
 */
export function useDriverLocation(driverId: string | null) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const supabaseRef = useRef(createBrowserSupabaseClient());

  useEffect(() => {
    if (!driverId) return;
    const supabase = supabaseRef.current;
    let cancelled = false;

    supabase
      .from("drivers")
      .select("current_lat,current_lng")
      .eq("profile_id", driverId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        if (data.current_lat != null && data.current_lng != null) {
          setCoords({ lat: data.current_lat, lng: data.current_lng });
        }
      });

    const channel = supabase
      .channel(`driver:${driverId}:location`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "drivers",
          filter: `profile_id=eq.${driverId}`,
        },
        (payload) => {
          const next = payload.new as { current_lat: number | null; current_lng: number | null };
          if (next.current_lat != null && next.current_lng != null) {
            setCoords({ lat: next.current_lat, lng: next.current_lng });
          }
        },
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return coords;
}
