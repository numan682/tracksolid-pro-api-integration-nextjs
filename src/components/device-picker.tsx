"use client";

import { useMemo, useState } from "react";
import { MonitorSmartphone, Search } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function DevicePicker({ className, compact }: { className?: string; compact?: boolean }) {
  const { devices, selectedImei, setSelectedImei, vehicles } = useFleet();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return devices.filter((device) =>
      `${device.name} ${device.imei} ${device.plate} ${device.driver} ${device.model}`.toLowerCase().includes(q),
    );
  }, [devices, query]);

  const onlineSet = useMemo(
    () => new Set(vehicles.filter((vehicle) => vehicle.online !== false).map((vehicle) => vehicle.imei)),
    [vehicles],
  );

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder={`Search ${devices.length} devices…`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-0.5">
        {filtered.map((device) => {
          const isActive = selectedImei === device.imei;
          const online = onlineSet.has(device.imei);
          return (
            <button
              key={device.imei}
              type="button"
              onClick={() => setSelectedImei(device.imei)}
              data-active={isActive || undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/5",
                isActive && "border-primary/50 bg-primary/10",
              )}
            >
              <span className={cn("size-2 shrink-0 rounded-full", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{device.name}</span>
                {!compact ? (
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">{device.imei}</span>
                ) : null}
              </span>
              {!compact && device.plate ? (
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {device.plate}
                </Badge>
              ) : null}
            </button>
          );
        })}
        {!filtered.length ? (
          <div className="grid place-items-center gap-1 rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
            <MonitorSmartphone className="size-5 opacity-50" />
            {devices.length ? "No devices match your search." : "Loading devices…"}
          </div>
        ) : null}
      </div>
    </div>
  );
}
