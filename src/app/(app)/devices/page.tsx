"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Save, Search } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { useApiAction } from "@/hooks/use-api-action";
import { ResultView } from "@/components/result-view";
import { PageBody, Panel } from "@/components/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function DevicesPage() {
  const { devices, selectedImei, setSelectedImei, selectedDevice, refreshDevices, loading } = useFleet();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const detail = useApiAction();
  const [form, setForm] = useState({ vehicle_name: "", vehicle_number: "", driver_name: "", driver_phone: "" });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return devices.filter((d) => `${d.name} ${d.imei} ${d.plate} ${d.driver} ${d.model}`.toLowerCase().includes(q));
  }, [devices, query]);

  async function loadDetail(imei: string) {
    setSelectedImei(imei);
    const device = devices.find((d) => d.imei === imei);
    setForm({
      vehicle_name: device?.name ?? "",
      vehicle_number: device?.plate ?? "",
      driver_name: device?.driver ?? "",
      driver_phone: device?.phone ?? "",
    });
    detail.run("jimi.track.device.detail", { imei }).catch(() => {});
  }

  async function saveVehicle() {
    if (!selectedImei) return;
    await detail.run("jimi.open.device.update", { imei: selectedImei, ...form }, "Vehicle updated");
    await refreshDevices();
  }

  return (
    <PageBody>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card size="sm" className="min-w-0">
          <CardHeader className="grid-cols-[1fr_auto] items-center gap-2">
            <div>
              <CardTitle>Devices ({devices.length})</CardTitle>
              <CardDescription>Vehicles and terminals bound to your account</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                setBusy(true);
                await refreshDevices();
                setBusy(false);
              }}
              disabled={busy || loading}
            >
              <RefreshCw className={cn("size-3.5", (busy || loading) && "animate-spin")} /> Sync
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search name, IMEI, plate, driver…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <div className="overflow-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/70 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">IMEI</th>
                    <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Plate</th>
                    <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Driver</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((device) => (
                    <tr
                      key={device.imei}
                      onClick={() => loadDetail(device.imei)}
                      className={cn(
                        "cursor-pointer border-t transition-colors hover:bg-muted/50",
                        selectedImei === device.imei && "bg-primary/10 hover:bg-primary/10",
                      )}
                    >
                      <td className="max-w-[12rem] truncate px-3 py-2 font-medium">{device.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{device.imei}</td>
                      <td className="hidden px-3 py-2 sm:table-cell">{device.plate || "—"}</td>
                      <td className="hidden px-3 py-2 md:table-cell">{device.driver || "—"}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-[10px]">{device.status || "Active"}</Badge>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                        {loading ? "Loading devices…" : "No devices match your search."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Panel icon={Save} title="Edit vehicle" description={selectedDevice ? selectedDevice.name : "Select a device to edit"}>
            {selectedImei ? (
              <>
                <Field label="Vehicle name" value={form.vehicle_name} onChange={(v) => setForm({ ...form, vehicle_name: v })} />
                <Field label="Plate number" value={form.vehicle_number} onChange={(v) => setForm({ ...form, vehicle_number: v })} />
                <Field label="Driver name" value={form.driver_name} onChange={(v) => setForm({ ...form, driver_name: v })} />
                <Field label="Driver phone" value={form.driver_phone} onChange={(v) => setForm({ ...form, driver_phone: v })} />
                <Button className="w-full" onClick={saveVehicle} disabled={detail.loading}>
                  {detail.loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save changes
                </Button>
              </>
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                Select a device from the table to view and edit details.
              </div>
            )}
          </Panel>

          {detail.data ? (
            <Panel title="Device detail">
              <ResultView data={detail.data} />
            </Panel>
          ) : null}
        </div>
      </div>
    </PageBody>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
