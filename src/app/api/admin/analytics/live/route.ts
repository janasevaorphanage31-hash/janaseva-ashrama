import { NextResponse } from "next/server";
import { count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, donations } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { getLiveVisitorTelemetry } from "@/lib/visitor-tracker";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get real-time in-memory visitor radar
    const liveTelemetry = getLiveVisitorTelemetry();

    // 2. Query today's historical aggregates from PostgreSQL
    const [todayStats] = await db
      .select({
        pageViewsToday: sql<number>`count(*)::int`,
        uniqueSessionsToday: sql<number>`count(distinct ${analyticsEvents.sessionId})::int`,
        checkoutsToday: sql<number>`count(case when ${analyticsEvents.event} in ('checkout_start', 'custom_amount', 'item_add') then 1 else null end)::int`,
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} >= date_trunc('day', now())`);

    // 3. Query today's donations
    const [todayDonations] = await db
      .select({
        paidCount: sql<number>`count(case when ${donations.status} = 'paid' then 1 else null end)::int`,
        totalRaised: sql<number>`coalesce(sum(case when ${donations.status} = 'paid' then ${donations.amount} else 0 end), 0)::int`,
      })
      .from(donations)
      .where(sql`${donations.paidAt} >= date_trunc('day', now())`);

    // 4. Query top 5 most viewed paths from database today
    const topDbPages = await db
      .select({
        path: sql<string>`coalesce(${analyticsEvents.meta}->>'path', '/')`,
        visits: count(),
      })
      .from(analyticsEvents)
      .where(sql`${analyticsEvents.createdAt} >= date_trunc('day', now())`)
      .groupBy(sql`${analyticsEvents.meta}->>'path'`)
      .orderBy(desc(count()))
      .limit(6);

    const formattedTopPages =
      topDbPages.length > 0
        ? topDbPages.map((p) => ({ path: p.path || "/", count: Number(p.visits) }))
        : liveTelemetry.topPages;

    return NextResponse.json({
      timestamp: Date.now(),
      activeNow: liveTelemetry.activeNow,
      today: {
        pageViews: todayStats?.pageViewsToday ?? 0,
        uniqueVisitors: todayStats?.uniqueSessionsToday ?? 0,
        checkouts: todayStats?.checkoutsToday ?? 0,
        donationsCount: todayDonations?.paidCount ?? 0,
        donationsRaised: todayDonations?.totalRaised ?? 0,
      },
      liveVisitors: liveTelemetry.sessions,
      topPages: formattedTopPages,
      sources: liveTelemetry.sources,
      devices: liveTelemetry.devices,
      recentEvents: liveTelemetry.recentEvents,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to generate live visitor telemetry",
        message: err?.message,
      },
      { status: 500 }
    );
  }
}
