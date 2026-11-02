import { NextResponse } from "next/server";
import { getFinancialCRMStats } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { ensureDbSchema } from "@/db";

export async function GET(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth || !auth.isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator privileges required." },
        { status: 403 }
      );
    }

    await ensureDbSchema();

    const stats = await getFinancialCRMStats();

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
