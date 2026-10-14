import { NextResponse } from "next/server";
import { getAssignedLeads } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";

export async function GET(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your telecaller portal." },
        { status: 401 }
      );
    }

    // Row-level security: Telecaller can ONLY query their own verified callerId
    const targetCallerId = auth.callerId;
    const leads = await getAssignedLeads(targetCallerId);

    return NextResponse.json({
      success: true,
      callerId: targetCallerId,
      callerName: auth.name,
      isAdmin: auth.isAdmin,
      count: leads.length,
      leads,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
