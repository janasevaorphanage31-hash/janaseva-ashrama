import { NextResponse } from "next/server";
import { generateAgencyCSVExport } from "@/lib/antigravity-crm";
import { requireAdminApi } from "@/lib/admin-auth";
import { authenticateCallerOrAdmin, verifyCallerToken } from "@/lib/caller-auth";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/server-utils";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type") || "performance";
    const callerIdParam = (url.searchParams.get("callerId") || "").trim().toUpperCase();
    const tokenParam = url.searchParams.get("token");

    // 1. Authorize: Admin, authenticated telecaller, or cryptographic token match
    let isAuthorized = false;
    let isAdmin = false;
    let actorId: string | null = null;

    const adminSession = await requireAdminApi();
    if (adminSession) {
      isAuthorized = true;
      isAdmin = true;
      actorId = adminSession.user.id != null ? String(adminSession.user.id) : null;
    } else if (typeParam === "caller_leads" && callerIdParam) {
      // Check if signed token matches callerId
      if (tokenParam && verifyCallerToken(tokenParam) === callerIdParam) {
        isAuthorized = true;
        actorId = `token:${callerIdParam}`;
      } else {
        // Check if telecaller session cookie matches callerId
        const callerAuth = await authenticateCallerOrAdmin(req);
        if (callerAuth && (callerAuth.isAdmin || callerAuth.callerId === callerIdParam)) {
          isAuthorized = true;
          actorId = `caller:${callerAuth.callerId}`;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator credentials or verified caller token required." },
        { status: 401 }
      );
    }

    const exportType =
      typeParam === "leads" || typeParam === "donations" || typeParam === "roster" || typeParam === "caller_leads"
        ? (typeParam as "performance" | "leads" | "donations" | "roster" | "caller_leads")
        : "performance";

    const { filename, csv } = await generateAgencyCSVExport(exportType, callerIdParam || undefined);

    if (isAdmin && adminSession) {
      await writeAudit({
        actorAdminUserId: adminSession.user.id ?? null,
        action: "crm.download_agency_export",
        entity: "agency_reports",
        afterState: { exportType, filename },
        ipAddress: clientIp(req),
      });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
