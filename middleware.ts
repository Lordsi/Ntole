import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { canAccess, isPublicPath, resolveHomePath } from "@/lib/auth/routing";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, supabase, user } = await updateSession(request);

  if (isPublicPath(pathname)) return response;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Resolve role for top-level segment guarding. The home redirect at "/"
  // is handled by app/page.tsx, but middleware enforces the access control.
  if (pathname === "/" || pathname === "") return response;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccess(pathname, profile?.role)) {
    const url = request.nextUrl.clone();
    url.pathname = resolveHomePath(profile?.role);
    return NextResponse.redirect(url);
  }

  if (
    profile?.role === "driver" &&
    pathname.startsWith("/driver") &&
    !pathname.startsWith("/driver/apply") &&
    !pathname.startsWith("/driver/onboarding")
  ) {
    const { data: driver } = await supabase
      .from("drivers")
      .select("approval_status")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (
      !driver ||
      (driver.approval_status !== "approved" &&
        driver.approval_status !== "banned")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/driver/apply";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next internals + static assets + the manifest + icons.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|.*\\..*).*)",
  ],
};
