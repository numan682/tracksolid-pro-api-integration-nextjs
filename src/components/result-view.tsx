"use client";

import { useMemo } from "react";
import { Inbox, Loader2, SearchX } from "lucide-react";
import { unwrapArray } from "@/lib/normalize";
import { cn } from "@/lib/utils";

type ResultViewProps = {
  loading?: boolean;
  error?: string;
  data?: unknown;
  emptyHint?: string;
  /** Optional curated columns (keys) for tabular data. */
  columns?: string[];
};

const ACRONYMS: Record<string, string> = {
  imei: "IMEI", imeis: "IMEIs", obd: "OBD", gps: "GPS", sim: "SIM", id: "ID", acc: "ACC",
  rfid: "RFID", url: "URL", vin: "VIN", iccid: "ICCID", lbs: "LBS", sos: "SOS", dlt: "DLT",
  mac: "MAC", api: "API", no: "No.", lat: "Latitude", lng: "Longitude",
};

/** Turn `driverPhone` / `start_time` into "Driver Phone" / "Start Time". */
function humanize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/);
  return words
    .map((w) => ACRONYMS[w.toLowerCase()] ?? w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isScalar(value: unknown) {
  return value === null || ["string", "number", "boolean", "undefined"].includes(typeof value);
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

/** Peel Tracksolid `{code,message,result|data}` envelopes down to the meaningful payload. */
function extractPayload(data: unknown): unknown {
  let current = data;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const record = current as Record<string, unknown>;
    const hasArrayChild = Object.values(record).some((v) => Array.isArray(v));
    if (hasArrayChild) break;
    const inner = record.result ?? record.data;
    if (inner === undefined || inner === record) break;
    current = inner;
  }
  return current;
}

function DataTable({ rows, columns }: { rows: Record<string, unknown>[]; columns?: string[] }) {
  const cols = useMemo(() => {
    if (columns?.length) return columns;
    const seen = new Set<string>();
    rows.slice(0, 80).forEach((row) => Object.keys(row).forEach((key) => seen.add(key)));
    // Drop columns that are empty across every row, and nested object columns.
    return Array.from(seen)
      .filter((key) => rows.some((row) => isScalar(row[key]) && row[key] !== null && row[key] !== undefined && row[key] !== ""))
      .slice(0, 10);
  }, [rows, columns]);

  return (
    <div className="overflow-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-muted/80 backdrop-blur">
          <tr>
            {cols.map((col) => (
              <th key={col} className="border-b px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                {humanize(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 300).map((row, index) => (
            <tr key={index} className={cn("border-b last:border-0 transition-colors hover:bg-muted/40", index % 2 ? "bg-muted/20" : undefined)}>
              {cols.map((col) => {
                const text = formatScalar(row[col]);
                return (
                  <td key={col} className="max-w-[18rem] truncate px-3 py-2 whitespace-nowrap" title={text}>
                    {text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailGrid({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0));
  const scalars = entries.filter(([, v]) => isScalar(v));
  const nested = entries.filter(([, v]) => v && typeof v === "object");

  return (
    <div className="space-y-4">
      {scalars.length ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {scalars.map(([key, value]) => (
            <div key={key} className="rounded-lg border bg-background p-2.5">
              <div className="text-[11px] tracking-wide text-muted-foreground uppercase">{humanize(key)}</div>
              <div className="mt-0.5 truncate text-sm font-medium" title={formatScalar(value)}>{formatScalar(value)}</div>
            </div>
          ))}
        </div>
      ) : null}

      {nested.map(([key, value]) => {
        const arr = Array.isArray(value) ? value : null;
        const objRows = arr?.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
        return (
          <div key={key} className="space-y-2">
            <div className="text-xs font-semibold text-foreground">{humanize(key)}</div>
            {objRows && objRows.length ? (
              <DataTable rows={objRows} />
            ) : value && typeof value === "object" && !Array.isArray(value) ? (
              <DetailGrid data={value as Record<string, unknown>} />
            ) : (
              <div className="rounded-lg border bg-background px-3 py-2 text-sm">{formatScalar(value as unknown)}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon: Icon, children }: { icon: typeof Inbox; children: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      <Icon className="size-5 opacity-50" />
      {children}
    </div>
  );
}

export function ResultView({ loading, error, data, emptyHint = "Run an action to see results here.", columns }: ResultViewProps) {
  const payload = useMemo(() => extractPayload(data), [data]);
  const rows = useMemo(
    () => unwrapArray(payload).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)),
    [payload],
  );

  if (loading) {
    return (
      <div className="grid place-items-center gap-2 rounded-xl border border-dashed p-10 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Loading…
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={SearchX}>We couldn&apos;t load this data. Please adjust your selection and try again.</EmptyState>;
  }

  if (data === undefined) {
    return <EmptyState icon={Inbox}>{emptyHint}</EmptyState>;
  }

  if (rows.length) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">{rows.length} record{rows.length === 1 ? "" : "s"}</div>
        <DataTable rows={rows} columns={columns} />
      </div>
    );
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload) && Object.keys(payload).length) {
    return <DetailGrid data={payload as Record<string, unknown>} />;
  }

  if (typeof payload === "string" && payload.trim()) {
    const isUrl = /^https?:\/\//i.test(payload.trim());
    return (
      <div className="rounded-xl border bg-background p-3 text-sm break-all">
        {isUrl ? (
          <a href={payload.trim()} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
            {payload.trim()}
          </a>
        ) : (
          payload.trim()
        )}
      </div>
    );
  }

  return <EmptyState icon={Inbox}>No data for this selection.</EmptyState>;
}
