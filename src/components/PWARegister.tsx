"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    // Unregister stale service workers and clear cache storage so browser always gets live updates
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});

      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        }).catch(() => {});
      }

      // If browser previously had an active service worker, reload once to take new HTML immediately
      const HAS_CLEARED = "js_v2_cache_cleared";
      if (!sessionStorage.getItem(HAS_CLEARED)) {
        sessionStorage.setItem(HAS_CLEARED, "true");
        navigator.serviceWorker.getRegistrations().then((regs) => {
          if (regs.length > 0) {
            window.location.reload();
          }
        }).catch(() => {});
      }
    }
  }, []);

  return null;
}
