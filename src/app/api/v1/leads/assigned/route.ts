import { NextResponse } from "next/server";
import { getCallerPortalData, reallocateAbsenteeAdvanceLeads } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { ensureDbSchema } from "@/db";

export async function GET(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your telecaller portal." },
        { status: 401 }
      );
    }

    await ensureDbSchema();

    // Row-level security: Telecaller can ONLY query their own verified callerId
    // Administrator can query any specific callerId or 'ALL'
    const url = new URL(req.url);
    const paramCallerId = url.searchParams.get("callerId");
    const paramLimit = url.searchParams.get("limit");
    const paramPage = url.searchParams.get("page");
    const paramRefresh = url.searchParams.get("refresh");
    const page = paramPage ? Math.max(1, parseInt(paramPage, 10)) : 1;
    const limit = paramLimit ? Math.min(parseInt(paramLimit, 10), 10000) : (paramPage ? 100 : 2500);
    const offset = (page - 1) * limit;

    // On-demand explicit refresh: harvest absentee advance leads and distribute unassigned T+1/T+2 leads
    if (paramRefresh === "true" || paramRefresh === "1") {
      try {
        await reallocateAbsenteeAdvanceLeads({ includeT2: true });
      } catch (e) {
        console.warn("Advance lead reallocate on refresh skipped:", e);
      }
    }

    const targetCallerId = auth.isAdmin
      ? (paramCallerId || auth.callerId)
      : auth.callerId;

    const { leads, stats } = await getCallerPortalData(targetCallerId, limit, offset);

    return NextResponse.json({
      success: true,
      callerId: targetCallerId,
      callerName: auth.name,
      isAdmin: auth.isAdmin,
      page,
      limit,
      count: leads.length,
      totalAssigned: stats.totalAssigned,
      leads,
      callerStats: stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
