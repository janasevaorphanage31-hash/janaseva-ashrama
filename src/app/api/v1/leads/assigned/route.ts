import { NextResponse } from "next/server";
import { getAssignedLeads } from "@/lib/antigravity-crm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let callerId = url.searchParams.get("callerId");

    if (!callerId) {
      // Check cookie or header
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/ag_caller_session=([^;]+)/);
      callerId = match ? match[1] : req.headers.get("x-caller-id");
    }

    if (!callerId) {
      callerId = "TC01"; // Fallback to primary test caller
    }

    const leads = await getAssignedLeads(callerId);

    return NextResponse.json({
      success: true,
      callerId: callerId.toUpperCase(),
      count: leads.length,
      leads,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
