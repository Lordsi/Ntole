"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { RideTier, Vehicle } from "@/lib/supabase/types";

interface VehicleFormProps {
  driverId: string;
  vehicle: Vehicle | null;
  tiers: RideTier[];
}

export function VehicleForm({ driverId, vehicle, tiers }: VehicleFormProps) {
  const [make, setMake] = useState(vehicle?.make ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [plate, setPlate] = useState(vehicle?.plate_number ?? "");
  const [color, setColor] = useState(vehicle?.color ?? "");
  const [seats, setSeats] = useState(vehicle?.seats ?? 4);
  const [tierId, setTierId] = useState(
    vehicle?.tier_id ?? tiers[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const payload = {
        driver_id: driverId,
        tier_id: tierId,
        make,
        model,
        plate_number: plate,
        color,
        seats,
      };
      let res;
      if (vehicle) {
        res = await supabase.from("vehicles").update(payload).eq("id", vehicle.id);
      } else {
        const { data, error } = await supabase
          .from("vehicles")
          .insert(payload)
          .select("*")
          .single();
        res = { error };
        if (data) {
          await supabase
            .from("drivers")
            .upsert(
              { profile_id: driverId, vehicle_id: data.id, status: "offline" },
              { onConflict: "profile_id" },
            );
        }
      }
      if (res.error) throw res.error;
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Vehicle</p>
      <form onSubmit={save} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Make" value={make} onChange={(e) => setMake(e.target.value)} />
          <Input
            placeholder="Model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <Input
          placeholder="Plate number"
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
          <Input
            type="number"
            min={2}
            max={8}
            placeholder="Seats"
            value={String(seats)}
            onChange={(e) => setSeats(Number(e.target.value))}
          />
        </div>
        <select
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          className="h-12 rounded-2xl bg-surface px-4 text-sm ring-1 ring-white/5 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {tiers.map((t) => (
            <option key={t.id} value={t.id} className="bg-background">
              {t.name}
            </option>
          ))}
        </select>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved" : vehicle ? "Update vehicle" : "Add vehicle"}
        </Button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </form>
    </Card>
  );
}
