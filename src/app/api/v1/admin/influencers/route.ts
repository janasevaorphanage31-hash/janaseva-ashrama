import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import {
  getInfluencerProfiles,
  createOrUpdateInfluencer,
  toggleInfluencerStatus,
} from "@/lib/antigravity-crm";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/influencers
 * Fetches all influencer profiles with live aggregated funds raised and donor metrics.
 */
export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Administrator credentials required." }, { status: 401 });
  }

  try {
    const origin = req.nextUrl.origin;
    const data = await getInfluencerProfiles(origin);
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (err: any) {
    console.error("Failed to load influencer profiles:", err);
    return NextResponse.json({ error: err.message || "Failed to load influencers" }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/influencers
 * Actions: create_or_update, toggle_status
 */
export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Administrator credentials required." }, { status: 401 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "create_or_update") {
      const {
        influencerCode,
        displayName,
        instagramHandle,
        whatsappNumber,
        targetGoalAmount,
        campaignStory,
        coverImageUrl,
      } = body;

      const res = await createOrUpdateInfluencer({
        influencerCode,
        displayName,
        instagramHandle,
        whatsappNumber,
        targetGoalAmount,
        campaignStory,
        coverImageUrl,
      });

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: res.action === "created" ? "influencer.create" : "influencer.update",
        entity: "influencer_profiles",
        entityId: res.influencerCode,
        ipAddress: ip,
      });

      const updated = await getInfluencerProfiles(req.nextUrl.origin);
      return NextResponse.json({
        success: true,
        message: `Influencer ${res.influencerCode} successfully ${res.action}.`,
        ...updated,
      });
    }

    if (action === "toggle_status") {
      const { influencerCode, status } = body;
      if (!influencerCode || !["ACTIVE", "PAUSED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status or code" }, { status: 400 });
      }

      const res = await toggleInfluencerStatus(influencerCode, status);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "influencer.toggle_status",
        entity: "influencer_profiles",
        entityId: res.influencerCode,
        afterState: { status },
        ipAddress: ip,
      });

      const updated = await getInfluencerProfiles(req.nextUrl.origin);
      return NextResponse.json({
        success: true,
        message: `Influencer ${res.influencerCode} is now ${status}.`,
        ...updated,
      });
    }

    return NextResponse.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (err: any) {
    console.error("Influencer API action error:", err);
    return NextResponse.json({ error: err.message || "Action failed" }, { status: 500 });
  }
}
