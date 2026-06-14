"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Gauge, Loader2, Pause, Play, Route, SkipBack, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { DevicePicker } from "@/components/device-picker";
import { PageBody, Panel } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeRoute, routeDistanceKm } from "@/lib/normalize";
import type { MapVehicle } from "@/lib/types";

const FleetMap = dynamic(() => import("@/components/FleetMap").then((mod) => mod.FleetMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>,
});

function localRange(hoursBack: number) {
  const end = new Date();
  const start = new Date(Date.now() - hoursBack * 3600_000);
  const fmt = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { start: fmt(start), end: fmt(end) };
}

const apiTime = (value: string) => (value ? value.replace("T", " ") + ":00" : "");

export default function PlaybackPage() {
  const { selectedImei, selectedDevice } = useFleet();
  const { run, loading } = useApiAction();
  const [range, setRange] = useState(() => localRange(6));
  const [route, setRoute] = useState<[number, number][]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const distance = useMemo(() => routeDistanceKm(route), [route]);

  useEffect(() => {
    if (!playing || route.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        if (current >= route.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing, route.length]);

  async function load() {
    if (!selectedImei) return;
    const data = await run("jimi.device.track.list", {
      imei: selectedImei,
      begin_time: apiTime(range.start),
      end_time: apiTime(range.end),
    });
    const next = normalizeRoute(data);
    setRoute(next);
    setIndex(0);
    setPlaying(false);
    if (!next.length) {
      toast.info("No track points in this time range. Try a wider range — this device may not have reported recently.");
    } else {
      toast.success(`Loaded ${next.length} track points`);
    }
  }

  const marker: MapVehicle[] = useMemo(() => {
    if (!route.length) return [];
    const point = route[Math.min(index, route.length - 1)];
    return [{ id: "playback", imei: selectedImei, name: selectedDevice?.name ?? "Playback", lat: point[0], lng: point[1], status: `Point ${index + 1}/${route.length}` }];
  }, [route, index, selectedImei, selectedDevice]);

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel icon={Route} title="Trip playback" description={selectedDevice ? selectedDevice.name : "Select a device"}>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="datetime-local" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="datetime-local" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(6))}>6h</Button>
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(24))}>24h</Button>
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(72))}>3d</Button>
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(168))}>7d</Button>
            </div>
            <Button className="w-full" onClick={load} disabled={loading || !selectedImei}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              Load route
            </Button>

            {route.length > 1 ? (
              <div className="space-y-2 rounded-lg border bg-background p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Gauge className="size-3" />{distance.toFixed(1)} km</span>
                  <span>{index + 1}/{route.length}</span>
                </div>
                <input
                  className="playback-range"
                  type="range"
                  min={0}
                  max={route.length - 1}
                  value={index}
                  onChange={(e) => {
                    setPlaying(false);
                    setIndex(Number(e.target.value));
                  }}
                />
                <div className="flex items-center justify-center gap-1.5">
                  <Button size="icon-sm" variant="outline" onClick={() => setIndex(0)}><SkipBack className="size-4" /></Button>
                  <Button size="icon-sm" onClick={() => setPlaying((v) => !v)}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
                  <Button size="icon-sm" variant="outline" onClick={() => setIndex(route.length - 1)}><SkipForward className="size-4" /></Button>
                </div>
              </div>
            ) : route.length === 1 ? (
              <p className="text-xs text-muted-foreground">Only one point returned for this range.</p>
            ) : null}
          </Panel>

          <Panel title="Select device">
            <DevicePicker compact className="max-h-72" />
          </Panel>
        </div>

        <div className="h-[calc(100dvh-7rem)] min-h-[28rem] overflow-hidden rounded-2xl border">
          <FleetMap vehicles={marker} route={route} />
        </div>
      </div>
    </PageBody>
  );
}
