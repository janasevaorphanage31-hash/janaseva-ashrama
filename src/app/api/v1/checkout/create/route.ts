import { NextResponse } from "next/server";
import { clean, cleanRazorpayNote, normalizePhone, isEmail, isPhone } from "@/lib/server-utils";

const MAX_DONATION_AMOUNT = 1000000; // ₹10,00,000 maximum per single transaction

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    // 1. CAPTCHA / Bot Protection via Invisible Honeypot
    // Automated spambots automatically fill all form inputs including hidden ones
    if (body.website_hp || body.hp_token) {
      return NextResponse.json(
        { error: "Automated submission blocked by spam protection." },
        { status: 400 },
      );
    }

    // 2. Never Trust the Frontend: Server-side Amount Validation
    const amount = Number(body.amount);
    if (!amount || isNaN(amount) || amount < 10) {
      return NextResponse.json(
        { error: "Invalid donation amount (minimum contribution is ₹10)." },
        { status: 400 },
      );
    }

    if (amount > MAX_DONATION_AMOUNT) {
      return NextResponse.json(
        { error: `Single online contributions are capped at ₹${MAX_DONATION_AMOUNT.toLocaleString("en-IN")}. For larger institutional contributions, please contact the Trust directly.` },
        { status: 400 },
      );
    }

    // 3. Sanitize User Input
    const donorName = clean(body.donorName, 80).replace(/[<>{}[\]\\]/g, "");
    const donorPhone = normalizePhone(clean(body.donorPhone, 20));
    const donorEmail = clean(body.donorEmail, 100).toLowerCase();
    const rawRef = clean(body.callerRefId || "DIRECT", 16).toUpperCase();
    const callerRefId = /^[A-Z0-9_-]+$/.test(rawRef) ? rawRef : "DIRECT";
    const leadId = body.leadId ? Number(body.leadId) : null;
    const occasion = clean(body.occasion, 50);
    const prayerNote = clean(body.prayerNote, 250);
    const donorPan = clean(body.donorPan, 10)?.toUpperCase() || "";

    if (!donorName || donorName.length < 2) {
      return NextResponse.json(
        { error: "Donor name must be at least 2 characters long." },
        { status: 400 },
      );
    }

    if (!donorPhone || !isPhone(donorPhone)) {
      return NextResponse.json(
        { error: "A valid 10-digit WhatsApp/mobile number is required to issue your 80G tax receipt." },
        { status: 400 },
      );
    }

    if (donorEmail && !isEmail(donorEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address or leave it blank." },
        { status: 400 },
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 4. Live Gateway Execution
    if (keyId && keySecret) {
      // Build safe notes: strip emojis / 4-byte UTF-8 which Razorpay API strictly rejects
      const safeNotes: Record<string, string> = {};
      if (callerRefId) safeNotes.caller_ref_id = cleanRazorpayNote(callerRefId, 30);
      if (leadId) safeNotes.lead_id = String(leadId);
      if (donorName) safeNotes.donor_name = cleanRazorpayNote(donorName, 50);
      if (donorPhone) safeNotes.donor_phone = cleanRazorpayNote(donorPhone, 15);
      if (donorEmail) safeNotes.donor_email = cleanRazorpayNote(donorEmail, 60);
      if (donorPan) safeNotes.donor_pan = cleanRazorpayNote(donorPan, 10);
      if (occasion) safeNotes.occasion = cleanRazorpayNote(occasion, 50);
      if (prayerNote) safeNotes.prayer_note = cleanRazorpayNote(prayerNote, 120);
      safeNotes.platform = "antigravity_crm";

      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // in paise
          currency: "INR",
          receipt: `ag_rcpt_${Date.now()}`,
          notes: safeNotes,
        }),
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        throw new Error(`Payment gateway order initiation failed: ${orderRes.status} ${errText}`);
      }

      const order = await orderRes.json();

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        callerRefId,
        mode: "live",
      });
    }

    // 5. Debug Mode Off in Production Check
    const isProduction = process.env.NODE_ENV === "production";
    const allowDemo = process.env.ALLOW_DEMO_SEED === "true";

    if (isProduction && !allowDemo) {
      return NextResponse.json(
        { error: "The online payment gateway is currently unavailable. Please contact the Trust directly or try again later." },
        { status: 503 },
      );
    }

    // Demo / Sandbox mode fallback for local staging & development only
    const demoOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      success: true,
      orderId: demoOrderId,
      amount: Math.round(amount * 100),
      currency: "INR",
      keyId: "rzp_test_demokey12345",
      callerRefId,
      mode: "demo",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
