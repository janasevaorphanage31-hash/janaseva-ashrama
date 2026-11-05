import { NextResponse } from "next/server";
import { getCallerPortalData, reallocateAbsenteeAdvanceLeads, getISTDateBounds } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { ensureDbSchema } from "@/db";

const globalForSync = globalThis as unknown as { __arenaAdvanceLeadSyncDate?: string };

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
    const paramFilter = url.searchParams.get("filter");
    const page = paramPage ? Math.max(1, parseInt(paramPage, 10)) : 1;
    const limit = paramLimit ? Math.min(parseInt(paramLimit, 10), 10000) : (paramPage ? 100 : 1000);
    const offset = (page - 1) * limit;

    const { dateStr, year, month, day } = getISTDateBounds();
    const nowIST = new Date(Date.UTC(year, month - 1, day));
    const tomorrow = new Date(nowIST.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDay = tomorrow.getUTCDate();
    const tomorrowMonth = tomorrow.getUTCMonth() + 1;
    const t2 = new Date(nowIST.getTime() + 2 * 24 * 60 * 60 * 1000);
    const t2Day = t2.getUTCDate();
    const t2Month = t2.getUTCMonth() + 1;

    // Lead redistribution is protected from GET race conditions; only triggered on explicit admin rebalance
    const shouldReallocate = auth.isAdmin && (paramRefresh === "rebalance" || paramRefresh === "redistribute");
    if (shouldReallocate) {
      try {
        await reallocateAbsenteeAdvanceLeads({ includeT2: true });
      } catch (e) {
        console.warn("Advance lead reallocate skipped:", e);
      }
    }

    const targetCallerId = auth.isAdmin
      ? (paramCallerId || auth.callerId)
      : auth.callerId;

    const { leads, stats } = await getCallerPortalData(targetCallerId, limit, offset, paramFilter);

    return NextResponse.json({
      success: true,
      callerId: targetCallerId,
      callerName: auth.name,
      isAdmin: auth.isAdmin,
      page,
      limit,
      count: leads.length,
      totalAssigned: stats.totalAssigned,
      istDate: {
        year,
        month,
        day,
        dateStr,
        tomorrowDay,
        tomorrowMonth,
        t2Day,
        t2Month,
      },
      leads,
      callerStats: stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
