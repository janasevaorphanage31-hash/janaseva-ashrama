import { NextResponse } from "next/server";
import { generateAgencyCSVExport } from "@/lib/antigravity-crm";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type") || "performance";
    const exportType =
      typeParam === "leads" || typeParam === "donations" || typeParam === "roster"
        ? (typeParam as "performance" | "leads" | "donations" | "roster")
        : "performance";

    const { filename, csv } = await generateAgencyCSVExport(exportType);

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
