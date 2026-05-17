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

const ACCENT = "#34D67E";

function dotIcon(color: string, ring = "rgba(52,214,126,0.25)") {
  return L.divIcon({
    className: "ntole-map-pin",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:inline-flex;width:22px;height:22px;border-radius:9999px;align-items:center;justify-content:center;background:${ring};"><span style="width:12px;height:12px;border-radius:9999px;background:${color};box-shadow:0 0 0 2px #0B0C0E;"></span></span>`,
  });
}

function carIcon() {
  return L.divIcon({
    className: "ntole-map-car",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<span style="display:inline-flex;width:34px;height:34px;border-radius:9999px;align-items:center;justify-content:center;background:#34D67E;box-shadow:0 0 0 4px rgba(52,214,126,0.25),0 4px 10px rgba(0,0,0,0.4);">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="#0B0C0E"><path d="M5 17V11l2-5h10l2 5v6h-2v2H7v-2H5Zm2-6h10l-1.4-3.5H8.4L7 11Zm2 4a1 1 0 1 0-1-1 1 1 0 0 0 1 1Zm6 0a1 1 0 1 0-1-1 1 1 0 0 0 1 1Z"/></svg>
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
          <Polyline
            positions={route}
            pathOptions={{ color: ACCENT, weight: 5, opacity: 0.95 }}
          />
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
