import { NextResponse } from "next/server";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import { getMetaConfig, sendWhatsAppMediaMessage, normalizePhoneNumber } from "@/lib/whatsapp";
import { logCallDisposition } from "@/lib/antigravity-crm";
import { db } from "@/db";
import { agLeads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized caller session" }, { status: 401 });
    }

    const body = await req.json();
    const { leadId, mediaUrl, captionText, mediaType = "image" } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const [lead] = await db
      .select({
        leadId: agLeads.leadId,
        name: agLeads.name,
        phone: agLeads.phone,
        assignedCallerId: agLeads.assignedCallerId,
      })
      .from(agLeads)
      .where(eq(agLeads.leadId, leadId))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (!auth.isAdmin && lead.assignedCallerId !== auth.callerId) {
      return NextResponse.json(
        { error: "Access denied. Lead assigned to another advisor." },
        { status: 403 }
      );
    }

    const config = getMetaConfig();
    const normalized = normalizePhoneNumber(lead.phone);

    if (!config.accessToken || !config.phoneNumberId) {
      return NextResponse.json({
        success: false,
        isApiConfigured: false,
        message: "Meta Cloud API credentials not configured in environment.",
      });
    }

    // Dispatch real media message via Meta Cloud API
    const res = await sendWhatsAppMediaMessage({
      to: normalized.metaTo,
      type: mediaType as "image" | "video" | "document",
      mediaUrl: mediaUrl || "https://www.janasevaashrama.org/media/banana-leaf-feast.jpg",
      caption: captionText,
    });

    // Automatically mark lead as Contacted
    await logCallDisposition(
      leadId,
      auth.callerId,
      "Contacted",
      "Official Meta WhatsApp Media Card dispatched"
    );

    return NextResponse.json({
      success: true,
      isApiConfigured: true,
      wamId: res.wamId,
      recipientId: res.recipientId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to dispatch card" }, { status: 500 });
  }
}
