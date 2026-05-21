import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { DriverShell } from "@/components/shared/role-shell";
import { formatMoney } from "@/lib/utils/format";
import type { Payment, Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TINT: Record<string, string> = {
  paid: "text-primary-container",
  pending: "text-on-surface-variant",
  failed: "text-error",
  refunded: "text-secondary",
};

export default async function DriverWalletPage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  // Pull completed rides for the driver (those generate payouts) and any
  // payments tied to those rides. We sum the paid amounts as lifetime
  // earnings and show the transaction list.
  const { data: ridesData } = await supabase
    .from("rides")
    .select("id, fare_minor, currency, completed_at")
    .eq("driver_id", profile!.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(100);

  const rides = (ridesData ?? []) as Pick<
    Ride,
    "id" | "fare_minor" | "currency" | "completed_at"
  >[];

  const rideIds = rides.map((r) => r.id);
  const { data: paymentsData } = rideIds.length
    ? await supabase
        .from("payments")
        .select("*")
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] as Payment[] };

  const payments = (paymentsData ?? []) as Payment[];
  const lifetime = rides.reduce((sum, r) => sum + r.fare_minor, 0);
  const currency = rides[0]?.currency ?? "MWK";

  return (
    <DriverShell profile={profile}>
      <PageHeader
        title="Wallet"
        subtitle="Available balance, payouts and history."
        icon="account_balance_wallet"
      />

      <section className="glass-panel rounded-lg p-lg flex flex-col items-center text-center gap-xs border border-primary-container/15">
        <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Available balance
        </span>
        <span className="font-display-lg text-display-lg font-extrabold text-primary-container">
          {formatMoney(lifetime, currency)}
        </span>
        <span className="font-label-md text-label-md text-on-surface-variant">
          {rides.length} completed trip{rides.length === 1 ? "" : "s"}
        </span>
      </section>

      {/* Payout method — placeholder. Wires to Stripe Connect later. */}
      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Payout method
        </h2>
        <div className="glass-panel rounded-md p-md flex items-center gap-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-container/10 text-primary-container">
            <MaterialIcon name="account_balance" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-body-md text-on-surface">
              Direct bank transfer
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Payouts settle weekly on Mondays.
            </p>
          </div>
          <button
            type="button"
            className="px-md py-xs rounded-full bg-surface-container-highest text-on-surface font-label-sm text-label-sm border border-outline-variant/30 active:scale-95 transition-transform"
          >
            Edit
          </button>
        </div>
      </section>

      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Recent activity
        </h2>

        {payments.length === 0 ? (
          <div className="glass-panel rounded-md p-lg flex flex-col items-center text-center gap-sm">
            <MaterialIcon
              name="receipt_long"
              className="text-on-surface-variant text-[40px]"
            />
            <p className="font-body-md text-body-md text-on-surface-variant">
              No payouts yet — completed rides will appear here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-sm">
            {payments.map((p) => (
              <li
                key={p.id}
                className="glass-panel rounded-md p-md flex items-center gap-md"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container/10 text-primary-container">
                  <MaterialIcon name="payments" />
                </span>
                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    Payout · {p.provider}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {new Date(p.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span
                    className={`font-label-sm text-label-sm uppercase tracking-[0.12em] mt-1 ${
                      STATUS_TINT[p.status] ?? "text-on-surface-variant"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  {formatMoney(p.amount_minor, p.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </DriverShell>
  );
}
