"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { StationDto } from "@/types";

function stationIcon(_kw: number, highlighted: boolean) {
  // one uniform sign for every station; the nearest-compatible one gets a ring
  const bg = highlighted ? "#0C3B24" : "#1B7A4B";
  const ring = highlighted ? "box-shadow:0 0 0 4px rgba(27,122,75,.35);" : "";
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:#fff;border:2px solid #fff;${ring}border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font:700 16px/1 system-ui;">⚡</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="background:#2563EB;border:3px solid #fff;border-radius:9999px;width:18px;height:18px;box-shadow:0 0 0 6px rgba(37,99,235,.25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function StationMap({
  center,
  userLocation,
  stations,
  highlightedId,
  onSelect,
  rangeKm,
}: {
  center: [number, number];
  userLocation: [number, number] | null;
  stations: StationDto[];
  highlightedId?: string | null;
  onSelect: (s: StationDto) => void;
  /** remaining-range ring radius (km), drawn around the user/center */
  rangeKm?: number | null;
}) {
  return (
    <MapContainer
      center={center}
      zoom={11}
      className="h-full w-full"
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Recenter center={center} />
      {userLocation && (
        <>
          <Marker position={userLocation} icon={userIcon} />
          <Circle
            center={userLocation}
            radius={10000}
            pathOptions={{ color: "#1B7A4B", weight: 1, fillOpacity: 0.04 }}
          />
        </>
      )}
      {rangeKm != null && rangeKm > 0 && (
        <Circle
          center={userLocation ?? center}
          radius={rangeKm * 1000}
          pathOptions={{
            color: "#B45309",
            weight: 2,
            dashArray: "8 8",
            fillColor: "#B45309",
            fillOpacity: 0.05,
          }}
        />
      )}
      {stations.map((s) => (
        <Marker
          key={s.id}
          position={[s.latitude, s.longitude]}
          icon={stationIcon(s.maxPowerKw, s.id === highlightedId)}
          eventHandlers={{ click: () => onSelect(s) }}
        />
      ))}
    </MapContainer>
  );
}
