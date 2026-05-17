import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";
import { resolveHomePath } from "./routing";

/**
 * Returns the current user + profile, or redirects to login if signed out.
 * Use in Server Components for protected routes.
 */
export async function requireUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { supabase, user, profile };
}

/**
 * Like requireUser, but also enforces that the user has one of the given roles.
 * If not, redirects to the user's home path.
 */
export async function requireRole(...roles: UserRole[]) {
  const session = await requireUser();
  if (!session.profile || !roles.includes(session.profile.role)) {
    redirect(resolveHomePath(session.profile?.role));
  }
  return session;
}
