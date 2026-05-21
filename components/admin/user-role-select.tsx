"use client";

import { useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/supabase/types";

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: "rider", label: "Rider", icon: "person" },
  { value: "driver", label: "Driver", icon: "directions_car" },
  { value: "admin", label: "Admin", icon: "shield_person" },
];

interface UserRoleSelectProps {
  userId: string;
  role: UserRole;
  /** Caller's own id — we never let an admin demote themselves accidentally. */
  selfId?: string;
}

/**
 * Three-state segmented control used in the admin "Users" table.
 *
 * Click a role pill to promote/demote the target user. Admins can't change
 * their own role from this widget; they have to do it from another admin's
 * session to avoid locking themselves out. Promoting to `driver` also
 * upserts a row in the `drivers` table so they immediately have a driver
 * record (offline + unverified by default).
 */
export function UserRoleSelect({ userId, role, selfId }: UserRoleSelectProps) {
  const [value, setValue] = useState<UserRole>(role);
  const [busy, setBusy] = useState(false);
  const isSelf = selfId === userId;

  async function update(next: UserRole) {
    if (busy || next === value || isSelf) return;
    const previous = value;
    setValue(next);
    setBusy(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: next })
      .eq("id", userId);

    if (error) {
      setValue(previous);
      setBusy(false);
      return;
    }

    // Make sure a `drivers` row exists the moment someone is promoted to
    // driver, otherwise the driver portal blows up on first load.
    if (next === "driver") {
      await supabase
        .from("drivers")
        .upsert(
          { profile_id: userId, status: "offline", is_verified: false },
          { onConflict: "profile_id", ignoreDuplicates: true },
        );
    }
    setBusy(false);
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-full p-0.5 bg-surface-container-highest/60 ring-1 ring-white/[0.08] gap-0.5",
        busy && "opacity-70",
      )}
      role="group"
      aria-label="User role"
    >
      {ROLES.map((r) => {
        const active = r.value === value;
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => update(r.value)}
            disabled={busy || isSelf}
            aria-pressed={active}
            title={
              isSelf
                ? "You can't change your own role here."
                : `Set role to ${r.label}`
            }
            className={cn(
              "inline-flex items-center gap-xs px-sm py-xs rounded-full font-label-sm text-label-sm uppercase tracking-[0.08em] transition-colors",
              active
                ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(57,255,20,0.25)]"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/5",
              (busy || isSelf) && "cursor-not-allowed",
            )}
          >
            <MaterialIcon
              name={r.icon}
              filled={active}
              className="text-[16px]"
            />
            <span className="hidden sm:inline">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
