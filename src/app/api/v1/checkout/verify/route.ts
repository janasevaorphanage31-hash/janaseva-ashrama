import { NextResponse } from "next/server";
import { recordPaymentAttribution } from "@/lib/antigravity-crm";
import {
  checkoutSignatureValid,
  subscriptionSignatureValid,
  fetchRazorpayPayment,
  captureRazorpayPayment,
  razorpayConfigured,
} from "@/lib/payments";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

export const dynamic = "force-dynamic";

/**
 * Client Checkout Verification Endpoint
 * Validates Razorpay payment signature from client-side modal,
 * confirms capture status, and synchronizes attribution atomically into
 * both `ag_donations` (influencer/telecaller stats) and `donations` (public donor wall & 80G receipt).
 */
export async function POST(req: Request) {
  try {
    if (!rateLimit(`chk_ver:${clientIp(req)}`, 60, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const orderId = clean(body.orderId || body.razorpay_order_id, 64);
    const paymentId = clean(body.paymentId || body.razorpay_payment_id, 64);
    const signature = clean(body.signature || body.razorpay_signature, 128);
    const subscriptionId = clean(body.subscriptionId || body.razorpay_subscription_id, 64);

    const rawRef = clean(body.callerRefId || body.callerRef || "DIRECT", 32).toUpperCase();
    const callerRefId = /^[A-Z0-9_-]+$/.test(rawRef) ? rawRef : "DIRECT";
    const leadId = body.leadId ? Number(body.leadId) : null;
    const amount = Number(body.amount);
    const donorName = clean(body.donorName, 80) || "Janaseva Supporter";
    const donorPhone = clean(body.donorPhone, 20) || null;
    const donorEmail = clean(body.donorEmail, 100) || null;
    const donorPan = clean(body.donorPan, 10)?.toUpperCase() || null;
    const occasion = clean(body.occasion, 50) || null;
    const prayerNote = clean(body.prayerNote, 250) || null;
    const frequency = clean(body.frequency, 20) || "onetime";

    const isProduction = process.env.NODE_ENV === "production";
    const allowDemo = process.env.ALLOW_DEMO_SEED === "true";
    const isDemoPayload =
      Boolean(orderId?.startsWith("order_demo_") || paymentId?.startsWith("pay_sim_"));

    // 1. Signature Verification for Live Payments
    if (razorpayConfigured() && !isDemoPayload) {
      if (!paymentId) {
        return NextResponse.json({ error: "Missing Razorpay payment ID." }, { status: 400 });
      }

      let isSigValid = false;

      if (orderId && signature) {
        isSigValid = checkoutSignatureValid(orderId, paymentId, signature);
      } else if (subscriptionId && signature) {
        isSigValid = subscriptionSignatureValid(paymentId, subscriptionId, signature);
      }

      // If HMAC verification passes, verify or auto-capture status via Razorpay API
      if (isSigValid) {
        try {
          let p = await fetchRazorpayPayment(paymentId);
          if (p.status === "authorized") {
            const captureAmt = amount && amount > 0 ? Math.round(amount * 100) : p.amount;
            p = await captureRazorpayPayment(paymentId, captureAmt);
          }
        } catch (apiErr) {
          console.warn("[CHECKOUT VERIFY] Gateway API check warning:", apiErr);
        }
      } else {
        // Fallback: Query Razorpay API directly to confirm capture
        try {
          const p = await fetchRazorpayPayment(paymentId);
          if (p && (p.status === "captured" || p.status === "authorized")) {
            isSigValid = true;
          }
        } catch (directCheckErr) {
          console.error("[CHECKOUT VERIFY] Direct gateway verification failed:", directCheckErr);
        }
      }

      if (!isSigValid) {
        console.error("[CHECKOUT VERIFY] Invalid signature for payment:", paymentId);
        return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
      }
    } else if (isProduction && !allowDemo) {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 503 }
      );
    }

    // 2. Synchronize attribution into BOTH agDonations and donations
    const finalTxnId = paymentId || `pay_sim_${Date.now()}`;
    const finalOrderId = orderId || (subscriptionId ? `sub_${subscriptionId}` : `order_${Date.now()}`);
    const finalAmount = amount && !isNaN(amount) && amount > 0 ? amount : 1000;

    await recordPaymentAttribution({
      txnId: finalTxnId,
      gatewayOrderId: finalOrderId,
      amount: finalAmount,
      callerRefId,
      leadId,
      donorName,
      donorPhone,
      donorEmail,
      metadata: {
        occasion,
        prayerNote,
        donorPan,
        frequency,
        subscriptionId: subscriptionId || null,
        clientVerified: true,
        verifiedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      txnId: finalTxnId,
      orderId: finalOrderId,
      amount: finalAmount,
      callerRefId,
      attributedTo: callerRefId,
    });
  } catch (err: any) {
    console.error("[CHECKOUT VERIFY ERROR]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
