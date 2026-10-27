import { NextResponse } from "next/server";
import { authenticateCallerOrAdmin } from "@/lib/caller-auth";
import {
  getBaileysSocket,
  getBaileysGatewayStatus,
  sendBaileysMediaMessage,
  disconnectBaileysSession,
} from "@/lib/whatsapp-baileys";
import { logCallDisposition } from "@/lib/antigravity-crm";
import { db } from "@/db";
import { agLeads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET: Retrieve status of Baileys WhatsApp Gateway (status, QR code, connected phone)
 */
export async function GET(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = await getBaileysGatewayStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Trigger initialization, disconnect, or dispatch message
 */
export async function POST(req: Request) {
  try {
    const auth = await authenticateCallerOrAdmin(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // Action: Connect / Start QR session
    if (action === "connect") {
      void getBaileysSocket();
      const status = await getBaileysGatewayStatus();
      return NextResponse.json({ success: true, ...status });
    }

    // Action: Disconnect
    if (action === "disconnect") {
      await disconnectBaileysSession();
      return NextResponse.json({ success: true, message: "Baileys session disconnected" });
    }

    // Action: Send real media message to lead
    if (action === "send") {
      const {
        leadId,
        recipientPhone,
        mediaUrl,
        captionText,
        caption,
        messageText,
        mediaType = "image",
      } = body;

      const finalCaption = captionText || caption || messageText || "";
      let targetPhone = recipientPhone;
      let targetLeadId = leadId ? parseInt(String(leadId), 10) : null;

      if (targetLeadId) {
        const [lead] = await db
          .select({
            leadId: agLeads.leadId,
            phone: agLeads.phone,
            assignedCallerId: agLeads.assignedCallerId,
          })
          .from(agLeads)
          .where(eq(agLeads.leadId, targetLeadId))
          .limit(1);

        if (!lead && !targetPhone) {
          return NextResponse.json({ error: "Lead not found" }, { status: 404 });
        }

        if (lead) {
          if (!auth.isAdmin && lead.assignedCallerId !== auth.callerId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
          }
          if (!targetPhone) {
            targetPhone = lead.phone;
          }
        }
      }

      if (!targetPhone) {
        return NextResponse.json(
          { error: "recipientPhone or valid leadId is required" },
          { status: 400 }
        );
      }

      const res = await sendBaileysMediaMessage({
        to: targetPhone,
        caption: finalCaption,
        mediaUrl,
        mediaType,
      });

      // Automatically log Contacted disposition in CRM if leadId is available
      if (targetLeadId) {
        await logCallDisposition(
          targetLeadId,
          auth.callerId,
          "Contacted",
          `Dispatched Kanglish media via connected Ashrama WhatsApp to customer ${res.phone}`
        );
      }

      return NextResponse.json({
        success: true,
        messageId: res.messageId,
        phone: res.phone,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Operation failed" }, { status: 500 });
  }
}
