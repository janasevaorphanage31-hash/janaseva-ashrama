import { NextResponse } from "next/server";
import {
  getAdminLeaderboard,
  distributeBirthdayLeads,
  bulkReassignLeads,
  ensureTelecallersAndSeedData,
} from "@/lib/antigravity-crm";

export async function GET() {
  try {
    const data = await getAdminLeaderboard();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "trigger_routing") {
      const result = await distributeBirthdayLeads();
      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Distributed ${result.distributed} birthday leads across ${result.callersCount} active telecallers.`,
        ...updatedLeaderboard,
      });
    }

    if (action === "bulk_reassign") {
      const leadIds = body.leadIds as number[];
      const targetCallerId = body.targetCallerId as string;

      if (!leadIds || leadIds.length === 0 || !targetCallerId) {
        return NextResponse.json({ error: "Lead IDs and target caller are required" }, { status: 400 });
      }

      await bulkReassignLeads(leadIds, targetCallerId);
      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Reassigned ${leadIds.length} leads to ${targetCallerId}.`,
        ...updatedLeaderboard,
      });
    }

    if (action === "seed_sample") {
      await ensureTelecallersAndSeedData();
      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: "Seeded initial telecallers and birthday leads successfully.",
        ...updatedLeaderboard,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
