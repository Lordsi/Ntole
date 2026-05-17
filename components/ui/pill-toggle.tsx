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
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const widthPct = 100 / options.length;

  return (
    <div
      className={cn(
        "relative inline-flex w-full items-center rounded-full bg-surface p-1",
        className,
      )}
      role="tablist"
    >
      {/* Sliding indicator pill — animated like the iOS segmented control. */}
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-full bg-accent transition-transform duration-200 ease-out"
        style={{
          width: `calc(${widthPct}% - 4px)`,
          transform: `translateX(calc(${activeIndex} * (100% + 4px)))`,
        }}
      />
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-[14px] font-semibold tracking-[-0.01em] transition-colors duration-150",
              active ? "text-black" : "text-muted-strong hover:text-white",
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
