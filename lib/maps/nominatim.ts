import type { PlaceSuggestion } from "./types";

const DEFAULT_BASE = "https://nominatim.openstreetmap.org";

interface NominatimSearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

/**
 * Forward-geocode a free-form query. Tries Malawi first for relevance,
 * then falls back to a global search if Malawi returns nothing — so
 * users typing famous local landmarks ("Mzuzu Central Hospital") get
 * results even when OSM only has them tagged with the country at a
 * higher level.
 *
 * The public Nominatim instance is rate-limited and requires a
 * User-Agent. Production deployments should self-host or use a paid
 * alternative.
 */
export async function searchPlaces(
  query: string,
  opts: {
    limit?: number;
    countryCodes?: string | null;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  const base = process.env.NOMINATIM_BASE_URL?.replace(/\/$/, "") || DEFAULT_BASE;

  async function run(countryCodes: string | null): Promise<PlaceSuggestion[]> {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: String(opts.limit ?? 6),
      addressdetails: "1",
    });
    if (countryCodes) params.set("countrycodes", countryCodes);

    // Independent timeout so a slow upstream doesn't leave the UI stuck
    // on "Searching…". Chained with any caller-supplied signal.
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException("timeout", "AbortError")),
      opts.timeoutMs ?? 8000,
    );
    const onParentAbort = () => controller.abort(opts.signal?.reason);
    opts.signal?.addEventListener("abort", onParentAbort, { once: true });

    try {
      const res = await fetch(`${base}/search?${params.toString()}`, {
        headers: {
          "User-Agent": "ntole-app/0.1 (+https://ntole.app)",
          Accept: "application/json",
        },
        signal: controller.signal,
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
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onParentAbort);
    }
  }

  // Caller can pass `null` to bypass the Malawi bias.
  const preferredCountry =
    opts.countryCodes === undefined ? "mw" : opts.countryCodes;
  const primary = await run(preferredCountry);
  if (primary.length > 0 || !preferredCountry) return primary;
  // Malawi turned up nothing — try worldwide as a safety net.
  return run(null);
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
