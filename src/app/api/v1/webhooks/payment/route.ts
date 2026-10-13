import { NextResponse } from "next/server";
import crypto from "crypto";
import { recordPaymentAttribution } from "@/lib/antigravity-crm";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Cryptographic signature check if webhook secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSignature !== signature) {
        console.error("[SECURITY] Invalid Razorpay webhook signature");
        return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 400 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // 1. Live Razorpay payment.captured event
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

    // 2. Direct simulation / internal verification trigger
    if (payload.action === "simulate_donation" || payload.paymentId) {
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
