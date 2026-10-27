import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ensureDbSchema } from "@/db";
import { recurringSubscriptions } from "@/db/schema";
import {
  createRazorpayPlan,
  createRazorpaySubscription,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/payments";
import { clean, clientIp, isEmail, isPhone, normalizePhone, publicToken, rateLimit } from "@/lib/server-utils";
import { NAME_REGEX, PAN_REGEX } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MIN_MONTHLY = 50; // ₹50 min monthly pledge
const MAX_MONTHLY = 100_000; // ₹1,00,000 max monthly pledge

export async function POST(req: Request) {
  try {
    if (!rateLimit(`sub_crt:${clientIp(req)}`, 15, 10 * 60_000)) {
      return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
    }

    await ensureDbSchema();

    const b = await req.json().catch(() => null);
    if (!b) return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });

    // CAPTCHA / Bot Protection via Invisible Honeypot
    if (b.website_hp || b.hp_token) {
      return NextResponse.json({ error: "Spam submission blocked." }, { status: 400 });
    }


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
  const rawFreq = clean(b.frequency, 16).toLowerCase();
  const frequency = (["daily", "weekly", "monthly", "yearly"].includes(rawFreq) ? rawFreq : "monthly") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";

  const minAmount = frequency === "daily" ? 10 : frequency === "yearly" ? 500 : 50;
  const maxAmount = frequency === "yearly" ? 500_000 : 100_000;

  if (amount < minAmount || amount > maxAmount) {
    return NextResponse.json(
      { error: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} pledge must be between ₹${minAmount} and ₹${maxAmount.toLocaleString("en-IN")}.` },
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

  const isDaily = frequency === "daily";
  const cycleAmount = isDaily ? amount * 7 : amount;
  const totalCount = isDaily ? 52 : frequency === "weekly" ? 52 : frequency === "yearly" ? 10 : 60;
  const periodLabel = frequency.charAt(0).toUpperCase() + frequency.slice(1);
  const planName = isDaily
    ? `Janaseva Ashrama Daily Seva (₹${amount}/day · Billed ₹${cycleAmount}/wk)`
    : `Janaseva Ashrama ${periodLabel} Support (₹${amount})`;

  if (mode === "demo") {
    const [sub] = await db
      .insert(recurringSubscriptions)
      .values({
        publicId,
        mode: "demo",
        status: "active",
        mandateStatus: "active",
        amount: cycleAmount,
        frequency,
        donorName,
        donorEmail,
        donorPhone: donorPhone || null,
        donorPan,
        totalCycles: totalCount,
        idempotencyKey: key,
        meta: {
          demoSimulated: true,
          frequency,
          dailyAmount: isDaily ? amount : null,
          cycleAmount,
          createdAt: new Date().toISOString(),
        },
      })
      .returning();

    return NextResponse.json({
      mode: "demo",
      publicId: sub.publicId,
      amount: sub.amount,
      frequency: sub.frequency,
      status: "active",
    });
  }

  try {
    // 1. Create plan on Razorpay for this amount and frequency (weekly settlement for daily)
    const plan = await createRazorpayPlan(cycleAmount, isDaily ? "weekly" : frequency, planName);

    // 2. Create subscription mandate with appropriate cycles
    const rzSub = await createRazorpaySubscription({
      planId: plan.id,
      totalCount,
      customerNotify: 1,
      notes: {
        donor_email: donorEmail,
        donor_name: donorName,
        donor_phone: donorPhone || "",
        frequency,
        daily_amount: isDaily ? String(amount) : "",
        cycle_amount: String(cycleAmount),
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
        amount: cycleAmount,
        frequency,
        donorName,
        donorEmail,
        donorPhone: donorPhone || null,
        donorPan,
        razorpayPlanId: plan.id,
        razorpaySubscriptionId: rzSub.id,
        totalCycles: totalCount,
        idempotencyKey: key,
        meta: {
          razorpayPlanId: plan.id,
          razorpaySubscriptionId: rzSub.id,
          frequency,
          dailyAmount: isDaily ? amount : null,
          cycleAmount,
          totalCount,
        },
      })
      .returning();

    return NextResponse.json({
      mode: "razorpay",
      publicId: sub.publicId,
      amount: sub.amount,
      subscriptionId: rzSub.id,
      keyId: razorpayKeyId(),
      shortUrl: rzSub.short_url || null,
      status: "created",
    });

  } catch (err: any) {
    console.error("Razorpay subscription creation failed:", err);
    return NextResponse.json(
      { error: "Payment service is currently unavailable for recurring mandates. Please try again shortly." },
      { status: 502 },
    );
  }
} catch (outerErr: any) {
  console.error("Subscription route unexpected error:", outerErr);
  return NextResponse.json(
    { error: outerErr?.message || "Internal server error. Please try again." },
    { status: 500 },
  );
}
}

