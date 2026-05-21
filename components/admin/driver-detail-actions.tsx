"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DriverApprovalStatus, RideTier } from "@/lib/supabase/types";

interface DriverDetailActionsProps {
  driverId: string;
  approvalStatus: DriverApprovalStatus;
  tiers: RideTier[];
  currentTierId: string | null;
  displayRating: number;
}

export function DriverDetailActions({
  driverId,
  approvalStatus,
  tiers,
  currentTierId,
  displayRating,
}: DriverDetailActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tierId, setTierId] = useState(
    currentTierId ?? tiers[0]?.id ?? "",
  );
  const [rejectReason, setRejectReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [ratingOverride, setRatingOverride] = useState(
    displayRating.toFixed(2),
  );

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-wrap gap-sm">
        {approvalStatus !== "approved" && (
          <Button
            disabled={busy || !tierId}
            onClick={() => patch({ action: "approve", tierId })}
          >
            Approve
          </Button>
        )}
        {approvalStatus !== "rejected" && approvalStatus !== "banned" && (
          <Button
            variant="secondary"
            disabled={busy || rejectReason.length < 3}
            onClick={() => patch({ action: "reject", reason: rejectReason })}
          >
            Reject
          </Button>
        )}
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => patch({ action: "warn" })}
        >
          Warn
        </Button>
        {approvalStatus !== "banned" && (
          <Button
            variant="secondary"
            disabled={busy || banReason.length < 3}
            onClick={() => patch({ action: "ban", reason: banReason })}
          >
            Ban
          </Button>
        )}
        {approvalStatus === "banned" && (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => patch({ action: "unban" })}
          >
            Unban
          </Button>
        )}
      </div>

      {approvalStatus !== "approved" && (
        <div className="flex flex-col gap-xs max-w-xs">
          <label className="font-label-sm text-label-sm text-on-surface-variant">
            Tier on approve
          </label>
          <select
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            className="h-12 rounded-2xl bg-surface px-4 text-sm ring-1 ring-white/5"
          >
            {tiers.map((t) => (
              <option key={t.id} value={t.id} className="bg-background">
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {approvalStatus === "approved" && (
        <div className="flex flex-wrap items-end gap-md">
          <div className="flex flex-col gap-xs">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              Assigned tier
            </label>
            <select
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              className="h-12 rounded-2xl bg-surface px-4 text-sm ring-1 ring-white/5"
            >
              {tiers.map((t) => (
                <option key={t.id} value={t.id} className="bg-background">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => patch({ action: "set_tier", tierId })}
          >
            Update tier
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-md max-w-md">
        <Input
          placeholder="Reject reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <Input
          placeholder="Ban reason"
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-end gap-md max-w-xs">
        <Input
          type="number"
          step="0.1"
          min={1}
          max={5}
          value={ratingOverride}
          onChange={(e) => setRatingOverride(e.target.value)}
        />
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() =>
            patch({
              action: "set_rating",
              rating: Number(ratingOverride),
            })
          }
        >
          Set rating override
        </Button>
      </div>

      {error && (
        <p className="font-label-sm text-label-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
