import { NextResponse } from "next/server";
import { getCallerDailyLogs } from "@/lib/antigravity-crm";
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

    const url = new URL(req.url);
    const paramCallerId = url.searchParams.get("callerId");
    const targetCallerId = auth.isAdmin && paramCallerId ? paramCallerId : auth.callerId;

    const logs = await getCallerDailyLogs(targetCallerId);

    return NextResponse.json({
      success: true,
      callerId: targetCallerId,
      count: logs.length,
      logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
