import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/session";

export default async function DriverLayout({ children }: { children: ReactNode }) {
  await requireRole("driver", "admin");
  // `MobileShell` (rendered inside each driver page via DriverShell) controls
  // the responsive width — including the centered phone column on desktop.
  return <div className="min-h-screen">{children}</div>;
}
