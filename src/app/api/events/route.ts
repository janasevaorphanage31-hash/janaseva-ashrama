import { NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

const ALLOWED = new Set([
  "visit", "story_started", "story_completed", "story_skipped", "story_view", "need_view", "item_add",
  "cart_view", "custom_amount", "checkout_start", "checkout_submit", "payment_failed", "share", "cta_make_impact",
  "campaign_view", "campaign_created", "volunteer_signup", "volunteer_started", "volunteer_submitted",
  "gift_started", "gift_created", "gift_shared", "certificate_generated", "certificate_downloaded",
  "mission_viewed", "mission_started", "mission_supported", "mission_completed",
  "company_interest_started", "company_interest_submitted", "team_created", "team_supported",
  "creator_campaign_created", "creator_campaign_shared", "ngo_partner_interest", "ngo_partner_verified",
  "future_project_viewed", "future_project_interaction", "CSR_report_viewed",
]);

export async function POST(req: Request) {
  if (!rateLimit(`ev:${clientIp(req)}`, 120, 60_000)) return new NextResponse(null, { status: 429 });
  try {
    const b = await req.json();
    const event = clean(b?.event, 40);
    if (!ALLOWED.has(event)) return new NextResponse(null, { status: 204 });
    const meta = b?.meta && typeof b.meta === "object" ? JSON.parse(JSON.stringify(b.meta).slice(0, 500)) : null;
    await db.insert(analyticsEvents).values({ event, sessionId: clean(b?.sessionId, 64) || "anon", meta });
  } catch {
    /* ignore malformed analytics */
  }
  return new NextResponse(null, { status: 204 });
}
