import { NextResponse } from "next/server";
import { generateAgencyCSVExport } from "@/lib/antigravity-crm";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/server-utils";

export async function GET(req: Request) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator credentials required." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type") || "performance";
    const exportType =
      typeParam === "leads" || typeParam === "donations" || typeParam === "roster"
        ? (typeParam as "performance" | "leads" | "donations" | "roster")
        : "performance";

    const { filename, csv } = await generateAgencyCSVExport(exportType);

    await writeAudit({
      actorAdminUserId: session.user.id ?? null,
      action: "crm.download_agency_export",
      entity: "agency_reports",
      afterState: { exportType, filename },
      ipAddress: clientIp(req),
    });

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
