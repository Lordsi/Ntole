"use client";

import Link from "next/link";

import {
  MobileShell,
  type MobileShellNavItem,
} from "@/components/shared/mobile-shell";
import type { NotificationItem } from "@/components/shared/notifications-button";
import type { Profile } from "@/lib/supabase/types";

const RIDER_NAV: MobileShellNavItem[] = [
  { href: "/rider", icon: "home", label: "Home" },
  { href: "/rider/history", icon: "history", label: "Activity" },
  { href: "/rider/profile", icon: "person", label: "Profile" },
];

const DRIVER_NAV: MobileShellNavItem[] = [
  { href: "/driver", icon: "dashboard", label: "Dashboard" },
  { href: "/driver/earnings", icon: "account_balance_wallet", label: "Earnings" },
  { href: "/driver/profile", icon: "person", label: "Profile" },
];

interface ShellProps {
  profile: Profile | null;
  notifications?: NotificationItem[];
  children: React.ReactNode;
}

/**
 * Concrete `MobileShell` for the rider surface. Centralizes the bottom-nav
 * tabs and the signed-out "Sign in" CTA so every rider page renders the
 * exact same chrome.
 */
export function RiderShell({ profile, notifications, children }: ShellProps) {
  const topRight = !profile ? (
    <Link
      href="/login?next=/rider"
      className="inline-flex h-10 items-center rounded-full bg-primary-container px-4 text-label-md font-label-md font-bold text-on-primary-container shadow-glow transition-colors hover:bg-primary-fixed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
    >
      Sign in
    </Link>
  ) : undefined;

  return (
    <MobileShell
      navItems={RIDER_NAV}
      profileHref={profile ? "/rider/profile" : "/login?next=/rider"}
      avatarName={profile?.full_name ?? "Rider"}
      avatarSrc={profile?.avatar_url}
      topRight={topRight}
      notifications={notifications}
    >
      {children}
    </MobileShell>
  );
}

/** Concrete `MobileShell` for the driver surface. */
export function DriverShell({ profile, notifications, children }: ShellProps) {
  return (
    <MobileShell
      navItems={DRIVER_NAV}
      profileHref="/driver/profile"
      avatarName={profile?.full_name ?? "Driver"}
      avatarSrc={profile?.avatar_url}
      notifications={notifications}
    >
      {children}
    </MobileShell>
  );
}
