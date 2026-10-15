import { NextRequest, NextResponse } from "next/server";
import {
  getMetaConfig,
  verifyMetaWebhookSignature,
  parseMetaWebhookPayload,
  sendWhatsAppTextMessage,
} from "@/lib/whatsapp";
import {
  upsertWhatsAppContact,
  handleOptInOutKeywords,
  getOrCreateConversation,
  recordInboundMessage,
  recordOutboundMessage,
  updateMessageDeliveryStatus,
} from "@/lib/whatsapp-contacts";
import { generateWhatsAppAiResponse } from "@/lib/whatsapp-ai";
import { db } from "@/db";
import { whatsAppConversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET Handler: Meta Webhook Handshake Verification
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const config = getMetaConfig();

  if (mode === "subscribe" && token === config.verifyToken) {
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Verification failed. Invalid verify token." }, { status: 403 });
}

/**
 * POST Handler: Meta Webhook Event Ingestion
 */
export async function POST(req: NextRequest) {
  const config = getMetaConfig();
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // Verify HMAC-SHA256 signature if app secret is configured
  if (config.appSecret) {
    const isValid = verifyMetaWebhookSignature(rawBody, signature, config.appSecret);
    if (!isValid) {
      console.warn("[WhatsApp Webhook] Signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages, statuses } = parseMetaWebhookPayload(body);

  // 1. Process Outbound Message Delivery Receipts
  for (const st of statuses) {
    try {
      await updateMessageDeliveryStatus({
        wamId: st.wamId,
        status: st.status,
        timestamp: st.timestamp,
        errorCode: st.errorCode,
        errorTitle: st.errorTitle,
      });
    } catch (err) {
      console.error("[WhatsApp Webhook] Error updating status:", err);
    }
  }

  // 2. Process Inbound Messages
  for (const msg of messages) {
    try {
      // Upsert Contact
      const contact = await upsertWhatsAppContact({
        phone: msg.from,
        displayName: msg.name,
        source: "INBOUND_WHATSAPP",
      });

      // Get or Create Conversation Thread
      const conversation = await getOrCreateConversation(contact.id);

      // Check Opt-In / Opt-Out keywords
      const optResult = await handleOptInOutKeywords(contact.id, msg.text);

      if (optResult.handled && optResult.replyText) {
        // Send Regulatory acknowledgment
        try {
          let wamId = "";
          if (config.accessToken && config.phoneNumberId) {
            const sendRes = await sendWhatsAppTextMessage({
              to: contact.normalizedPhone,
              text: optResult.replyText,
            });
            wamId = sendRes.wamId;
          }
          await recordOutboundMessage({
            contactId: contact.id,
            conversationId: conversation.id,
            wamId: wamId || `opt_${Date.now()}`,
            messageType: "text",
            content: optResult.replyText,
          });
        } catch (err) {
          console.error("[WhatsApp Webhook] Failed to send opt-out reply:", err);
        }
        continue;
      }

      // Record Inbound Message
      const { message, isNew } = await recordInboundMessage({
        contactId: contact.id,
        conversationId: conversation.id,
        wamId: msg.wamId,
        messageType: msg.type,
        content: msg.text || (msg.buttonPayload ? `[Button: ${msg.buttonPayload}]` : `[${msg.type}]`),
        rawPayload: msg,
      });

      // If new message, contact is opted-in, AI is enabled, and no human takeover is active:
      if (isNew && contact.optInStatus && conversation.aiEnabled && !conversation.assignedUserId && msg.text) {
        const aiResponse = await generateWhatsAppAiResponse({
          userMessage: msg.text,
          donorName: contact.displayName || undefined,
          preferredLanguage: contact.preferredLanguage,
        });

        if (aiResponse.humanTakeoverNeeded) {
          // Flag conversation for human staff attention
          await db
            .update(whatsAppConversations)
            .set({
              status: "WAITING",
              updatedAt: new Date(),
            })
            .where(eq(whatsAppConversations.id, conversation.id));
        }

        // Send AI reply
        try {
          let wamId = "";
          if (config.accessToken && config.phoneNumberId) {
            const sendRes = await sendWhatsAppTextMessage({
              to: contact.normalizedPhone,
              text: aiResponse.replyText,
              previewUrl: true,
            });
            wamId = sendRes.wamId;
          }

          await recordOutboundMessage({
            contactId: contact.id,
            conversationId: conversation.id,
            wamId: wamId || `ai_${Date.now()}`,
            messageType: "text",
            content: aiResponse.replyText,
          });
        } catch (err) {
          console.error("[WhatsApp Webhook] Failed to dispatch AI message:", err);
        }
      }
    } catch (err) {
      console.error("[WhatsApp Webhook] Error processing message:", err);
    }
  }

  // Always return 200 to acknowledge receipt to Meta
  return new Response("EVENT_RECEIVED", { status: 200 });
}
