"use client";

import dynamic from "next/dynamic";

// Leaflet only works in the browser, so the actual map is loaded client-side.
const RideMap = dynamic(() => import("./ride-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center bg-background text-sm text-muted">
      Loading map...
    </div>
  ),
});

export { RideMap };
