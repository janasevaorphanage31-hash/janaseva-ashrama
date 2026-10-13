import { NextResponse } from "next/server";
import { generateWhatsAppLink } from "@/lib/antigravity-crm";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const url = new URL(req.url);
    let callerId = url.searchParams.get("callerId");

    if (!callerId) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/ag_caller_session=([^;]+)/);
      callerId = match ? match[1] : req.headers.get("x-caller-id") || "TC01";
    }

    const host = req.headers.get("host") || "janasevaorphanage.org";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const result = await generateWhatsAppLink(leadId, callerId, baseUrl);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
