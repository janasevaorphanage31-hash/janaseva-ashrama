import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { recurringSubscriptions } from "@/db/schema";
import {
  createRazorpayPlan,
  createRazorpaySubscription,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/payments";
import { clean, clientIp, isEmail, isPhone, normalizePhone, publicToken, rateLimit } from "@/lib/server-utils";
import { NAME_REGEX, PAN_REGEX } from "@/lib/validation";

const MIN_MONTHLY = 50; // ₹50 min monthly pledge
const MAX_MONTHLY = 100_000; // ₹1,00,000 max monthly pledge

export async function POST(req: Request) {
  if (!rateLimit(`sub_crt:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

  const donorName = clean(b.donor?.name, 120);
  const donorEmail = clean(b.donor?.email, 200).toLowerCase();
  const donorPhoneRaw = clean(b.donor?.phone, 24);
  const donorPhone = normalizePhone(donorPhoneRaw);
  const donorPan = clean(b.donor?.pan, 10)?.toUpperCase() || null;
  const key = clean(b.idempotencyKey, 80);
  const amount = Math.floor(Number(b.amount) || 0);

  if (!donorName || !isEmail(donorEmail)) {
    return NextResponse.json({ error: "Please enter your name and a valid email address." }, { status: 400 });
  }
  if (!NAME_REGEX.test(donorName)) {
    return NextResponse.json({ error: "Please enter a valid donor name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (key.length < 16) {
    return NextResponse.json({ error: "Missing or invalid idempotency key." }, { status: 400 });
  }
  if ((donorPhoneRaw && !donorPhone) || (donorPhone && !isPhone(donorPhone))) {
    return NextResponse.json({ error: "Please enter a valid phone number (10-15 digits)." }, { status: 400 });
  }
  if (donorPan && !PAN_REGEX.test(donorPan)) {
    return NextResponse.json({ error: "Invalid PAN card format (e.g. ABCDE1234F)." }, { status: 400 });
  }
  if (amount < MIN_MONTHLY || amount > MAX_MONTHLY) {
    return NextResponse.json(
      { error: `Monthly pledge must be between ₹${MIN_MONTHLY} and ₹${MAX_MONTHLY.toLocaleString("en-IN")}.` },
      { status: 400 },
    );
  }

  // Idempotency: return existing subscription if already created with this idempotency key
  const [existing] = await db
    .select()
    .from(recurringSubscriptions)
    .where(eq(recurringSubscriptions.idempotencyKey, key))
    .limit(1);

  if (existing) {
    return NextResponse.json({
      mode: existing.mode,
      publicId: existing.publicId,
      amount: existing.amount,
      subscriptionId: existing.razorpaySubscriptionId,
      keyId: existing.mode === "razorpay" ? razorpayKeyId() : null,
      status: existing.status,
    });
  }

  const mode = razorpayConfigured() ? "razorpay" : "demo";
  const publicId = "sub_" + publicToken();

  if (mode === "demo") {
    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        publicId,
        mode: "demo",
        status: "active",
        mandateStatus: "active",
        amount,
        donorName,
        donorEmail,
        donorPhone: donorPhone || null,
        donorPan,
        idempotencyKey: key,
        meta: { demoSimulated: true, createdAt: new Date().toISOString() },
      })
      .returning();

    return NextResponse.json({
      mode: "demo",
      publicId: sub.publicId,
      amount: sub.amount,
      status: "active",
    });
  }

  try {
    // 1. Create monthly plan on Razorpay for this amount
    const plan = await createRazorpayPlan(amount, `Janaseva Ashrama Monthly Support (₹${amount})`);

    // 2. Create subscription mandate with 60 cycles (5 years) default
    const rzSub = await createRazorpaySubscription({
      planId: plan.id,
      totalCount: 60,
      customerNotify: 1,
      notes: {
        donor_email: donorEmail,
        donor_name: donorName,
        donor_phone: donorPhone || "",
        public_id: publicId,
      },
    });

    // 3. Save subscription in database
    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        publicId,
        mode: "razorpay",
        status: "created",
        mandateStatus: "pending",
        amount,
        donorName,
        donorEmail,
        donorPhone: donorPhone || null,
        donorPan,
        razorpayPlanId: plan.id,
        razorpaySubscriptionId: rzSub.id,
        idempotencyKey: key,
        meta: {
          razorpayPlanId: plan.id,
          razorpaySubscriptionId: rzSub.id,
          totalCount: 60,
        },
      })
      .returning();

    return NextResponse.json({
      mode: "razorpay",
      publicId: sub.publicId,
      amount: sub.amount,
      subscriptionId: rzSub.id,
      keyId: razorpayKeyId(),
      status: "created",
    });
  } catch (err: any) {
    console.error("Razorpay subscription creation failed:", err);
    return NextResponse.json(
      { error: "Payment service is currently unavailable for recurring mandates. Please try again shortly." },
      { status: 502 },
    );
  }
}
