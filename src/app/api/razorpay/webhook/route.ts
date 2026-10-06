import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";
import { markPaid, webhookSignatureValid } from "@/lib/payments";

/**
 * Razorpay webhook. Configure in the Razorpay dashboard:
 *   URL: https://<your-domain>/api/razorpay/webhook
 *   Events: payment.captured, refund.processed
 *   Secret: RAZORPAY_WEBHOOK_SECRET
 * Handlers are idempotent, so Razorpay retries are safe.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  if (!webhookSignatureValid(raw, sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let evt: {
    event?: string;
    payload?: {
      payment?: { entity?: { id: string; order_id?: string; amount: number; currency: string; status: string } };
      refund?: { entity?: { payment_id?: string } };
    };
  };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (evt.event === "payment.captured") {
    const p = evt.payload?.payment?.entity;
    if (p?.order_id) {
      const [d] = await db.select().from(donations).where(eq(donations.razorpayOrderId, p.order_id)).limit(1);
      if (d && d.status === "created" && p.amount === d.amount * 100 && p.currency === "INR") {
        await markPaid(d.id, p.id);
      } else if (d && p.amount !== d.amount * 100) {
        console.error("Webhook amount mismatch", { donation: d.id, got: p.amount });
      }
    }
  } else if (evt.event === "refund.processed" || evt.event === "refund.created") {
    const paymentId = evt.payload?.refund?.entity?.payment_id;
    if (paymentId && evt.event === "refund.processed") {
      await db
        .update(donations)
        .set({ status: "refunded", refundedAt: new Date() })
        .where(and(eq(donations.razorpayPaymentId, paymentId), eq(donations.status, "paid")));
    }
  }
  return NextResponse.json({ ok: true });
}
