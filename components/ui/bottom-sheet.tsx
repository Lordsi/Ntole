"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface BottomSheetProps {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  /** When true, the sheet covers the screen with a backdrop. */
  modal?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  children,
  className,
  modal = false,
}: BottomSheetProps) {
  if (!open) return null;
  return (
    <>
      {modal && (
        <button
          aria-label="Close"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 animate-fade-in"
        />
      )}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-surface px-4 pb-6 pt-3 shadow-card ring-1 ring-white/5 animate-slide-up",
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/10" />
        {children}
      </div>
    </>
  );
}
