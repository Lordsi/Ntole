"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { cn } from "@/lib/utils/cn";
import type { PlaceSuggestion } from "@/lib/maps/types";

interface LocationInputProps {
  placeholder: string;
  value: PlaceSuggestion | null;
  onChange: (value: PlaceSuggestion | null) => void;
  /** Header label shown above the search field ("Pickup Location" / "Destination"). */
  label: string;
  /** "pickup" gets a muted color scheme, "drop" gets the neon-green accent. */
  variant?: "pickup" | "drop";
}

/**
 * Single row in the Stitch destination card. Renders the editable
 * search field + autocomplete dropdown. Visual chrome of the row
 * (background, border) is owned by the parent `LocationStack`.
 */
export function LocationInput({
  placeholder,
  value,
  onChange,
  label,
  variant = "pickup",
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

  const isPickup = variant === "pickup";

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={cn(
          "rounded-md p-md transition-colors",
          isPickup
            ? "bg-surface-container/50 border border-white/5"
            : "bg-surface-container border border-primary-container/20",
        )}
      >
        <p
          className={cn(
            "text-label-sm font-label-sm mb-xs",
            isPickup ? "text-on-surface-variant" : "text-primary-container",
          )}
        >
          {label}
        </p>
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          className={cn(
            "w-full bg-transparent text-body-md font-body-md focus:outline-none",
            isPickup
              ? "text-on-surface placeholder:text-on-surface-variant/60"
              : "text-on-surface placeholder:text-on-surface-variant",
          )}
        />
        {value && (
          <button
            onClick={() => {
              onChange(null);
              setQuery("");
              setResults([]);
            }}
            className="absolute right-md top-md text-label-sm text-on-surface-variant hover:text-on-surface"
            type="button"
            aria-label="Clear"
          >
            Clear
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-sm max-h-72 overflow-auto rounded-md glass-panel p-xs shadow-card">
          {loading && (
            <p className="px-sm py-xs text-label-sm text-on-surface-variant">
              Searching…
            </p>
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
              className="flex w-full items-start gap-sm rounded-md px-sm py-xs text-left text-body-md text-on-surface transition-colors hover:bg-white/5"
            >
              <MaterialIcon
                name="location_on"
                className="mt-0.5 text-[18px] text-primary-container"
              />
              <span className="line-clamp-2 leading-snug">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
