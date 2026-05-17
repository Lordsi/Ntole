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
    return NextResponse.json(
      { results: [], error: (err as Error).message },
      { status: 200 },
    );
  }
}
