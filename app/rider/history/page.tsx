import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/card";
import { formatDistance, formatDuration, formatMoney } from "@/lib/utils/format";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RiderHistoryPage() {
  const { profile } = await requireRole("rider", "admin");
  const supabase = await createServerSupabaseClient();
  const { data: rides } = await supabase
    .from("rides")
    .select("*")
    .eq("rider_id", profile!.id)
    .order("requested_at", { ascending: false })
    .limit(50);

  const list = (rides ?? []) as Ride[];

  return (
    <div className="flex min-h-screen flex-col gap-4 p-5">
      <header className="flex items-center gap-3">
        <Link href="/rider">
          <IconButton size={40}>
            <ArrowLeftIcon className="h-4 w-4" />
          </IconButton>
        </Link>
        <h1 className="text-xl font-semibold">Trip history</h1>
      </header>
      {list.length === 0 ? (
        <p className="text-sm text-muted">No trips yet.</p>
      ) : (
        list.map((ride) => (
          <Link key={ride.id} href={`/rider/ride/${ride.id}`}>
            <Card className="flex items-center gap-3 hover:bg-surface-2">
              <div className="flex flex-1 flex-col">
                <span className="text-sm font-semibold">
                  {ride.drop_address || "Trip"}
                </span>
                <span className="text-xs text-muted">
                  {new Date(ride.requested_at).toLocaleString()} ·{" "}
                  {formatDistance(ride.actual_distance_km ?? ride.quoted_distance_km)} ·{" "}
                  {formatDuration(ride.actual_duration_min ?? ride.quoted_duration_min)}
                </span>
                <span className="mt-1 text-xs uppercase tracking-wide text-muted">
                  {ride.status}
                </span>
              </div>
              <span className="text-sm font-semibold">
                {formatMoney(ride.fare_minor, ride.currency)}
              </span>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}
