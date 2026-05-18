import type { ReactNode } from "react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Avatar } from "@/components/ui/avatar";

import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireRole("admin");
  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <AdminSidebar />

      <main className="ml-64 p-lg pb-xl min-h-screen">
        {/* Right-aligned utility chrome — notifications + admin profile pill.
            Per-page titles render below as part of `children`. */}
        <header className="flex justify-end items-center gap-md mb-lg">
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
            href="/admin"
            className="flex items-center gap-sm glass-panel py-xs px-md rounded-full border border-white/10"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Avatar
                name={profile?.full_name ?? "Admin"}
                src={profile?.avatar_url}
                size={32}
              />
            </div>
            <span className="font-label-md text-label-md">Admin Portal</span>
          </Link>
        </header>

        {children}
      </main>
    </div>
  );
}
