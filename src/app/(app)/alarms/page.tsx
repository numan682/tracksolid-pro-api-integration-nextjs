"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { DevicePicker } from "@/components/device-picker";
import { ResultView } from "@/components/result-view";
import { PageBody, Panel } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function localRange(hoursBack: number) {
  const fmt = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { start: fmt(new Date(Date.now() - hoursBack * 3600_000)), end: fmt(new Date()) };
}
const apiTime = (value: string) => (value ? value.replace("T", " ") + ":00" : "");

export default function AlarmsPage() {
  const { selectedImei, selectedDevice } = useFleet();
  const { run, loading, error, data } = useApiAction();
  const [range, setRange] = useState(() => localRange(24));

  function load(scope: "device" | "all") {
    run("jimi.device.alarm.list", {
      imei: scope === "device" ? selectedImei : undefined,
      begin_time: apiTime(range.start),
      end_time: apiTime(range.end),
      page_no: 1,
      page_size: 100,
    }).catch(() => {});
  }

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel icon={Bell} title="Alarm history" description={selectedDevice ? selectedDevice.name : "All devices"}>
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
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(72))}>3d</Button>
              <Button size="sm" variant="outline" onClick={() => setRange(localRange(168))}>7d</Button>
            </div>
            <Button className="w-full" onClick={() => load("device")} disabled={loading || !selectedImei}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />} Selected device
            </Button>
            <Button className="w-full" variant="outline" onClick={() => load("all")} disabled={loading}>
              All devices
            </Button>
          </Panel>
          <Panel title="Select device">
            <DevicePicker compact className="max-h-72" />
          </Panel>
        </div>

        <Panel title="Alarms">
          <ResultView loading={loading} error={error} data={data} emptyHint="Load alarms for a device or the whole fleet." />
        </Panel>
      </div>
    </PageBody>
  );
}
