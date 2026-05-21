import type { ReactNode } from "react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { NotificationsButton } from "@/components/shared/notifications-button";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { buildAdminNotifications } from "@/lib/notifications/admin";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const notifications = await buildAdminNotifications(supabase);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <AdminSidebar
        adminName={profile?.full_name}
        adminAvatarUrl={profile?.avatar_url}
        notifications={notifications}
      />

      {/* Main content: full-width on mobile (sidebar is a drawer), shifted
          right by the persistent sidebar on md+. Top padding on mobile leaves
          room for the fixed mobile top app bar (h-14). */}
      <main className="md:ml-64 px-md md:px-lg pt-[4.5rem] md:pt-lg pb-xl min-h-screen">
        {/* Desktop-only utility chrome — notifications + admin profile pill.
            On mobile these live in the top app bar inside <AdminSidebar />. */}
        <header className="hidden md:flex justify-end items-center gap-md mb-lg">
          <NotificationsButton items={notifications} tone="glass" />
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
      </main>
    </div>
  );
}
