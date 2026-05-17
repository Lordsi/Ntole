import type { RideTier } from "@/lib/supabase/types";

export interface FareInput {
  tier: Pick<
    RideTier,
    | "base_fare_minor"
    | "per_km_minor"
    | "per_minute_minor"
    | "min_fare_minor"
    | "currency"
    | "surge_multiplier"
  >;
  distanceKm: number;
  durationMin: number;
  /** Override surge multiplier. Defaults to the tier's surge_multiplier. */
  surge?: number;
}

export interface FareBreakdown {
  base_minor: number;
  distance_minor: number;
  time_minor: number;
  surge: number;
  subtotal_minor: number;
  total_minor: number;
  min_fare_applied: boolean;
  currency: string;
  distance_km: number;
  duration_min: number;
}

/**
 * Uber-style fare:
 *
 *   total = max(min_fare,
 *               (base + per_km * distance_km + per_min * duration_min) * surge)
 *
 * All money values are integer minor units. Distance and duration are kept
 * as floats here; rounding to the nearest minor unit happens at the end.
 */
export function quoteFare(input: FareInput): FareBreakdown {
  const { tier, distanceKm, durationMin } = input;
  const surge = input.surge ?? tier.surge_multiplier ?? 1;

  const distance_minor = Math.round(tier.per_km_minor * Math.max(0, distanceKm));
  const time_minor = Math.round(tier.per_minute_minor * Math.max(0, durationMin));
  const variable = tier.base_fare_minor + distance_minor + time_minor;
  const subtotal = Math.round(variable * surge);
  const total = Math.max(subtotal, tier.min_fare_minor);

  return {
    base_minor: tier.base_fare_minor,
    distance_minor,
    time_minor,
    surge,
    subtotal_minor: subtotal,
    total_minor: total,
    min_fare_applied: total > subtotal,
    currency: tier.currency,
    distance_km: distanceKm,
    duration_min: durationMin,
  };
}

/**
 * Parse a comma-separated "lat,lng" string. Returns null if invalid.
 */
export function parseLatLng(s: string): { lat: number; lng: number } | null {
  const parts = s.split(",").map((x) => Number(x.trim()));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return null;
  const [lat, lng] = parts;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
