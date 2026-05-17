import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/utils/format";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverEarningsPage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();
  const { data: rides } = await supabase
    .from("rides")
    .select("*")
    .eq("driver_id", profile!.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  const list = (rides ?? []) as Ride[];
  const total = list.reduce((sum, r) => sum + r.fare_minor, 0);
  const currency = list[0]?.currency ?? "MWK";

  return (
    <div className="flex min-h-screen flex-col gap-4 p-5">
      <header className="flex items-center gap-3">
        <Link href="/driver">
          <IconButton size={40}>
            <ArrowLeftIcon className="h-4 w-4" />
          </IconButton>
        </Link>
        <h1 className="text-xl font-semibold">Earnings</h1>
      </header>
      <Card className="flex flex-col items-center gap-2 py-8">
        <span className="text-xs uppercase tracking-wide text-muted">
          Total earned
        </span>
        <span className="text-4xl font-semibold text-accent">
          {formatMoney(total, currency)}
        </span>
        <span className="text-xs text-muted">{list.length} completed trips</span>
      </Card>
      <div className="flex flex-col gap-2">
        {list.map((r) => (
          <Card key={r.id} className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {r.drop_address || "Trip"}
              </span>
              <span className="text-xs text-muted">
                {new Date(r.completed_at ?? r.requested_at).toLocaleString()}
              </span>
            </div>
            <span className="text-sm font-semibold">
              {formatMoney(r.fare_minor, r.currency)}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
