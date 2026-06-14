"use client";

import { useEffect, useState } from "react";
import { LocateFixed, Pause, Play, RefreshCw } from "lucide-react";
import { useFleet } from "@/components/fleet-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function relativeTime(timestamp?: number) {
  if (!timestamp) return "—";
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

export function LiveStatusBar() {
  const { vehicles, onlineCount, livePolling, setLivePolling, refreshing, refreshLocations, lastUpdated } = useFleet();
  const [, force] = useState(0);

  // Tick so the "x seconds ago" label stays fresh.
  useEffect(() => {
    const id = window.setInterval(() => force((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="live-location-pill gap-1.5">
        <span className={cn("size-1.5 rounded-full bg-emerald-500", livePolling && "animate-pulse")} />
        {onlineCount}/{vehicles.length} live
      </Badge>
      <span className="hidden text-xs text-muted-foreground sm:inline">Updated {relativeTime(lastUpdated)}</span>
      <Button
        size="icon-sm"
        variant="ghost"
        title={livePolling ? "Pause live updates" : "Resume live updates"}
        onClick={() => setLivePolling(!livePolling)}
      >
        {livePolling ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <Button size="sm" variant="outline" onClick={() => refreshLocations()} disabled={refreshing}>
        <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
        <LocateFixed className="size-3.5 sm:hidden" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );
}
