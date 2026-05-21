import Link from "next/link";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { RiderShell } from "@/components/shared/role-shell";
import { formatMoney } from "@/lib/utils/format";
import type { Profile, RideTier } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function iconFor(name: string): string {
  const k = name.toLowerCase();
  if (k.includes("lux") || k.includes("premium")) return "star";
  if (k.includes("comfort") || k.includes("plus")) return "minor_crash";
  return "directions_car";
}

export default async function RiderRideOptionsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle<Profile>();
    profile = data ?? null;
  }

  const { data: tiers } = await supabase
    .from("ride_tiers")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const list = (tiers ?? []) as RideTier[];

  return (
    <RiderShell profile={profile}>
      <PageHeader
        title="Ride options"
        subtitle="Compare tiers and pricing. Fares on the home screen update when you pick pickup and destination."
        icon="directions_car"
      />

      <ul className="flex flex-col gap-md">
        {list.map((tier) => (
          <li
            key={tier.id}
            className="glass-panel rounded-xl p-lg flex gap-md items-start"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-container/10 text-primary-container">
              <MaterialIcon name={iconFor(tier.name)} className="text-[28px]" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="font-headline-md text-headline-md text-on-surface">
                {tier.name}
              </h2>
              {tier.description ? (
                <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
                  {tier.description}
                </p>
              ) : null}
              <div className="mt-sm flex flex-wrap gap-md font-label-sm text-label-sm text-on-surface-variant">
                <span className="flex items-center gap-xs">
                  <MaterialIcon name="group" className="text-[14px]" />
                  {tier.seats} seats
                </span>
                <span>
                  From {formatMoney(tier.min_fare_minor, tier.currency)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/rider"
        className="mt-xl inline-flex w-full items-center justify-center gap-sm py-md rounded-full bg-primary-container text-on-primary-container font-headline-md text-label-md font-bold shadow-elevated transition-transform active:scale-95"
      >
        <MaterialIcon name="arrow_back" className="text-[20px]" />
        Back to book a ride
      </Link>
    </RiderShell>
  );
}
