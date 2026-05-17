import type { UserRole } from "@/lib/supabase/types";

/**
 * Public paths that don't require authentication.
 */
export const PUBLIC_PATHS = ["/login", "/auth/callback"] as const;

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
 * Roles allowed to access a given top-level segment.
 */
const SEGMENT_ROLES: Record<string, UserRole[]> = {
  rider: ["rider"],
  driver: ["driver"],
  admin: ["admin"],
};

/**
 * Returns true if the role is allowed to access the given path.
 */
export function canAccess(
  pathname: string,
  role: UserRole | null | undefined,
): boolean {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  const allowed = SEGMENT_ROLES[segment];
  if (!allowed) return true;
  if (!role) return false;
  return allowed.includes(role);
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
