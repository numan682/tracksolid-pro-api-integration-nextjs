"use client";

import { useState } from "react";
import { Command, Loader2, Send, Video } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { DevicePicker } from "@/components/device-picker";
import { ResultView } from "@/components/result-view";
import { PageBody, Panel } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CommandsPage() {
  const { selectedImei, selectedDevice } = useFleet();
  const { run, loading, error, data } = useApiAction();
  const [instruction, setInstruction] = useState("");
  const [params, setParams] = useState("");

  const disabled = loading || !selectedImei;

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel icon={Command} title="Remote control" description={selectedDevice ? selectedDevice.name : "Select a device"}>
            <Button className="w-full" variant="outline" disabled={disabled} onClick={() => run("jimi.open.instruction.list", { imei: selectedImei }).catch(() => {})}>
              List supported commands
            </Button>
            <div className="space-y-1.5">
              <Label>Instruction</Label>
              <Input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="e.g. CUTOInstruction" />
            </div>
            <div className="space-y-1.5">
              <Label>Parameters</Label>
              <Textarea rows={3} value={params} onChange={(e) => setParams(e.target.value)} placeholder="Optional parameters" />
            </div>
            <Button
              className="w-full"
              disabled={disabled || !instruction}
              onClick={() => run("jimi.open.instruction.send", { imei: selectedImei, instruction, params }, "Command sent").catch(() => {})}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send command
            </Button>
          </Panel>

          <Panel icon={Video} title="Media" description="Live stream & capture">
            <Button className="w-full" variant="outline" disabled={disabled} onClick={() => run("jimi.device.live.page.url", { imei: selectedImei }).catch(() => {})}>
              <Video className="size-4" /> Live stream URL
            </Button>
            <Button className="w-full" variant="outline" disabled={disabled} onClick={() => run("jimi.device.meida.cmd.send", { imei: selectedImei, cmd: "PHOTO" }, "Snapshot requested").catch(() => {})}>
              Request snapshot
            </Button>
          </Panel>

          <Panel title="Select device">
            <DevicePicker compact className="max-h-56" />
          </Panel>
        </div>

        <Panel title="Response">
          <ResultView loading={loading} error={error} data={data} emptyHint="Send a command to see its result." />
        </Panel>
      </div>
    </PageBody>
  );
}
