import { NextResponse } from "next/server";
import { logCallDisposition } from "@/lib/antigravity-crm";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const body = await req.json();
    const disposition = body.disposition;
    const notes = body.notes;
    const callbackTime = body.callbackTime;
    let callerId = body.callerId;

    if (!callerId) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/ag_caller_session=([^;]+)/);
      callerId = match ? match[1] : req.headers.get("x-caller-id") || "TC01";
    }

    if (!disposition) {
      return NextResponse.json({ error: "Disposition is required" }, { status: 400 });
    }

    await logCallDisposition(leadId, callerId, disposition, notes, callbackTime);

    return NextResponse.json({
      success: true,
      message: "Call disposition logged successfully",
      leadId,
      disposition,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
