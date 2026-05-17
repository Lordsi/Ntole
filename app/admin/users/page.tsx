import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import type { Profile } from "@/lib/supabase/types";
import { UserRoleSelect } from "@/components/admin/user-role-select";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Phone</th>
            <th className="px-4 py-3 text-left">Trips</th>
            <th className="px-4 py-3 text-left">Rating</th>
            <th className="px-4 py-3 text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-white/5">
              <td className="px-4 py-3">{u.full_name || "—"}</td>
              <td className="px-4 py-3 text-muted">{u.phone || "—"}</td>
              <td className="px-4 py-3">{u.trip_count}</td>
              <td className="px-4 py-3">{u.rating.toFixed(2)}</td>
              <td className="px-4 py-3">
                <UserRoleSelect userId={u.id} role={u.role} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
