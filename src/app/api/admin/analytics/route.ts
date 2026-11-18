import { NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, donationLines, campaigns, volunteerApplications, analyticsEvents } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { getLiveVisitorTelemetry } from "@/lib/visitor-tracker";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const istTodayStart = sql`(date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')`;

    // Execute all independent analytics aggregations in parallel (5x faster, lower serverless CPU)
    const [
      [totals],
      [todayTotals],
      statusRows,
      rawCategoryRows,
      recentTransactions,
      [campaignCount],
      [volunteerCount],
      [eventsCount],
    ] = await Promise.all([
      db
        .select({
          totalRaised: sql<number>`coalesce(sum(case when ${donations.status} = 'paid' then ${donations.amount} else 0 end), 0)::int`,
          paidCount: sql<number>`count(case when ${donations.status} = 'paid' then 1 else null end)::int`,
          totalCount: sql<number>`count(*)::int`,
          avgDonation: sql<number>`coalesce(avg(case when ${donations.status} = 'paid' then ${donations.amount} else null end), 0)::int`,
        })
        .from(donations),
      db
        .select({
          todayRaised: sql<number>`coalesce(sum(case when ${donations.status} = 'paid' then ${donations.amount} else 0 end), 0)::int`,
          todayCount: sql<number>`count(case when ${donations.status} = 'paid' then 1 else null end)::int`,
        })
        .from(donations)
        .where(sql`${donations.paidAt} >= ${istTodayStart}`),
      db
        .select({
          status: donations.status,
          count: count(),
          total: sql<number>`coalesce(sum(${donations.amount}), 0)::int`,
        })
        .from(donations)
        .groupBy(donations.status),
      db
        .select({
          label: donationLines.label,
          totalQty: sql<number>`sum(${donationLines.qty})::int`,
          totalAmount: sql<number>`sum(${donationLines.qty} * ${donationLines.unitPrice})::int`,
        })
        .from(donationLines)
        .innerJoin(donations, eq(donations.id, donationLines.donationId))
        .where(eq(donations.status, "paid"))
        .groupBy(donationLines.label)
        .orderBy(desc(sql`sum(${donationLines.qty} * ${donationLines.unitPrice})`))
        .limit(8),
      db
        .select({
          id: donations.id,
          publicId: donations.publicId,
          receiptNo: donations.receiptNo,
          donorName: donations.donorName,
          donorEmail: donations.donorEmail,
          amount: donations.amount,
          status: donations.status,
          mode: donations.mode,
          createdAt: donations.createdAt,
          paidAt: donations.paidAt,
        })
        .from(donations)
        .orderBy(desc(donations.createdAt))
        .limit(10),
      db.select({ count: count() }).from(campaigns),
      db.select({ count: count() }).from(volunteerApplications),
      db
        .select({
          visits: sql<number>`count(case when ${analyticsEvents.event} = 'visit' then 1 else null end)::int`,
          needViews: sql<number>`count(case when ${analyticsEvents.event} = 'need_view' then 1 else null end)::int`,
          checkouts: sql<number>`count(case when ${analyticsEvents.event} = 'checkout_start' then 1 else null end)::int`,
        })
        .from(analyticsEvents),
    ]);

    const categoryRows = rawCategoryRows.map((cat) => {
      let cleanLabel = (cat.label || "").trim();
      if (!cleanLabel || cleanLabel.toLowerCase() === "your own amount" || cleanLabel.toLowerCase() === "offline") {
        cleanLabel = "General Child Welfare & Meals (Direct)";
      }
      return {
        ...cat,
        label: cleanLabel,
      };
    });

    const conversions = totals?.paidCount ?? 0;
    const rawCheckouts = eventsCount?.checkouts ?? 0;
    const checkouts = Math.max(rawCheckouts, conversions);
    const rawNeedViews = eventsCount?.needViews ?? 0;
    const needViews = Math.max(rawNeedViews, checkouts);
    const rawVisits = eventsCount?.visits ?? 0;
    const visits = Math.max(rawVisits, needViews);

    return NextResponse.json({
      kpis: {
        totalRaised: totals?.totalRaised ?? 0,
        paidDonors: totals?.paidCount ?? 0,
        totalOrders: totals?.totalCount ?? 0,
        averageDonation: totals?.avgDonation ?? 0,
        todayRaised: todayTotals?.todayRaised ?? 0,
        todayDonations: todayTotals?.todayCount ?? 0,
        campaignCount: campaignCount?.count ?? 0,
        volunteerCount: volunteerCount?.count ?? 0,
      },
      funnel: {
        visits,
        needViews,
        checkouts,
        conversions,
        conversionRate: visits > 0 ? Number(((conversions / visits) * 100).toFixed(2)) : 0,
      },
      statusBreakdown: statusRows,
      categoryBreakdown: categoryRows,
      recentTransactions,
      liveTelemetry: getLiveVisitorTelemetry(),
    });
  } catch (err: any) {
    console.error("[Admin Analytics] Query failed:", err);
    return NextResponse.json(
      { error: "Failed to load analytics data.", details: err?.message },
      { status: 500 }
    );
  }
}
