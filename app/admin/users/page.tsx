import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.length} accounts across all roles`}
        icon="group"
      />

      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] font-body-md text-body-md">
          <thead>
            <tr className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm uppercase tracking-[0.12em]">
              <th className="px-md py-sm text-left">Name</th>
              <th className="px-md py-sm text-left">Phone</th>
              <th className="px-md py-sm text-left">Trips</th>
              <th className="px-md py-sm text-left">Rating</th>
              <th className="px-md py-sm text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-white/[0.06] hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-md py-md text-on-surface font-semibold">
                  {u.full_name || "—"}
                </td>
                <td className="px-md py-md text-on-surface-variant">
                  {u.phone || "—"}
                </td>
                <td className="px-md py-md text-on-surface">{u.trip_count}</td>
                <td className="px-md py-md text-on-surface">
                  {u.rating.toFixed(2)}
                </td>
                <td className="px-md py-md">
                  <UserRoleSelect userId={u.id} role={u.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
