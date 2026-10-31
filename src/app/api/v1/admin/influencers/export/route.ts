import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { verifyCallerToken } from "@/lib/caller-auth";
import { exportInfluencerDonationsCsv } from "@/lib/antigravity-crm";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/influencers/export
 * Downloads CSV donor ledger for an influencer or consolidated all-influencers summary.
 *
 * Query Params:
 * - code: Influencer code (e.g. 'ROHIT_FIT') for single ledger, or omitted for summary
 * - token: HMAC-SHA256 signed token allowing influencers to download their ledger securely
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code")?.trim().toUpperCase() || null;
  const token = searchParams.get("token") || null;

  // 1. Authorization check: Admin session OR valid signed token for that code
  const adminSession = await getAdminSession();
  let isAuthorized = Boolean(adminSession);

  if (!isAuthorized && code && token) {
    const verifiedCode = verifyCallerToken(token);
    if (verifiedCode && verifiedCode.toUpperCase() === code) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized. Administrator session or valid signed download token required." },
      { status: 401 }
    );
  }

  try {
    const { filename, csv } = await exportInfluencerDonationsCsv(code);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    console.error("Influencer CSV export error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate CSV" }, { status: 500 });
  }
}
