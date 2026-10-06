import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations } from "@/db/schema";
import {
  captureRazorpayPayment,
  checkoutSignatureValid,
  fetchRazorpayPayment,
  markPaid,
  razorpayConfigured,
} from "@/lib/payments";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

/** Server-side verification: signature + payment status + amount + order match, then one-time state change. */
export async function POST(req: Request) {
  if (!rateLimit(`ver:${clientIp(req)}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  if (!razorpayConfigured()) return NextResponse.json({ error: "Payments are not configured." }, { status: 400 });

  const b = await req.json().catch(() => null);
  const publicId = clean(b?.publicId, 64);
  const orderId = clean(b?.razorpay_order_id, 64);
  const paymentId = clean(b?.razorpay_payment_id, 64);
  const signature = clean(b?.razorpay_signature, 128);
  if (!publicId || !orderId || !paymentId || !signature) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const [d] = await db.select().from(donations).where(eq(donations.publicId, publicId)).limit(1);
  if (!d || d.razorpayOrderId !== orderId) return NextResponse.json({ error: "Donation not found." }, { status: 404 });
  if (d.status === "paid") return NextResponse.json({ ok: true, publicId });

  if (!checkoutSignatureValid(orderId, paymentId, signature)) {
    return NextResponse.json({ error: "Payment signature could not be verified." }, { status: 400 });
  }

  try {
    let p = await fetchRazorpayPayment(paymentId);
    if (p.order_id !== orderId || p.amount !== d.amount * 100 || p.currency !== "INR") {
      return NextResponse.json({ error: "Payment details do not match this donation." }, { status: 400 });
    }
    if (p.status === "authorized") p = await captureRazorpayPayment(paymentId, d.amount * 100);
    if (p.status !== "captured") {
      return NextResponse.json({ error: "Payment is not completed yet. If money was debited, it will be confirmed automatically." }, { status: 409 });
    }
    await markPaid(d.id, paymentId);
    return NextResponse.json({ ok: true, publicId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "We could not confirm the payment yet. If money was debited, your receipt will be issued automatically." }, { status: 502 });
  }
}
