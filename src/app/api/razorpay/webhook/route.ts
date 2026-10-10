import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, donations, recurringSubscriptions } from "@/db/schema";
import { markPaid, recordSubscriptionCharge, webhookSignatureValid } from "@/lib/payments";

/**
 * Razorpay webhook handler for one-time and recurring subscriptions.
 * Configure in Razorpay Dashboard:
 *   URL: https://<your-domain>/api/razorpay/webhook
 *   Secret: RAZORPAY_WEBHOOK_SECRET
 *   Events:
 *     - payment.captured
 *     - refund.processed
 *     - subscription.authenticated
 *     - subscription.activated
 *     - subscription.charged
 *     - subscription.halted
 *     - subscription.cancelled
 *     - payment.failed
 * All event handlers are strictly idempotent.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!webhookSignatureValid(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let evt: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id: string;
          order_id?: string;
          amount: number;
          currency: string;
          status: string;
          error_code?: string;
          error_description?: string;
        };
      };
      refund?: { entity?: { payment_id?: string } };
      subscription?: {
        entity?: {
          id: string;
          plan_id?: string;
          status?: string;
          current_count?: number;
          charge_at?: number;
          end_at?: number;
        };
      };
    };
  };

  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const eventName = evt.event;

  // 1. One-time Payment Captured
  if (eventName === "payment.captured") {
    const p = evt.payload?.payment?.entity;
    if (p?.order_id) {
      const [d] = await db.select().from(donations).where(eq(donations.razorpayOrderId, p.order_id)).limit(1);
      if (d && d.status === "created" && p.amount === d.amount * 100 && p.currency === "INR") {
        await markPaid(d.id, p.id);
      } else if (d && p.amount !== d.amount * 100) {
        console.error("Webhook amount mismatch", { donation: d.id, got: p.amount });
      }
    }
  }

  // 2. Refund Processed
  else if (eventName === "refund.processed" || eventName === "refund.created") {
    const paymentId = evt.payload?.refund?.entity?.payment_id;
    if (paymentId && eventName === "refund.processed") {
      await db
        .update(donations)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(and(eq(donations.razorpayPaymentId, paymentId), eq(donations.status, "paid")));
    }
  }

  // 3. Subscription Authenticated
  else if (eventName === "subscription.authenticated") {
    const rzSub = evt.payload?.subscription?.entity;
    if (rzSub?.id) {
      const nextChargeAt = rzSub.charge_at ? new Date(rzSub.charge_at * 1000) : null;
      await db
        .update(recurringSubscriptions)
        .set({
          status: "authenticated",
          mandateStatus: "active",
          ...(nextChargeAt ? { nextChargeAt } : {}),
          updatedAt: new Date(),
        })
        .where(eq(recurringSubscriptions.razorpaySubscriptionId, rzSub.id));
    }
  }

  // 4. Subscription Activated
  else if (eventName === "subscription.activated") {
    const rzSub = evt.payload?.subscription?.entity;
    if (rzSub?.id) {
      const nextChargeAt = rzSub.charge_at ? new Date(rzSub.charge_at * 1000) : null;
      await db
        .update(recurringSubscriptions)
        .set({
          status: "active",
          mandateStatus: "active",
          ...(nextChargeAt ? { nextChargeAt } : {}),
          updatedAt: new Date(),
        })
        .where(eq(recurringSubscriptions.razorpaySubscriptionId, rzSub.id));
    }
  }

  // 5. Subscription Charged (Monthly recurring deduction)
  else if (eventName === "subscription.charged") {
    const rzSub = evt.payload?.subscription?.entity;
    const rzPayment = evt.payload?.payment?.entity;

    if (rzSub?.id && rzPayment?.id) {
      const [sub] = await db
        .select()
        .from(recurringSubscriptions)
        .where(eq(recurringSubscriptions.razorpaySubscriptionId, rzSub.id))
        .limit(1);

      if (sub) {
        const nextChargeAt = rzSub.charge_at ? new Date(rzSub.charge_at * 1000) : null;
        await recordSubscriptionCharge({
          subscriptionDbId: sub.id,
          paymentId: rzPayment.id,
          amountPaise: rzPayment.amount,
          currentCycle: rzSub.current_count,
          nextChargeAt,
        });
      }
    }
  }

  // 6. Subscription Halted (Repeated payment failures)
  else if (eventName === "subscription.halted") {
    const rzSub = evt.payload?.subscription?.entity;
    if (rzSub?.id) {
      await db
        .update(recurringSubscriptions)
        .set({
          status: "halted",
          mandateStatus: "failed",
          updatedAt: new Date(),
        })
        .where(eq(recurringSubscriptions.razorpaySubscriptionId, rzSub.id));
    }
  }

  // 7. Subscription Cancelled
  else if (eventName === "subscription.cancelled") {
    const rzSub = evt.payload?.subscription?.entity;
    if (rzSub?.id) {
      await db
        .update(recurringSubscriptions)
        .set({
          status: "cancelled",
          mandateStatus: "cancelled",
          cancelledAt: new Date(),
          cancelReason: "Cancelled via Razorpay Gateway",
          updatedAt: new Date(),
        })
        .where(eq(recurringSubscriptions.razorpaySubscriptionId, rzSub.id));
    }
  }

  // 8. Payment Failed
  else if (eventName === "payment.failed") {
    const p = evt.payload?.payment?.entity;
    if (p?.id) {
      await db
        .insert(analyticsEvents)
        .values({
          event: "payment_failed_webhook",
          sessionId: "webhook",
          meta: {
            paymentId: p.id,
            orderId: p.order_id,
            errorCode: p.error_code,
            errorDescription: p.error_description,
          },
        })
        .catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, received: eventName });
}
