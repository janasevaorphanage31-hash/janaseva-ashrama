import { NextResponse } from "next/server";
import { getCallerPortalData } from "@/lib/antigravity-crm";
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
    // Administrator can query any specific callerId or 'ALL'
    const url = new URL(req.url);
    const paramCallerId = url.searchParams.get("callerId");
    const paramLimit = url.searchParams.get("limit");
    const limit = paramLimit ? Math.min(parseInt(paramLimit, 10), 10000) : 10000;
    const targetCallerId = auth.isAdmin
      ? (paramCallerId || auth.callerId)
      : auth.callerId;

    const { leads, stats } = await getCallerPortalData(targetCallerId, limit);

    return NextResponse.json({
      success: true,
      callerId: targetCallerId,
      callerName: auth.name,
      isAdmin: auth.isAdmin,
      count: leads.length,
      leads,
      callerStats: stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
