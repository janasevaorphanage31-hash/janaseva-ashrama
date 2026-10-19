/**
 * High-Performance Real-Time Visitor Telemetry Engine
 * Tracks active visitors, sessions, page routes, referrers, devices, and live heartbeats.
 */

export interface LiveVisitorSession {
  sessionId: string;
  firstSeenAt: number;
  lastSeenAt: number;
  currentPath: string;
  pageTitle: string;
  referrer: string;
  trafficSource: "Direct" | "WhatsApp" | "Meta Ads" | "Google Search" | "Google Ads" | "Instagram" | "Twitter" | "Referral";
  campaign?: string;
  device: "Mobile" | "Desktop" | "Tablet";
  browser: string;
  os: string;
  ipMasked: string;
  city: string;
  country: string;
  eventCount: number;
  history: Array<{ path: string; timestamp: number; action?: string }>;
  status: "online" | "idle" | "inactive";
}

// In-memory registry of active visitor sessions (ephemeral, fast <1ms access)
// Scoped globally across serverless warm instances
const globalForVisitors = global as unknown as {
  activeVisitorSessions?: Map<string, LiveVisitorSession>;
  recentLiveEvents?: Array<{
    id: string;
    timestamp: number;
    sessionId: string;
    event: string;
    path: string;
    device: string;
    city: string;
    source: string;
    details?: string;
  }>;
};

const sessions = globalForVisitors.activeVisitorSessions ?? new Map<string, LiveVisitorSession>();
globalForVisitors.activeVisitorSessions = sessions;

const recentEvents = globalForVisitors.recentLiveEvents ?? [];
globalForVisitors.recentLiveEvents = recentEvents;

// Clean up sessions older than 30 minutes
function purgeStaleSessions() {
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;

  for (const [id, session] of sessions.entries()) {
    if (now - session.lastSeenAt > THIRTY_MINUTES) {
      sessions.delete(id);
    }
  }

  // Keep only the last 100 events
  if (recentEvents.length > 100) {
    recentEvents.splice(100);
  }
}

/**
 * Determine traffic source from referrer and URL params
 */
export function parseTrafficSource(
  referrer: string = "",
  utmSource: string = "",
  utmMedium: string = "",
  utmCampaign: string = ""
): { source: LiveVisitorSession["trafficSource"]; campaign?: string } {
  const ref = (referrer || "").toLowerCase();
  const utmSrc = (utmSource || "").toLowerCase();
  const utmMed = (utmMedium || "").toLowerCase();

  if (utmSrc.includes("whatsapp") || ref.includes("whatsapp") || ref.includes("wa.me")) {
    return { source: "WhatsApp", campaign: utmCampaign || undefined };
  }
  if (utmSrc.includes("facebook") || utmSrc.includes("fb") || utmSrc.includes("meta") || ref.includes("facebook.com") || ref.includes("fb.me")) {
    return { source: "Meta Ads", campaign: utmCampaign || undefined };
  }
  if (utmSrc.includes("instagram") || ref.includes("instagram.com")) {
    return { source: "Instagram", campaign: utmCampaign || undefined };
  }
  if (utmSrc.includes("google") && (utmMed.includes("cpc") || utmMed.includes("ads"))) {
    return { source: "Google Ads", campaign: utmCampaign || undefined };
  }
  if (ref.includes("google.") || utmSrc.includes("google")) {
    return { source: "Google Search", campaign: utmCampaign || undefined };
  }
  if (ref.includes("twitter.com") || ref.includes("x.com") || utmSrc.includes("twitter")) {
    return { source: "Twitter", campaign: utmCampaign || undefined };
  }
  if (ref && !ref.includes("janaseva") && !ref.includes("localhost")) {
    return { source: "Referral", campaign: utmCampaign || undefined };
  }

  return { source: "Direct", campaign: utmCampaign || undefined };
}

/**
 * Parse User-Agent into clean device, browser, and OS
 */
export function parseUserAgent(ua: string = ""): {
  device: "Mobile" | "Desktop" | "Tablet";
  browser: string;
  os: string;
} {
  const s = ua.toLowerCase();

  // Device
  let device: "Mobile" | "Desktop" | "Tablet" = "Desktop";
  if (/ipad|tablet|playbook|silk/i.test(s)) {
    device = "Tablet";
  } else if (/mobi|android|touch|iphone|ipod/i.test(s)) {
    device = "Mobile";
  }

  // OS
  let os = "Unknown OS";
  if (/windows/i.test(s)) os = "Windows";
  else if (/android/i.test(s)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(s)) os = "iOS";
  else if (/macintosh|mac os x/i.test(s)) os = "macOS";
  else if (/linux/i.test(s)) os = "Linux";

  // Browser
  let browser = "Browser";
  if (/whatsapp/i.test(s)) browser = "WhatsApp WABrowser";
  else if (/edg/i.test(s)) browser = "Edge";
  else if (/chrome|crios/i.test(s)) browser = "Chrome";
  else if (/firefox|fxios/i.test(s)) browser = "Firefox";
  else if (/safari/i.test(s) && !/chrome/i.test(s)) browser = "Safari";
  else if (/opera|opr/i.test(s)) browser = "Opera";

  return { device, browser, os };
}

/**
 * Mask client IP for privacy (e.g. 106.51.x.x)
 */
export function maskIp(ip: string = ""): string {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return "Localhost";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  return ip.slice(0, 10) + "...";
}

/**
 * Record a visitor telemetry ping (page view, heartbeat, or interaction)
 */
export function recordVisitorPing(payload: {
  sessionId: string;
  path: string;
  pageTitle?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ip?: string;
  userAgent?: string;
  city?: string;
  country?: string;
  action?: string;
}): LiveVisitorSession {
  const now = Date.now();
  purgeStaleSessions();

  const id = payload.sessionId || `s_${Math.random().toString(36).slice(2, 10)}`;
  const { device, browser, os } = parseUserAgent(payload.userAgent);
  const { source, campaign } = parseTrafficSource(
    payload.referrer,
    payload.utmSource,
    payload.utmMedium,
    payload.utmCampaign
  );

  let session = sessions.get(id);

  if (!session) {
    session = {
      sessionId: id,
      firstSeenAt: now,
      lastSeenAt: now,
      currentPath: payload.path || "/",
      pageTitle: payload.pageTitle || "Janaseva Ashrama",
      referrer: payload.referrer || "",
      trafficSource: source,
      campaign: campaign,
      device,
      browser,
      os,
      ipMasked: maskIp(payload.ip),
      city: payload.city || "Bengaluru",
      country: payload.country || "IN",
      eventCount: 1,
      history: [{ path: payload.path || "/", timestamp: now, action: payload.action }],
      status: "online",
    };
  } else {
    session.lastSeenAt = now;
    if (payload.path) session.currentPath = payload.path;
    if (payload.pageTitle) session.pageTitle = payload.pageTitle;
    session.eventCount += 1;
    session.status = "online";

    // Track path changes or actions in session history (keep last 15 steps)
    if (
      payload.action ||
      !session.history.length ||
      session.history[session.history.length - 1].path !== payload.path
    ) {
      session.history.push({
        path: payload.path || session.currentPath,
        timestamp: now,
        action: payload.action,
      });
      if (session.history.length > 15) session.history.shift();
    }
  }

  sessions.set(id, session);

  // Add to recent activity stream if it's a new page view or action
  if (payload.action || !session.history.length || session.history[session.history.length - 1].path === payload.path) {
    recentEvents.unshift({
      id: `${id}_${now}`,
      timestamp: now,
      sessionId: id,
      event: payload.action || "page_view",
      path: payload.path || "/",
      device: `${session.device} · ${session.browser}`,
      city: session.city,
      source: session.trafficSource,
      details: payload.pageTitle || undefined,
    });
    if (recentEvents.length > 100) recentEvents.pop();
  }

  return session;
}

/**
 * Get current live visitor snapshot for Admin Dashboard
 */
export function getLiveVisitorTelemetry() {
  const now = Date.now();
  purgeStaleSessions();

  const sessionList = Array.from(sessions.values());

  // Mark status based on last seen time
  const enrichedList = sessionList.map((s) => {
    const diffSeconds = Math.floor((now - s.lastSeenAt) / 1000);
    let status: "online" | "idle" | "inactive" = "online";
    if (diffSeconds > 180) {
      status = "inactive";
    } else if (diffSeconds > 60) {
      status = "idle";
    }

    return {
      ...s,
      status,
      secondsAgo: diffSeconds,
      durationSeconds: Math.floor((s.lastSeenAt - s.firstSeenAt) / 1000),
    };
  });

  // Active right now = seen in the last 120 seconds (2 minutes)
  const activeNow = enrichedList.filter((s) => s.secondsAgo <= 120).length;

  // Breakdown by traffic source
  const sourceCounts: Record<string, number> = {};
  for (const s of enrichedList) {
    sourceCounts[s.trafficSource] = (sourceCounts[s.trafficSource] || 0) + 1;
  }

  // Breakdown by device
  const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
  for (const s of enrichedList) {
    deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
  }

  // Top pages currently viewed
  const pageCounts: Record<string, number> = {};
  for (const s of enrichedList) {
    pageCounts[s.currentPath] = (pageCounts[s.currentPath] || 0) + 1;
  }

  const topPages = Object.entries(pageCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Sort sessions: online first, then by last seen
  enrichedList.sort((a, b) => {
    if (a.status === "online" && b.status !== "online") return -1;
    if (b.status === "online" && a.status !== "online") return 1;
    return b.lastSeenAt - a.lastSeenAt;
  });

  return {
    activeNow,
    totalTrackedSessions: enrichedList.length,
    sessions: enrichedList.slice(0, 50),
    sources: sourceCounts,
    devices: deviceCounts,
    topPages,
    recentEvents: recentEvents.slice(0, 30),
  };
}
