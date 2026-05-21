"use client";

import Link from "next/link";

import {
  MobileShell,
  type MobileShellNavItem,
} from "@/components/shared/mobile-shell";
import type { Profile } from "@/lib/supabase/types";

/**
 * Bottom-nav items lifted verbatim from the Stitch mocks. We use the
 * mock's icon + label set so the chrome matches 1:1.
 */
const RIDER_NAV: MobileShellNavItem[] = [
  { href: "/rider", icon: "home", label: "Home" },
  { href: "/rider/history", icon: "history", label: "Activity" },
  { href: "/rider/wallet", icon: "account_balance_wallet", label: "Wallet" },
  { href: "/rider/profile", icon: "person", label: "Profile" },
];

const DRIVER_NAV: MobileShellNavItem[] = [
  { href: "/driver", icon: "dashboard", label: "Dashboard" },
  { href: "/driver/earnings", icon: "directions_car", label: "Rides" },
  { href: "/driver/wallet", icon: "account_balance_wallet", label: "Wallet" },
  { href: "/driver/profile", icon: "person", label: "Profile" },
];

import type { MobileShellLayout } from "@/components/shared/mobile-shell";

interface ShellProps {
  profile: Profile | null;
  children: React.ReactNode;
  layout?: MobileShellLayout;
  mapSlot?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Concrete `MobileShell` for the rider surface. Centralizes the bottom-nav
 * tabs and the signed-out "Sign in" CTA so every rider page renders the
 * exact same chrome.
 */
export function RiderShell({
  profile,
  children,
  layout,
  mapSlot,
  footer,
}: ShellProps) {
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
      layout={layout}
      mapSlot={mapSlot}
      footer={footer}
    >
      {children}
    </MobileShell>
  );
}

/** Concrete `MobileShell` for the driver surface. */
export function DriverShell({
  profile,
  children,
  layout,
  mapSlot,
  footer,
}: ShellProps) {
  return (
    <MobileShell
      navItems={DRIVER_NAV}
      profileHref="/driver/profile"
      avatarName={profile?.full_name ?? "Driver"}
      avatarSrc={profile?.avatar_url}
      topBarVariant="driver"
      layout={layout}
      mapSlot={mapSlot}
      footer={footer}
    >
      {children}
    </MobileShell>
  );
}
