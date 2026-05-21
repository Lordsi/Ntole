import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { Avatar } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { PageHeader } from "@/components/shared/page-header";
import { UserRoleSelect } from "@/components/admin/user-role-select";
import type { Profile } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { profile: self } = await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as Profile[];
  const counts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={`${users.length} accounts · ${counts.rider ?? 0} riders · ${counts.driver ?? 0} drivers · ${counts.admin ?? 0} admins`}
        icon="group"
      />

      <div className="glass-panel rounded-md p-md mb-md flex items-start gap-md">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-container/10 text-primary-container">
          <MaterialIcon name="shield_person" />
        </span>
        <div className="flex flex-col">
          <p className="font-body-md text-body-md text-on-surface">
            Promote or demote any user by tapping a role pill.
          </p>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Promoting a rider to <strong>driver</strong> creates an offline,
            unverified driver record they can complete in the driver portal.
            Use <strong>admin</strong> sparingly — admins can edit every page.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm uppercase tracking-[0.12em]">
                <th className="px-md py-sm text-left">User</th>
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
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <Avatar
                        name={u.full_name || "User"}
                        src={u.avatar_url}
                        size={36}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {u.full_name || "—"}
                          {self?.id === u.id && (
                            <span className="ml-xs inline-flex items-center font-label-sm text-label-sm uppercase tracking-[0.08em] text-primary-container">
                              · you
                            </span>
                          )}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md text-on-surface-variant">
                    {u.phone || "—"}
                  </td>
                  <td className="px-md py-md text-on-surface">{u.trip_count}</td>
                  <td className="px-md py-md text-on-surface">
                    {u.rating.toFixed(2)}
                  </td>
                  <td className="px-md py-md">
                    <UserRoleSelect
                      userId={u.id}
                      role={u.role}
                      selfId={self?.id}
                    />
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
