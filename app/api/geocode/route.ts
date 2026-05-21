import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/maps/nominatim";

export const runtime = "nodejs";

// Server-side proxy so the browser doesn't have to talk to nominatim
// directly (keeps the User-Agent + rate limits on our side).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ results: [] });
  try {
    const results = await searchPlaces(q, { limit: 6 });
    return NextResponse.json({ results });
  } catch (err) {
    const message = (err as Error).message ?? "Geocoder unavailable";
    const isTimeout = /timeout|abort/i.test(message);
    return NextResponse.json(
      {
        results: [],
        error: isTimeout
          ? "Map search is taking longer than usual. Please try again."
          : "Couldn't reach the location service right now.",
      },
      { status: 200 },
    );
  }
}
