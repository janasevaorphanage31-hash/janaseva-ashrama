import { NextResponse } from "next/server";
import { db, ensureDbSchema } from "@/db";
import { recurringSubscriptions } from "@/db/schema";
import { createRazorpayPlan, createRazorpaySubscription } from "@/lib/payments";
import { clean, cleanRazorpayNote, normalizePhone, isEmail, isPhone, publicToken } from "@/lib/server-utils";

const MAX_DONATION_AMOUNT = 1000000; // ₹10,00,000 maximum per single transaction

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    // 1. CAPTCHA / Bot Protection via Invisible Honeypot
    if (body.website_hp || body.hp_token) {
      return NextResponse.json(
        { error: "Automated submission blocked by spam protection." },
        { status: 400 },
      );
    }

    // 2. Frequency handling (One-time vs Recurring: daily, weekly, monthly, yearly)
    const rawFreq = clean(body.frequency, 16).toLowerCase();
    const isRecurring = ["daily", "weekly", "monthly", "yearly"].includes(rawFreq);
    const frequency = isRecurring ? (rawFreq as "daily" | "weekly" | "monthly" | "yearly") : "onetime";

    // 3. Amount Validation
    const amount = Number(body.amount);
    const minAmount = frequency === "daily" ? 10 : frequency === "yearly" ? 500 : 10;
    if (!amount || isNaN(amount) || amount < minAmount) {
      return NextResponse.json(
        { error: `Invalid donation amount (minimum contribution is ₹${minAmount}).` },
        { status: 400 },
      );
    }

    if (amount > MAX_DONATION_AMOUNT) {
      return NextResponse.json(
        { error: `Single online contributions are capped at ₹${MAX_DONATION_AMOUNT.toLocaleString("en-IN")}. For larger institutional contributions, please contact the Trust directly.` },
        { status: 400 },
      );
    }

    // 4. Sanitize User Input with generous fallbacks for quick donations
    const rawDonorName = clean(body.donorName, 80).replace(/[<>{}[\]\\]/g, "");
    const donorName = rawDonorName && rawDonorName.length >= 2 ? rawDonorName : "Janaseva Supporter";
    const rawDonorPhone = normalizePhone(clean(body.donorPhone, 20));
    const donorPhone = rawDonorPhone && isPhone(rawDonorPhone) ? rawDonorPhone : "9980359595";
    const donorEmail = clean(body.donorEmail, 100).toLowerCase();
    const rawRef = clean(body.callerRefId || "DIRECT", 16).toUpperCase();
    const callerRefId = /^[A-Z0-9_-]+$/.test(rawRef) ? rawRef : "DIRECT";
    const leadId = body.leadId ? Number(body.leadId) : null;
    const occasion = clean(body.occasion, 50);
    const prayerNote = clean(body.prayerNote, 250);
    const donorPan = clean(body.donorPan, 10)?.toUpperCase() || "";

    // Paid Ads Attribution (Meta Ads & Google Ads)
    const utmSource = clean(body.utmSource || body.utm_source, 40);
    const utmMedium = clean(body.utmMedium || body.utm_medium, 40);
    const utmCampaign = clean(body.utmCampaign || body.utm_campaign, 50);
    const gclid = clean(body.gclid, 60);
    const fbclid = clean(body.fbclid, 60);

    if (donorEmail && !isEmail(donorEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address or leave it blank." },
        { status: 400 },
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

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
    if (utmSource) safeNotes.utm_source = cleanRazorpayNote(utmSource, 40);
    if (utmMedium) safeNotes.utm_medium = cleanRazorpayNote(utmMedium, 40);
    if (utmCampaign) safeNotes.utm_campaign = cleanRazorpayNote(utmCampaign, 50);
    if (gclid) safeNotes.gclid = cleanRazorpayNote(gclid, 60);
    if (fbclid) safeNotes.fbclid = cleanRazorpayNote(fbclid, 60);
    safeNotes.frequency = frequency;
    safeNotes.platform = "antigravity_crm";

    // 5. Live Gateway Execution
    if (keyId && keySecret) {
      if (isRecurring) {
        // --- RECURRING AUTOPAY (UPI Autopay / e-mandate) ---
        await ensureDbSchema().catch(() => {});
        const period = frequency as "daily" | "weekly" | "monthly" | "yearly";
        // Under RBI/NPCI e-mandate rules, minimum automated debit interval is 7 days.
        // For Daily Punya (₹11/day, ₹21/day), cycle amount is amount * 7 debited weekly.
        const isDaily = period === "daily";
        const cycleAmount = isDaily ? amount * 7 : amount;
        const totalCount = isDaily ? 52 : period === "weekly" ? 52 : period === "yearly" ? 10 : 60;
        const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
        const planName = isDaily
          ? `Janaseva Ashrama Daily Seva (₹${amount}/day · Billed ₹${cycleAmount}/wk)`
          : `Janaseva Ashrama ${periodLabel} Support (₹${amount})`;

        // 1. Create or get recurring plan on Razorpay
        const plan = await createRazorpayPlan(
          cycleAmount,
          isDaily ? "weekly" : period,
          planName
        );

        const subPublicId = "sub_" + publicToken();

        // 2. Create subscription mandate
        const rzSub = await createRazorpaySubscription({
          planId: plan.id,
          totalCount,
          customerNotify: 1,
          notes: {
            ...safeNotes,
            daily_amount: isDaily ? String(amount) : "",
            cycle_amount: String(cycleAmount),
            donor_email: donorEmail || "",
            donor_name: donorName,
            donor_phone: donorPhone || "",
            public_id: subPublicId,
          },
        });

        // 3. Store in Postgres DB
        await db.insert(recurringSubscriptions).values({
          publicId: subPublicId,
          mode: "razorpay",
          status: "created",
          mandateStatus: "pending",
          amount: cycleAmount,
          frequency: period,
          donorName,
          donorEmail: donorEmail || "donor@janasevaashrama.org",
          donorPhone: donorPhone || null,
          donorPan: donorPan || null,
          razorpayPlanId: plan.id,
          razorpaySubscriptionId: rzSub.id,
          totalCycles: totalCount,
          idempotencyKey: `sub_chk_${Date.now()}_${publicToken()}`,
          meta: {
            ...safeNotes,
            dailyAmount: isDaily ? amount : null,
            cycleAmount,
            razorpayPlanId: plan.id,
            razorpaySubscriptionId: rzSub.id,
            frequency: period,
            totalCount,
          },
        });

        return NextResponse.json({
          success: true,
          subscriptionId: rzSub.id,
          amount: Math.round(cycleAmount * 100),
          currency: "INR",
          frequency: period,
          keyId,
          callerRefId,
          mode: "live",
        });
      } else {
        // --- ONE-TIME ORDER ---
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
          frequency: "onetime",
          keyId,
          callerRefId,
          mode: "live",
        });
      }
    }

    // 6. Debug Mode Off in Production Check
    const isProduction = process.env.NODE_ENV === "production";
    const allowDemo = process.env.ALLOW_DEMO_SEED === "true";

    if (isProduction && !allowDemo) {
      return NextResponse.json(
        { error: "The online payment gateway is currently unavailable. Please contact the Trust directly or try again later." },
        { status: 503 },
      );
    }

    // Demo / Sandbox mode fallback for local staging & development only
    if (isRecurring) {
      const demoSubId = `sub_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isDaily = frequency === "daily";
      const cycleAmount = isDaily ? amount * 7 : amount;
      await ensureDbSchema().catch(() => {});
      await db.insert(recurringSubscriptions).values({
        publicId: demoSubId,
        mode: "demo",
        status: "active",
        mandateStatus: "active",
        amount: cycleAmount,
        frequency,
        donorName,
        donorEmail: donorEmail || "donor@janasevaashrama.org",
        donorPhone: donorPhone || null,
        donorPan: donorPan || null,
        totalCycles: isDaily ? 52 : frequency === "weekly" ? 52 : frequency === "yearly" ? 10 : 60,
        idempotencyKey: `sub_chk_${Date.now()}_${publicToken()}`,
        meta: {
          demoSimulated: true,
          frequency,
          dailyAmount: isDaily ? amount : null,
          cycleAmount,
          ...safeNotes,
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        subscriptionId: demoSubId,
        amount: Math.round(cycleAmount * 100),
        currency: "INR",
        frequency,
        keyId: "rzp_test_demokey12345",
        callerRefId,
        mode: "demo",
      });
    }

    const demoOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return NextResponse.json({
      success: true,
      orderId: demoOrderId,
      amount: Math.round(amount * 100),
      currency: "INR",
      frequency: "onetime",
      keyId: "rzp_test_demokey12345",
      callerRefId,
      mode: "demo",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
