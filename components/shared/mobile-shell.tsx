"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { DesktopRail } from "@/components/shared/desktop-rail";
import { StitchMapBackdrop } from "@/components/shared/stitch-map-backdrop";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  NotificationsButton,
  type NotificationItem,
} from "@/components/shared/notifications-button";
import { cn } from "@/lib/utils/cn";

export interface MobileShellNavItem {
  href: string;
  icon: string;
  label: string;
}

const PHONE_MAX = "max-w-[430px]";

export type MobileShellLayout = "content" | "map-first";

interface MobileShellProps {
  navItems: MobileShellNavItem[];
  profileHref: string;
  topRight?: React.ReactNode;
  avatarName?: string;
  avatarSrc?: string | null;
  topBarVariant?: "rider" | "driver";
  layout?: MobileShellLayout;
  mapSlot?: React.ReactNode;
  /** Pinned below scroll area on desktop map-first layout (e.g. primary CTA). */
  footer?: React.ReactNode;
  /** Items rendered inside the bell sheet. Empty array → empty state. */
  notifications?: NotificationItem[];
  children: React.ReactNode;
}

/**
 * Rider + driver chrome. Mobile keeps bottom tabs + top bar; desktop uses a
 * left rail, full-bleed map, and a floating command card (map-first) or a
 * spacious content canvas (wallet, profile, etc.).
 */
export function MobileShell({
  navItems,
  profileHref,
  topRight,
  avatarName,
  avatarSrc,
  topBarVariant = "rider",
  layout = "content",
  mapSlot,
  footer,
  notifications,
  children,
}: MobileShellProps) {
  const pathname = usePathname();
  const mapFirst = layout === "map-first";

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md lg:h-screen lg:overflow-hidden">
      {/* ── Desktop app frame ── */}
      <div className="hidden lg:flex h-screen w-full">
        <DesktopRail
          navItems={navItems}
          profileHref={profileHref}
          avatarName={avatarName}
          avatarSrc={avatarSrc}
          topRight={topRight}
          variant={topBarVariant}
          notifications={notifications}
        />

        {mapFirst ? (
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-0 z-0">
              {mapSlot ?? (
                <>
                  <StitchMapBackdrop className="opacity-100" />
                  <div className="absolute inset-0 map-edge-vignette pointer-events-none" />
                </>
              )}
            </div>

            {/* Floating command card — inset from map edges */}
            <div className="absolute z-10 inset-y-5 left-5 right-5 flex justify-end pointer-events-none">
              <div className="desktop-float-card pointer-events-auto flex w-full max-w-[min(520px,40vw)] flex-col min-h-0 max-h-full">
                <div className="flex-1 min-h-0 overflow-y-auto px-xl pt-xl pb-lg custom-scrollbar">
                  {children}
                </div>
                {footer ? (
                  <div className="shrink-0 border-t border-white/10 px-xl py-md bg-[rgba(22,24,24,0.98)]">
                    {footer}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <main className="relative flex-1 min-w-0 overflow-y-auto custom-scrollbar">
            <div className="absolute inset-0 stitch-map-backdrop opacity-[0.35] pointer-events-none" />
            <div className="relative mx-auto w-full max-w-5xl px-xl py-xl">
              {children}
            </div>
          </main>
        )}
      </div>

      {/* ── Mobile layout (unchanged structure, polished) ── */}
      <div className="lg:hidden">
        {mapFirst ? (
          <div className="fixed inset-0 z-0">
            {mapSlot ?? (
              <>
                <StitchMapBackdrop />
                <div className="absolute inset-0 map-gradient-overlay pointer-events-none" />
              </>
            )}
          </div>
        ) : (
          <StitchMapBackdrop className="opacity-50" />
        )}

        <MobileTopBar
          profileHref={profileHref}
          avatarName={avatarName}
          avatarSrc={avatarSrc}
          topRight={topRight}
          notifications={notifications}
        />

        <main
          className={cn(
            "relative z-10 min-h-screen pt-[88px] pb-32 px-margin-mobile",
            !mapFirst && "mx-auto w-full",
            !mapFirst && PHONE_MAX,
          )}
        >
          {children}
        </main>

        <BottomNav items={navItems} pathname={pathname} mapFirst={mapFirst} />
      </div>
    </div>
  );
}

function MobileTopBar({
  profileHref,
  avatarName,
  avatarSrc,
  topRight,
  notifications,
}: {
  profileHref: string;
  avatarName?: string;
  avatarSrc?: string | null;
  topRight?: React.ReactNode;
  notifications?: NotificationItem[];
}) {
  return (
    <header className="lg:hidden fixed top-0 inset-x-0 z-50 flex justify-between items-center px-margin-mobile py-md bg-background/80 backdrop-blur-xl border-b border-outline-variant/30">
      {/* Brand sits flush-left now that the hamburger is gone — the bottom
          nav already covers every top-level destination on mobile. */}
      <Link
        href={profileHref}
        aria-label="Home"
        className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary-container tracking-tighter"
      >
        Ntole
      </Link>
      <div className="flex items-center gap-xs">
        <ThemeToggle compact />
        <NotificationsButton items={notifications} />
        {topRight ?? (
          <Link
            href={profileHref}
            className="w-10 h-10 rounded-full border-2 border-primary-container/30 overflow-hidden"
          >
            <Avatar name={avatarName ?? "User"} src={avatarSrc} size={36} />
          </Link>
        )}
      </div>
    </header>
  );
}

function BottomNav({
  items,
  pathname,
  mapFirst,
}: {
  items: MobileShellNavItem[];
  pathname: string;
  mapFirst: boolean;
}) {
  return (
    <nav
      className={cn(
        "lg:hidden fixed bottom-0 inset-x-0 z-50",
        "bg-background/90 backdrop-blur-2xl border-t border-white/5 rounded-t-lg",
        "flex justify-around items-center h-20 pb-safe px-gutter",
        !mapFirst && cn("mx-auto w-full", PHONE_MAX),
      )}
    >
      {items.map((it) => {
        const active =
          it.href === "/rider" || it.href === "/driver"
            ? pathname === it.href
            : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex flex-col items-center justify-center transition-colors active:scale-90",
              active
                ? "text-primary-container font-bold"
                : "text-on-surface-variant",
            )}
          >
            <MaterialIcon name={it.icon} filled={active} />
            <span className="font-label-sm text-label-sm">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
