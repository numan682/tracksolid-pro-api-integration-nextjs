"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Gauge, MapPin, Navigation, Power, Search, X } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import type { MapFeatureId } from "@/components/FleetMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FleetMap = dynamic(() => import("@/components/FleetMap").then((mod) => mod.FleetMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>,
});

const FEATURE_ROUTES: Record<MapFeatureId, string> = {
  playback: "/playback",
  geofences: "/geofences",
  alarms: "/alarms",
  media: "/commands",
  diagnostics: "/diagnostics",
};

export default function LivePage() {
  const router = useRouter();
  const { vehicles, devices, selectedImei, setSelectedImei, selectedVehicle, selectedDevice } = useFleet();
  const [query, setQuery] = useState("");
  const [listOpen, setListOpen] = useState(true);

  const q = query.toLowerCase();
  const filtered = vehicles.filter((vehicle) => `${vehicle.name} ${vehicle.imei}`.toLowerCase().includes(q));

  function handleFeature(imei: string | undefined, feature: MapFeatureId) {
    if (imei) setSelectedImei(imei);
    router.push(FEATURE_ROUTES[feature]);
  }

  return (
    <div className="relative h-[calc(100dvh-3.75rem)]">
      <FleetMap
        vehicles={vehicles}
        selectedVehicleId={selectedImei}
        onSelectVehicle={(vehicle) => vehicle.imei && setSelectedImei(vehicle.imei)}
        onFeatureSelect={(vehicle, feature) => handleFeature(vehicle.imei, feature)}
      />

      {/* Vehicle list overlay */}
      <div className="pointer-events-none absolute inset-0 p-3">
        <div className="flex h-full gap-3">
          <div
            className={cn(
              "pointer-events-auto flex w-72 max-w-[80vw] flex-col gap-2 rounded-2xl border border-border bg-card/90 p-3 shadow-xl backdrop-blur-xl transition-all",
              !listOpen && "w-auto",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">{listOpen ? `Vehicles (${vehicles.length})` : null}</div>
              <Button size="icon-xs" variant="ghost" onClick={() => setListOpen((value) => !value)}>
                {listOpen ? <X className="size-3.5" /> : <Search className="size-3.5" />}
              </Button>
            </div>
            {listOpen ? (
              <>
                <Input
                  className="h-8"
                  placeholder="Search vehicles…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-0.5">
                  {filtered.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => vehicle.imei && setSelectedImei(vehicle.imei)}
                      data-active={selectedImei === vehicle.imei || undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                        selectedImei === vehicle.imei && "border-primary/40 bg-primary/10",
                      )}
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", vehicle.online !== false ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                      <span className="min-w-0 flex-1 truncate">{vehicle.name}</span>
                      {typeof vehicle.speed === "number" ? (
                        <span className="shrink-0 text-[11px] text-muted-foreground">{Math.round(vehicle.speed)} km/h</span>
                      ) : null}
                    </button>
                  ))}
                  {!filtered.length ? (
                    <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                      {devices.length ? "No live positions yet." : "Loading…"}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex-1" />

          {/* Selected vehicle detail */}
          {selectedVehicle ? (
            <div className="pointer-events-auto hidden w-72 flex-col gap-3 self-start rounded-2xl border border-border bg-card/90 p-4 shadow-xl backdrop-blur-xl sm:flex">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-heading text-base font-semibold">{selectedVehicle.name}</div>
                  <div className="truncate font-mono text-[11px] text-muted-foreground">{selectedVehicle.imei}</div>
                </div>
                <Badge variant={selectedVehicle.online === false ? "secondary" : "outline"} className={selectedVehicle.online !== false ? "live-location-pill" : undefined}>
                  {selectedVehicle.online === false ? "Offline" : "Online"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Metric icon={Gauge} label="Speed" value={typeof selectedVehicle.speed === "number" ? `${Math.round(selectedVehicle.speed)} km/h` : "—"} />
                <Metric icon={Navigation} label="Course" value={typeof selectedVehicle.course === "number" ? `${Math.round(selectedVehicle.course)}°` : "—"} />
                <Metric icon={Power} label="ACC" value={selectedVehicle.acc === undefined ? "—" : selectedVehicle.acc ? "On" : "Off"} />
                <Metric icon={MapPin} label="Updated" value={selectedVehicle.lastTime || "—"} />
              </div>
              {selectedVehicle.address ? (
                <p className="rounded-lg border bg-background p-2.5 text-xs leading-5 text-muted-foreground">{selectedVehicle.address}</p>
              ) : null}
              {selectedDevice?.plate ? (
                <div className="text-xs text-muted-foreground">
                  Plate <span className="font-medium text-foreground">{selectedDevice.plate}</span>
                  {selectedDevice.driver ? <> · Driver <span className="font-medium text-foreground">{selectedDevice.driver}</span></> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-2">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-medium" title={value}>
        {value}
      </div>
    </div>
  );
}
