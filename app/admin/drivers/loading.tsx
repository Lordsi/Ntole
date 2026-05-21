import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";

export default function Loading() {
  return (
    <AdminTableSkeleton
      title="Drivers"
      subtitle="Loading drivers…"
      icon="directions_car"
      cols={5}
    />
  );
}
