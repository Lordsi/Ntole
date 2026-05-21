"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { StitchMapBackdrop } from "@/components/shared/stitch-map-backdrop";
import { cn } from "@/lib/utils/cn";

export interface MobileShellNavItem {
  href: string;
  /** Material Symbol name */
  icon: string;
  label: string;
}

/** Floating side panel width from DESIGN.md (desktop map-first layout). */
const PANEL_WIDTH = "380px";

/** Phone column max width for stacked content pages on small screens. */
const PHONE_MAX = "max-w-[430px]";

export type MobileShellLayout = "content" | "map-first";

interface MobileShellProps {
  navItems: MobileShellNavItem[];
  profileHref: string;
  topRight?: React.ReactNode;
  avatarName?: string;
  avatarSrc?: string | null;
  topBarVariant?: "rider" | "driver";
  /**
   * - `map-first`: full-bleed map (Stitch rider request / trip status). Desktop
   *   uses a fixed 380px side panel; mobile overlays content on the map.
   * - `content`: wallet, profile, history — scrollable pages. Desktop uses a
   *   wider centered column, not a phone frame.
   */
  layout?: MobileShellLayout;
  /** Real map layer for `map-first` layout (typically `<RideMap />`). */
  mapSlot?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared chrome for rider + driver surfaces. Implements DESIGN.md layout rules:
 * map bleeds to edges; on lg+ the booking/dashboard UI lives in a 380px panel.
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
  children,
}: MobileShellProps) {
  const pathname = usePathname();
  const mapFirst = layout === "map-first";

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      {/* Map layer */}
      {mapFirst ? (
        <div
          className="fixed inset-0 z-0 lg:right-[var(--ntole-panel-width)]"
          style={{ "--ntole-panel-width": PANEL_WIDTH } as React.CSSProperties}
        >
          {mapSlot ?? (
            <>
              <StitchMapBackdrop />
              <div className="absolute inset-0 map-gradient-overlay pointer-events-none" />
            </>
          )}
        </div>
      ) : (
        <StitchMapBackdrop className="hidden md:block opacity-40" />
      )}

      <TopAppBar
        profileHref={profileHref}
        avatarName={avatarName}
        avatarSrc={avatarSrc}
        topRight={topRight}
        variant={topBarVariant}
        mapFirst={mapFirst}
      />

      {mapFirst ? (
        <>
          {/* Mobile: overlay content on the map */}
          <main className="relative z-10 min-h-screen pt-[88px] pb-32 px-margin-mobile lg:hidden">
            {children}
          </main>

          {/* Desktop: fixed side panel */}
          <aside
            className="hidden lg:flex fixed top-0 right-0 z-20 h-screen w-[380px] flex-col border-l border-white/[0.08] glass-panel-strong shadow-[-8px_0_32px_rgba(0,0,0,0.45)]"
            aria-label="App panel"
          >
            <DesktopSideNav
              items={navItems}
              pathname={pathname}
              variant="panel"
            />
            <div className="flex-1 overflow-y-auto px-lg py-lg">{children}</div>
          </aside>
        </>
      ) : (
        <div
          className={cn(
            "relative z-10 mx-auto min-h-screen w-full",
            PHONE_MAX,
            "md:max-w-3xl md:px-margin-desktop lg:max-w-4xl",
          )}
        >
          <DesktopSideNav
            items={navItems}
            pathname={pathname}
            variant="horizontal"
            className="hidden lg:flex mb-lg"
          />
          <main className="min-h-screen pt-[88px] pb-32 px-margin-mobile md:px-0 lg:pb-xl">
            {children}
          </main>
        </div>
      )}

      {/* Bottom nav — mobile + tablet only */}
      <BottomNav items={navItems} pathname={pathname} mapFirst={mapFirst} />
    </div>
  );
}

function TopAppBar({
  profileHref,
  avatarName,
  avatarSrc,
  topRight,
  variant,
  mapFirst,
}: {
  profileHref: string;
  avatarName?: string;
  avatarSrc?: string | null;
  topRight?: React.ReactNode;
  variant: "rider" | "driver";
  mapFirst: boolean;
}) {
  const menuButton = (
    <button
      type="button"
      aria-label="Menu"
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full hover:bg-white/5 transition-colors active:scale-95 duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2",
        variant === "driver"
          ? "text-primary-container hover:text-primary-fixed"
          : "text-on-surface-variant hover:text-on-surface",
      )}
    >
      <MaterialIcon
        name="menu"
        className={variant === "driver" ? undefined : "text-[28px]"}
      />
    </button>
  );

  const wordmark = (
    <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary-container tracking-tighter">
      Ntole
    </h1>
  );

  const actions = (
    <div
      className={cn(
        "flex items-center",
        variant === "driver" ? "gap-lg" : "gap-sm",
      )}
    >
      <button
        type="button"
        aria-label="Notifications"
        className="relative grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors active:scale-95 duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
      >
        <MaterialIcon name="notifications" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-container rounded-full" />
      </button>
      {topRight ?? (
        <Link
          href={profileHref}
          aria-label="Profile"
          className="w-10 h-10 rounded-full border-2 border-primary-container/30 overflow-hidden block focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
        >
          <Avatar name={avatarName ?? "User"} src={avatarSrc} size={36} />
        </Link>
      )}
    </div>
  );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 flex justify-between items-center px-margin-mobile py-md",
        "bg-background/80 backdrop-blur-xl border-b border-white/10",
        mapFirst
          ? "inset-x-0 lg:right-[380px]"
          : cn("inset-x-0 mx-auto w-full", PHONE_MAX, "md:max-w-3xl lg:max-w-4xl"),
      )}
    >
      {variant === "driver" ? (
        <div className="flex items-center gap-md">
          {menuButton}
          {wordmark}
        </div>
      ) : (
        <>
          {menuButton}
          {wordmark}
        </>
      )}
      {actions}
    </header>
  );
}

/** Horizontal nav for content pages on desktop; vertical strip for map-first panel. */
function DesktopSideNav({
  items,
  pathname,
  variant = "horizontal",
  className,
}: {
  items: MobileShellNavItem[];
  pathname: string;
  variant?: "horizontal" | "panel";
  className?: string;
}) {
  return (
    <nav
      className={cn(
        variant === "panel"
          ? "flex flex-col gap-0 border-b border-white/5 px-lg pt-[88px] pb-md shrink-0"
          : "hidden lg:flex flex-row flex-wrap gap-sm border-b border-white/5 pb-md",
        className,
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
              "flex items-center gap-sm rounded-full px-md py-sm font-label-md text-label-md transition-colors",
              active
                ? "bg-primary-container/10 text-primary-container border border-primary-container/20"
                : "text-on-surface-variant hover:text-on-surface hover:bg-white/5",
            )}
          >
            <MaterialIcon name={it.icon} filled={active} className="text-[20px]" />
            {it.label}
          </Link>
        );
      })}
    </nav>
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
        "bg-background/90 backdrop-blur-2xl border-t border-white/5 rounded-t-lg shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
        "flex justify-around items-center h-20 pb-safe px-gutter",
        mapFirst ? "" : cn("mx-auto w-full", PHONE_MAX),
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
              "flex flex-col items-center justify-center transition-colors active:scale-90 duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container rounded-md px-2",
              active
                ? "text-primary-container font-bold"
                : "text-on-surface-variant hover:text-on-surface",
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
