import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { ProfileForm } from "@/components/shared/profile-form";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { VehicleForm } from "@/components/driver/vehicle-form";
import type { RideTier, Vehicle } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverProfilePage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const [vehicleRes, tiersRes] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", profile!.id)
      .maybeSingle<Vehicle>(),
    supabase
      .from("ride_tiers")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return (
    <div className="flex min-h-screen flex-col gap-4 p-5">
      <header className="flex items-center gap-3">
        <Link href="/driver">
          <IconButton size={40}>
            <ArrowLeftIcon className="h-4 w-4" />
          </IconButton>
        </Link>
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>
      <Card className="flex items-center gap-3">
        <Avatar name={profile!.full_name} src={profile!.avatar_url} size={64} />
        <div className="flex flex-col">
          <span className="text-base font-semibold">
            {profile!.full_name || "Driver"}
          </span>
          <span className="text-xs text-muted">
            {profile!.trip_count} trips · rating {profile!.rating.toFixed(1)}
          </span>
        </div>
      </Card>
      <ProfileForm profile={profile!} />
      <VehicleForm
        driverId={profile!.id}
        vehicle={vehicleRes.data ?? null}
        tiers={(tiersRes.data ?? []) as RideTier[]}
      />
      <SignOutButton />
    </div>
  );
}
