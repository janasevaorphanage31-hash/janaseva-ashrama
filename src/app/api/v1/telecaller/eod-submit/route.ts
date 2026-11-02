import { NextResponse } from "next/server";
import { submitCallerEODShift, getEODShiftStatus } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { ensureDbSchema } from "@/db";
import { clean } from "@/lib/server-utils";

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
    const dateStr = url.searchParams.get("date") || undefined;
    const paramCallerId = url.searchParams.get("callerId");
    const targetCallerId = auth.isAdmin && paramCallerId ? paramCallerId : auth.callerId;

    const status = await getEODShiftStatus(targetCallerId, dateStr);

    return NextResponse.json({
      success: true,
      callerId: targetCallerId,
      ...status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your telecaller portal." },
        { status: 401 }
      );
    }

    await ensureDbSchema();

    const body = await req.json().catch(() => ({}));
    const submissionType = body.submissionType === "AUTO_EOD" ? "AUTO_EOD" : "MANUAL";
    const notes = clean(body.notes, 500);

    const result = await submitCallerEODShift(auth.callerId, submissionType, notes);

    return NextResponse.json({
      message: "End-of-Day shift report submitted successfully to supervisor.",
      callerId: auth.callerId,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
