import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function DriverLayout({ children }: { children: ReactNode }) {
  await requireRole("driver", "admin");
  return <div className="mx-auto min-h-screen w-full max-w-md">{children}</div>;
}
