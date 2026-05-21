import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function Loading() {
  return (
    <AdminTableSkeleton
      title="Users"
      subtitle="Loading accounts…"
      icon="group"
      cols={5}
    />
  );
}
