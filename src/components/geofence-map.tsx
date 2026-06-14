"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Polygon, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { GeofenceShape, MapVehicle } from "@/lib/types";

const vertexIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:12px;height:12px;border-radius:999px;background:#0f766e;border:2px solid white;box-shadow:0 1px 4px rgba(15,23,42,.4)"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

function ClickCapture({
  mode,
  onCircleCenter,
  onPolygonPoint,
}: {
  mode: "circle" | "polygon";
  onCircleCenter: (point: [number, number]) => void;
  onPolygonPoint: (point: [number, number]) => void;
}) {
  useMapEvents({
    click(event) {
      const point: [number, number] = [event.latlng.lat, event.latlng.lng];
      if (mode === "circle") onCircleCenter(point);
      else onPolygonPoint(point);
    },
  });
  return null;
}

function FitReference({ vehicles, shape }: { vehicles: MapVehicle[]; shape: GeofenceShape | null }) {
  const map = useMap();
  useEffect(() => {
    if (shape) return; // don't fight the user while drawing
    const points = vehicles.map((vehicle) => [vehicle.lat, vehicle.lng] as [number, number]);
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
    else if (points.length === 1) map.setView(points[0], 13);
  }, [map, vehicles, shape]);
  return null;
}

export function GeofenceMap({
  mode,
  shape,
  vehicles,
  onCircleCenter,
  onPolygonPoint,
}: {
  mode: "circle" | "polygon";
  shape: GeofenceShape | null;
  vehicles: MapVehicle[];
  onCircleCenter: (point: [number, number]) => void;
  onPolygonPoint: (point: [number, number]) => void;
}) {
  const center = useMemo<[number, number]>(
    () => (vehicles[0] ? [vehicles[0].lat, vehicles[0].lng] : [23.685, 90.3563]),
    [vehicles],
  );

  return (
    <MapContainer center={center} zoom={vehicles.length ? 12 : 7} scrollWheelZoom className="h-full w-full">
      <FitReference vehicles={vehicles} shape={shape} />
      <ClickCapture mode={mode} onCircleCenter={onCircleCenter} onPolygonPoint={onPolygonPoint} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Faint reference markers for live vehicles. */}
      {vehicles.map((vehicle) => (
        <Circle
          key={vehicle.id}
          center={[vehicle.lat, vehicle.lng]}
          radius={40}
          pathOptions={{ color: "#0f766e", weight: 1, opacity: 0.5, fillOpacity: 0.5 }}
        />
      ))}

      {shape?.kind === "circle" ? (
        <>
          <Circle
            center={shape.center}
            radius={shape.radius}
            pathOptions={{ color: "#0d9488", weight: 2, fillColor: "#14b8a6", fillOpacity: 0.18 }}
          />
          <Marker position={shape.center} icon={vertexIcon} />
        </>
      ) : null}

      {shape?.kind === "polygon" && shape.points.length > 0 ? (
        <>
          {shape.points.length >= 3 ? (
            <Polygon positions={shape.points} pathOptions={{ color: "#0d9488", weight: 2, fillColor: "#14b8a6", fillOpacity: 0.18 }} />
          ) : null}
          {shape.points.map((point, index) => (
            <Marker key={index} position={point} icon={vertexIcon} />
          ))}
        </>
      ) : null}
    </MapContainer>
  );
}
