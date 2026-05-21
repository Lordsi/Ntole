import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Refresh the Supabase auth session on every request. Call from middleware.ts.
 *
 * Returns the response with refreshed cookies, plus a lightweight user
 * object derived from the JWT in the session cookie.
 *
 * Performance note: we deliberately use `getSession()` here, not
 * `getUser()`. `getUser()` round-trips to Supabase's auth server on every
 * request (200–400 ms) which dominates middleware latency. `getSession()`
 * reads the JWT from cookies locally — no network call. This is safe for
 * routing decisions because:
 *   - Middleware only chooses which page to render, never reads sensitive
 *     data. The data layer behind it is gated by Postgres RLS, which the
 *     forger can't bypass without the JWT signing secret.
 *   - Server components / route handlers that need a fully-verified user
 *     still call `supabase.auth.getUser()` themselves (see
 *     `lib/auth/session.ts`).
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  return { response, supabase, user };
}
