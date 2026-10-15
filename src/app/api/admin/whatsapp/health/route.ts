import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getWhatsAppHealth } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const health = await getWhatsAppHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Health check failed" }, { status: 500 });
  }
}
