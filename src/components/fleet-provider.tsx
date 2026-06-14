"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { callApi } from "@/lib/api";
import { normalizeDevices, normalizeLocations } from "@/lib/normalize";
import type { Device, MapVehicle } from "@/lib/types";

const LIVE_POLL_MS = 15_000;

type FleetContextValue = {
  devices: Device[];
  vehicles: MapVehicle[];
  selectedImei: string;
  selectedDevice?: Device;
  selectedVehicle?: MapVehicle;
  loading: boolean;
  refreshing: boolean;
  error?: string;
  lastUpdated?: number;
  livePolling: boolean;
  onlineCount: number;
  setSelectedImei: (imei: string) => void;
  setLivePolling: (value: boolean) => void;
  refreshDevices: () => Promise<void>;
  refreshLocations: () => Promise<void>;
};

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [vehicles, setVehicles] = useState<MapVehicle[]>([]);
  const [selectedImei, setSelectedImei] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [livePolling, setLivePolling] = useState(true);

  const devicesRef = useRef<Device[]>([]);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  const refreshDevices = useCallback(async () => {
    const data = await callApi("jimi.user.device.list");
    const next = normalizeDevices(data);
    setDevices(next);
    setSelectedImei((current) => current || next[0]?.imei || "");
    return next;
  }, []);

  const refreshLocations = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await callApi("jimi.user.device.location.list");
      setVehicles(normalizeLocations(data, devicesRef.current));
      setLastUpdated(Date.now());
      setError(undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh locations";
      setError(message);
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initial load: devices then live locations.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await refreshDevices();
        if (cancelled) return;
        const data = await callApi("jimi.user.device.location.list");
        if (cancelled) return;
        setVehicles(normalizeLocations(data, devicesRef.current));
        setLastUpdated(Date.now());
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to load fleet";
        setError(message);
        toast.error(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshDevices]);

  // Live polling loop.
  useEffect(() => {
    if (!livePolling) return;
    const id = window.setInterval(() => {
      refreshLocations().catch(() => {});
    }, LIVE_POLL_MS);
    return () => window.clearInterval(id);
  }, [livePolling, refreshLocations]);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.imei === selectedImei),
    [devices, selectedImei],
  );
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.imei === selectedImei || vehicle.id === selectedImei),
    [vehicles, selectedImei],
  );
  const onlineCount = useMemo(() => vehicles.filter((vehicle) => vehicle.online !== false).length, [vehicles]);

  const value = useMemo<FleetContextValue>(
    () => ({
      devices,
      vehicles,
      selectedImei,
      selectedDevice,
      selectedVehicle,
      loading,
      refreshing,
      error,
      lastUpdated,
      livePolling,
      onlineCount,
      setSelectedImei,
      setLivePolling,
      refreshDevices: async () => {
        await refreshDevices();
      },
      refreshLocations: async () => {
        await refreshLocations().catch((err) => {
          toast.error(err instanceof Error ? err.message : "Refresh failed");
        });
      },
    }),
    [
      devices,
      vehicles,
      selectedImei,
      selectedDevice,
      selectedVehicle,
      loading,
      refreshing,
      error,
      lastUpdated,
      livePolling,
      onlineCount,
      refreshDevices,
      refreshLocations,
    ],
  );

  return <FleetContext.Provider value={value}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used within a FleetProvider");
  return ctx;
}
