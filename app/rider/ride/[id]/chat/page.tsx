import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { RideChat } from "@/components/chat/ride-chat";
import type { Ride } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireRole("rider", "admin");
  const supabase = await createServerSupabaseClient();
  const { data: ride } = await supabase
    .from("rides")
    .select("id, rider_id, driver_id")
    .eq("id", id)
    .maybeSingle<Pick<Ride, "id" | "rider_id" | "driver_id">>();
  if (!ride) notFound();
  if (ride.rider_id !== profile!.id && profile!.role !== "admin") redirect("/rider");

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-white/5 p-3">
        <Link href={`/rider/ride/${id}`} aria-label="Back">
          <IconButton size={36}>
            <ArrowLeftIcon className="h-4 w-4" />
          </IconButton>
        </Link>
        <span className="text-sm font-semibold">Chat with driver</span>
      </header>
      <RideChat rideId={id} selfId={profile!.id} className="flex-1" />
    </div>
  );
}
