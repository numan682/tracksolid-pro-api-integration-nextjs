export type Device = {
  id: string;
  imei: string;
  name: string;
  model?: string;
  sim?: string;
  plate?: string;
  driver?: string;
  phone?: string;
  expiration?: string;
  status?: string;
  raw: Record<string, unknown>;
};

export type MapVehicle = {
  id: string;
  name: string;
  imei?: string;
  lat: number;
  lng: number;
  speed?: number;
  course?: number;
  status?: string;
  online?: boolean;
  acc?: boolean;
  address?: string;
  lastTime?: string;
};

export type AlarmRow = {
  id: string;
  imei: string;
  type: string;
  time: string;
  address?: string;
  raw: Record<string, unknown>;
};

export type GeofenceShape =
  | { kind: "circle"; center: [number, number]; radius: number }
  | { kind: "polygon"; points: [number, number][] };
