"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/supabase/types";

const ROLES: UserRole[] = ["rider", "driver", "admin"];

export function UserRoleSelect({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [value, setValue] = useState<UserRole>(role);
  const [busy, setBusy] = useState(false);

  async function update(next: UserRole) {
    setBusy(true);
    const prev = value;
    setValue(next);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: next })
      .eq("id", userId);
    if (error) setValue(prev);
    setBusy(false);
  }

  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => update(e.target.value as UserRole)}
      className="rounded-pill bg-surface-2 px-3 py-1 text-xs ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
    >
      {ROLES.map((r) => (
        <option key={r} value={r} className="bg-background">
          {r}
        </option>
      ))}
    </select>
  );
}
