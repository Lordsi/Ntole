import type { UserRole } from "@/lib/supabase/types";

/**
 * Paths that are reachable without authentication.
 *
 * - `/` is the smart entry point that redirects by role (anonymous → /rider).
 * - `/rider` is the public rider home — anyone can browse routes / fare quotes.
 *   Sub-paths like `/rider/history`, `/rider/profile`, `/rider/ride/[id]` still
 *   require auth, since they expose personal data or trip ownership.
 * - `/login` and anything under `/auth/` (callback handler) are public by nature.
 */
const PUBLIC_EXACT = new Set<string>(["/", "/login", "/rider"]);
const PUBLIC_PREFIXES = ["/auth/"] as const;

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Returns the home path for a user given their role.
 */
export function resolveHomePath(role: UserRole | null | undefined): string {
  switch (role) {
    case "driver":
      return "/driver";
    case "admin":
      return "/admin";
    case "rider":
    default:
      return "/rider";
  }
}

/**
 * Roles allowed to access a given top-level segment. Public paths bypass
 * this check entirely (handled in middleware via `isPublicPath`).
 */
const SEGMENT_ROLES: Record<string, UserRole[]> = {
  rider: ["rider", "admin"],
  driver: ["driver", "admin"],
  admin: ["admin"],
};

/**
 * Cross-role paths — reachable by any signed-in user regardless of their
 * current `profiles.role`. Used today for the driver application flow:
 * a rider needs to be able to open the wizard, submit it, and watch
 * their pending status before they're a driver yet.
 */
const CROSS_ROLE_PREFIXES = ["/driver/apply", "/driver/onboarding"] as const;

/**
 * Returns true if the role is allowed to access the given path. Anonymous
 * users only get here after a public-path check, so we always require a role.
 */
export function canAccess(
  pathname: string,
  role: UserRole | null | undefined,
): boolean {
  if (!role) return false;
  if (CROSS_ROLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const allowed = SEGMENT_ROLES[segment];
  if (!allowed) return true;
  return allowed.includes(role);
}
