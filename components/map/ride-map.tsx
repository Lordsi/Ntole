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
  /** Additional drivers to render as fleet pins. Useful for ops dashboards. */
  drivers?: LatLng[] | null;
  /** Default center if no pickup/drop is provided. */
  center?: LatLng;
  className?: string;
  zoom?: number;
}

const DEFAULT_CENTER: LatLng = {
  lat: Number(process.env.NEXT_PUBLIC_DEFAULT_LAT ?? -13.9626),
  lng: Number(process.env.NEXT_PUBLIC_DEFAULT_LNG ?? 33.7741),
};

const ACCENT = "#39ff14";
const ACCENT_RING = "rgba(57,255,20,0.28)";
const ACCENT_GLOW = "rgba(57,255,20,0.55)";
const SURFACE = "#0c0f0f";

function dotIcon(color: string, ring = ACCENT_RING) {
  return L.divIcon({
    className: "ntole-map-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span style="display:inline-flex;width:28px;height:28px;border-radius:9999px;align-items:center;justify-content:center;background:${ring};box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 0 20px ${ring};"><span style="width:14px;height:14px;border-radius:9999px;background:${color};box-shadow:0 0 0 3px ${SURFACE},0 0 12px ${color};"></span></span>`,
  });
}

function carIcon() {
  return L.divIcon({
    className: "ntole-map-car",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `<span style="display:inline-flex;width:38px;height:38px;border-radius:9999px;align-items:center;justify-content:center;background:${ACCENT};box-shadow:0 0 0 4px ${ACCENT_RING},0 0 24px ${ACCENT_GLOW},0 4px 10px rgba(0,0,0,0.55);">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="${SURFACE}" aria-hidden="true"><path d="M5 17V11l2-5h10l2 5v6h-2v2H7v-2H5Zm2-6h10l-1.4-3.5H8.4L7 11Zm2 4a1 1 0 1 0-1-1 1 1 0 0 0 1 1Zm6 0a1 1 0 1 0-1-1 1 1 0 0 0 1 1Z"/></svg>
    </span>`,
  });
}

function fleetIcon() {
  return L.divIcon({
    className: "ntole-map-fleet",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:inline-flex;width:22px;height:22px;border-radius:9999px;align-items:center;justify-content:center;background:${ACCENT_RING};box-shadow:0 0 14px ${ACCENT_RING};"><span style="width:10px;height:10px;border-radius:9999px;background:${ACCENT};box-shadow:0 0 0 2px ${SURFACE},0 0 8px ${ACCENT};"></span></span>`,
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
  drivers,
  center,
  className,
  zoom = 13,
}: RideMapProps) {
  const initialCenter = pickup ?? driver ?? center ?? DEFAULT_CENTER;
  const fitPoints = useMemo(() => {
    const list: LatLng[] = [];
    if (pickup) list.push(pickup);
    if (drop) list.push(drop);
    if (driver) list.push(driver);
    if (drivers) list.push(...drivers);
    return list;
  }, [pickup, drop, driver, drivers]);

  const pickupIcon = useRef(dotIcon(ACCENT)).current;
  const dropIcon = useRef(dotIcon("#ffffff", "rgba(255,255,255,0.18)")).current;
  const driverPinIcon = useRef(carIcon()).current;
  const fleetPinIcon = useRef(fleetIcon()).current;

  // CartoDB Dark Matter — purpose-built dark basemap with hi-DPI tiles.
  // No API key required; attribution preserved below.
  const tileUrl =
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className={className} style={{ position: "relative", height: "100%" }}>
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={zoom}
        zoomControl={false}
        style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
        attributionControl={true}
        worldCopyJump
        preferCanvas
      >
        <TileLayer
          attribution={tileAttribution}
          url={tileUrl}
          subdomains={["a", "b", "c", "d"]}
          maxZoom={20}
          detectRetina
          className="ntole-tile-layer"
        />
        {drivers?.map((d, i) => (
          <Marker
            key={`fleet-${i}-${d.lat}-${d.lng}`}
            position={[d.lat, d.lng]}
            icon={fleetPinIcon}
          />
        ))}
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
                weight: 16,
                opacity: 0.15,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={route}
              pathOptions={{
                color: ACCENT,
                weight: 9,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={route}
              pathOptions={{
                color: ACCENT,
                weight: 4,
                opacity: 1,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}
        <FitBounds points={fitPoints} />
      </MapContainer>
      {/* Edge vignette to blend the map into the surrounding dark UI. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(10,12,12,0.55) 100%)",
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
