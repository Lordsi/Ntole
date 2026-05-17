import type { ReactNode } from "react";

// The rider layout intentionally does NOT enforce auth — the public home
// (`/rider`) is browsable anonymously so visitors can preview prices.
// Sub-routes that need a session (e.g. /rider/history, /rider/profile,
// /rider/ride/[id]) call `requireRole` themselves.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-screen w-full max-w-md">{children}</div>;
}
