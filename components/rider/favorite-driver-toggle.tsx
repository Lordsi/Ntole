"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";

interface FavoriteDriverToggleProps {
  riderId: string;
  driverId: string;
  initialFavorited: boolean;
  /** Optional label after the icon; useful in larger contexts. */
  label?: string;
  className?: string;
}

/**
 * Star button. Toggles a row in `favorite_drivers`. Optimistic — flips the
 * UI immediately and rolls back if the server returns an error.
 */
export function FavoriteDriverToggle({
  riderId,
  driverId,
  initialFavorited,
  label,
  className,
}: FavoriteDriverToggleProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const supabase = createBrowserSupabaseClient();
    const next = !favorited;
    setFavorited(next);
    setBusy(true);
    try {
      if (next) {
        const { error } = await supabase
          .from("favorite_drivers")
          .upsert(
            { rider_id: riderId, driver_id: driverId },
            { onConflict: "rider_id,driver_id" },
          );
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorite_drivers")
          .delete()
          .eq("rider_id", riderId)
          .eq("driver_id", driverId);
        if (error) throw error;
      }
    } catch {
      setFavorited(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Unfavorite driver" : "Favorite driver"}
      className={cn(
        "inline-flex items-center gap-xs rounded-full px-sm py-xs font-label-sm text-label-sm transition-colors active:scale-95",
        favorited
          ? "bg-primary-container/15 text-primary-container ring-1 ring-primary-container/30"
          : "bg-surface-container-highest/60 text-on-surface-variant ring-1 ring-white/10 hover:text-on-surface",
        busy && "opacity-70",
        className,
      )}
    >
      <MaterialIcon name="star" filled={favorited} className="text-[18px]" />
      {label && <span>{label}</span>}
    </button>
  );
}
