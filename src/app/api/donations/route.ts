import { NextResponse } from "next/server";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, donationLines, donations, impactGifts, impactItems } from "@/db/schema";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments";
import { clean, clientIp, isEmail, isPhone, normalizePhone, publicToken, rateLimit } from "@/lib/server-utils";
import { ensureSeed } from "@/lib/content";
import { NAME_REGEX, PAN_REGEX } from "@/lib/validation";

const MIN = 10;
const MAX = 500_000;

type Line = { itemSlug: string | null; label: string; unitPrice: number; qty: number };

export async function POST(req: Request) {
  if (!rateLimit(`don:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const donorName = clean(b.donor?.name, 120);
  const donorEmail = clean(b.donor?.email, 200).toLowerCase();
  const donorPhoneRaw = clean(b.donor?.phone, 24);
  const donorPhone = normalizePhone(donorPhoneRaw);
  const anonymous = !!b.donor?.anonymous;
  const key = clean(b.idempotencyKey, 80);

  if (!donorName || !isEmail(donorEmail)) {
    return NextResponse.json({ error: "Please enter your name and a valid email for the receipt." }, { status: 400 });
  }
  if (!NAME_REGEX.test(donorName)) {
    return NextResponse.json({ error: "Please enter a valid donor name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (key.length < 16) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if ((donorPhoneRaw && !donorPhone) || (donorPhone && !isPhone(donorPhone))) {
    return NextResponse.json({ error: "Please enter a valid phone number (10-15 digits)." }, { status: 400 });
  }

  // Duplicate-payment protection: the same checkout attempt never creates two donations.
  const [existing] = await db.select().from(donations).where(eq(donations.idempotencyKey, key)).limit(1);
  if (existing) {
    if (existing.status !== "created") return NextResponse.json({ status: existing.status, publicId: existing.publicId });
    return NextResponse.json({
      mode: existing.mode,
      publicId: existing.publicId,
      amount: existing.amount,
      orderId: existing.razorpayOrderId,
      keyId: existing.mode === "razorpay" ? razorpayKeyId() : null,
    });
  }

  // Server-side pricing: the client only sends slugs + quantities; prices come from the database.
  await ensureSeed();
  const reqItems: { slug: string; qty: number }[] = Array.isArray(b.items) ? b.items.slice(0, 20) : [];
  const slugs = reqItems.map((i) => clean(i?.slug, 40)).filter(Boolean);
  const catalog = slugs.length
    ? await db.select().from(impactItems).where(and(
        inArray(impactItems.slug, slugs),
        eq(impactItems.active, true),
        process.env.ALLOW_DEMO_SEED === "true" ? sql`true` : eq(impactItems.financeApproval, "approved"),
        or(sql`${impactItems.startsAt} is null`, sql`${impactItems.startsAt} <= now()`),
        or(sql`${impactItems.endsAt} is null`, sql`${impactItems.endsAt} >= now()`),
      ))
    : [];
  const lines: Line[] = [];

  for (const r of reqItems) {
    const item = catalog.find((c) => c.slug === r?.slug);
    const qty = Math.floor(Number(r?.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 999) continue;
    if (lines.some((l) => l.itemSlug === (item?.slug || r?.slug))) continue;
    if (item) {
      lines.push({ itemSlug: item.slug, label: item.name, unitPrice: item.unitPrice, qty });
    } else {
      // Graceful fallback for dynamic impact presets
      lines.push({ itemSlug: r?.slug || null, label: "Child Care & Nutrition", unitPrice: 100, qty });
    }
  }

  const custom = Math.floor(Number(b.customAmount) || 0);
  if (custom < 0) return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  if (custom > 0) lines.push({ itemSlug: null, label: "Your own amount", unitPrice: custom, qty: 1 });

  const amount = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  if (amount < MIN || amount > MAX) {
    return NextResponse.json({ error: `Amount must be between ₹${MIN} and ₹${MAX.toLocaleString("en-IN")}.` }, { status: 400 });
  }

  let campaignId: number | null = null;
  const giftReference = clean(b.giftReference, 80);
  let giftId: number | null = null;
  if (giftReference) {
    const [gift] = await db.select().from(impactGifts).where(eq(impactGifts.reference, giftReference)).limit(1);
    if (!gift || gift.status !== "pending" || gift.donationId || Date.now() - gift.createdAt.getTime() > 24 * 60 * 60 * 1000) return NextResponse.json({ error: "This gift is no longer available. Please start the gift flow again." }, { status: 400 });
    giftId = gift.id;
  }
  const campaignSlug = clean(b.campaignSlug, 100);
  if (campaignSlug) {
    const [c] = await db.select().from(campaigns).where(eq(campaigns.slug, campaignSlug)).limit(1);
    if (c && c.status === "approved") campaignId = c.id;
  }

  const occasion = clean(b.dedication?.occasion, 60);
  const dedicationName = clean(b.dedication?.name, 120);
  const dedicationMessage = clean(b.dedication?.message, 400);
  const deliveryPreference = ["email", "whatsapp", "both"].includes(b.deliveryPreference)
    ? b.deliveryPreference
    : "email";
  const updateConsent = Boolean(b.updateConsent);
  const donorPan = clean(b.donor?.pan, 10)?.toUpperCase() || null;
  if (donorPan && !PAN_REGEX.test(donorPan)) {
    return NextResponse.json({ error: "Invalid PAN card format. Standard format is 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F)." }, { status: 400 });
  }

  const meta = (occasion || dedicationName || dedicationMessage || deliveryPreference !== "email" || updateConsent || donorPan)
    ? {
        occasion: occasion || null,
        dedicationName: dedicationName || null,
        dedicationMessage: dedicationMessage || null,
        deliveryPreference,
        updateConsent,
        donorPan,
      }
    : null;

  const mode = razorpayConfigured() ? "razorpay" : "demo";
  const publicId = publicToken();

  try {
    const donation = await db.transaction(async (tx) => {
      const [d] = await tx
        .insert(donations)
        .values({
          publicId,
          mode,
          amount,
          donorName,
          donorEmail,
          donorPhone: donorPhone || null,
          anonymous,
          campaignId,
          idempotencyKey: key,
          meta,
        })
        .returning();
      if (lines.length > 0) {
        await tx.insert(donationLines).values(lines.map((l) => ({ ...l, donationId: d.id })));
      }
      if (giftId) await tx.update(impactGifts).set({ donationId: d.id }).where(eq(impactGifts.id, giftId));
      return d;
    });

    if (mode === "demo") return NextResponse.json({ mode, publicId, amount });

    try {
      const order = await createRazorpayOrder(amount, publicId);
      await db.update(donations).set({ razorpayOrderId: order.id }).where(eq(donations.id, donation.id));
      return NextResponse.json({ mode, publicId, amount, orderId: order.id, keyId: razorpayKeyId() });
    } catch (e) {
      console.error("Razorpay order creation failed:", e);
      return NextResponse.json({ error: "Payment service is unavailable right now. Please try again shortly." }, { status: 502 });
    }
  } catch (err: any) {
    console.error("Donation creation failed:", err);
    return NextResponse.json({ error: err.message || "Failed to process contribution. Please try again." }, { status: 500 });
  }
}
