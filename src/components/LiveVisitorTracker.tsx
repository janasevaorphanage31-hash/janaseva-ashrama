"use client";

import { useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Global declaration for manual action tracking
declare global {
  interface Window {
    trackVisitorAction?: (action: string, details?: Record<string, any>) => void;
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "anon";
  try {
    let sid = window.sessionStorage.getItem("jana_visitor_sid");
    if (!sid) {
      sid = "v_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      window.sessionStorage.setItem("jana_visitor_sid", sid);
    }
    return sid;
  } catch {
    return "v_" + Math.random().toString(36).substring(2, 9);
  }
}

function sendVisitorPing(payload: Record<string, any>) {
  if (typeof window === "undefined") return;

  const data = JSON.stringify({
    ...payload,
    sessionId: getOrCreateSessionId(),
    timestamp: Date.now(),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/visitor", new Blob([data], { type: "application/json" }));
    } else {
      fetch("/api/track/visitor", {
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Fail silently - analytics must never disturb user experience
  }
}

function VisitorBeaconInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const heartbeatTimer = useRef<NodeJS.Timeout | null>(null);
  const lastPath = useRef<string>("");

  useEffect(() => {
    // Expose global window helper for interactive click tracking
    window.trackVisitorAction = (action: string, details?: Record<string, any>) => {
      sendVisitorPing({
        path: window.location.pathname,
        pageTitle: document.title,
        action,
        ...details,
      });
    };
  }, []);

  useEffect(() => {
    const currentPath = pathname || "/";
    const title = typeof document !== "undefined" ? document.title : "";
    const referrer = typeof document !== "undefined" ? document.referrer : "";

    const utmSource = searchParams?.get("utm_source") || "";
    const utmMedium = searchParams?.get("utm_medium") || "";
    const utmCampaign = searchParams?.get("utm_campaign") || "";

    // Send page view ping
    sendVisitorPing({
      path: currentPath,
      pageTitle: title,
      referrer: lastPath.current ? lastPath.current : referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      action: "page_view",
    });

    lastPath.current = currentPath;

    // Setup 15-second active heartbeat
    if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);

    heartbeatTimer.current = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        sendVisitorPing({
          path: window.location.pathname,
          pageTitle: document.title,
          isHeartbeat: true,
        });
      }
    }, 15000);

    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
    };
  }, [pathname, searchParams]);

  // Wakeup ping when tab regains visibility
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sendVisitorPing({
          path: window.location.pathname,
          pageTitle: document.title,
          isHeartbeat: true,
          action: "tab_focus",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return null;
}

export function LiveVisitorTracker() {
  return (
    <Suspense fallback={null}>
      <VisitorBeaconInner />
    </Suspense>
  );
}
