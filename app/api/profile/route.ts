import { NextResponse } from "next/server";

import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Permanently delete the calling user's account.
 *
 * Uses the service-role client because `auth.admin.deleteUser` is gated to
 * the service key. The `profiles` table cascades on `auth.users.id`, so
 * removing the auth user wipes every downstream row (rides, payments,
 * favorites, vehicles, messages, ratings) automatically.
 */
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const admin = createServiceSupabaseClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The caller still has a session cookie; sign them out client-side after
  // this returns so the cookies clear cleanly. We also attempt server sign-out
  // for completeness; ignore any "user not found" race.
  await supabase.auth.signOut().catch(() => undefined);

  return NextResponse.json({ ok: true });
}
