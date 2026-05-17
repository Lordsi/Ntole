"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const RideMap = dynamic(() => import("@/components/map/ride-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted">
      Loading map...
    </div>
  ),
});

interface DriverPin {
  id: string;
  lat: number;
  lng: number;
}

export function AdminLiveMap() {
  const [drivers, setDrivers] = useState<DriverPin[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let cancelled = false;

    void supabase
      .from("drivers")
      .select("profile_id, current_lat, current_lng, status")
      .eq("status", "online")
      .then(({ data }) => {
        if (cancelled || !data) return;
        setDrivers(
          data
            .filter(
              (d) => d.current_lat != null && d.current_lng != null,
            )
            .map((d) => ({
              id: d.profile_id,
              lat: d.current_lat as number,
              lng: d.current_lng as number,
            })),
        );
      });

    const channel = supabase
      .channel("admin-drivers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        (payload) => {
          const next = payload.new as {
            profile_id: string;
            current_lat: number | null;
            current_lng: number | null;
            status: string;
          };
          setDrivers((prev) => {
            const without = prev.filter((d) => d.id !== next.profile_id);
            if (
              next.status === "online" &&
              next.current_lat != null &&
              next.current_lng != null
            ) {
              return [
                ...without,
                {
                  id: next.profile_id,
                  lat: next.current_lat,
                  lng: next.current_lng,
                },
              ];
            }
            return without;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // Render only the first driver as the centerpiece; remaining drivers are
  // overlaid via separate driver dots in a future iteration.
  const first = drivers[0] ?? null;
  return (
    <RideMap
      driver={first ? { lat: first.lat, lng: first.lng } : null}
      className="h-full w-full"
    />
  );
}
