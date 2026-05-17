"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L, { type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { LatLng } from "@/lib/maps/types";

interface RideMapProps {
  pickup?: LatLng | null;
  drop?: LatLng | null;
  route?: [number, number][] | null;
  driver?: LatLng | null;
  /** Default center if no pickup/drop is provided. */
  center?: LatLng;
  className?: string;
  zoom?: number;
}

const DEFAULT_CENTER: LatLng = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? -13.9626),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? 33.7741),
};

const ACCENT = "#28C76F";

function dotIcon(color: string, ring = "rgba(40,199,111,0.28)") {
  return L.divIcon({
    className: "ntole-map-pin",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<span style="display:inline-flex;width:26px;height:26px;border-radius:9999px;align-items:center;justify-content:center;background:${ring};box-shadow:0 0 18px ${ring};"><span style="width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px #0B0C10;"></span></span>`,
  });
}

function carIcon() {
  return L.divIcon({
    className: "ntole-map-car",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<span style="display:inline-flex;width:36px;height:36px;border-radius:9999px;align-items:center;justify-content:center;background:#28C76F;box-shadow:0 0 0 4px rgba(40,199,111,0.28),0 0 22px rgba(40,199,111,0.55),0 4px 10px rgba(0,0,0,0.5);">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="#0B0C10"><path d="M5 17V11l2-5h10l2 5v6h-2v2H7v-2H5Zm2-6h10l-1.4-3.5H8.4L7 11Zm2 4a1 1 0 1 0-1-1 1 1 0 0 0 1 1Zm6 0a1 1 0 1 0-1-1 1 1 0 0 0 1 1Z"/></svg>
    </span>`,
  });
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: true });
      return;
    }
    const bounds: LatLngBoundsExpression = points.map((p) => [p.lat, p.lng]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [points, map]);
  return null;
}

export default function RideMap({
  pickup,
  drop,
  route,
  driver,
  center,
  className,
  zoom = 13,
}: RideMapProps) {
  const initialCenter = pickup ?? center ?? DEFAULT_CENTER;
  const points = useMemo(
    () => [pickup, drop, driver].filter(Boolean) as LatLng[],
    [pickup, drop, driver],
  );

  const pickupIcon = useRef(dotIcon(ACCENT)).current;
  const dropIcon = useRef(dotIcon("#FFFFFF", "rgba(255,255,255,0.18)")).current;
  const driverPinIcon = useRef(carIcon()).current;

  return (
    <div className={className} style={{ position: "relative", height: "100%" }}>
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={zoom}
        zoomControl={false}
        style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
        )}
        {drop && <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverPinIcon} />
        )}
        {route && route.length > 1 && (
          <>
            {/* Outer halo for the "glowing neon" effect. */}
            <Polyline
              positions={route}
              pathOptions={{
                color: ACCENT,
                weight: 14,
                opacity: 0.18,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={route}
              pathOptions={{
                color: ACCENT,
                weight: 5,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
