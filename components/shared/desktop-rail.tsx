"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { cn } from "@/lib/utils/cn";

import type { MobileShellNavItem } from "@/components/shared/mobile-shell";

interface DesktopRailProps {
  navItems: MobileShellNavItem[];
  profileHref: string;
  avatarName?: string;
  avatarSrc?: string | null;
  topRight?: React.ReactNode;
  /** Accent wordmark tint — driver uses neon, rider neutral */
  variant?: "rider" | "driver";
}

/**
 * Persistent left navigation for lg+ viewports. Replaces the mobile top bar +
 * bottom tabs on desktop so the map/content area stays uncluttered.
 */
export function DesktopRail({
  navItems,
  profileHref,
  avatarName,
  avatarSrc,
  topRight,
  variant = "rider",
}: DesktopRailProps) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-outline-variant/30 bg-surface-container-low/95 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="px-lg pt-lg pb-md">
        <Link href={navItems[0]?.href ?? "/"} className="group inline-flex flex-col">
          <span
            className={cn(
              "font-headline-lg text-headline-lg font-black tracking-tighter transition-colors",
              variant === "driver"
                ? "text-primary-container group-hover:text-primary-fixed"
                : "text-on-surface group-hover:text-primary-container",
            )}
          >
            Ntole
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant/80 mt-0.5">
            {variant === "driver" ? "Driver" : "Rider"}
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-sm py-md space-y-0.5 overflow-y-auto">
        {navItems.map((it) => {
          const active =
            it.href === "/rider" || it.href === "/driver"
              ? pathname === it.href
              : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "relative flex items-center gap-md rounded-xl px-md py-sm font-label-md text-label-md transition-all duration-200",
                active
                  ? "bg-white/[0.08] text-on-surface shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface",
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-primary-container"
                  aria-hidden
                />
              )}
              <MaterialIcon
                name={it.icon}
                filled={active}
                className={cn(
                  "text-[22px]",
                  active ? "text-primary-container" : undefined,
                )}
              />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-outline-variant/30 p-md space-y-sm">
        <ThemeToggle compact className="w-full justify-center" />

        <button
          type="button"
          aria-label="Notifications"
          className="flex w-full items-center gap-md rounded-xl px-md py-sm text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface transition-colors"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04]">
            <MaterialIcon name="notifications" className="text-[20px]" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary-container" />
          </span>
          <span className="font-label-md text-label-md">Notifications</span>
        </button>

        {topRight ?? (
          <Link
            href={profileHref}
            className="flex w-full items-center gap-md rounded-xl px-md py-sm hover:bg-white/[0.04] transition-colors"
          >
            <Avatar name={avatarName ?? "User"} src={avatarSrc} size={36} />
            <div className="min-w-0 flex-1">
              <p className="font-label-md text-label-md text-on-surface truncate">
                {avatarName ?? "Account"}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                View profile
              </p>
            </div>
            <MaterialIcon
              name="chevron_right"
              className="text-on-surface-variant text-[18px]"
            />
          </Link>
        )}
      </div>
    </aside>
  );
}
