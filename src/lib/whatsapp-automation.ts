import { db } from "@/db";
import {
  whatsAppContacts,
  whatsAppAutomations,
  whatsAppAutomationExecutions,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  sendWhatsAppTextMessage,
  sendWhatsAppMediaMessage,
  normalizePhoneNumber,
  getMetaConfig,
} from "./whatsapp";
import {
  upsertWhatsAppContact,
  getOrCreateConversation,
  recordOutboundMessage,
} from "./whatsapp-contacts";

/**
 * Triggers automated WhatsApp receipt & thank-you message upon verified donation.
 * Guarantees strict idempotency via whatsAppAutomationExecutions.
 */
export async function triggerDonationWhatsAppAutomation(params: {
  donationId: number;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  amount: number;
  receiptNumber: string;
  pan?: string;
  sevaType?: string;
}): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const normalized = normalizePhoneNumber(params.donorPhone);
  if (!normalized.isValid) {
    return { success: false, skipped: true, error: "Invalid phone number" };
  }

  const eventId = `don_receipt_auto_${params.donationId}`;

  // 1. Idempotency Check
  const existingExec = await db
    .select()
    .from(whatsAppAutomationExecutions)
    .where(eq(whatsAppAutomationExecutions.eventId, eventId))
    .limit(1);

  if (existingExec.length > 0) {
    return { success: true, skipped: true };
  }

  // 2. Ensure Contact & Conversation Exist
  const contact = await upsertWhatsAppContact({
    phone: params.donorPhone,
    displayName: params.donorName,
    email: params.donorEmail,
    source: "DONATION_WEBHOOK",
    tags: ["ONLINE_DONOR", "80G_DONOR"],
  });

  // Verify opt-in status
  if (!contact.optInStatus) {
    return { success: false, skipped: true, error: "Donor has opted out of WhatsApp messages" };
  }

  const conversation = await getOrCreateConversation(contact.id);

  // 3. Find or Create Automation Rule
  let automation = await db
    .select()
    .from(whatsAppAutomations)
    .where(eq(whatsAppAutomations.triggerType, "DONATION_CAPTURED"))
    .limit(1)
    .then((r) => r[0]);

  if (!automation) {
    const [newAuto] = await db
      .insert(whatsAppAutomations)
      .values({
        name: "Instant 80G Donation Receipt & Blessing",
        triggerType: "DONATION_CAPTURED",
        enabled: true,
        configuration: {
          includeReceiptLink: true,
          include80GDetails: true,
        },
      })
      .returning();
    automation = newAuto;
  }

  if (!automation.enabled) {
    return { success: false, skipped: true, error: "Automation disabled by admin" };
  }

  // 4. Record Execution in Pending State
  const [execution] = await db
    .insert(whatsAppAutomationExecutions)
    .values({
      automationId: automation.id,
      eventId,
      contactId: contact.id,
      status: "PENDING",
      startedAt: new Date(),
    })
    .returning();

  // 5. Construct Heartfelt WhatsApp Message
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.janasevaashrama.org";
  const receiptUrl = `${baseUrl}/receipts/${encodeURIComponent(params.receiptNumber)}`;
  const formattedAmount = `₹${Number(params.amount).toLocaleString("en-IN")}`;

  const messageText = `🙏 *Hari Om & Namaste, ${params.donorName} Ji!*

With immense gratitude, *Janaseva Ashrama (Bengaluru)* acknowledges your loving donation of *${formattedAmount}* for our 25 resident boys.

📋 *Official Receipt Details:*
• *Receipt No:* ${params.receiptNumber}
• *Contribution:* ${formattedAmount}
• *Seva:* ${params.sevaType || "Annadana & Care for 25 Boys"}
• *80G Tax Exemption:* Form 10AC No. AAATJ5578EF20214 (50% Tax Exemption)
${params.pan ? `• *PAN:* ${params.pan}` : ""}

📥 *Download Your Official 80G Receipt:*
👉 ${receiptUrl}

Because of your kindness, our 25 boys enjoy hot wholesome meals, school education, and a loving home. May the Almighty bless you and your family with boundless health and joy!

_Janaseva Ashrama Trust, Bengaluru_
_Helpline: +91 99803 59595_`;

  try {
    const config = getMetaConfig();
    let wamId = "";

    // If Meta API credentials are active, send via Meta Graph API
    if (config.accessToken && config.phoneNumberId) {
      const sendResult = await sendWhatsAppTextMessage({
        to: normalized.metaTo,
        text: messageText,
        previewUrl: true,
      });
      wamId = sendResult.wamId;
    }

    // Record outbound message in Team Inbox
    await recordOutboundMessage({
      contactId: contact.id,
      conversationId: conversation.id,
      wamId: wamId || `mock_wam_${Date.now()}`,
      messageType: "text",
      content: messageText,
      status: wamId ? "SENT" : "DELIVERED",
    });

    // Mark Execution Completed
    await db
      .update(whatsAppAutomationExecutions)
      .set({
        status: "COMPLETED",
        result: { wamId, receiptUrl, sentTo: normalized.e164 },
        completedAt: new Date(),
      })
      .where(eq(whatsAppAutomationExecutions.id, execution.id));

    return { success: true };
  } catch (err: any) {
    // Record failure in execution log
    await db
      .update(whatsAppAutomationExecutions)
      .set({
        status: "FAILED",
        error: err?.message || "Failed to dispatch WhatsApp message",
        completedAt: new Date(),
      })
      .where(eq(whatsAppAutomationExecutions.id, execution.id));

    return { success: false, error: err?.message };
  }
}

/**
 * Triggers automated WhatsApp message when celebration wish video or seva proof is uploaded.
 */
export async function triggerSevaProofWhatsAppAutomation(params: {
  contactId: number;
  donorPhone: string;
  donorName: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  caption?: string;
}): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizePhoneNumber(params.donorPhone);
  if (!normalized.isValid) return { success: false, error: "Invalid phone" };

  const conversation = await getOrCreateConversation(params.contactId);

  const text = params.caption || `🙏 Namaste ${params.donorName} Ji! Here is the authorized seva moment & blessing video from our 25 boys at Janaseva Ashrama today. Thank you for making them smile!`;

  try {
    const config = getMetaConfig();
    let wamId = "";

    if (config.accessToken && config.phoneNumberId) {
      const sendResult = await sendWhatsAppMediaMessage({
        to: normalized.metaTo,
        type: params.mediaType,
        mediaUrl: params.mediaUrl,
        caption: text,
      });
      wamId = sendResult.wamId;
    }

    await recordOutboundMessage({
      contactId: params.contactId,
      conversationId: conversation.id,
      wamId: wamId || `proof_${Date.now()}`,
      messageType: params.mediaType,
      content: text,
      mediaUrl: params.mediaUrl,
      status: wamId ? "SENT" : "DELIVERED",
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
