import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import type { Driver } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DriverOnboardingPage() {
  const { profile } = await requireRole("driver", "admin");
  const supabase = await createServerSupabaseClient();

  const { data: driver } = await supabase
    .from("drivers")
    .select("approval_status")
    .eq("profile_id", profile!.id)
    .maybeSingle<Pick<Driver, "approval_status">>();

  if (driver?.approval_status === "approved") {
    redirect("/driver");
  }

  redirect("/driver/apply");
}
