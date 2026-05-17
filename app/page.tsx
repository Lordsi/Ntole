import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveHomePath } from "@/lib/auth/routing";

// Smart entry point. Anonymous visitors land on the public rider home;
// signed-in users go to the surface that matches their role.
export const dynamic = "force-dynamic";

export default async function RootRedirect() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/rider");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(resolveHomePath(profile?.role));
}
