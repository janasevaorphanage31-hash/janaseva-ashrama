import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recurringSubscriptions } from "@/db/schema";
import {
  fetchRazorpayPayment,
  fetchRazorpaySubscription,
  razorpayConfigured,
  recordSubscriptionCharge,
  subscriptionSignatureValid,
} from "@/lib/payments";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

/**
 * Server-side verification for Razorpay Subscription authorization:
 * Verifies HMAC_SHA256(payment_id + "|" + subscription_id, secret),
 * confirms mandate status with Razorpay, and idempotently records the first cycle donation.
 */
export async function POST(req: Request) {
  if (!rateLimit(`sub_ver:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many verification requests." }, { status: 429 });
  }

  if (!razorpayConfigured()) {
    return NextResponse.json({ error: "Razorpay is not configured." }, { status: 400 });
  }

  const b = await req.json().catch(() => null);
  const publicId = clean(b?.publicId, 64);
  const subscriptionId = clean(b?.razorpay_subscription_id, 64);
  const paymentId = clean(b?.razorpay_payment_id, 64);
  const signature = clean(b?.razorpay_signature, 128);

  if (!publicId || !subscriptionId || !paymentId || !signature) {
    return NextResponse.json({ error: "Invalid verification parameters." }, { status: 400 });
  }

  // Look up subscription in database
  const [sub] = await db
    .select()
    .from(recurringSubscriptions)
    .where(eq(recurringSubscriptions.publicId, publicId))
    .limit(1);

  if (!sub || sub.razorpaySubscriptionId !== subscriptionId) {
    return NextResponse.json({ error: "Subscription record not found." }, { status: 404 });
  }

  // Verify HMAC signature
  if (!subscriptionSignatureValid(paymentId, subscriptionId, signature)) {
    return NextResponse.json({ error: "Payment mandate signature could not be verified." }, { status: 400 });
  }

  try {
    // Verify with Razorpay API
    const [rzSub, rzPayment] = await Promise.all([
      fetchRazorpaySubscription(subscriptionId),
      fetchRazorpayPayment(paymentId),
    ]);

    if (rzPayment.amount !== sub.amount * 100 || rzPayment.currency !== "INR") {
      return NextResponse.json({ error: "Payment amount mismatch with subscription plan." }, { status: 400 });
    }

    // Determine next charge timestamp
    const nextChargeAt = rzSub.charge_at ? new Date(rzSub.charge_at * 1000) : null;

    // Record the first charge donation idempotently
    const chargeResult = await recordSubscriptionCharge({
      subscriptionDbId: sub.id,
      paymentId,
      amountPaise: rzPayment.amount,
      currentCycle: rzSub.current_count || 1,
      nextChargeAt,
    });

    return NextResponse.json({
      ok: true,
      publicId: sub.publicId,
      status: "active",
      receiptNo: chargeResult.donation.receiptNo,
      donationPublicId: chargeResult.donation.publicId,
      nextChargeAt: nextChargeAt?.toISOString() || null,
    });
  } catch (err: any) {
    console.error("Subscription verification failed:", err);
    return NextResponse.json(
      { error: "Could not confirm recurring mandate right now. If authorized, it will be activated via webhook." },
      { status: 502 },
    );
  }
}
