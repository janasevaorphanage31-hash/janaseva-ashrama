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
    }
  }, []);

  return null;
}
