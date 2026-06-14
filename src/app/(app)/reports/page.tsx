"use client";

import { useState } from "react";
import { ClipboardList, Clock, Gauge, Loader2, MapPin, Route, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { DevicePicker } from "@/components/device-picker";
import { ResultView } from "@/components/result-view";
import { PageBody, Panel, StatTile } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { callApi } from "@/lib/api";
import { normalizeRoute, numberValue, routeDistanceKm, stringValue, unwrapArray } from "@/lib/normalize";

function localRange(hoursBack: number) {
  const fmt = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { start: fmt(new Date(Date.now() - hoursBack * 3600_000)), end: fmt(new Date()) };
}
const apiTime = (value: string) => (value ? value.replace("T", " ") + ":00" : "");

const PAGE = { start_row: "0", page_size: "100" };

const apiReports = [
  { key: "trips", label: "Trips", method: "jimi.open.platform.report.trips", imeiKey: "imeis", timeKeys: ["start_time", "end_time"], extra: { type: "1", ...PAGE } },
  { key: "parking", label: "Parking", method: "jimi.open.platform.report.parking", imeiKey: "imeis", timeKeys: ["start_time", "end_time"], extra: { acc_type: "off", ...PAGE } },
  { key: "rfid", label: "RFID", method: "jimi.open.device.rfid.list", imeiKey: "imei", timeKeys: ["begin_time", "end_time"], extra: {} },
  { key: "fence", label: "Fence duration", method: "jimi.open.platform.fence.duration", imeiKey: "imeis", timeKeys: ["start_time", "end_time"], extra: { ...PAGE } },
] as const;

type Mileage = { km: number; points: number; first: string; last: string; maxSpeed?: number };

export default function ReportsPage() {
  const { selectedImei, selectedDevice } = useFleet();
  const { run, loading, error, data } = useApiAction();
  const [range, setRange] = useState(() => localRange(168));
  const [active, setActive] = useState<string>();
  const [mileage, setMileage] = useState<Mileage | null>(null);
  const [mileageLoading, setMileageLoading] = useState(false);

  async function runMileage() {
    if (!selectedImei) return;
    setActive("Mileage");
    setMileage(null);
    setMileageLoading(true);
    try {
      // The native mileage endpoint is empty for trackers without trip detection,
      // so we derive real distance travelled from the recorded track points.
      const trackData = await callApi("jimi.device.track.list", {
        imei: selectedImei,
        begin_time: apiTime(range.start),
        end_time: apiTime(range.end),
      });
      const rows = unwrapArray(trackData) as Record<string, unknown>[];
      const route = normalizeRoute(trackData);
      if (!route.length) {
        toast.info("No track points in this range — try a wider window.");
        setMileage({ km: 0, points: 0, first: "—", last: "—" });
        return;
      }
      const speeds = rows.map((r) => numberValue(r, ["gpsSpeed", "speed"]) ?? -1).filter((s) => s >= 0);
      setMileage({
        km: routeDistanceKm(route),
        points: route.length,
        first: stringValue(rows[0] ?? {}, ["gpsTime", "time"], "—"),
        last: stringValue(rows[rows.length - 1] ?? {}, ["gpsTime", "time"], "—"),
        maxSpeed: speeds.length ? Math.max(...speeds) : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load mileage");
    } finally {
      setMileageLoading(false);
    }
  }

  function runReport(report: (typeof apiReports)[number]) {
    if (!selectedImei) return;
    setActive(report.label);
    setMileage(null);
    run(report.method, {
      [report.imeiKey]: selectedImei,
      [report.timeKeys[0]]: apiTime(range.start),
      [report.timeKeys[1]]: apiTime(range.end),
      ...report.extra,
    }).catch(() => {});
  }

  const isMileage = active === "Mileage";

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel icon={ClipboardList} title="Reports" description={selectedDevice ? selectedDevice.name : "Select a device"}>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="datetime-local" value={range.start} onChange={(e) => setRange({ ...range, start: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="datetime-local" value={range.end} onChange={(e) => setRange({ ...range, end: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(24))}>24h</Button>
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(168))}>7d</Button>
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(720))}>30d</Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant={isMileage ? "secondary" : "outline"} disabled={mileageLoading || !selectedImei} onClick={runMileage}>
                {mileageLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Route className="size-3.5" />} Mileage
              </Button>
              {apiReports.map((report) => (
                <Button
                  key={report.key}
                  size="sm"
                  variant={active === report.label ? "secondary" : "outline"}
                  disabled={loading || !selectedImei}
                  onClick={() => runReport(report)}
                >
                  {loading && active === report.label ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {report.label}
                </Button>
              ))}
            </div>
          </Panel>
          <Panel title="Select device">
            <DevicePicker compact className="max-h-64" />
          </Panel>
        </div>

        <Panel title={active ? `${active} report` : "Report"}>
          {isMileage ? (
            mileageLoading ? (
              <div className="grid place-items-center gap-2 rounded-xl border border-dashed p-10 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" /> Calculating mileage…
              </div>
            ) : mileage ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatTile label="Distance" value={`${mileage.km.toFixed(1)} km`} icon={Route} tone="primary" />
                  <StatTile label="Track points" value={mileage.points} icon={Waypoints} />
                  <StatTile label="Max speed" value={mileage.maxSpeed !== undefined ? `${Math.round(mileage.maxSpeed)} km/h` : "—"} icon={Gauge} />
                  <StatTile label="Period" value={`${mileage.points ? "Active" : "No data"}`} icon={Clock} tone={mileage.points ? "emerald" : "default"} />
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  <span>First point: <span className="font-medium text-foreground">{mileage.first}</span></span>
                  <span className="text-border">•</span>
                  <span>Last point: <span className="font-medium text-foreground">{mileage.last}</span></span>
                </div>
                <p className="text-[11px] text-muted-foreground">Distance is estimated from recorded GPS/track points over the selected period.</p>
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed p-10 text-sm text-muted-foreground">Pick a device and run mileage.</div>
            )
          ) : (
            <ResultView loading={loading} error={error} data={data} emptyHint="Pick a device and run a report." />
          )}
        </Panel>
      </div>
    </PageBody>
  );
}
