import { NextResponse } from "next/server";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, donationLines, campaigns, volunteerApplications, analyticsEvents } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";

export async function GET() {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Overall financial summary
  const [totals] = await db
    .select({
      totalRaised: sql<number>`coalesce(sum(case when ${donations.status} = 'paid' then ${donations.amount} else 0 end), 0)::int`,
      paidCount: sql<number>`count(case when ${donations.status} = 'paid' then 1 else null end)::int`,
      totalCount: sql<number>`count(*)::int`,
      avgDonation: sql<number>`coalesce(avg(case when ${donations.status} = 'paid' then ${donations.amount} else null end), 0)::int`,
    })
    .from(donations);

  // 2. Today's collections
  const [todayTotals] = await db
    .select({
      todayRaised: sql<number>`coalesce(sum(case when ${donations.status} = 'paid' then ${donations.amount} else 0 end), 0)::int`,
      todayCount: sql<number>`count(case when ${donations.status} = 'paid' then 1 else null end)::int`,
    })
    .from(donations)
    .where(sql`${donations.paidAt} >= date_trunc('day', now())`);

  // 3. Status breakdown
  const statusRows = await db
    .select({
      status: donations.status,
      count: count(),
      total: sql<number>`coalesce(sum(${donations.amount}), 0)::int`,
    })
    .from(donations)
    .groupBy(donations.status);

  // 4. Category breakdown from donation lines
  const categoryRows = await db
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
    .limit(8);

  // 5. Recent transactions
  const recentTransactions = await db
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
    .limit(10);

  // 6. Community counts
  const [campaignCount] = await db.select({ count: count() }).from(campaigns);
  const [volunteerCount] = await db.select({ count: count() }).from(volunteerApplications);

  // 7. Funnel counts from analytics events
  const [eventsCount] = await db
    .select({
      visits: sql<number>`count(case when ${analyticsEvents.event} = 'visit' then 1 else null end)::int`,
      needViews: sql<number>`count(case when ${analyticsEvents.event} = 'need_view' then 1 else null end)::int`,
      checkouts: sql<number>`count(case when ${analyticsEvents.event} = 'checkout_start' then 1 else null end)::int`,
    })
    .from(analyticsEvents);

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
      visits: eventsCount?.visits ?? 0,
      needViews: eventsCount?.needViews ?? 0,
      checkouts: eventsCount?.checkouts ?? 0,
      conversions: totals?.paidCount ?? 0,
    },
    statusBreakdown: statusRows,
    categoryBreakdown: categoryRows,
    recentTransactions,
  });
}
