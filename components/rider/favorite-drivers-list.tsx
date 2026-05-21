"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { RatingStars } from "@/components/ui/rating-stars";

export interface FavoriteDriverRow {
  driver_id: string;
  full_name: string | null;
  avatar_url: string | null;
  rating: number;
  trip_count: number;
}

interface FavoriteDriversListProps {
  riderId: string;
  initialFavorites: FavoriteDriverRow[];
}

/**
 * Editable list of the rider's favorite drivers. Each row has a star button
 * that removes the favorite (optimistic). Empty state explains how to add
 * favorites from the trip history.
 */
export function FavoriteDriversList({
  riderId,
  initialFavorites,
}: FavoriteDriversListProps) {
  const [list, setList] = useState(initialFavorites);

  async function unfavorite(driverId: string) {
    const previous = list;
    setList((l) => l.filter((d) => d.driver_id !== driverId));
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("favorite_drivers")
      .delete()
      .eq("rider_id", riderId)
      .eq("driver_id", driverId);
    if (error) setList(previous);
  }

  if (list.length === 0) {
    return (
      <div className="glass-panel rounded-md p-md flex items-center gap-md">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container/10 text-primary-container">
          <MaterialIcon name="star" />
        </span>
        <div className="flex flex-col">
          <p className="font-body-md text-body-md text-on-surface">
            No favorite drivers yet.
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Tap the star on a completed trip to save the driver here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-sm">
      {list.map((d) => (
        <li
          key={d.driver_id}
          className="glass-panel rounded-md p-md flex items-center gap-md"
        >
          <Avatar
            name={d.full_name ?? "Driver"}
            src={d.avatar_url}
            size={44}
          />
          <div className="flex flex-1 min-w-0 flex-col">
            <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
              {d.full_name ?? "Driver"}
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              {d.trip_count} trips
            </span>
            <RatingStars value={d.rating} showValue className="mt-1" />
          </div>
          <button
            type="button"
            onClick={() => unfavorite(d.driver_id)}
            aria-label={`Unfavorite ${d.full_name ?? "driver"}`}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary-container/15 text-primary-container ring-1 ring-primary-container/30 hover:bg-primary-container/25 transition-colors active:scale-95"
          >
            <MaterialIcon name="star" filled />
          </button>
        </li>
      ))}
    </ul>
  );
}
