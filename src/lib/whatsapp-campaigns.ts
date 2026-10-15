import { db } from "@/db";
import {
  whatsAppCampaigns,
  whatsAppCampaignRecipients,
  whatsAppContacts,
  whatsAppConversations,
  whatsAppTemplates,
} from "@/db/schema";
import { eq, and, sql, desc, inArray, gte, lte } from "drizzle-orm";
import {
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
  getMetaConfig,
  normalizePhoneNumber,
} from "./whatsapp";
import { getOrCreateConversation, recordOutboundMessage } from "./whatsapp-contacts";

export interface AudienceCriteria {
  segment?: "ALL" | "ANNADANA" | "SPONSOR_25_BOYS" | "HIGH_VALUE" | "MONTHLY_DONORS" | "INACTIVE_60_DAYS" | "CUSTOM";
  minDonation?: number;
  maxDonation?: number;
  tags?: string[];
  preferredLanguage?: "en" | "kn";
}

/**
 * Evaluates audience criteria and returns eligible contacts strictly respecting opt-in status.
 */
export async function getEligibleAudience(criteria: AudienceCriteria): Promise<Array<typeof whatsAppContacts.$inferSelect>> {
  // Query all opted-in contacts
  const allContacts = await db
    .select()
    .from(whatsAppContacts)
    .where(eq(whatsAppContacts.optInStatus, true));

  return allContacts.filter((contact) => {
    // Double safeguard on opt-out timestamp
    if (contact.optOutAt !== null) return false;

    // Language filter if specified
    if (criteria.preferredLanguage && contact.preferredLanguage !== criteria.preferredLanguage) {
      return false;
    }

    const tags = Array.isArray(contact.tags) ? (contact.tags as string[]) : [];
    const donation = contact.lastDonationAmount || 0;

    // Segment Filter
    switch (criteria.segment) {
      case "ANNADANA":
        return (
          tags.includes("ANNADANA") ||
          (contact.lastSevaType && contact.lastSevaType.toLowerCase().includes("annadana"))
        );
      case "SPONSOR_25_BOYS":
        return (
          tags.includes("SPONSOR_25_BOYS") ||
          tags.includes("DONOR") ||
          (contact.lastSevaType && contact.lastSevaType.toLowerCase().includes("25"))
        );
      case "HIGH_VALUE":
        return donation >= (criteria.minDonation || 5000);
      case "MONTHLY_DONORS":
        return tags.includes("MONTHLY_DONOR") || tags.includes("SUBSCRIPTION");
      case "INACTIVE_60_DAYS":
        if (!contact.lastDonationAt) return false;
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        return new Date(contact.lastDonationAt) < sixtyDaysAgo;
      case "CUSTOM":
        if (criteria.minDonation && donation < criteria.minDonation) return false;
        if (criteria.maxDonation && donation > criteria.maxDonation) return false;
        if (criteria.tags && criteria.tags.length > 0) {
          const hasTag = criteria.tags.some((t) => tags.includes(t));
          if (!hasTag) return false;
        }
        return true;
      case "ALL":
      default:
        return true;
    }
  });
}

/**
 * Creates a new Broadcast Campaign and populates the send queue
 */
export async function createBroadcastCampaign(params: {
  name: string;
  purpose?: string;
  templateId?: number;
  templateName?: string;
  customText?: string;
  audienceCriteria: AudienceCriteria;
  createdBy?: number;
  scheduledAt?: Date;
}): Promise<typeof whatsAppCampaigns.$inferSelect> {
  // 1. Evaluate Audience
  const eligible = await getEligibleAudience(params.audienceCriteria);

  // 2. Insert Campaign Record
  const [campaign] = await db
    .insert(whatsAppCampaigns)
    .values({
      name: params.name,
      purpose: params.purpose || "ANNADANA_APPEAL",
      templateId: params.templateId || null,
      templateName: params.templateName || null,
      audienceCriteria: params.audienceCriteria,
      status: "DRAFT",
      totalRecipients: eligible.length,
      eligibleRecipients: eligible.length,
      suppressedRecipients: 0,
      queuedCount: eligible.length,
      createdBy: params.createdBy || null,
      scheduledAt: params.scheduledAt || null,
    })
    .returning();

  // 3. Populate Recipients Send Queue
  if (eligible.length > 0) {
    const recipientValues = eligible.map((contact) => ({
      campaignId: campaign.id,
      contactId: contact.id,
      status: "QUEUED",
      parameters: {
        customText: params.customText,
        donorName: contact.displayName || "Supporter",
        phone: contact.normalizedPhone,
      },
    }));

    // Batch insert in chunks of 500
    for (let i = 0; i < recipientValues.length; i += 500) {
      const chunk = recipientValues.slice(i, i + 500);
      await db.insert(whatsAppCampaignRecipients).values(chunk);
    }
  }

  return campaign;
}

/**
 * Durable Queue Dispatcher: Sends messages to queued recipients with rate-limiting
 */
export async function processCampaignSendQueue(
  campaignId: number,
  batchSize = 25
): Promise<{ processed: number; successCount: number; failCount: number; isCompleted: boolean }> {
  const campaign = await db
    .select()
    .from(whatsAppCampaigns)
    .where(eq(whatsAppCampaigns.id, campaignId))
    .limit(1)
    .then((r) => r[0]);

  if (!campaign) {
    throw new Error(`Campaign #${campaignId} not found`);
  }

  // Update status to PROCESSING
  await db
    .update(whatsAppCampaigns)
    .set({ status: "PROCESSING" })
    .where(eq(whatsAppCampaigns.id, campaignId));

  // Fetch pending recipients
  const queuedRecipients = await db
    .select({
      recipient: whatsAppCampaignRecipients,
      contact: whatsAppContacts,
    })
    .from(whatsAppCampaignRecipients)
    .innerJoin(whatsAppContacts, eq(whatsAppCampaignRecipients.contactId, whatsAppContacts.id))
    .where(
      and(
        eq(whatsAppCampaignRecipients.campaignId, campaignId),
        eq(whatsAppCampaignRecipients.status, "QUEUED")
      )
    )
    .limit(batchSize);

  if (queuedRecipients.length === 0) {
    // Campaign is complete!
    await db
      .update(whatsAppCampaigns)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
      })
      .where(eq(whatsAppCampaigns.id, campaignId));

    return { processed: 0, successCount: 0, failCount: 0, isCompleted: true };
  }

  const config = getMetaConfig();
  let successCount = 0;
  let failCount = 0;

  for (const item of queuedRecipients) {
    const { recipient, contact } = item;

    // Check opt-out safeguarding
    if (!contact.optInStatus || contact.optOutAt !== null) {
      await db
        .update(whatsAppCampaignRecipients)
        .set({
          status: "SUPPRESSED",
          failureReason: "Recipient opted out",
        })
        .where(eq(whatsAppCampaignRecipients.id, recipient.id));

      await db
        .update(whatsAppCampaigns)
        .set({
          suppressedRecipients: sql`${whatsAppCampaigns.suppressedRecipients} + 1`,
          queuedCount: sql`GREATEST(0, ${whatsAppCampaigns.queuedCount} - 1)`,
        })
        .where(eq(whatsAppCampaigns.id, campaignId));

      continue;
    }

    const conversation = await getOrCreateConversation(contact.id);
    const params = (recipient.parameters as any) || {};

    try {
      let wamId = "";

      // 1. Template Send if template name provided
      if (campaign.templateName && config.accessToken && config.phoneNumberId) {
        const sendRes = await sendWhatsAppTemplateMessage({
          to: contact.normalizedPhone,
          templateName: campaign.templateName,
          languageCode: contact.preferredLanguage || "en",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: contact.displayName || "Noble Donor" },
              ],
            },
          ],
        });
        wamId = sendRes.wamId;
      } else if (params.customText && config.accessToken && config.phoneNumberId) {
        // 2. Direct Text Send
        const sendRes = await sendWhatsAppTextMessage({
          to: contact.normalizedPhone,
          text: params.customText,
        });
        wamId = sendRes.wamId;
      } else {
        // Mock wamId for staging/development without active Meta tokens
        wamId = `camp_${campaignId}_${recipient.id}_${Date.now()}`;
      }

      // Record outbound message
      const msg = await recordOutboundMessage({
        contactId: contact.id,
        conversationId: conversation.id,
        wamId,
        messageType: campaign.templateName ? "template" : "text",
        content: params.customText || `Template: ${campaign.templateName}`,
        templateName: campaign.templateName || undefined,
        campaignId: campaign.id,
        status: "SENT",
      });

      // Update Recipient State
      await db
        .update(whatsAppCampaignRecipients)
        .set({
          status: "SENT",
          messageId: msg.id,
          wamId,
          sentAt: new Date(),
        })
        .where(eq(whatsAppCampaignRecipients.id, recipient.id));

      // Update Campaign Counters
      await db
        .update(whatsAppCampaigns)
        .set({
          sentCount: sql`${whatsAppCampaigns.sentCount} + 1`,
          queuedCount: sql`GREATEST(0, ${whatsAppCampaigns.queuedCount} - 1)`,
        })
        .where(eq(whatsAppCampaigns.id, campaignId));

      successCount++;
    } catch (err: any) {
      failCount++;
      const errorMsg = err?.message || "Send failed";

      await db
        .update(whatsAppCampaignRecipients)
        .set({
          status: "FAILED",
          failureReason: errorMsg,
        })
        .where(eq(whatsAppCampaignRecipients.id, recipient.id));

      await db
        .update(whatsAppCampaigns)
        .set({
          failedCount: sql`${whatsAppCampaigns.failedCount} + 1`,
          queuedCount: sql`GREATEST(0, ${whatsAppCampaigns.queuedCount} - 1)`,
        })
        .where(eq(whatsAppCampaigns.id, campaignId));
    }

    // Gentle rate-limiting delay (50ms) to respect Meta throughput limit
    await new Promise((r) => setTimeout(r, 50));
  }

  // Check remaining count
  const remaining = await db
    .select({ count: sql<number>`count(*)` })
    .from(whatsAppCampaignRecipients)
    .where(
      and(
        eq(whatsAppCampaignRecipients.campaignId, campaignId),
        eq(whatsAppCampaignRecipients.status, "QUEUED")
      )
    )
    .then((r) => Number(r[0]?.count || 0));

  const isCompleted = remaining === 0;
  if (isCompleted) {
    await db
      .update(whatsAppCampaigns)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
      })
      .where(eq(whatsAppCampaigns.id, campaignId));
  }

  return {
    processed: queuedRecipients.length,
    successCount,
    failCount,
    isCompleted,
  };
}
