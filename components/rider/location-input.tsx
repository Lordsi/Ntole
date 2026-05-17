"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { PlaceSuggestion } from "@/lib/maps/types";
import { MapPinIcon } from "@/components/ui/icons";

interface LocationInputProps {
  placeholder: string;
  value: PlaceSuggestion | null;
  onChange: (value: PlaceSuggestion | null) => void;
  /** Visual indicator for pickup vs drop. */
  variant?: "pickup" | "drop";
}

export function LocationInput({
  placeholder,
  value,
  onChange,
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

  const dotColor =
    variant === "pickup" ? "bg-accent" : "bg-white";

  return (
    <div className="relative" ref={containerRef}>
      <label className="flex h-14 w-full items-center gap-3 rounded-2xl bg-surface px-4 ring-1 ring-white/5 focus-within:ring-accent">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2">
          <span className="relative">
            <MapPinIcon className="h-4 w-4 text-muted-strong" />
            <span
              className={cn(
                "absolute -right-1 -top-1 h-2 w-2 rounded-full",
                dotColor,
              )}
            />
          </span>
        </span>
        <input
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          className="h-full flex-1 bg-transparent text-base text-white placeholder:text-muted focus:outline-none"
        />
        {value && (
          <button
            onClick={() => {
              onChange(null);
              setQuery("");
              setResults([]);
            }}
            className="text-xs text-muted hover:text-white"
            type="button"
          >
            Clear
          </button>
        )}
      </label>
      {open && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-auto rounded-2xl bg-surface-2 p-1 shadow-card ring-1 ring-white/5">
          {loading && (
            <p className="px-3 py-2 text-xs text-muted">Searching...</p>
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
              className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left text-sm text-white hover:bg-white/5"
            >
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="line-clamp-2">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
