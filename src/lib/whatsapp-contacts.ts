import { db } from "@/db";
import {
  whatsAppContacts,
  whatsAppConsents,
  whatsAppConversations,
  whatsAppMessages,
  whatsAppCampaigns,
  whatsAppCampaignRecipients,
  donations,
} from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { normalizePhoneNumber, isOptOutKeyword, isOptInKeyword } from "./whatsapp";

/**
 * Finds or creates a WhatsApp contact based on raw phone number.
 * Automatically reconciles with past donations table if available.
 */
export async function upsertWhatsAppContact(params: {
  phone: string;
  displayName?: string;
  email?: string;
  source?: string;
  tags?: string[];
}): Promise<typeof whatsAppContacts.$inferSelect> {
  const normalized = normalizePhoneNumber(params.phone);
  if (!normalized.isValid) {
    throw new Error(`Invalid phone number: ${params.phone}`);
  }

  // 1. Check existing WhatsApp contact
  const existing = await db
    .select()
    .from(whatsAppContacts)
    .where(eq(whatsAppContacts.normalizedPhone, normalized.e164))
    .limit(1);

  if (existing.length > 0) {
    const contact = existing[0];
    const updates: Partial<typeof whatsAppContacts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (params.displayName && (!contact.displayName || contact.displayName === "Donor")) {
      updates.displayName = params.displayName;
    }
    if (params.email && !contact.email) {
      updates.email = params.email;
    }

    if (params.tags && params.tags.length > 0) {
      const currentTags = Array.isArray(contact.tags) ? contact.tags : [];
      const mergedTags = Array.from(new Set([...currentTags, ...params.tags]));
      updates.tags = mergedTags;
    }

    if (Object.keys(updates).length > 1) {
      const updated = await db
        .update(whatsAppContacts)
        .set(updates)
        .where(eq(whatsAppContacts.id, contact.id))
        .returning();
      return updated[0];
    }
    return contact;
  }

  // 2. Query donations to reconcile existing donor history
  let donorRecord: any = null;
  try {
    const rawDigits = normalized.metaTo.slice(-10); // last 10 digits
    const donorMatches = await db
      .select()
      .from(donations)
      .where(sql`${donations.donorPhone} LIKE ${"%" + rawDigits}`)
      .orderBy(desc(donations.createdAt))
      .limit(1);
    if (donorMatches.length > 0) {
      donorRecord = donorMatches[0];
    }
  } catch {
    // Non-fatal if donations search fails
  }

  const initialTags = ["DONOR"];
  if (params.tags) initialTags.push(...params.tags);
  if (donorRecord) initialTags.push("VERIFIED_DONOR");

  const [newContact] = await db
    .insert(whatsAppContacts)
    .values({
      donorId: donorRecord?.id || null,
      normalizedPhone: normalized.e164,
      whatsappId: normalized.metaTo,
      displayName: params.displayName || donorRecord?.donorName || "Janaseva Donor",
      email: params.email || donorRecord?.donorEmail || null,
      tags: Array.from(new Set(initialTags)),
      preferredLanguage: "en",
      lastDonationAmount: donorRecord ? Number(donorRecord.amount) : null,
      lastDonationAt: donorRecord?.createdAt || null,
      optInStatus: true,
      consentSource: params.source || (donorRecord ? "CHECKOUT" : "DIRECT"),
      consentTimestamp: new Date(),
    })
    .returning();

  // Log initial consent
  await db.insert(whatsAppConsents).values({
    contactId: newContact.id,
    purpose: "ALL",
    status: "GRANTED",
    source: params.source || (donorRecord ? "CHECKOUT" : "DIRECT"),
    policyVersion: "v1.0",
    evidenceReference: donorRecord ? `Donation #${donorRecord.id}` : "Initial Contact",
  });

  return newContact;
}

/**
 * Handle Opt-In and Opt-Out regulatory keywords
 */
export async function handleOptInOutKeywords(
  contactId: number,
  messageText?: string | null
): Promise<{ handled: boolean; optInStatus: boolean; replyText?: string }> {
  if (!messageText) return { handled: false, optInStatus: true };

  if (isOptOutKeyword(messageText)) {
    await db
      .update(whatsAppContacts)
      .set({
        optInStatus: false,
        optOutAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsAppContacts.id, contactId));

    await db.insert(whatsAppConsents).values({
      contactId,
      purpose: "MARKETING",
      status: "REVOKED",
      source: "INBOUND_WHATSAPP",
      withdrawnAt: new Date(),
      evidenceReference: `Keyword: ${messageText.trim().toUpperCase()}`,
    });

    return {
      handled: true,
      optInStatus: false,
      replyText:
        "🙏 Janaseva Ashrama: You have been unsubscribed from promotional updates. You will continue to receive only essential transaction receipts for any direct donations. Reply START anytime to re-enable updates.",
    };
  }

  if (isOptInKeyword(messageText)) {
    await db
      .update(whatsAppContacts)
      .set({
        optInStatus: true,
        optOutAt: null,
        updatedAt: new Date(),
      })
      .where(eq(whatsAppContacts.id, contactId));

    await db.insert(whatsAppConsents).values({
      contactId,
      purpose: "ALL",
      status: "GRANTED",
      source: "INBOUND_WHATSAPP",
      evidenceReference: `Keyword: ${messageText.trim().toUpperCase()}`,
    });

    return {
      handled: true,
      optInStatus: true,
      replyText:
        "🙏 Janaseva Ashrama: Welcome back! You have re-subscribed to receive seva updates, festival wishes, and impact stories for our 25 resident boys.",
    };
  }

  return { handled: false, optInStatus: true };
}

/**
 * Get or create active conversation thread for a contact
 */
export async function getOrCreateConversation(
  contactId: number
): Promise<typeof whatsAppConversations.$inferSelect> {
  const existing = await db
    .select()
    .from(whatsAppConversations)
    .where(eq(whatsAppConversations.contactId, contactId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newConv] = await db
    .insert(whatsAppConversations)
    .values({
      contactId,
      status: "OPEN",
      unreadCount: 0,
      aiEnabled: true,
    })
    .returning();

  return newConv;
}

/**
 * Record an inbound message idempotently
 */
export async function recordInboundMessage(params: {
  contactId: number;
  conversationId: number;
  wamId: string;
  messageType: string;
  content?: string;
  mediaUrl?: string;
  rawPayload?: any;
}): Promise<{ message: typeof whatsAppMessages.$inferSelect; isNew: boolean }> {
  // Idempotency check
  if (params.wamId) {
    const existing = await db
      .select()
      .from(whatsAppMessages)
      .where(eq(whatsAppMessages.wamId, params.wamId))
      .limit(1);
    if (existing.length > 0) {
      return { message: existing[0], isNew: false };
    }
  }

  const [msg] = await db
    .insert(whatsAppMessages)
    .values({
      contactId: params.contactId,
      conversationId: params.conversationId,
      wamId: params.wamId,
      direction: "INBOUND",
      messageType: params.messageType || "text",
      content: params.content,
      mediaUrl: params.mediaUrl,
      status: "DELIVERED",
      rawPayload: params.rawPayload,
      deliveredAt: new Date(),
    })
    .returning();

  // Increment unread count and bump last message time
  await db
    .update(whatsAppConversations)
    .set({
      unreadCount: sql`${whatsAppConversations.unreadCount} + 1`,
      lastInboundAt: new Date(),
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(whatsAppConversations.id, params.conversationId));

  return { message: msg, isNew: true };
}

/**
 * Record an outbound message
 */
export async function recordOutboundMessage(params: {
  contactId: number;
  conversationId: number;
  wamId?: string;
  messageType: string;
  content?: string;
  mediaUrl?: string;
  templateName?: string;
  campaignId?: number;
  status?: string;
  rawPayload?: any;
}): Promise<typeof whatsAppMessages.$inferSelect> {
  const [msg] = await db
    .insert(whatsAppMessages)
    .values({
      contactId: params.contactId,
      conversationId: params.conversationId,
      wamId: params.wamId,
      direction: "OUTBOUND",
      messageType: params.messageType || "text",
      content: params.content,
      mediaUrl: params.mediaUrl,
      templateName: params.templateName,
      campaignId: params.campaignId,
      status: params.status || "SENT",
      rawPayload: params.rawPayload,
      sentAt: new Date(),
    })
    .returning();

  await db
    .update(whatsAppConversations)
    .set({
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(whatsAppConversations.id, params.conversationId));

  return msg;
}

/**
 * Update delivery status from Meta Webhook (sent -> delivered -> read -> failed)
 */
export async function updateMessageDeliveryStatus(params: {
  wamId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
  errorCode?: string;
  errorTitle?: string;
}): Promise<void> {
  const existing = await db
    .select()
    .from(whatsAppMessages)
    .where(eq(whatsAppMessages.wamId, params.wamId))
    .limit(1);

  if (existing.length === 0) return;
  const msg = existing[0];

  const updates: Partial<typeof whatsAppMessages.$inferInsert> = {
    status: params.status.toUpperCase(),
  };

  if (params.status === "delivered") updates.deliveredAt = params.timestamp;
  if (params.status === "read") updates.readAt = params.timestamp;
  if (params.status === "failed") {
    updates.failureCode = params.errorCode;
    updates.failureReason = params.errorTitle;
  }

  await db.update(whatsAppMessages).set(updates).where(eq(whatsAppMessages.id, msg.id));

  // If this message belongs to a broadcast campaign, update campaign recipient & stats
  if (msg.campaignId) {
    try {
      await db
        .update(whatsAppCampaignRecipients)
        .set({
          status: params.status.toUpperCase(),
          deliveredAt: params.status === "delivered" ? params.timestamp : undefined,
          readAt: params.status === "read" ? params.timestamp : undefined,
          failureReason: params.errorTitle,
        })
        .where(
          and(
            eq(whatsAppCampaignRecipients.campaignId, msg.campaignId),
            eq(whatsAppCampaignRecipients.contactId, msg.contactId)
          )
        );

      // Increment campaign counters
      if (params.status === "delivered") {
        await db
          .update(whatsAppCampaigns)
          .set({ deliveredCount: sql`${whatsAppCampaigns.deliveredCount} + 1` })
          .where(eq(whatsAppCampaigns.id, msg.campaignId));
      } else if (params.status === "read") {
        await db
          .update(whatsAppCampaigns)
          .set({ readCount: sql`${whatsAppCampaigns.readCount} + 1` })
          .where(eq(whatsAppCampaigns.id, msg.campaignId));
      } else if (params.status === "failed") {
        await db
          .update(whatsAppCampaigns)
          .set({ failedCount: sql`${whatsAppCampaigns.failedCount} + 1` })
          .where(eq(whatsAppCampaigns.id, msg.campaignId));
      }
    } catch {
      // Non-fatal if campaign counter update fails
    }
  }
}
