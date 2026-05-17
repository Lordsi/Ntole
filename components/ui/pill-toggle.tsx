"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface PillToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface PillToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: PillToggleOption<T>[];
  className?: string;
}

export function PillToggle<T extends string>({
  value,
  onChange,
  options,
  className,
}: PillToggleProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-pill bg-surface p-1 ring-1 ring-white/5",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-pill text-sm font-medium transition-colors",
              active
                ? "bg-accent text-background"
                : "text-muted-strong hover:text-white",
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
