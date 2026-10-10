import { NextResponse } from "next/server";
import { and, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import { donations, recurringSubscriptions } from "@/db/schema";
import { clean, clientIp, isEmail, rateLimit } from "@/lib/server-utils";

/**
 * Donor self-service lookup for recurring subscriptions and payment receipts.
 */
export async function GET(req: Request) {
  if (!rateLimit(`sub_sts:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const url = new URL(req.url);
  const publicId = clean(url.searchParams.get("publicId"), 64);
  const email = clean(url.searchParams.get("email"), 200).toLowerCase();

  if (!publicId && (!email || !isEmail(email))) {
    return NextResponse.json(
      { error: "Please provide either a subscription reference ID or a valid donor email address." },
      { status: 400 },
    );
  }

  let subs: (typeof recurringSubscriptions.$inferSelect)[] = [];

  if (publicId) {
    subs = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.publicId, publicId))
      .limit(10);
  } else if (email) {
    subs = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.donorEmail, email))
      .orderBy(desc(recurringSubscriptions.createdAt))
      .limit(10);
  }

  if (subs.length === 0) {
    return NextResponse.json({ subscriptions: [] });
  }

  const subIds = subs.map((s) => s.id);

  // Fetch all payment history / 80G receipts tied to these subscriptions
  const history = await db
    .select({
      id: donations.id,
      publicId: donations.publicId,
      receiptNo: donations.receiptNo,
      amount: donations.amount,
      status: donations.status,
      paidAt: donations.paidAt,
      subscriptionId: donations.subscriptionId,
      recurringCycle: donations.recurringCycle,
    })
    .from(donations)
    .where(or(...subIds.map((id) => eq(donations.subscriptionId, id))))
    .orderBy(desc(donations.paidAt));

  const result = subs.map((s) => ({
    publicId: s.publicId,
    status: s.status,
    mandateStatus: s.mandateStatus,
    amount: s.amount,
    currency: s.currency,
    frequency: s.frequency,
    donorName: s.donorName,
    donorEmail: s.donorEmail,
    chargeCount: s.chargeCount,
    currentCycle: s.currentCycle,
    totalCycles: s.totalCycles,
    nextChargeAt: s.nextChargeAt,
    lastPaymentAt: s.lastPaymentAt,
    cancelledAt: s.cancelledAt,
    createdAt: s.createdAt,
    payments: history.filter((h) => h.subscriptionId === s.id),
  }));

  return NextResponse.json({ subscriptions: result });
}
