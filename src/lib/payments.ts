import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, donations, impactGifts } from "@/db/schema";

const API = "https://api.razorpay.com/v1";

export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "";
const secret = () => process.env.RAZORPAY_KEY_SECRET || "";
export const razorpayConfigured = () => !!(razorpayKeyId() && secret());

const authHeader = () => "Basic " + Buffer.from(`${razorpayKeyId()}:${secret()}`).toString("base64");

export function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkoutSignatureValid(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", secret()).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

export function webhookSignatureValid(rawBody: string, signature: string) {
  const whSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
  if (!whSecret || !signature) return false;
  const expected = createHmac("sha256", whSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

async function rz<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export const createRazorpayOrder = (amountInr: number, receipt: string) =>
  rz<{ id: string; amount: number }>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: amountInr * 100, currency: "INR", receipt, notes: { receipt } }),
  });

export type RzPayment = { id: string; order_id: string; amount: number; currency: string; status: string };
export const fetchRazorpayPayment = (id: string) => rz<RzPayment>(`/payments/${encodeURIComponent(id)}`);
export const captureRazorpayPayment = (id: string, amountPaise: number) =>
  rz<RzPayment>(`/payments/${encodeURIComponent(id)}/capture`, {
    method: "POST",
    body: JSON.stringify({ amount: amountPaise, currency: "INR" }),
  });

function financialYear(d = new Date()) {
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

/**
 * Atomically moves a donation created → paid exactly once (duplicate-payment protection).
 * Returns true only for the call that performed the transition.
 */
export async function markPaid(donationId: number, paymentId: string): Promise<boolean> {
  try {
    const rows = await db
      .update(donations)
      .set({
        status: "paid",
        paidAt: new Date(),
        razorpayPaymentId: paymentId,
        receiptNo: sql`${"JSA/" + financialYear() + "/"} || lpad(${donations.id}::text, 6, '0')`,
      })
      .where(and(eq(donations.id, donationId), eq(donations.status, "created")))
      .returning({ id: donations.id });
    if (rows.length > 0) {
      await db.update(impactGifts).set({ status: "ready" }).where(eq(impactGifts.donationId, donationId)).catch(() => {});
      await db.insert(analyticsEvents).values({ event: "verified_donation", sessionId: "server", meta: { donationId: donationId } }).catch(() => {});
      return true;
    }
    return false;
  } catch (e) {
    // unique violation on razorpay_payment_id → this payment was already applied elsewhere
    console.error("markPaid conflict", e);
    return false;
  }
}

export async function markDemoPaid(donationId: number): Promise<boolean> {
  const rows = await db
    .update(donations)
    .set({
      status: "demo",
      paidAt: new Date(),
      receiptNo: sql`'DEMO-' || lpad(${donations.id}::text, 6, '0')`,
    })
    .where(and(eq(donations.id, donationId), eq(donations.status, "created"), eq(donations.mode, "demo")))
    .returning({ id: donations.id });
  return rows.length > 0;
}
