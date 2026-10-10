import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, recurringSubscriptions } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { cancelRazorpaySubscription, razorpayConfigured } from "@/lib/payments";
import { clean } from "@/lib/server-utils";

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

  // Compute live metrics across all subscriptions
  const allSubs = await db.select().from(recurringSubscriptions);

  let activeCount = 0;
  let pendingCount = 0;
  let haltedCount = 0;
  let cancelledCount = 0;
  let mrr = 0;

  for (const s of allSubs) {
    if (s.status === "active") {
      activeCount++;
      mrr += s.amount;
    } else if (s.status === "created" || s.status === "authenticated") {
      pendingCount++;
    } else if (s.status === "halted") {
      haltedCount++;
    } else if (s.status === "cancelled") {
      cancelledCount++;
    }
  }

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
      total: allSubs.length,
      active: activeCount,
      pending: pendingCount,
      halted: haltedCount,
      cancelled: cancelledCount,
      mrr,
      recentChargesCount: recentCharges.length,
    },
    subscriptions: subList,
    recentCharges,
  });
}

export async function POST(req: Request) {
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
