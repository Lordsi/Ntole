"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant shadow-xl flex flex-col py-lg z-50">
      <div className="px-lg mb-xl">
        <h1 className="font-headline-lg text-headline-lg font-black text-primary-container tracking-tighter">
          Ntole
        </h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant opacity-70">
          Fleet Management
        </p>
      </div>

      <nav className="flex-1 flex flex-col">
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
        <div className="py-sm px-md rounded-full bg-primary-container/5 border border-primary-container/20">
          <p className="font-label-sm text-label-sm text-primary-container flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            System Status: Online
          </p>
        </div>
        <Link
          href="#"
          className="flex items-center gap-md text-on-surface-variant py-md px-md hover:text-on-surface transition-opacity"
        >
          <MaterialIcon name="help" />
          <span className="font-label-md text-label-md">Support</span>
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-md text-error py-md px-md hover:opacity-80 transition-opacity"
        >
          <MaterialIcon name="logout" />
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </aside>
  );
}
