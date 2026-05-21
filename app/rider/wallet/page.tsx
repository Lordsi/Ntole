import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { RiderShell } from "@/components/shared/role-shell";
import { formatMoney } from "@/lib/utils/format";
import type { Payment } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const STATUS_TINT: Record<string, string> = {
  paid: "text-primary-container",
  pending: "text-on-surface-variant",
  failed: "text-error",
  refunded: "text-secondary",
};

export default async function RiderWalletPage() {
  const { profile } = await requireRole("rider", "admin");
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("rider_id", profile!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const payments = (data ?? []) as Payment[];
  const paid = payments.filter((p) => p.status === "paid");
  const totalSpent = paid.reduce((sum, p) => sum + p.amount_minor, 0);
  const currency = paid[0]?.currency ?? "MWK";

  return (
    <RiderShell profile={profile}>
      <PageHeader
        title="Wallet"
        subtitle="Payment methods, balance and recent activity."
        icon="account_balance_wallet"
      />

      {/* Hero balance tile — mirrors the driver "total earned" tile but with
          spend-side framing. */}
      <section className="glass-panel rounded-lg p-lg flex flex-col items-center text-center gap-xs border border-primary-container/15">
        <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Lifetime spend
        </span>
        <span className="font-display-lg text-display-lg font-extrabold text-primary-container">
          {formatMoney(totalSpent, currency)}
        </span>
        <span className="font-label-md text-label-md text-on-surface-variant">
          {paid.length} successful payment{paid.length === 1 ? "" : "s"}
        </span>
      </section>

      {/* Payment methods — placeholder pill row. Hooks into Stripe later. */}
      <section className="mt-lg">
        <h2 className="mb-sm font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
          Payment methods
        </h2>
        <div className="glass-panel rounded-md p-md flex items-center gap-md">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-container/10 text-primary-container">
            <MaterialIcon name="credit_card" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-body-md text-body-md text-on-surface">
              Cash on arrival
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Card &amp; mobile money coming soon.
            </p>
          </div>
          <span className="px-sm py-xs rounded-full bg-primary-container/10 text-primary-container font-label-sm text-label-sm border border-primary-container/20">
            Default
          </span>
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
              No payments yet — your trip receipts will show up here.
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
                  <MaterialIcon name="local_taxi" />
                </span>
                <div className="flex flex-1 min-w-0 flex-col">
                  <span className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    Trip · {p.provider}
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
    </RiderShell>
  );
}
