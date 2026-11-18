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

const HIGH_VALUE_SERVER_EVENTS = new Set([
  "checkout_start",
  "checkout_submit",
  "payment_failed",
  "volunteer_submitted",
  "gift_created",
  "campaign_created",
  "company_interest_submitted",
  "creator_campaign_created",
  "ngo_partner_interest",
]);

/** Journey events: only sends high-value conversion milestones to /api/events to protect Vercel Fluid CPU & Neon DB. */
export function track(event: string, meta?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  if (!HIGH_VALUE_SERVER_EVENTS.has(event)) return;
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
