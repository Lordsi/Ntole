import type { SupabaseClient } from "@supabase/supabase-js";

import type { NotificationItem } from "@/components/shared/notifications-button";

type AnySupabase = SupabaseClient;

interface RecentRideRow {
  id: string;
  status: string;
  drop_address: string | null;
  pickup_address: string | null;
  requested_at: string;
  rider: { full_name: string | null } | null;
}

interface RecentUserRow {
  id: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

/**
 * Pull a handful of "things an admin would want to know about" from the
 * database and shape them into NotificationItem entries. Currently:
 *   - latest 5 rides (any status)
 *   - latest 3 user sign-ups
 *
 * Returns an empty array on any failure — notifications are decorative,
 * not load-bearing, so they should never break the admin shell.
 */
export async function buildAdminNotifications(
  supabase: AnySupabase,
): Promise<NotificationItem[]> {
  try {
    const [ridesRes, usersRes] = await Promise.all([
      supabase
        .from("rides")
        .select(
          "id, status, drop_address, pickup_address, requested_at, rider:profiles!rides_rider_id_fkey(full_name)",
        )
        .order("requested_at", { ascending: false })
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const rides = (ridesRes.data ?? []) as unknown as RecentRideRow[];
    const users = (usersRes.data ?? []) as RecentUserRow[];

    const rideItems: NotificationItem[] = rides.map((r) => ({
      id: `ride-${r.id}`,
      icon: iconForStatus(r.status),
      title: `${humanStatus(r.status)} · ${r.rider?.full_name ?? "Rider"}`,
      body: r.drop_address
        ? `→ ${r.drop_address}`
        : r.pickup_address ?? undefined,
      timestamp: r.requested_at,
      href: "/admin/rides",
    }));

    const userItems: NotificationItem[] = users.map((u) => ({
      id: `user-${u.id}`,
      icon: u.role === "driver" ? "directions_car" : "person_add",
      title: `New ${u.role}: ${u.full_name || "Unnamed"}`,
      timestamp: u.created_at,
      href: "/admin/users",
    }));

    return [...rideItems, ...userItems]
      .sort(
        (a, b) =>
          new Date(b.timestamp ?? 0).getTime() -
          new Date(a.timestamp ?? 0).getTime(),
      )
      .slice(0, 8);
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

function humanStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/^./, (c) => c.toUpperCase());
}
