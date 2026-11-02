import { NextResponse } from "next/server";
import { unlockCallerShift } from "@/lib/antigravity-crm";
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
    const callerId = clean(body.callerId, 40);
    const dateStr = clean(body.dateStr, 20);

    if (!callerId) {
      return NextResponse.json({ error: "Caller ID is required." }, { status: 400 });
    }

    const result = await unlockCallerShift(callerId, dateStr);

    return NextResponse.json({
      success: true,
      message: result.message,
      callerId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
