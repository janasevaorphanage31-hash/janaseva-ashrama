import { NextResponse } from "next/server";
import crypto from "crypto";
import { recordPaymentAttribution } from "@/lib/antigravity-crm";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === "production";
    const allowDemo = process.env.ALLOW_DEMO_SEED === "true";

    // 1. Verify Webhook Signatures (Mandatory in production or when secret configured)
    if (webhookSecret) {
      if (!signature) {
        console.error("[SECURITY] Missing x-razorpay-signature header on payment webhook");
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (
        expectedBuffer.length !== signatureBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
      ) {
        console.error("[SECURITY] Invalid Razorpay webhook signature (HMAC SHA256 mismatch)");
        return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
      }
    } else if (isProduction && !allowDemo) {
      console.error("[SECURITY] RAZORPAY_WEBHOOK_SECRET not configured in production");
      return NextResponse.json({ error: "Webhook endpoint not configured" }, { status: 500 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // 2. Live Razorpay payment.captured event
    if (payload.event === "payment.captured") {
      const payment = payload.payload?.payment?.entity || {};
      const notes = payment.notes || {};
      const callerRefId = notes.caller_ref_id || null;
      const leadId = notes.lead_id ? parseInt(notes.lead_id, 10) : null;
      const amountInRupees = Number(payment.amount || 0) / 100;

      await recordPaymentAttribution({
        txnId: payment.id || `pay_${Date.now()}`,
        gatewayOrderId: payment.order_id || `order_${Date.now()}`,
        amount: amountInRupees,
        callerRefId,
        leadId,
        donorName: notes.donor_name || payment.description || null,
        donorPhone: payment.contact || notes.donor_phone || null,
        donorEmail: payment.email || notes.donor_email || null,
        metadata: payment,
      });

      return NextResponse.json({ status: "ok", attributedTo: callerRefId });
    }

    // 3. Debug Mode Off in Production: Reject unauthenticated simulation in production
    if (payload.action === "simulate_donation" || payload.paymentId) {
      if (isProduction && !allowDemo) {
        return NextResponse.json(
          { error: "Payment simulation is strictly disabled in production." },
          { status: 403 },
        );
      }

      const amount = Number(payload.amount || 1000);
      const callerRefId = payload.callerRefId || "TC01";
      const txnId = payload.paymentId || `pay_sim_${Date.now()}`;
      const leadId = payload.leadId ? Number(payload.leadId) : null;

      await recordPaymentAttribution({
        txnId,
        gatewayOrderId: payload.orderId || `order_sim_${Date.now()}`,
        amount,
        callerRefId,
        leadId,
        donorName: payload.donorName || "Simulated Donor",
        donorPhone: payload.donorPhone || "9980359595",
        donorEmail: payload.donorEmail || "donor@example.com",
        metadata: { simulated: true },
      });

      return NextResponse.json({ status: "ok", simulated: true, attributedTo: callerRefId });
    }

    return NextResponse.json({ status: "ignored", reason: "Event not payment.captured" });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
