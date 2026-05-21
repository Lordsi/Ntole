import type { ReactNode } from "react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Avatar } from "@/components/ui/avatar";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireRole("admin");
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <AdminSidebar
        adminName={profile?.full_name}
        adminAvatarUrl={profile?.avatar_url}
      />

      {/* Main content: full-width on mobile (sidebar is a drawer), shifted
          right by the persistent sidebar on md+. Top padding on mobile leaves
          room for the fixed mobile top app bar (h-14). */}
      <main className="md:ml-64 px-md md:px-xl pt-[4.5rem] md:pt-xl pb-xl min-h-screen">
        <div className="mx-auto max-w-[1400px]">
        <header className="hidden md:flex justify-end items-center gap-md mb-xl">
          <ThemeToggle compact />
          <button
            type="button"
            aria-label="Notifications"
            className="glass-panel p-sm rounded-lg flex items-center gap-sm hover:bg-white/10 transition-colors"
          >
            <MaterialIcon
              name="notifications"
              className="text-primary-container"
            />
          </button>
          <Link
            href="/admin/profile"
            aria-label="My profile"
            className="flex items-center gap-sm glass-panel py-xs px-md rounded-full border border-white/10 hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Avatar
                name={profile?.full_name ?? "Admin"}
                src={profile?.avatar_url}
                size={32}
              />
            </div>
            <span className="font-label-md text-label-md">My Profile</span>
          </Link>
        </header>

        {children}
        </div>
      </main>
    </div>
  );
}
