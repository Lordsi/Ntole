import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/maps/nominatim";

export const runtime = "nodejs";

/**
 * Reverse geocode `(lat, lng)` → `PlaceSuggestion`. Server-side proxy so
 * the browser doesn't have to call Nominatim directly (keeps the
 * required User-Agent + the rate limit on our side).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ result: null, error: "Invalid lat/lng" }, {
      status: 400,
    });
  }
  try {
    const result = await reverseGeocode(lat, lng);
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { result: null, error: (err as Error).message },
      { status: 200 },
    );
  }
}
