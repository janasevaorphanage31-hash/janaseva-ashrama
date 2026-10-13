import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const amount = Number(body.amount);
    const callerRefId = (body.callerRefId || "DIRECT").trim().toUpperCase();
    const leadId = body.leadId ? Number(body.leadId) : null;
    const donorName = body.donorName || "";
    const donorPhone = body.donorPhone || "";
    const donorEmail = body.donorEmail || "";

    if (!amount || amount < 10) {
      return NextResponse.json({ error: "Invalid donation amount (minimum ₹10)" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
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
          notes: {
            caller_ref_id: callerRefId,
            lead_id: leadId ? String(leadId) : "",
            donor_name: donorName,
            donor_phone: donorPhone,
            donor_email: donorEmail,
            platform: "antigravity_crm",
          },
        }),
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        throw new Error(`Gateway error: ${orderRes.status} ${errText}`);
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

    // Demo / Sandbox mode fallback when live credentials are pending
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
