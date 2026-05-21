"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import {
  NotificationsButton,
  type NotificationItem,
} from "@/components/shared/notifications-button";
import { cn } from "@/lib/utils/cn";

export interface MobileShellNavItem {
  href: string;
  /** Material Symbol name */
  icon: string;
  label: string;
}

interface MobileShellProps {
  /** Bottom-nav items shown left-to-right. */
  navItems: MobileShellNavItem[];
  /** Where the avatar in the top bar links to. */
  profileHref: string;
  /** Override the avatar (e.g. signed-out users get a "Sign in" pill). */
  topRight?: React.ReactNode;
  /** Optional avatar inputs. Ignored when `topRight` is provided. */
  avatarName?: string;
  avatarSrc?: string | null;
  /** Items shown in the notifications sheet (empty state if omitted). */
  notifications?: NotificationItem[];
  children: React.ReactNode;
}

/** Maximum width of the "phone column" — the mobile shell never grows beyond
 *  this on desktop. The chrome (top app bar + bottom nav) is centered to the
 *  same column so it doesn't span the whole viewport. Tuned to a comfortable
 *  iPhone-Pro size. */
const SHELL_MAX = "max-w-[430px]";

/**
 * Shared mobile chrome used by the rider + driver surfaces. On phones it
 * fills the viewport (top app bar + bottom nav both fixed). On desktop it
 * collapses into a centered 430px column with a phone-frame outline; the
 * area outside the column shows a darker ambient backdrop so the centered
 * shell reads as the app, not a layout bug.
 */
export function MobileShell({
  navItems,
  profileHref,
  topRight,
  avatarName,
  avatarSrc,
  notifications,
  children,
}: MobileShellProps) {
  const pathname = usePathname();

  return (
    <>
      <DesktopBackdrop />

      <TopAppBar
        profileHref={profileHref}
        avatarName={avatarName}
        avatarSrc={avatarSrc}
        topRight={topRight}
        notifications={notifications}
      />

      {/*
        The mobile column. On phones it's the full viewport; on desktop it's
        clamped to SHELL_MAX with a hairline border + soft glow so it reads
        as the device frame.
      */}
      <div
        className={cn(
          "relative z-10 mx-auto min-h-screen",
          SHELL_MAX,
          // On desktop, give the column its own subtle frame.
          "md:border-x md:border-white/[0.06] md:shadow-[0_0_120px_rgba(0,0,0,0.55)]",
        )}
      >
        <main className="min-h-screen pt-[88px] pb-32 px-margin-mobile">
          {children}
        </main>
      </div>

      <BottomNav items={navItems} pathname={pathname} />
    </>
  );
}

/**
 * Renders a dimmer surround on tablet+ so the centered phone column has
 * something to sit on. Hidden on phones (where the shell fills the screen).
 */
function DesktopBackdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 hidden md:block pointer-events-none bg-[#0a0c0c]"
    >
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(57,255,20,0.10)_1px,transparent_1px),radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px,32px_32px] [background-position:0_0,16px_16px]" />
      <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_30%,rgba(57,255,20,0.04),transparent_60%)]" />
    </div>
  );
}

function TopAppBar({
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
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 mx-auto",
        SHELL_MAX,
        "bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(57,255,20,0.1)]",
        "flex justify-between items-center px-margin-mobile py-md",
      )}
    >
      <Link
        href={profileHref}
        aria-label="Menu"
        className="grid h-11 w-11 place-items-center rounded-full text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors active:scale-95 duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2"
      >
        <MaterialIcon name="menu" className="text-[28px]" />
      </Link>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary-container tracking-tighter">
        Ntole
      </h1>
      <div className="flex items-center gap-sm">
        <NotificationsButton items={notifications} />
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
    </header>
  );
}

function BottomNav({
  items,
  pathname,
}: {
  items: MobileShellNavItem[];
  pathname: string;
}) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 mx-auto",
        SHELL_MAX,
        "bg-background/90 backdrop-blur-2xl border-t border-white/5 rounded-t-lg shadow-[0_-4px_20px_rgba(0,0,0,0.5)]",
        "flex justify-around items-center h-20 pb-safe px-gutter",
      )}
    >
      {items.map((it) => {
        const active =
          it.href === "/rider" || it.href === "/driver" || it.href === "/admin"
            ? pathname === it.href
            : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex flex-col items-center justify-center transition-transform active:scale-90 duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container focus-visible:outline-offset-2 rounded-md px-2",
              active
                ? "text-primary-container font-bold scale-110"
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
