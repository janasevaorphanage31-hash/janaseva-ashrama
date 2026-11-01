import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, ensureDbSchema } from "@/db";
import { donations, recurringSubscriptions } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { cancelRazorpaySubscription, razorpayConfigured } from "@/lib/payments";
import { clean } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE", "DONATION_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "all").trim().toLowerCase();

  const conditions: any[] = [];
  if (status && status !== "all") {
    if (status === "pending") {
      conditions.push(or(eq(recurringSubscriptions.status, "created"), eq(recurringSubscriptions.status, "authenticated")));
    } else {
      conditions.push(eq(recurringSubscriptions.status, status));
    }
  }

  if (q) {
    conditions.push(
      or(
        ilike(recurringSubscriptions.donorName, `%${q}%`),
        ilike(recurringSubscriptions.donorEmail, `%${q}%`),
        ilike(recurringSubscriptions.donorPhone, `%${q}%`),
        ilike(recurringSubscriptions.publicId, `%${q}%`),
        ilike(recurringSubscriptions.razorpaySubscriptionId, `%${q}%`),
      ),
    );
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const subList = await db
    .select()
    .from(recurringSubscriptions)
    .where(whereClause || sql`true`)
    .orderBy(desc(recurringSubscriptions.createdAt))
    .limit(100);

  // Compute live metrics across all subscriptions via fast SQL aggregation and normalized MRR math
  const [metricRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(case when ${recurringSubscriptions.status} = 'active' then 1 end)::int`,
      pending: sql<number>`count(case when ${recurringSubscriptions.status} in ('created', 'authenticated') then 1 end)::int`,
      halted: sql<number>`count(case when ${recurringSubscriptions.status} = 'halted' then 1 end)::int`,
      cancelled: sql<number>`count(case when ${recurringSubscriptions.status} = 'cancelled' then 1 end)::int`,
      mrr: sql<number>`coalesce(round(sum(
        case 
          when ${recurringSubscriptions.status} = 'active' and ${recurringSubscriptions.frequency} = 'yearly' then ${recurringSubscriptions.amount} / 12.0
          when ${recurringSubscriptions.status} = 'active' and ${recurringSubscriptions.frequency} = 'weekly' then ${recurringSubscriptions.amount} * 4.33
          when ${recurringSubscriptions.status} = 'active' and ${recurringSubscriptions.frequency} = 'daily' then ${recurringSubscriptions.amount} * 30.4
          when ${recurringSubscriptions.status} = 'active' then ${recurringSubscriptions.amount}::numeric
          else 0
        end
      )), 0)::int`,
    })
    .from(recurringSubscriptions);

  // Get recent 50 recurring charges from donations
  const recentCharges = await db
    .select({
      id: donations.id,
      publicId: donations.publicId,
      receiptNo: donations.receiptNo,
      amount: donations.amount,
      donorName: donations.donorName,
      donorEmail: donations.donorEmail,
      subscriptionId: donations.subscriptionId,
      recurringCycle: donations.recurringCycle,
      razorpayPaymentId: donations.razorpayPaymentId,
      paidAt: donations.paidAt,
    })
    .from(donations)
    .where(sql`${donations.subscriptionId} is not null and ${donations.status} = 'paid'`)
    .orderBy(desc(donations.paidAt))
    .limit(50);

  return NextResponse.json({
    metrics: {
      total: metricRow?.total ?? 0,
      active: metricRow?.active ?? 0,
      pending: metricRow?.pending ?? 0,
      halted: metricRow?.halted ?? 0,
      cancelled: metricRow?.cancelled ?? 0,
      mrr: metricRow?.mrr ?? 0,
      recentChargesCount: recentCharges.length,
    },
    subscriptions: subList,
    recentCharges,
  });
}

export async function POST(req: Request) {
  await ensureDbSchema();
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });


  const b = await req.json().catch(() => null);
  const action = clean(b?.action, 32);
  const publicId = clean(b?.publicId, 64);
  const reason = clean(b?.reason, 200) || `Cancelled by admin (${session.user.email})`;

  if (action === "cancel" && publicId) {
    const [sub] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.publicId, publicId))
      .limit(1);

    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });

    if (sub.mode === "razorpay" && sub.razorpaySubscriptionId && razorpayConfigured()) {
      try {
        await cancelRazorpaySubscription(sub.razorpaySubscriptionId, false);
      } catch (e) {
        console.error("Admin cancel subscription on Razorpay failed:", e);
      }
    }

    const now = new Date();
    await db
      .update(recurringSubscriptions)
      .set({
        status: "cancelled",
        mandateStatus: "cancelled",
        cancelledAt: now,
        cancelReason: reason,
        updatedAt: now,
      })
      .where(eq(recurringSubscriptions.id, sub.id));

    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
