import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { analyticsEvents, donations, impactGifts, recurringSubscriptions } from "@/db/schema";

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

/**
 * Validates the Razorpay Subscriptions authorization signature.
 * In Razorpay Subscriptions, the checkout callback returns:
 * HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
 */
export function subscriptionSignatureValid(paymentId: string, subscriptionId: string, signature: string) {
  const expected = createHmac("sha256", secret()).update(`${paymentId}|${subscriptionId}`).digest("hex");
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

/**
 * Creates or registers a recurring monthly plan on Razorpay.
 */
export const createRazorpayPlan = (amountInr: number, name?: string) =>
  rz<{ id: string; period: string; interval: number }>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: name || `Janaseva Ashrama Monthly Support (₹${amountInr})`,
        amount: amountInr * 100,
        currency: "INR",
        description: "Monthly sponsorship for 25 boys residing at Janaseva Ashrama",
      },
    }),
  });

export type RzSubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_count: number;
  total_count: number;
  charge_at?: number;
  start_at?: number;
  end_at?: number;
};

/**
 * Creates a monthly recurring subscription mandate on Razorpay.
 */
export const createRazorpaySubscription = (params: {
  planId: string;
  totalCount?: number;
  customerNotify?: number;
  notes?: Record<string, string>;
  startAt?: number;
}) =>
  rz<RzSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: params.planId,
      total_count: params.totalCount || 60, // 5 years monthly default
      quantity: 1,
      customer_notify: params.customerNotify ?? 1,
      notes: params.notes || {},
      ...(params.startAt ? { start_at: params.startAt } : {}),
    }),
  });

export const fetchRazorpaySubscription = (id: string) =>
  rz<RzSubscription>(`/subscriptions/${encodeURIComponent(id)}`);

export const cancelRazorpaySubscription = (id: string, cancelAtCycleEnd = false) =>
  rz<RzSubscription>(`/subscriptions/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    body: JSON.stringify({ cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0 }),
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

/**
 * Idempotently records a recurring charge into the donations table.
 * Each monthly debit creates an individual 80G tax receipt for the donor.
 */
export async function recordSubscriptionCharge(params: {
  subscriptionDbId: number;
  paymentId: string;
  amountPaise?: number;
  currentCycle?: number;
  nextChargeAt?: Date | null;
}) {
  const { subscriptionDbId, paymentId, amountPaise, currentCycle, nextChargeAt } = params;

  // 1. Idempotency check: see if this payment ID was already recorded
  const [existingDonation] = await db
    .select()
    .from(donations)
    .where(eq(donations.razorpayPaymentId, paymentId))
    .limit(1);

  if (existingDonation) {
    return { donation: existingDonation, alreadyRecorded: true };
  }

  // 2. Fetch subscription
  const [sub] = await db
    .select()
    .from(recurringSubscriptions)
    .where(eq(recurringSubscriptions.id, subscriptionDbId))
    .limit(1);

  if (!sub) {
    throw new Error(`Subscription with DB ID ${subscriptionDbId} not found`);
  }

  const cycle = currentCycle || (sub.chargeCount + 1);
  const chargedAmountInr = amountPaise ? Math.round(amountPaise / 100) : sub.amount;
  const chargeIdempotencyKey = `sub_charge_${paymentId}`;

  // 3. Atomically record donation and update subscription counters
  const result = await db.transaction(async (tx) => {
    const [insertedDonation] = await tx
      .insert(donations)
      .values({
        publicId: "rec_" + randomUUID().replace(/-/g, "").slice(0, 20),
        status: "paid",
        mode: sub.mode,
        amount: chargedAmountInr,
        donorName: sub.donorName,
        donorEmail: sub.donorEmail,
        donorPhone: sub.donorPhone,
        anonymous: false,
        subscriptionId: sub.id,
        recurringCycle: cycle,
        razorpayPaymentId: paymentId,
        idempotencyKey: chargeIdempotencyKey,
        paidAt: new Date(),
        meta: {
          recurring: true,
          frequency: sub.frequency,
          cycleNumber: cycle,
          donorPan: sub.donorPan,
          subscriptionPublicId: sub.publicId,
        },
      })
      .returning();

    // Assign standard 80G receipt number: JSA/YY-YY/000xxx
    const [finalDonation] = await tx
      .update(donations)
      .set({
        receiptNo: sql`${"JSA/" + financialYear() + "/"} || lpad(${insertedDonation.id}::text, 6, '0')`,
      })
      .where(eq(donations.id, insertedDonation.id))
      .returning();

    // Update subscription
    await tx
      .update(recurringSubscriptions)
      .set({
        status: "active",
        mandateStatus: "active",
        chargeCount: sql`${recurringSubscriptions.chargeCount} + 1`,
        currentCycle: cycle,
        lastPaymentId: paymentId,
        lastPaymentAt: new Date(),
        ...(nextChargeAt ? { nextChargeAt } : {}),
        updatedAt: new Date(),
      })
      .where(eq(recurringSubscriptions.id, sub.id));

    await tx
      .insert(analyticsEvents)
      .values({
        event: "subscription_charged",
        sessionId: "server",
        meta: {
          subscriptionId: sub.id,
          donationId: finalDonation.id,
          cycle,
          amount: chargedAmountInr,
        },
      })
      .catch(() => {});

    return finalDonation;
  });

  return { donation: result, alreadyRecorded: false };
}

