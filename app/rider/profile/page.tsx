import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { RatingStars } from "@/components/ui/rating-stars";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { RiderShell } from "@/components/shared/role-shell";
import { SignOutButton } from "@/components/shared/sign-out-button";

export const dynamic = "force-dynamic";

export default async function RiderProfilePage() {
  const { profile } = await requireRole("rider", "admin");
  if (!profile) return null;

  return (
    <RiderShell profile={profile}>
      <PageHeader
        title="Profile"
        subtitle="Account details and trip history."
      />

      <section className="glass-panel rounded-md p-md flex items-center gap-md">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={64} />
        <div className="flex flex-1 flex-col">
          <span className="font-display-md text-display-md font-bold text-on-surface">
            {profile.full_name || "Rider"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {profile.trip_count} trips
          </span>
          <RatingStars value={profile.rating} showValue className="mt-1" />
        </div>
      </section>

      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Account
        </h2>
        <ProfileForm profile={profile} />
      </section>

      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Shortcuts
        </h2>
        <Link
          href="/rider/history"
          className="glass-panel rounded-md p-md flex items-center justify-between gap-md transition-colors hover:bg-white/5"
        >
          <span className="flex items-center gap-md">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-container/10 text-primary-container">
              <MaterialIcon name="history" />
            </span>
            <span className="flex flex-col">
              <span className="font-body-md text-body-md font-semibold text-on-surface">
                Trip history
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                View past rides and receipts
              </span>
            </span>
          </span>
          <MaterialIcon
            name="chevron_right"
            className="text-on-surface-variant"
          />
        </Link>
      </section>

      <div className="mt-xl">
        <SignOutButton />
      </div>
    </RiderShell>
  );
}
