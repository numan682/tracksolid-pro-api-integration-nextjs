"use client";

/* eslint-disable @next/next/no-img-element -- map marker and popup icons intentionally load tiny SVGs from a CDN. */

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Fragment, useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { MapVehicle } from "@/lib/types";

export type { MapVehicle } from "@/lib/types";

export type MapFeatureId = "playback" | "geofences" | "alarms" | "media" | "diagnostics";

const CDN_ICON_BASE = "https://cdn.jsdelivr.net/npm/lucide-static@0.554.0/icons";

const featureActions: { id: MapFeatureId; label: string; icon: string }[] = [
  { id: "playback", label: "Playback", icon: "route" },
  { id: "geofences", label: "Geofence", icon: "scan" },
  { id: "alarms", label: "Alarms", icon: "bell" },
  { id: "media", label: "Media", icon: "video" },
  { id: "diagnostics", label: "Info", icon: "circle-gauge" },
];

function cdnIcon(name: string) {
  return `${CDN_ICON_BASE}/${name}.svg`;
}

function vehicleIcon(selected: boolean) {
  return new L.DivIcon({
    className: "",
    html: `
      <div class="map-pin ${selected ? "map-pin-selected" : ""}" aria-hidden="true">
        <span class="map-pin-pulse"></span>
        <span class="map-pin-core">
          <img alt="" src="${cdnIcon("map-pin")}" />
        </span>
      </div>
    `,
    iconSize: selected ? [54, 54] : [46, 46],
    iconAnchor: selected ? [27, 46] : [23, 40],
  });
}

function vehicleLabelIcon(vehicle: MapVehicle, selected: boolean) {
  return new L.DivIcon({
    className: "",
    html: `<div class="map-device-label ${selected ? "map-device-label-selected" : ""}">${escapeHtml(vehicle.name)}</div>`,
    iconSize: [150, 28],
    iconAnchor: [75, 78],
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function MapAutoFit({
  vehicles,
  route,
  selectedVehicleId,
}: {
  vehicles: MapVehicle[];
  route: [number, number][];
  selectedVehicleId?: string;
}) {
  const map = useMap();
  // Only the SET of vehicles (not their moving positions) should trigger a refit,
  // otherwise live polling / playback animation re-centers the map every update.
  const idsKey = vehicles.map((vehicle) => vehicle.id).join("|");
  const routeKey = `${route.length}:${route[0]?.join(",") ?? ""}`;

  useEffect(() => {
    const selectedVehicle = vehicles.find((vehicle) => vehicle.imei === selectedVehicleId || vehicle.id === selectedVehicleId);

    if (selectedVehicle) {
      map.setView([selectedVehicle.lat, selectedVehicle.lng], Math.max(map.getZoom(), 15), { animate: true });
      return;
    }

    const points = [...vehicles.map((vehicle) => [vehicle.lat, vehicle.lng] as [number, number]), ...route];
    if (points.length > 1) {
      map.fitBounds(points, { padding: [44, 44], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routeKey, selectedVehicleId, idsKey]);

  return null;
}

export function FleetMap({
  vehicles,
  route = [],
  selectedVehicleId,
  onSelectVehicle,
  onFeatureSelect,
}: {
  vehicles: MapVehicle[];
  route?: [number, number][];
  selectedVehicleId?: string;
  onSelectVehicle?: (vehicle: MapVehicle) => void;
  onFeatureSelect?: (vehicle: MapVehicle, feature: MapFeatureId) => void;
}) {
  const center: [number, number] = vehicles.length ? [vehicles[0].lat, vehicles[0].lng] : [23.685, 90.3563];
  const icons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const vehicle of vehicles) {
      const selected = vehicle.imei === selectedVehicleId || vehicle.id === selectedVehicleId;
      cache.set(vehicle.id, vehicleIcon(selected));
    }
    return cache;
  }, [selectedVehicleId, vehicles]);
  const labelIcons = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    for (const vehicle of vehicles) {
      const selected = vehicle.imei === selectedVehicleId || vehicle.id === selectedVehicleId;
      cache.set(vehicle.id, vehicleLabelIcon(vehicle, selected));
    }
    return cache;
  }, [selectedVehicleId, vehicles]);

  return (
    <MapContainer center={center} zoom={vehicles.length ? 12 : 7} scrollWheelZoom className="h-full w-full">
      <MapAutoFit vehicles={vehicles} route={route} selectedVehicleId={selectedVehicleId} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {route.length > 1 ? (
        <>
          <Polyline positions={route} pathOptions={{ color: "#0f172a", weight: 8, opacity: 0.18 }} />
          <Polyline positions={route} pathOptions={{ color: "#0f766e", weight: 5, opacity: 0.88 }} />
        </>
      ) : null}
      {vehicles.map((vehicle) => (
        <Fragment key={vehicle.id}>
          <Marker
            position={[vehicle.lat, vehicle.lng]}
            icon={labelIcons.get(vehicle.id) ?? vehicleLabelIcon(vehicle, false)}
            interactive={false}
            keyboard={false}
          />
          <Marker
            position={[vehicle.lat, vehicle.lng]}
            icon={icons.get(vehicle.id) ?? vehicleIcon(false)}
            eventHandlers={{
              click: () => onSelectVehicle?.(vehicle),
            }}
          >
            <Popup offset={[0, -18]}>
              <div className="map-popup">
                <div className="map-popup-title">
                  <img alt="" src={cdnIcon("map-pin")} />
                  <span>{vehicle.name}</span>
                </div>
                {vehicle.imei ? <div className="map-popup-imei">{vehicle.imei}</div> : null}
                <div className="map-popup-grid">
                  <InfoBlock label="Status" value={vehicle.status ?? "Unknown"} />
                  <InfoBlock label="Speed" value={typeof vehicle.speed === "number" ? `${vehicle.speed} km/h` : "-"} />
                  <InfoBlock label="Latitude" value={vehicle.lat.toFixed(5)} />
                  <InfoBlock label="Longitude" value={vehicle.lng.toFixed(5)} />
                </div>
                <InfoBlock label="Last update" value={vehicle.lastTime || "Not available"} wide />
                {vehicle.address ? <p className="map-popup-address">{vehicle.address}</p> : null}
                <div className="map-feature-grid">
                  {featureActions.map((feature) => (
                    <button key={feature.id} type="button" onClick={() => onFeatureSelect?.(vehicle, feature.id)}>
                      <img alt="" src={cdnIcon(feature.icon)} />
                      <span>{feature.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        </Fragment>
      ))}
    </MapContainer>
  );
}

function InfoBlock({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "map-popup-info map-popup-info-wide" : "map-popup-info"}>
      <div>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}
