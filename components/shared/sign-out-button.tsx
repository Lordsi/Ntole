"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { MaterialIcon } from "@/components/ui/material-icon";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";

interface SignOutButtonProps {
  /** Where to land after the session is cleared. Defaults to /login. */
  redirectTo?: string;
  /** Compact icon-only button, e.g. when sitting next to other affordances. */
  variant?: "block" | "compact";
  className?: string;
}

/**
 * Standalone log-out control. Lives at the bottom of each role's profile
 * page so users always have an obvious exit, regardless of whether they
 * remember the menu lives somewhere else.
 */
export function SignOutButton({
  redirectTo = "/login",
  variant = "block",
  className,
}: SignOutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.auth.signOut();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        aria-label="Sign out"
        className={cn(
          "inline-flex items-center gap-xs rounded-full px-md py-xs text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors active:scale-95",
          className,
        )}
      >
        <MaterialIcon name="logout" className="text-[18px]" />
        <span className="font-label-md text-label-md">
          {busy ? "Signing out…" : "Sign out"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={cn(
        "flex w-full items-center justify-center gap-sm h-12 rounded-full border border-error/30 bg-error/5 text-error font-label-md text-label-md font-bold uppercase tracking-[0.08em] hover:bg-error/10 active:scale-[0.98] transition-colors disabled:opacity-60",
        className,
      )}
    >
      <MaterialIcon name="logout" />
      {busy ? "Signing out…" : "Log out"}
    </button>
  );
}
