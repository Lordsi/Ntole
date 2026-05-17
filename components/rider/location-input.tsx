"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PlaceSuggestion } from "@/lib/maps/types";

interface LocationInputProps {
  placeholder: string;
  value: PlaceSuggestion | null;
  onChange: (value: PlaceSuggestion | null) => void;
  /** Visual indicator for pickup vs drop. */
  variant?: "pickup" | "drop";
  /** When this row sits inside a grouped LocationStack we drop the rounded
   * container chrome; the parent owns the surface. */
  flush?: boolean;
}

/**
 * A single pickup/drop row. Designed to be composed inside a LocationStack
 * (where it renders flush, sharing a card surface and a shared divider).
 * Standalone it still renders as its own rounded card.
 */
export function LocationInput({
  placeholder,
  value,
  onChange,
  variant = "pickup",
  flush = false,
}: LocationInputProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleChange(next: string) {
    setQuery(next);
    setOpen(true);
    if (debounce.current) clearTimeout(debounce.current);
    if (next.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(next)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label
        className={cn(
          "flex h-14 w-full items-center gap-3 px-4",
          !flush && "rounded-2xl bg-surface",
        )}
      >
        <Indicator variant={variant} />
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          className="h-full flex-1 bg-transparent text-[15px] text-white placeholder:text-muted focus:outline-none"
        />
        {value && (
          <button
            onClick={() => {
              onChange(null);
              setQuery("");
              setResults([]);
            }}
            className="text-[13px] text-muted transition-colors hover:text-white"
            type="button"
          >
            Clear
          </button>
        )}
      </label>
      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-2xl bg-surface-2 p-1 shadow-card">
          {loading && (
            <p className="px-3 py-2 text-[13px] text-muted">Searching…</p>
          )}
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lng}`}
              type="button"
              onClick={() => {
                onChange(r);
                setQuery(r.label);
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-white transition-colors hover:bg-white/5"
            >
              <Indicator variant="drop" muted />
              <span className="line-clamp-2 leading-snug">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Apple Maps-style indicator: a small filled dot (pickup) or hollow square (drop).
 * No more pin-in-circle decoration — single glyph, single purpose.
 */
function Indicator({
  variant,
  muted = false,
}: {
  variant: "pickup" | "drop";
  muted?: boolean;
}) {
  if (variant === "pickup") {
    return (
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center",
          muted && "opacity-60",
        )}
        aria-hidden
      >
        <span className="h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgba(52,214,126,0.18)]" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center",
        muted && "opacity-60",
      )}
      aria-hidden
    >
      <span className="h-2.5 w-2.5 rounded-[3px] bg-white" />
    </span>
  );
}
