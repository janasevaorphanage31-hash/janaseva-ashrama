import { NextResponse } from "next/server";
import { verifyDonation } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { ensureDbSchema } from "@/db";
import { clean } from "@/lib/server-utils";

export async function POST(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    await ensureDbSchema();

    const body = await req.json().catch(() => ({}));
    const txnId = clean(body.txnId, 100);
    const action = body.action as "APPROVE" | "ADJUST" | "REJECT";
    const verifiedAmount = body.verifiedAmount != null ? Number(body.verifiedAmount) : undefined;
    const rejectionReason = clean(body.rejectionReason, 300);
    const adminNotes = clean(body.adminNotes, 500);

    if (!txnId) {
      return NextResponse.json({ error: "Transaction ID (txnId) is required." }, { status: 400 });
    }

    if (!["APPROVE", "ADJUST", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE, ADJUST, or REJECT." },
        { status: 400 }
      );
    }

    const result = await verifyDonation(txnId, action, {
      verifiedAmount,
      rejectionReason,
      adminNotes,
      verifiedBy: auth.callerId,
    });

    return NextResponse.json({
      message: `Donation ${txnId} ${action.toLowerCase()}d successfully.`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
