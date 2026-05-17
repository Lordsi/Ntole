"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils/format";
import { quoteFare } from "@/lib/pricing/fare";
import type { RideTier } from "@/lib/supabase/types";

interface PricingEditorProps {
  tiers: RideTier[];
}

export function PricingEditor({ tiers }: PricingEditorProps) {
  const [list, setList] = useState(tiers);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((tier, i) => (
        <TierCardEditor
          key={tier.id}
          tier={tier}
          onSave={(updated) =>
            setList((prev) => {
              const next = [...prev];
              next[i] = updated;
              return next;
            })
          }
        />
      ))}
    </div>
  );
}

function TierCardEditor({
  tier,
  onSave,
}: {
  tier: RideTier;
  onSave: (updated: RideTier) => void;
}) {
  const [draft, setDraft] = useState<RideTier>(tier);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sample = quoteFare({ tier: draft, distanceKm: 10, durationMin: 20 });

  function set<K extends keyof RideTier>(key: K, value: RideTier[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from("ride_tiers")
      .update({
        base_fare_minor: draft.base_fare_minor,
        per_km_minor: draft.per_km_minor,
        per_minute_minor: draft.per_minute_minor,
        min_fare_minor: draft.min_fare_minor,
        currency: draft.currency,
        surge_multiplier: draft.surge_multiplier,
        is_active: draft.is_active,
        description: draft.description,
      })
      .eq("id", draft.id);
    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      onSave(draft);
    }
    setSaving(false);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">{tier.name}</span>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-4 w-4 accent-[#10C46F]"
          />
          Active
        </label>
      </div>
      <Input
        placeholder="Description"
        value={draft.description}
        onChange={(e) => set("description", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Base fare"
          value={draft.base_fare_minor}
          onChange={(v) => set("base_fare_minor", v)}
        />
        <Field
          label="Per km"
          value={draft.per_km_minor}
          onChange={(v) => set("per_km_minor", v)}
        />
        <Field
          label="Per minute"
          value={draft.per_minute_minor}
          onChange={(v) => set("per_minute_minor", v)}
        />
        <Field
          label="Minimum fare"
          value={draft.min_fare_minor}
          onChange={(v) => set("min_fare_minor", v)}
        />
        <Field
          label="Surge"
          value={draft.surge_multiplier}
          step={0.05}
          onChange={(v) => set("surge_multiplier", v)}
        />
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-wide text-muted">
            Currency
          </label>
          <Input
            value={draft.currency}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
          />
        </div>
      </div>
      <div className="rounded-2xl bg-surface-2 p-3 text-xs">
        <span className="block text-muted">Example: 10 km · 20 min</span>
        <span className="text-base font-semibold">
          {formatMoney(sample.total_minor, draft.currency)}
        </span>
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved" : "Save"}
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] uppercase tracking-wide text-muted">
        {label}
      </label>
      <Input
        type="number"
        step={step ?? 1}
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
