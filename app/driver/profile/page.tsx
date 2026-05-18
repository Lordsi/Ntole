import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { DriverShell } from "@/components/shared/role-shell";
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
    <DriverShell profile={profile}>
      <PageHeader title="Profile" subtitle="Account and vehicle settings." />

      <section className="glass-panel rounded-md p-md flex items-center gap-md">
        <Avatar
          name={profile!.full_name}
          src={profile!.avatar_url}
          size={64}
        />
        <div className="flex flex-1 flex-col">
          <span className="font-display-md text-display-md font-bold text-on-surface">
            {profile!.full_name || "Driver"}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {profile!.trip_count} completed trips
          </span>
          <RatingStars value={profile!.rating} showValue className="mt-1" />
        </div>
      </section>

      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Account
        </h2>
        <ProfileForm profile={profile!} />
      </section>

      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Vehicle
        </h2>
        <VehicleForm
          driverId={profile!.id}
          vehicle={vehicleRes.data ?? null}
          tiers={(tiersRes.data ?? []) as RideTier[]}
        />
      </section>

      <div className="mt-xl">
        <SignOutButton />
      </div>
    </DriverShell>
  );
}
