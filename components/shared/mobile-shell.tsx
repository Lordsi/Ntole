"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
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
  children: React.ReactNode;
}

/**
 * The shared mobile chrome used by the rider + driver surfaces. Renders a
 * fixed glass top app bar (menu / "Ntole" logo / bell + avatar) and a fixed
 * glass bottom nav. Children are placed in a `main` that compensates for the
 * fixed elements via top/bottom padding so the content never sits behind
 * them.
 *
 * The structure mirrors the Stitch HTML exactly so the visual result is a
 * 1:1 translation, not an interpretation.
 */
export function MobileShell({
  navItems,
  profileHref,
  topRight,
  avatarName,
  avatarSrc,
  children,
}: MobileShellProps) {
  const pathname = usePathname();

  return (
    <>
      <TopAppBar profileHref={profileHref} avatarName={avatarName} avatarSrc={avatarSrc} topRight={topRight} />
      <main className="relative z-10 min-h-screen pt-[88px] pb-32 px-margin-mobile">
        {children}
      </main>
      <BottomNav items={navItems} pathname={pathname} />
    </>
  );
}

function TopAppBar({
  profileHref,
  avatarName,
  avatarSrc,
  topRight,
}: {
  profileHref: string;
  avatarName?: string;
  avatarSrc?: string | null;
  topRight?: React.ReactNode;
}) {
  return (
    <header
      className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(57,255,20,0.1)] flex justify-between items-center px-margin-mobile py-md"
    >
      <button
        type="button"
        aria-label="Menu"
        className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-200"
      >
        <MaterialIcon name="menu" className="text-[32px]" />
      </button>
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-black text-primary-container tracking-tighter">
        Ntole
      </h1>
      <div className="flex items-center gap-md">
        <button
          type="button"
          aria-label="Notifications"
          className="relative text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-200"
        >
          <MaterialIcon name="notifications" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary-container rounded-full neon-glow-primary" />
        </button>
        {topRight ?? (
          <Link
            href={profileHref}
            aria-label="Profile"
            className="w-10 h-10 rounded-full border-2 border-primary-container/30 overflow-hidden block"
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
      className="fixed bottom-0 w-full z-50 bg-background/90 backdrop-blur-2xl border-t border-white/5 rounded-t-lg shadow-[0_-4px_20px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 pb-safe px-gutter"
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
              "flex flex-col items-center justify-center transition-transform active:scale-90 duration-150",
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
