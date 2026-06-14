import type { AlarmRow, Device, MapVehicle } from "@/lib/types";

/** Recursively dig out the first array we can find in a Tracksolid response. */
export function unwrapArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;

  for (const key of ["result", "data", "rows", "list", "items", "records"]) {
    const nested = record[key];
    if (Array.isArray(nested)) return nested;
    const found = unwrapArray(nested);
    if (found.length) return found;
  }

  return [];
}

export function stringValue(row: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).length > 0) return String(value);
  }
  return fallback;
}

export function numberValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value) && value !== 0) return value;
  }
  return undefined;
}

export function normalizeDevices(value: unknown): Device[] {
  return unwrapArray(value)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const imei = stringValue(row, ["imei", "deviceImei", "device_imei"]);
      if (!imei) return null;

      return {
        id: imei,
        imei,
        name: stringValue(row, ["deviceName", "device_name", "vehicleName", "name"], `Device ${index + 1}`),
        model: stringValue(row, ["mcType", "model", "deviceModel"]),
        sim: stringValue(row, ["sim", "simNo", "sim_number"]),
        plate: stringValue(row, ["vehicleNumber", "plateNo", "numberPlate"]),
        driver: stringValue(row, ["driverName", "driver"]),
        phone: stringValue(row, ["driverPhone", "phone"]),
        expiration: stringValue(row, ["expiration", "expireTime"]),
        status: String(row.enabledFlag ?? row.status ?? "Active"),
        raw: row,
      } satisfies Device;
    })
    .filter(Boolean) as Device[];
}

function parseOnline(row: Record<string, unknown>) {
  const status = stringValue(row, ["onlineStatus", "status", "deviceStatus"]).toLowerCase();
  if (!status) return undefined;
  if (/(^|\b)(1|online|move|moving|run|running|stop|static|idle)\b/.test(status)) return true;
  if (/(0|offline|expired)/.test(status)) return false;
  return undefined;
}

export function normalizeLocations(value: unknown, knownDevices: Device[] = []): MapVehicle[] {
  return unwrapArray(value)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const lat = numberValue(row, ["lat", "latitude", "gpsLat", "gps_lat", "bdLat", "latc"]);
      const lng = numberValue(row, ["lng", "lon", "longitude", "gpsLng", "gps_lng", "bdLng", "lngc"]);
      if (!lat || !lng) return null;

      const imei = stringValue(row, ["imei", "deviceImei", "device_imei"]);
      const device = knownDevices.find((entry) => entry.imei === imei);
      const accValue = stringValue(row, ["accStatus", "acc"]).toLowerCase();

      return {
        id: imei || String(index),
        imei,
        name: stringValue(row, ["deviceName", "device_name", "vehicleName", "name"], device?.name ?? `Device ${index + 1}`),
        lat,
        lng,
        speed: numberValue(row, ["speed", "gpsSpeed"]),
        course: numberValue(row, ["course", "direction", "dir"]),
        status: stringValue(row, ["status", "onlineStatus", "accStatus", "deviceStatus"], "Live"),
        online: parseOnline(row),
        acc: accValue ? /1|on|true/.test(accValue) : undefined,
        address: stringValue(row, ["address", "location"]),
        lastTime: stringValue(row, ["gpsTime", "lastTime", "serverTime", "time", "posTime"]),
      } satisfies MapVehicle;
    })
    .filter(Boolean) as MapVehicle[];
}

export function normalizeRoute(value: unknown): [number, number][] {
  return unwrapArray(value)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const lat = numberValue(row, ["lat", "latitude", "gpsLat", "gps_lat", "bdLat", "latc"]);
      const lng = numberValue(row, ["lng", "lon", "longitude", "gpsLng", "gps_lng", "bdLng", "lngc"]);
      return lat && lng ? ([lat, lng] as [number, number]) : null;
    })
    .filter(Boolean) as [number, number][];
}

export function normalizeAlarms(value: unknown): AlarmRow[] {
  return unwrapArray(value)
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      return {
        id: stringValue(row, ["id", "alarmId", "warnId"], String(index)),
        imei: stringValue(row, ["imei", "deviceImei"]),
        type: stringValue(row, ["alarmName", "alarmType", "warnType", "type"], "Alarm"),
        time: stringValue(row, ["alarmTime", "gpsTime", "time", "createTime"]),
        address: stringValue(row, ["address", "location"]),
        raw: row,
      } satisfies AlarmRow;
    })
    .filter(Boolean) as AlarmRow[];
}

const toRad = (value: number) => (value * Math.PI) / 180;

export function haversineKm(a: [number, number], b: [number, number]) {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sin =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(sin), Math.sqrt(1 - sin));
}

export function routeDistanceKm(route: [number, number][]) {
  return route.reduce((distance, point, index) => {
    const previous = route[index - 1];
    return previous ? distance + haversineKm(previous, point) : distance;
  }, 0);
}
