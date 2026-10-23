import { NextResponse } from "next/server";
import { generateWhatsAppLink } from "@/lib/antigravity-crm";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { db } from "@/db";
import { agLeads } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to your telecaller portal." },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const leadId = parseInt(id, 10);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID." }, { status: 400 });
    }

    // Row-level security: Verify lead exists and belongs to caller (or admin)
    const [lead] = await db
      .select({
        leadId: agLeads.leadId,
        assignedCallerId: agLeads.assignedCallerId,
      })
      .from(agLeads)
      .where(eq(agLeads.leadId, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (!auth.isAdmin && lead.assignedCallerId !== auth.callerId) {
      return NextResponse.json(
        { error: "Access denied. This lead is assigned to another telecaller." },
        { status: 403 },
      );
    }

    let host = req.headers.get("host") || "www.janasevaorphanage.org";
    if (host === "janasevaorphanage.org") host = "www.janasevaorphanage.org";
    if (host === "janasevaashrama.org") host = "www.janasevaashrama.org";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const result = await generateWhatsAppLink(leadId, auth.callerId, baseUrl);

    return NextResponse.json({
      success: true,
      ...result,
      callerId: auth.callerId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
