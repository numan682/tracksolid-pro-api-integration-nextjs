"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Circle, Hexagon, Loader2, MonitorSmartphone, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { PageBody, Panel } from "@/components/workspace";
import { ResultView } from "@/components/result-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { unwrapArray } from "@/lib/normalize";
import type { GeofenceShape } from "@/lib/types";

const GeofenceMap = dynamic(() => import("@/components/geofence-map").then((mod) => mod.GeofenceMap), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading map…</div>,
});

/** Tracksolid `geom`: "lat,lng" for a circle, "lat,lng#lat,lng#…" for a polygon (lat first). */
function buildGeom(shape: GeofenceShape | null): string {
  if (!shape) return "";
  if (shape.kind === "circle") return `${shape.center[0].toFixed(7)},${shape.center[1].toFixed(7)}`;
  return shape.points.map((p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`).join("#");
}

export default function GeofencesPage() {
  const { vehicles, selectedImei, selectedDevice } = useFleet();
  const list = useApiAction();
  const save = useApiAction();

  const [mode, setMode] = useState<"circle" | "polygon">("circle");
  const [shape, setShape] = useState<GeofenceShape | null>(null);
  const [radius, setRadius] = useState(500);
  const [name, setName] = useState("");
  const [bindDevice, setBindDevice] = useState(true);

  useEffect(() => {
    list.run("jimi.open.platform.fence.list").catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCircleCenter(point: [number, number]) {
    setShape({ kind: "circle", center: point, radius });
  }
  function handlePolygonPoint(point: [number, number]) {
    setShape((current) =>
      current?.kind === "polygon" ? { kind: "polygon", points: [...current.points, point] } : { kind: "polygon", points: [point] },
    );
  }
  function changeRadius(value: number) {
    setRadius(value);
    setShape((current) => (current?.kind === "circle" ? { ...current, radius: value } : current));
  }
  function reset() {
    setShape(null);
  }
  function undoPoint() {
    setShape((current) => {
      if (current?.kind !== "polygon") return current;
      const points = current.points.slice(0, -1);
      return points.length ? { kind: "polygon", points } : null;
    });
  }

  const geom = useMemo(() => buildGeom(shape), [shape]);
  const fences = useMemo(() => unwrapArray(list.data), [list.data]);
  const canSave = Boolean(name.trim() && geom && (shape?.kind === "circle" || (shape?.kind === "polygon" && shape.points.length >= 3)));

  async function createFence() {
    if (!shape) return;
    const res = (await save.run("jimi.open.platform.fence.create", {
      fence_name: name.trim(),
      fence_type: shape.kind,
      geom,
      ...(shape.kind === "circle" ? { radius: String(Math.round(radius)) } : {}),
    })) as { data?: string } | undefined;

    const fenceId = res?.data;
    const willBind = bindDevice && Boolean(selectedImei) && Boolean(fenceId);
    if (willBind) {
      await save.run("jimi.open.platform.fence.bind", {
        fence_id: String(fenceId),
        imeis: selectedImei,
        alert_type: "in,out",
      });
    }
    toast.success(willBind ? `Geofence created and bound to ${selectedDevice?.name ?? "device"}` : "Geofence created");

    setName("");
    reset();
    list.run("jimi.open.platform.fence.list").catch(() => {});
  }

  async function deleteFence(id: string) {
    await save.run("jimi.open.platform.fence.delete", { fence_id: id }, "Geofence deleted");
    list.run("jimi.open.platform.fence.list").catch(() => {});
  }

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel icon={mode === "circle" ? Circle : Hexagon} title="Create geofence" description="Draw the fence on the map">
            <div className="grid grid-cols-2 gap-2">
              <Button variant={mode === "circle" ? "secondary" : "outline"} size="sm" onClick={() => { setMode("circle"); reset(); }}>
                <Circle className="size-4" /> Circle
              </Button>
              <Button variant={mode === "polygon" ? "secondary" : "outline"} size="sm" onClick={() => { setMode("polygon"); reset(); }}>
                <Hexagon className="size-4" /> Polygon
              </Button>
            </div>

            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              {mode === "circle"
                ? "Click the map to place the centre, then set the radius below."
                : "Click the map to drop each corner. Add at least 3 points."}
            </p>

            {mode === "circle" ? (
              <div className="space-y-1.5">
                <Label className="justify-between">
                  <span>Radius</span>
                  <span className="text-muted-foreground">{radius} m</span>
                </Label>
                <input type="range" min={200} max={5000} step={50} value={radius} onChange={(e) => changeRadius(Number(e.target.value))} className="playback-range" />
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{shape?.kind === "polygon" ? shape.points.length : 0} points</span>
                <Button size="xs" variant="ghost" onClick={undoPoint} disabled={shape?.kind !== "polygon" || !shape.points.length}>
                  <Undo2 className="size-3.5" /> Undo
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="fence-name">Fence name</Label>
              <Input id="fence-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main depot" />
            </div>

            <div className="rounded-lg border bg-background p-2.5">
              <div className="flex items-center gap-2">
                <MonitorSmartphone className="size-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted-foreground">Selected device</div>
                  <div className="truncate text-sm font-medium">{selectedDevice?.name ?? "None — pick one on Devices/Live"}</div>
                </div>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-3.5 accent-primary"
                  checked={bindDevice && Boolean(selectedImei)}
                  disabled={!selectedImei}
                  onChange={(e) => setBindDevice(e.target.checked)}
                />
                {selectedImei
                  ? <>Alert <span className="font-medium text-foreground">{selectedDevice?.name}</span> on enter &amp; exit</>
                  : "Select a device to attach enter/exit alerts"}
              </label>
            </div>

            {geom ? (
              <div className="rounded-lg border bg-background p-2.5 text-[11px] text-muted-foreground">
                <div className="mb-1 font-medium text-foreground">Preview</div>
                <div>Type: {shape?.kind}{shape?.kind === "circle" ? ` · ${radius} m` : ` · ${shape?.kind === "polygon" ? shape.points.length : 0} points`}</div>
                <div className="mt-1 truncate font-mono" title={geom}>{geom}</div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="size-4" /> Clear
              </Button>
              <Button size="sm" onClick={createFence} disabled={!canSave || save.loading}>
                {save.loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
              </Button>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-[26rem] overflow-hidden rounded-2xl border">
            <GeofenceMap mode={mode} shape={shape} vehicles={vehicles} onCircleCenter={handleCircleCenter} onPolygonPoint={handlePolygonPoint} />
          </div>

          <Panel
            title={`Platform geofences${fences.length ? ` (${fences.length})` : ""}`}
            description="Existing fences for your account"
            action={
              <Button size="sm" variant="outline" onClick={() => list.run("jimi.open.platform.fence.list").catch(() => {})} disabled={list.loading}>
                <RotateCcw className={cn("size-3.5", list.loading && "animate-spin")} /> Refresh
              </Button>
            }
          >
            {fences.length ? (
              <div className="grid gap-1.5">
                {fences.map((item, i) => {
                  const row = item as Record<string, unknown>;
                  const id = String(row.fence_id ?? row.fenceId ?? row.id ?? i);
                  const fenceName = String(row.fence_name ?? row.fenceName ?? row.name ?? `Fence ${i + 1}`);
                  const type = String(row.fence_type ?? row.fenceType ?? "");
                  return (
                    <div key={id} className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                      {type === "circle" ? <Circle className="size-4 text-primary" /> : <Hexagon className="size-4 text-primary" />}
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{fenceName}</span>
                      {row.radius ? <span className="text-[11px] text-muted-foreground">{String(row.radius)} m</span> : null}
                      <Button size="icon-xs" variant="ghost" onClick={() => deleteFence(id)} title="Delete" disabled={save.loading}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <ResultView loading={list.loading} error={list.error} data={list.data} emptyHint="No platform geofences yet." />
            )}
          </Panel>
        </div>
      </div>
    </PageBody>
  );
}
