import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/ui/rating-stars";
import { ProfileForm } from "@/components/shared/profile-form";
import { SignOutButton } from "@/components/shared/sign-out-button";

export const dynamic = "force-dynamic";

export default async function RiderProfilePage() {
  const { profile } = await requireRole("rider", "admin");
  if (!profile) return null;

  return (
    <div className="flex min-h-screen flex-col gap-4 p-5">
      <header className="flex items-center gap-3">
        <Link href="/rider">
          <IconButton size={40}>
            <ArrowLeftIcon className="h-4 w-4" />
          </IconButton>
        </Link>
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>
      <Card className="flex items-center gap-3">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={64} />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-semibold">
            {profile.full_name || "Rider"}
          </span>
          <span className="text-xs text-muted">{profile.trip_count} trips</span>
          <RatingStars value={profile.rating} showValue className="mt-1" />
        </div>
      </Card>
      <ProfileForm profile={profile} />
      <Link href="/rider/history">
        <Card className="flex items-center justify-between hover:bg-surface-2">
          <span className="text-sm font-semibold">Trip history</span>
          <span className="text-xs text-muted">View all</span>
        </Card>
      </Link>
      <SignOutButton />
    </div>
  );
}
