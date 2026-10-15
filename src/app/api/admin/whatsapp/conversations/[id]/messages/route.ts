import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { db } from "@/db";
import { whatsAppConversations, whatsAppContacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  sendWhatsAppTextMessage,
  sendWhatsAppMediaMessage,
  getMetaConfig,
} from "@/lib/whatsapp";
import { recordOutboundMessage } from "@/lib/whatsapp-contacts";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const convId = parseInt(id, 10);
  if (isNaN(convId)) {
    return NextResponse.json({ error: "Invalid conversation ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { message, messageType = "text", mediaUrl, caption } = body;

    if (!message && !mediaUrl) {
      return NextResponse.json({ error: "Message content or media URL is required" }, { status: 400 });
    }

    // 1. Fetch Conversation & Contact
    const [convRow] = await db
      .select({
        conversation: whatsAppConversations,
        contact: whatsAppContacts,
      })
      .from(whatsAppConversations)
      .innerJoin(whatsAppContacts, eq(whatsAppConversations.contactId, whatsAppContacts.id))
      .where(eq(whatsAppConversations.id, convId))
      .limit(1);

    if (!convRow) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { contact, conversation } = convRow;
    const config = getMetaConfig();
    let wamId = "";

    // 2. Dispatch via Meta Cloud API if configured
    if (config.accessToken && config.phoneNumberId) {
      if (mediaUrl && (messageType === "image" || messageType === "video" || messageType === "document")) {
        const sendRes = await sendWhatsAppMediaMessage({
          to: contact.normalizedPhone,
          type: messageType,
          mediaUrl,
          caption: caption || message,
        });
        wamId = sendRes.wamId;
      } else {
        const sendRes = await sendWhatsAppTextMessage({
          to: contact.normalizedPhone,
          text: message,
          previewUrl: true,
        });
        wamId = sendRes.wamId;
      }
    } else {
      wamId = `staff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // 3. Record Outbound Message in Database
    const newMsg = await recordOutboundMessage({
      contactId: contact.id,
      conversationId: conversation.id,
      wamId,
      messageType: mediaUrl ? messageType : "text",
      content: message || caption,
      mediaUrl,
      status: wamId.startsWith("staff_") ? "DELIVERED" : "SENT",
    });

    return NextResponse.json({
      success: true,
      message: newMsg,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to send message" }, { status: 500 });
  }
}
