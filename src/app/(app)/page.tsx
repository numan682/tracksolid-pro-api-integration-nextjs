"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, Gauge, MapPinned, MonitorSmartphone, Power, Signal, WifiOff } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { PageBody, StatTile } from "@/components/workspace";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { navItems } from "@/lib/nav";

export default function OverviewPage() {
  const { devices, vehicles, onlineCount, setSelectedImei } = useFleet();

  const stats = useMemo(() => {
    const moving = vehicles.filter((v) => typeof v.speed === "number" && v.speed > 3).length;
    const accOn = vehicles.filter((v) => v.acc === true).length;
    return { moving, accOn, offline: vehicles.length - onlineCount };
  }, [vehicles, onlineCount]);

  const quickLinks = navItems.filter((item) => !["/", "/live"].includes(item.href));

  return (
    <PageBody className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Devices" value={devices.length} icon={MonitorSmartphone} />
        <StatTile label="Online" value={`${onlineCount}/${vehicles.length}`} icon={Signal} tone="emerald" />
        <StatTile label="Moving now" value={stats.moving} icon={Activity} tone="primary" />
        <StatTile label="Offline" value={stats.offline} icon={WifiOff} tone={stats.offline ? "rose" : "default"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card size="sm">
          <CardHeader className="grid-cols-[1fr_auto] items-center gap-2">
            <div>
              <CardTitle>Fleet activity</CardTitle>
              <CardDescription>Most recent live positions</CardDescription>
            </div>
            <Link href="/live">
              <Badge variant="outline" className="live-location-pill gap-1">
                <MapPinned className="size-3" /> Open map
              </Badge>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {vehicles.slice(0, 10).map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href="/live"
                  onClick={() => vehicle.imei && setSelectedImei(vehicle.imei)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className={vehicle.online !== false ? "size-2 rounded-full bg-emerald-500" : "size-2 rounded-full bg-muted-foreground/40"} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{vehicle.name}</span>
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Gauge className="size-3" />
                      {typeof vehicle.speed === "number" ? `${Math.round(vehicle.speed)} km/h` : "—"}
                      <Power className="size-3" />
                      {vehicle.acc === undefined ? "—" : vehicle.acc ? "ACC on" : "ACC off"}
                    </span>
                  </span>
                </Link>
              ))}
              {!vehicles.length ? (
                <div className="col-span-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Loading live fleet…
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump to a workspace</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <item.icon className="size-4 text-primary" />
                <span className="text-sm font-medium">{item.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{item.description}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageBody>
  );
}
