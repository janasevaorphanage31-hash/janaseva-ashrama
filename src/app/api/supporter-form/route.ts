import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { donationLines, donations } from "@/db/schema";
import { createRazorpayOrder, razorpayConfigured, razorpayKeyId } from "@/lib/payments";
import { clean, clientIp, isEmail, isPhone, normalizePhone, publicToken, rateLimit } from "@/lib/server-utils";
import { SUPPORTER_CATEGORIES } from "@/lib/supporter-form";
import { numberToIndianWords } from "@/lib/number-words";
import { NAME_REGEX, PAN_REGEX } from "@/lib/validation";

const MIN = 10;
const MAX = 500_000;

export async function POST(req: Request) {
  if (!rateLimit(`sup_form:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });

  const donorName = clean(b.donor?.name, 120);
  const donorEmail = clean(b.donor?.email, 200).toLowerCase();
  const donorPhoneRaw = clean(b.donor?.phone, 24);
  const donorPhone = normalizePhone(donorPhoneRaw);
  const donorDob = clean(b.donor?.dob, 30);
  const donorAddress = clean(b.donor?.address, 300);
  const donorPan = clean(b.donor?.pan, 10)?.toUpperCase() || null;
  const collectionMode = ["online", "bank_transfer", "residence", "office", "ashrama"].includes(b.collectionMode)
    ? b.collectionMode
    : "online";
  const refSign = clean(b.refSign, 100);
  const notes = clean(b.notes, 400);
  const key = clean(b.idempotencyKey, 80);

  if (!donorName) {
    return NextResponse.json({ error: "Please enter your full name as shown on your ID/record." }, { status: 400 });
  }
  if (!NAME_REGEX.test(donorName)) {
    return NextResponse.json({ error: "Please enter a valid donor name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (!donorPhone || !isPhone(donorPhone)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
  }
  if (donorEmail && !isEmail(donorEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address for your digital 80G tax receipt." }, { status: 400 });
  }
  if (donorPan && !PAN_REGEX.test(donorPan)) {
    return NextResponse.json({ error: "Invalid PAN card format (e.g. ABCDE1234F). Leave blank if not claiming 80G tax benefit." }, { status: 400 });
  }
  if (key.length < 16) {
    return NextResponse.json({ error: "Invalid session key." }, { status: 400 });
  }

  // Calculate items and total amount based on official SUPPORTER_CATEGORIES
  const selectedTiers: { categoryId: string; optionId: string }[] = Array.isArray(b.selectedTiers)
    ? b.selectedTiers.slice(0, 10)
    : [];

  const lines: { itemSlug: string | null; label: string; unitPrice: number; qty: number }[] = [];

  for (const sel of selectedTiers) {
    const cat = SUPPORTER_CATEGORIES.find((c) => c.id === sel.categoryId);
    if (!cat) continue;
    const opt = cat.options.find((o) => o.id === sel.optionId);
    if (!opt) continue;

    lines.push({
      itemSlug: `supporter-${cat.id}-${opt.id}`,
      label: `${cat.index}) ${cat.title}: ${opt.label} (${opt.subLabel || ""})`,
      unitPrice: opt.amount,
      qty: 1,
    });
  }

  const custom = Math.floor(Number(b.customAmount) || 0);
  if (custom > 0) {
    lines.push({
      itemSlug: "supporter-custom",
      label: "Custom Supporter Contribution",
      unitPrice: custom,
      qty: 1,
    });
  }

  const amount = lines.reduce((acc, l) => acc + l.unitPrice * l.qty, 0);
  if (amount < MIN || amount > MAX) {
    return NextResponse.json({
      error: `Please select at least one support option or enter an amount between ₹${MIN} and ₹${MAX.toLocaleString("en-IN")}.`,
    }, { status: 400 });
  }

  const amountInWords = numberToIndianWords(amount);

  // Check duplicate idempotency
  const [existing] = await db.select().from(donations).where(eq(donations.idempotencyKey, key)).limit(1);
  if (existing) {
    return NextResponse.json({
      status: existing.status,
      publicId: existing.publicId,
      amount: existing.amount,
      orderId: existing.razorpayOrderId,
      keyId: existing.mode === "razorpay" ? razorpayKeyId() : null,
      mode: existing.mode,
    });
  }

  const isOnlinePayment = collectionMode === "online";
  const initialStatus = isOnlinePayment ? "created" : "pledged";
  const donationMode = isOnlinePayment
    ? (razorpayConfigured() ? "razorpay" : "demo")
    : collectionMode;

  const publicId = publicToken();
  const pledgeReference = `JSA-SUP-${new Date().getFullYear()}-${publicToken().slice(0, 6).toUpperCase()}`;

  const meta = {
    formType: "OFFICIAL_SUPPORTER_FORM",
    kendraName: "MAKKALA ASHRAYA KENDRA",
    donorDob: donorDob || null,
    donorAddress: donorAddress || null,
    donorPan: donorPan || null,
    collectionMode,
    refSign: refSign || null,
    notes: notes || null,
    amountInWords,
    pledgeReference,
    submittedAt: new Date().toISOString(),
  };

  const donation = await db.transaction(async (tx) => {
    const [d] = await tx
      .insert(donations)
      .values({
        publicId,
        receiptNo: isOnlinePayment ? null : pledgeReference,
        status: initialStatus,
        mode: donationMode,
        amount,
        donorName,
        donorEmail: donorEmail || "donor@janasevaashrama.org",
        donorPhone: donorPhone,
        anonymous: false,
        idempotencyKey: key,
        meta,
      })
      .returning();

    await tx.insert(donationLines).values(lines.map((l) => ({ ...l, donationId: d.id })));
    return d;
  });

  // Offline / Bank Transfer / Collection flow
  if (!isOnlinePayment) {
    return NextResponse.json({
      ok: true,
      status: "pledged",
      publicId,
      amount,
      amountInWords,
      referenceNo: pledgeReference,
      collectionMode,
      donorName,
      donorPhone,
    });
  }

  // Demo gateway mode
  if (donationMode === "demo") {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      publicId,
      amount,
      amountInWords,
      donorName,
    });
  }

  // Razorpay online gateway order
  try {
    const order = await createRazorpayOrder(amount, publicId);
    await db.update(donations).set({ razorpayOrderId: order.id }).where(eq(donations.id, donation.id));
    return NextResponse.json({
      ok: true,
      mode: "razorpay",
      publicId,
      amount,
      amountInWords,
      orderId: order.id,
      keyId: razorpayKeyId(),
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    return NextResponse.json({
      error: "Unable to connect to payment gateway right now. You can choose Direct Bank Transfer or Cash Collection to proceed.",
    }, { status: 502 });
  }
}
