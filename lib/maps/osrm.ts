import type { LatLng, RouteResult } from "./types";

const DEFAULT_BASE = "https://router.project-osrm.org";

interface OsrmRoute {
  distance: number; // metres
  duration: number; // seconds
  geometry: string; // encoded polyline (precision 5)
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
  message?: string;
}

/**
 * Compute the driving route between two points using OSRM. The returned
 * coordinates are decoded from the polyline so callers can render them
 * on a Leaflet map without an extra dependency.
 *
 * The public OSRM demo (https://router.project-osrm.org) is rate-limited
 * and not suitable for production. Override OSRM_BASE_URL to point at a
 * self-hosted OSRM or a paid provider that speaks the same API.
 */
export async function routeBetween(
  pickup: LatLng,
  drop: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult> {
  const base = process.env.OSRM_BASE_URL?.replace(/\/$/, "") || DEFAULT_BASE;
  const coords = `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}`;
  const url = `${base}/route/v1/driving/${coords}?overview=full&geometries=polyline&alternatives=false&steps=false`;

  const res = await fetch(url, {
    signal,
    headers: { "User-Agent": "ntole-app/0.1" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`OSRM ${res.status}`);
  }
  const data = (await res.json()) as OsrmResponse;
  if (data.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(`OSRM: ${data.code}${data.message ? ` ${data.message}` : ""}`);
  }
  const route = data.routes[0];
  const coordinates = decodePolyline(route.geometry);
  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    polyline: route.geometry,
    coordinates,
  };
}

/**
 * Decode a Google polyline string (precision 5) into [lat, lng] pairs.
 * Adapted from the Google docs reference implementation.
 */
export function decodePolyline(str: string, precision = 5): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const factor = 10 ** precision;
  const coordinates: [number, number][] = [];

  while (index < str.length) {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    result = 0;
    shift = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/**
 * Haversine distance in km. Used as a cheap fallback when OSRM is unreachable.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (n: number) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
