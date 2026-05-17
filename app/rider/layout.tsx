import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function RiderLayout({ children }: { children: ReactNode }) {
  await requireRole("rider", "admin");
  return <div className="mx-auto min-h-screen w-full max-w-md">{children}</div>;
}
