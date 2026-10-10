import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, recurringSubscriptions } from "@/db/schema";
import { cancelRazorpaySubscription, razorpayConfigured } from "@/lib/payments";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

/**
 * Cancels an active recurring subscription mandate.
 * Calls Razorpay API to cancel gateway debit schedule and updates local DB.
 */
export async function POST(req: Request) {
  if (!rateLimit(`sub_cnl:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many cancellation requests." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  const publicId = clean(b?.publicId, 64);
  const reason = clean(b?.reason, 200) || "Donor requested cancellation";

  if (!publicId) {
    return NextResponse.json({ error: "Missing subscription identifier." }, { status: 400 });
  }

  const [sub] = await db
    .select()
    .from(recurringSubscriptions)
    .where(eq(recurringSubscriptions.publicId, publicId))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Subscription record not found." }, { status: 404 });
  }

  if (sub.status === "cancelled") {
    return NextResponse.json({ ok: true, message: "Subscription is already cancelled.", status: "cancelled" });
  }

  // If in Razorpay mode, notify gateway
  if (sub.mode === "razorpay" && sub.razorpaySubscriptionId && razorpayConfigured()) {
    try {
      await cancelRazorpaySubscription(sub.razorpaySubscriptionId, false);
    } catch (err: any) {
      console.error("Razorpay subscription cancellation notice failed:", err);
      // Even if gateway returns an error (e.g. already cancelled on dashboard), we still proceed to reflect cancellation locally
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

  await db
    .insert(analyticsEvents)
    .values({
      event: "subscription_cancelled",
      sessionId: "server",
      meta: { subscriptionId: sub.id, publicId: sub.publicId, reason },
    })
    .catch(() => {});

  return NextResponse.json({
    ok: true,
    message: "Your monthly donation auto-pay has been cancelled successfully.",
    status: "cancelled",
  });
}
