"use client";

import { useEffect } from "react";

const RESET_KEY = "tracksolid-origin-cache-reset-v1";

export function OriginCacheReset() {
  useEffect(() => {
    async function resetOldOriginState() {
      if (sessionStorage.getItem(RESET_KEY)) return;
      sessionStorage.setItem(RESET_KEY, "done");

      const registrations = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistrations() : [];
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    }

    resetOldOriginState().catch(() => {
      sessionStorage.removeItem(RESET_KEY);
    });
  }, []);

  return null;
}
