import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import { whatsAppCampaigns } from "@/db/schema";
import { createBroadcastCampaign } from "@/lib/whatsapp-campaigns";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET: List all campaigns
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaigns = await db
      .select()
      .from(whatsAppCampaigns)
      .orderBy(desc(whatsAppCampaigns.createdAt));

    return NextResponse.json({ campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch campaigns" }, { status: 500 });
  }
}

/**
 * POST: Create a new campaign
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, purpose, templateId, templateName, customText, audienceCriteria, scheduledAt } = body;

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    const campaign = await createBroadcastCampaign({
      name,
      purpose,
      templateId,
      templateName,
      customText,
      audienceCriteria: audienceCriteria || { segment: "ALL" },
      createdBy: session.user.id,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create campaign" }, { status: 500 });
  }
}
