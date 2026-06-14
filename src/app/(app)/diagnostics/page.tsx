"use client";

import { useState } from "react";
import { Gauge, MonitorSmartphone, TriangleAlert } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { DevicePicker } from "@/components/device-picker";
import { ResultView } from "@/components/result-view";
import { PageBody, Panel } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function localRange(daysBack: number) {
  const fmt = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return { start: fmt(new Date(Date.now() - daysBack * 86400_000)), end: fmt(new Date()) };
}
const apiTime = (value: string) => (value ? value.replace("T", " ") + ":00" : "");

export default function DiagnosticsPage() {
  const { selectedImei, selectedDevice } = useFleet();
  const { run, loading, error, data } = useApiAction();
  const [active, setActive] = useState<string>("Device detail");
  const disabled = loading || !selectedImei;
  const range = localRange(7);

  function detail() {
    setActive("Device detail");
    run("jimi.track.device.detail", { imei: selectedImei }).catch(() => {});
  }
  function obd(method: string, label: string) {
    setActive(label);
    run(method, { imeis: selectedImei, start_time: apiTime(range.start), end_time: apiTime(range.end) }).catch(() => {});
  }

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel icon={Gauge} title="Diagnostics" description={selectedDevice ? selectedDevice.name : "Select a device"}>
            <Button className={cn("w-full justify-start", active === "Device detail" && "bg-primary/15")} variant="outline" disabled={disabled} onClick={detail}>
              <MonitorSmartphone className="size-4" /> Device detail
            </Button>
            <Button className="w-full justify-start" variant="outline" disabled={disabled} onClick={() => obd("jimi.device.obd.list", "OBD telemetry")}>
              <Gauge className="size-4" /> OBD telemetry (7 days)
            </Button>
            <Button className="w-full justify-start" variant="outline" disabled={disabled} onClick={() => obd("jimi.device.obd.fault", "OBD faults")}>
              <TriangleAlert className="size-4" /> OBD fault codes (7 days)
            </Button>
            <p className="text-[11px] text-muted-foreground">OBD data is only available on OBD-capable hardware.</p>
          </Panel>
          <Panel title="Select device">
            <DevicePicker compact className="max-h-72" />
          </Panel>
        </div>

        <Panel title={active}>
          <ResultView loading={loading} error={error} data={data} emptyHint="Run a diagnostic for the selected device." />
        </Panel>
      </div>
    </PageBody>
  );
}
