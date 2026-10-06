"use client";

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("js_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("js_sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

/** Journey events: visit, story, need, item, cart, checkout, verified, share. No personal data. */
export function track(event: string, meta?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ event, sessionId: sessionId(), meta });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
    }
  } catch {
    /* analytics must never break the UI */
  }
}
