"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/shared/theme-toggle";

interface SidebarItem {
  href: string;
  icon: string;
  label: string;
}

const NAV: SidebarItem[] = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/users", icon: "group", label: "Users" },
  { href: "/admin/drivers", icon: "directions_car", label: "Drivers" },
  { href: "/admin/rides", icon: "leaderboard", label: "Rides" },
  { href: "/admin/pricing", icon: "settings", label: "Pricing" },
  { href: "/admin/profile", icon: "person", label: "My Profile" },
];

interface AdminSidebarProps {
  /** Used to render the mobile top app bar's admin pill. */
  adminName?: string | null;
  adminAvatarUrl?: string | null;
}

/**
 * Admin chrome. Renders two things:
 * 1. Mobile-only fixed top app bar (hamburger + brand + admin pill).
 * 2. The persistent left sidebar — visible at `md+` breakpoints, and
 *    presented as a slide-in drawer with backdrop on mobile.
 *
 * State for the drawer lives here so the hamburger toggle can stay
 * collocated with the navigation it controls. The drawer auto-closes when
 * the route changes so tapping a nav item dismisses it.
 */
export function AdminSidebar({ adminName, adminAvatarUrl }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile-only top app bar */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 z-40 bg-surface-container-low/95 backdrop-blur border-b border-outline-variant flex items-center justify-between px-md">
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="p-sm -ml-sm rounded-md text-on-surface hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <MaterialIcon name="menu" />
          </button>
          <Link href="/admin" className="flex items-baseline gap-xs">
            <span className="font-headline-md text-headline-md font-black text-primary-container tracking-tighter leading-none">
              Ntole
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
              Admin
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-xs">
          <ThemeToggle compact />
          <button
            type="button"
            aria-label="Notifications"
            className="p-sm rounded-md text-primary-container hover:bg-white/10 active:bg-white/15 transition-colors"
          >
            <MaterialIcon name="notifications" />
          </button>
          <Link
            href="/admin/profile"
            aria-label="My profile"
            className="w-9 h-9 rounded-full overflow-hidden border border-white/10"
          >
            <Avatar
              name={adminName ?? "Admin"}
              src={adminAvatarUrl ?? null}
              size={36}
            />
          </Link>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fade-in"
        />
      )}

      {/* Sidebar — fixed on desktop, slide-in drawer on mobile */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-72 max-w-[85vw] md:w-64 bg-surface-container-low border-r border-outline-variant shadow-xl flex flex-col py-lg z-50 transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
        aria-label="Admin navigation"
      >
        <div className="px-lg mb-xl flex items-start justify-between">
          <div>
            <h1 className="font-headline-lg text-headline-lg font-black text-primary-container tracking-tighter">
              Ntole
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
              Fleet Management
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden p-xs -mr-xs rounded-md text-on-surface-variant hover:text-on-surface hover:bg-white/10"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <nav className="flex-1 flex flex-col overflow-y-auto">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-md py-md px-lg transition-all duration-300 ease-in-out",
                  active
                    ? "bg-primary-container/10 text-primary-container border-r-4 border-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                <MaterialIcon name={item.icon} filled={active} />
                <span className="font-label-md text-label-md">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-lg space-y-sm">
          <div className="hidden md:block px-md">
            <ThemeToggle />
          </div>
          <div className="py-sm px-md rounded-full bg-primary-container/5 border border-primary-container/20">
            <p className="font-label-sm text-label-sm text-primary-container flex items-center gap-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              System Status: Online
            </p>
          </div>
          <Link
            href="/rider"
            className="flex items-center gap-md text-on-surface-variant py-md px-md rounded-md hover:bg-white/5 hover:text-on-surface transition-colors"
          >
            <MaterialIcon name="public" />
            <span className="font-label-md text-label-md">Back to site</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-md text-on-surface-variant py-md px-md rounded-md hover:bg-white/5 hover:text-on-surface transition-colors"
          >
            <MaterialIcon name="help" />
            <span className="font-label-md text-label-md">Support</span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-md text-error py-md px-md rounded-md hover:bg-error/10 transition-colors"
          >
            <MaterialIcon name="logout" />
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
