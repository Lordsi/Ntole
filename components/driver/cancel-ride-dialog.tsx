"use client";

import { useEffect, useRef, useState } from "react";

import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";

export type CancelStage = "before_pickup" | "in_progress";

interface CancelRideDialogProps {
  open: boolean;
  /** Drives the headline + tone — cancelling a started trip is heavier. */
  stage: CancelStage;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

// Predefined reason chips. Drivers can also type a custom reason which
// overrides any selected chip.
const BEFORE_PICKUP_REASONS = [
  "Rider didn't show up",
  "Wrong pickup location",
  "Vehicle issue",
  "Safety concern",
  "Other",
] as const;

const IN_PROGRESS_REASONS = [
  "Rider asked to end early",
  "Vehicle issue",
  "Safety concern",
  "Route impassable",
  "Other",
] as const;

/**
 * Modal sheet shown when the driver taps "Cancel". Forces the driver to
 * pick (or type) a reason and explicitly confirm before we PATCH the
 * ride. Especially important mid-trip — a misclick on a tiny button
 * shouldn't be able to abandon a passenger.
 */
export function CancelRideDialog({
  open,
  stage,
  onClose,
  onConfirm,
}: CancelRideDialogProps) {
  const reasons =
    stage === "in_progress" ? IN_PROGRESS_REASONS : BEFORE_PICKUP_REASONS;

  const [picked, setPicked] = useState<string>("");
  const [custom, setCustom] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setPicked("");
      setCustom("");
      setError(null);
      setBusy(false);
      return;
    }
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const effectiveReason = custom.trim() || picked;
  const canSubmit = effectiveReason.length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(effectiveReason);
    } catch (e) {
      setError((e as Error).message ?? "Couldn't cancel the ride.");
      setBusy(false);
    }
  }

  const headline =
    stage === "in_progress" ? "End trip early?" : "Cancel ride?";
  const body =
    stage === "in_progress"
      ? "Cancelling a trip in progress can affect your standing. The rider will be notified."
      : "The rider will be notified that you can't make this trip.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={headline}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-xs"
      />
      <div
        ref={sheetRef}
        className="relative w-full sm:max-w-md bg-surface-container-low border border-white/10 rounded-t-lg sm:rounded-lg shadow-[0_-10px_60px_rgba(0,0,0,0.6)] p-lg flex flex-col gap-md max-h-[85vh] overflow-y-auto"
      >
        <div className="mx-auto -mt-1 mb-xs h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />

        <div className="flex items-start gap-md">
          <span
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full",
              stage === "in_progress"
                ? "bg-error/15 text-error"
                : "bg-warning/15 text-warning",
            )}
          >
            <MaterialIcon name="report" filled />
          </span>
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              {headline}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              {body}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-sm">
          <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
            Reason
          </p>
          <div className="flex flex-wrap gap-xs">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setPicked(r);
                  setCustom("");
                }}
                className={cn(
                  "rounded-full px-md py-xs font-label-sm text-label-sm transition-colors ring-1",
                  picked === r && !custom
                    ? "bg-primary-container/15 text-primary-container ring-primary-container/30"
                    : "bg-surface-container-highest/60 text-on-surface-variant ring-white/10 hover:text-on-surface",
                )}
              >
                {r}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-xs">
            <span className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-on-surface-variant">
              Or type your own
            </span>
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Add a short note"
              className="h-12 rounded-md bg-surface-container px-md font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline focus:outline-2 focus:outline-primary-container"
            />
          </label>
        </div>

        {error && (
          <p
            className="font-label-md text-label-md text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-sm pt-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 h-12 rounded-full bg-surface-container-highest text-on-surface font-label-md text-label-md font-bold uppercase tracking-[0.08em] hover:bg-surface-container-high transition-colors disabled:opacity-60"
          >
            Keep trip
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "flex-1 h-12 rounded-full font-label-md text-label-md font-bold uppercase tracking-[0.08em] transition-colors",
              canSubmit
                ? "bg-error text-on-error hover:opacity-90"
                : "bg-error/40 text-on-error/70 cursor-not-allowed",
            )}
          >
            {busy
              ? "Cancelling…"
              : stage === "in_progress"
                ? "End trip"
                : "Cancel ride"}
          </button>
        </div>
      </div>
    </div>
  );
}
