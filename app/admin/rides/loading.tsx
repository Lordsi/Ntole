import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function Loading() {
  return (
    <AdminTableSkeleton
      title="Rides"
      subtitle="Loading rides…"
      icon="route"
      cols={5}
    />
  );
}
