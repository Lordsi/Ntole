import type { ReactNode } from "react";

// The rider layout intentionally does NOT enforce auth — the public home
// (`/rider`) is browsable anonymously so visitors can preview prices.
// Sub-routes that need a session (e.g. /rider/history, /rider/profile,
// /rider/ride/[id]) call `requireRole` themselves.
//
// We deliberately do NOT constrain width here — `MobileShell` (inside each
// page) handles the responsive "phone column on desktop" treatment so that
// the layout chrome (top app bar + bottom nav) lines up with the content.
export default function RiderLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
