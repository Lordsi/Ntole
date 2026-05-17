import type { PlaceSuggestion } from "./types";

const DEFAULT_BASE = "https://nominatim.openstreetmap.org";

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

/**
 * Forward-geocode a free-form query. Bounded to Malawi by default for
 * relevance; remove the `countrycodes` param to search globally.
 *
 * The public Nominatim instance is rate-limited and requires a User-Agent.
 * Production deployments should self-host or use a paid alternative.
 */
export async function searchPlaces(
  query: string,
  opts: { limit?: number; countryCodes?: string; signal?: AbortSignal } = {},
): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  const base = process.env.NOMINATIM_BASE_URL?.replace(/\/$/, "") || DEFAULT_BASE;
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: String(opts.limit ?? 6),
    addressdetails: "1",
  });
  if (opts.countryCodes ?? "mw") {
    params.set("countrycodes", opts.countryCodes ?? "mw");
  }
  const res = await fetch(`${base}/search?${params.toString()}`, {
    headers: {
      "User-Agent": "ntole-app/0.1 (+https://ntole.app)",
      Accept: "application/json",
    },
    signal: opts.signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as NominatimSearchResult[];
  return data.map((r) => ({
    label: r.display_name,
    address: r.display_name,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<PlaceSuggestion | null> {
  const base = process.env.NOMINATIM_BASE_URL?.replace(/\/$/, "") || DEFAULT_BASE;
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
  });
  const res = await fetch(`${base}/reverse?${params.toString()}`, {
    headers: {
      "User-Agent": "ntole-app/0.1 (+https://ntole.app)",
      Accept: "application/json",
    },
    signal,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimSearchResult & { error?: string };
  if (data.error) return null;
  return {
    label: data.display_name,
    address: data.display_name,
    lat: Number(data.lat),
    lng: Number(data.lon),
  };
}
