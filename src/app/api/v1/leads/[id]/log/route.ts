import { NextResponse } from "next/server";
import { logCallDisposition, recordPaymentAttribution } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { db } from "@/db";
import { agLeads } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clean } from "@/lib/server-utils";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your telecaller portal." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID." }, { status: 400 });
    }

    // Row-level security: Verify lead exists and belongs to the caller (or admin)
    const [lead] = await db
      .select({
        leadId: agLeads.leadId,
        assignedCallerId: agLeads.assignedCallerId,
      })
      .from(agLeads)
      .where(eq(agLeads.leadId, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (!auth.isAdmin && lead.assignedCallerId !== auth.callerId) {
      return NextResponse.json(
        { error: "Access denied. This lead is assigned to another telecaller." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawDisposition = clean(body.disposition, 40);
    const notes = clean(body.notes, 1000);
    const callbackTime = body.callbackTime ? String(body.callbackTime).slice(0, 50) : undefined;

    const VALID_DISPOSITIONS = [
      "Interested",
      "Reschedule",
      "Rejected",
      "Pending",
      "Donated",
      "No_Answer",
      "Contacted",
      "Busy",
      "Invalid_Number",
    ];
    if (!VALID_DISPOSITIONS.includes(rawDisposition)) {
      return NextResponse.json(
        { error: `Invalid disposition. Allowed: ${VALID_DISPOSITIONS.join(", ")}` },
        { status: 400 },
      );
    }

    await logCallDisposition(leadId, auth.callerId, rawDisposition, notes, callbackTime);

    // If marked Donated with an amount, record payment attribution in real-time
    if (rawDisposition === "Donated" && body.amount) {
      const amt = Number(body.amount);
      if (amt > 0) {
        const txnId = body.utr ? `utr_${clean(body.utr, 50)}` : `offline_${Date.now()}_${leadId}`;
        await recordPaymentAttribution({
          txnId,
          gatewayOrderId: `order_direct_${Date.now()}`,
          amount: amt,
          callerRefId: auth.callerId,
          leadId,
          metadata: { utr: body.utr ? clean(body.utr, 50) : null, loggedBy: auth.callerId, notes },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Call disposition logged successfully.",
      leadId,
      disposition: rawDisposition,
      callerId: auth.callerId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
