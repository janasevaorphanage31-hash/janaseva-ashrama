import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { recordVisitorPing } from "@/lib/visitor-tracker";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const headers = req.headers;
    const ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = headers.get("user-agent") || "";
    const city =
      headers.get("x-vercel-ip-city") ||
      headers.get("cf-ipcity") ||
      "Bengaluru";
    const country =
      headers.get("x-vercel-ip-country") ||
      headers.get("cf-ipcountry") ||
      "IN";

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Beacon may send form-urlencoded or empty body
    }

    const sessionId = (body.sessionId || "").slice(0, 64);
    const path = (body.path || "/").slice(0, 255);
    const pageTitle = (body.pageTitle || "").slice(0, 255);
    const referrer = (body.referrer || headers.get("referer") || "").slice(0, 500);
    const utmSource = (body.utmSource || "").slice(0, 100);
    const utmMedium = (body.utmMedium || "").slice(0, 100);
    const utmCampaign = (body.utmCampaign || "").slice(0, 100);
    const action = (body.action || (body.isHeartbeat ? "heartbeat" : "page_view")).slice(0, 50);

    // 1. Record in real-time in-memory visitor engine
    const session = recordVisitorPing({
      sessionId,
      path,
      pageTitle,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      ip,
      userAgent,
      city,
      country,
      action: action === "heartbeat" ? undefined : action,
    });

    // 2. Persist page views & milestone actions to PostgreSQL analyticsEvents (skip repetitive heartbeats)
    if (action !== "heartbeat") {
      db.insert(analyticsEvents)
        .values({
          event: action === "page_view" ? "visit" : action,
          sessionId: session.sessionId,
          meta: {
            path: session.currentPath,
            title: session.pageTitle,
            source: session.trafficSource,
            campaign: session.campaign,
            device: session.device,
            browser: session.browser,
            os: session.os,
            city: session.city,
            country: session.country,
          },
        })
        .catch(() => {
          // Non-blocking catch to ensure telemetry never slows down user request
        });
    }

    return NextResponse.json({ ok: true, activeNow: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
