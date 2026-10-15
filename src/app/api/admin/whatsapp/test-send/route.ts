import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { sendWhatsAppTextMessage, normalizePhoneNumber, getMetaConfig } from "@/lib/whatsapp";
import { upsertWhatsAppContact, getOrCreateConversation, recordOutboundMessage } from "@/lib/whatsapp-contacts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { phone, text } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);
    if (!normalized.isValid) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const testMessage =
      text ||
      `🙏 Hari Om! This is an official test message from Janaseva Ashrama WhatsApp Cloud API system. Our connection is operational.`;

    const config = getMetaConfig();
    let wamId = "";

    if (config.accessToken && config.phoneNumberId) {
      const res = await sendWhatsAppTextMessage({
        to: normalized.metaTo,
        text: testMessage,
      });
      wamId = res.wamId;
    } else {
      wamId = `test_${Date.now()}`;
    }

    // Record in test contact's timeline
    const contact = await upsertWhatsAppContact({
      phone: normalized.e164,
      displayName: "Test Recipient",
      source: "TEST_SEND",
    });
    const conversation = await getOrCreateConversation(contact.id);
    await recordOutboundMessage({
      contactId: contact.id,
      conversationId: conversation.id,
      wamId,
      messageType: "text",
      content: testMessage,
      status: wamId.startsWith("test_") ? "DELIVERED" : "SENT",
    });

    return NextResponse.json({
      success: true,
      wamId,
      sentTo: normalized.e164,
      mockMode: !config.accessToken || !config.phoneNumberId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to send test message" }, { status: 500 });
  }
}
