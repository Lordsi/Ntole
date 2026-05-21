import type { SupabaseClient } from "@supabase/supabase-js";

import type { NotificationItem } from "@/components/shared/notifications-button";
import type { UserRole } from "@/lib/supabase/types";

type AnySupabase = SupabaseClient;

interface RideRow {
  id: string;
  status: string;
  drop_address: string | null;
  pickup_address: string | null;
  requested_at: string;
  completed_at: string | null;
  driver_id: string | null;
  rider_id: string | null;
}

/**
 * Build a notifications feed for a rider/driver session. Pulls their last
 * few rides and turns each into a NotificationItem with sensible icons and
 * a destination link.
 *
 * For drivers we also surface "new ride request" entries for any open
 * `requested` rides — the realtime dashboard usually owns this, but
 * mirroring it in the bell makes the surface feel alive.
 */
export async function buildUserNotifications(
  supabase: AnySupabase,
  userId: string,
  role: UserRole,
): Promise<NotificationItem[]> {
  try {
    const rolePath = role === "driver" ? "driver" : "rider";
    const column = role === "driver" ? "driver_id" : "rider_id";

    const ridesRes = await supabase
      .from("rides")
      .select(
        "id, status, drop_address, pickup_address, requested_at, completed_at, driver_id, rider_id",
      )
      .eq(column, userId)
      .order("requested_at", { ascending: false })
      .limit(8);

    const rides = (ridesRes.data ?? []) as RideRow[];

    return rides.map<NotificationItem>((r) => ({
      id: `ride-${r.id}`,
      icon: iconForStatus(r.status),
      title: titleFor(r.status, role),
      body: r.drop_address ? `→ ${r.drop_address}` : r.pickup_address ?? undefined,
      timestamp: r.completed_at ?? r.requested_at,
      href: `/${rolePath}/ride/${r.id}`,
    }));
  } catch {
    return [];
  }
}

function iconForStatus(status: string): string {
  switch (status) {
    case "completed":
      return "check_circle";
    case "cancelled":
      return "cancel";
    case "in_progress":
    case "en_route_to_pickup":
      return "directions_car";
    case "accepted":
      return "handshake";
    case "requested":
    default:
      return "schedule";
  }
}

function titleFor(status: string, role: UserRole): string {
  const verb = role === "driver" ? "Trip" : "Ride";
  switch (status) {
    case "completed":
      return `${verb} completed`;
    case "cancelled":
      return `${verb} cancelled`;
    case "in_progress":
      return `${verb} in progress`;
    case "en_route_to_pickup":
      return `${verb} en route to pickup`;
    case "accepted":
      return `${verb} accepted`;
    case "requested":
      return role === "driver" ? "New ride request" : "Searching for a driver";
    default:
      return `${verb} ${status.replaceAll("_", " ")}`;
  }
}
