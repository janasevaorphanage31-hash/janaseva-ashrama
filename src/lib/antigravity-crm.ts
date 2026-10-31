import { db, ensureDbSchema } from "@/db";
import { agTelecallers, agLeads, agCallLogs, agDonations, contentEntries, influencerProfiles } from "@/db/schema";
import { eq, and, or, sql, desc, inArray, isNull } from "drizzle-orm";
import { hashPassword } from "@/lib/admin-auth";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";
import { signCallerToken } from "@/lib/caller-auth";
import {
  generateAntiBanMessage,
  CURATED_OUTREACH_MEDIA,
  type AntiBanLanguage,
  type OutreachAngle,
  type AntiBanMediaAsset,
} from "@/lib/whatsapp-antiban";

export interface CrmWhatsAppSettings {
  masterWhatsAppNumber: string;
  senderMode: "central" | "individual";
  defaultLanguage: AntiBanLanguage;
  defaultAngle: OutreachAngle;
  enableAntiBan: boolean;
  updatedAt?: string;
}

export const DEFAULT_CRM_WHATSAPP_SETTINGS: CrmWhatsAppSettings = {
  masterWhatsAppNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+919980359595",
  senderMode: "central",
  defaultLanguage: "kanglish",
  defaultAngle: "annadana",
  enableAntiBan: true,
};

export async function getCrmWhatsAppSettings(): Promise<CrmWhatsAppSettings> {
  await ensureDbSchema();
  try {
    const [entry] = await db
      .select({ body: contentEntries.body })
      .from(contentEntries)
      .where(and(eq(contentEntries.type, "crm_settings"), eq(contentEntries.slug, "whatsapp_config")))
      .limit(1);

    if (entry?.body) {
      const parsed = JSON.parse(entry.body);
      return {
        ...DEFAULT_CRM_WHATSAPP_SETTINGS,
        ...parsed,
      };
    }
  } catch (err) {
    console.error("Error reading crm_whatsapp_settings from DB:", err);
  }
  return DEFAULT_CRM_WHATSAPP_SETTINGS;
}

export async function saveCrmWhatsAppSettings(
  updates: Partial<CrmWhatsAppSettings>
): Promise<CrmWhatsAppSettings> {
  await ensureDbSchema();
  const current = await getCrmWhatsAppSettings();
  const updated: CrmWhatsAppSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const serialized = JSON.stringify(updated);

  const [existing] = await db
    .select({ id: contentEntries.id })
    .from(contentEntries)
    .where(and(eq(contentEntries.type, "crm_settings"), eq(contentEntries.slug, "whatsapp_config")))
    .limit(1);

  if (existing) {
    await db
      .update(contentEntries)
      .set({
        body: serialized,
        updatedAt: new Date(),
      })
      .where(eq(contentEntries.id, existing.id));
  } else {
    await db.insert(contentEntries).values({
      type: "crm_settings",
      slug: "whatsapp_config",
      title: "CRM WhatsApp Outreach Configuration",
      body: serialized,
      status: "PUBLISHED",
    });
  }

  return updated;
}

export interface TelecallerStats {
  callerId: string;
  name: string;
  whatsappNumber: string;
  email?: string;
  isActive: boolean;
  dailyQuota: number;
  assignedCount: number;
  contactedCount: number;
  convertedCount: number;
  conversionRate: number;
  totalDonationAmount: number;
  rank: number;
  exportToken?: string;
}

let telecallersSeeded = false;

/**
 * 1. Seeds 15 telecallers (TC01 to TC15) and realistic birthday leads if tables are fresh.
 */
export async function ensureTelecallersAndSeedData(forceCheck = false) {
  if (telecallersSeeded && !forceCheck) return;
  await ensureDbSchema();
  const existing = await db.select({ count: sql<number>`count(*)` }).from(agTelecallers);
  const count = Number(existing[0]?.count || 0);

  if (count === 0) {
    const defaultHash = hashPassword("ashrama@123");

    const callersData = [
      { id: "TC01", name: "Ananya Sharma", phone: "9845011001", email: "tc01@janaseva.org" },
      { id: "TC02", name: "Ramesh Hegde", phone: "9845011002", email: "tc02@janaseva.org" },
      { id: "TC03", name: "Kavitha Rao", phone: "9845011003", email: "tc03@janaseva.org" },
      { id: "TC04", name: "Suresh Gowda", phone: "9845011004", email: "tc04@janaseva.org" },
      { id: "TC05", name: "Pooja Kulkarni", phone: "9845011005", email: "tc05@janaseva.org" },
      { id: "TC06", name: "Venkatesh Prasad", phone: "9845011006", email: "tc06@janaseva.org" },
      { id: "TC07", name: "Divya Nair", phone: "9845011007", email: "tc07@janaseva.org" },
      { id: "TC08", name: "Manjunath Swamy", phone: "9845011008", email: "tc08@janaseva.org" },
      { id: "TC09", name: "Sowmya Bhat", phone: "9845011009", email: "tc09@janaseva.org" },
      { id: "TC10", name: "Girish Kumar", phone: "9845011010", email: "tc10@janaseva.org" },
      { id: "TC11", name: "Deepa Narayan", phone: "9845011011", email: "tc11@janaseva.org" },
      { id: "TC12", name: "Chethan Reddy", phone: "9845011012", email: "tc12@janaseva.org" },
      { id: "TC13", name: "Aishwarya Shenoy", phone: "9845011013", email: "tc13@janaseva.org" },
      { id: "TC14", name: "Raghavendra Joshi", phone: "9845011014", email: "tc14@janaseva.org" },
      { id: "TC15", name: "Meenakshi Iyengar", phone: "9845011015", email: "tc15@janaseva.org" },
    ];

    for (const c of callersData) {
      await db.insert(agTelecallers).values({
        callerId: c.id,
        name: c.name,
        whatsappNumber: c.phone,
        email: c.email,
        passwordHash: defaultHash,
        dailyQuota: 50,
        isActive: true,
      });
    }

    // Seed realistic birthday leads matching today, tomorrow, and upcoming days
    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomDay = tomorrow.getDate();
    const tomMonth = tomorrow.getMonth() + 1;

    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const dayAfterDay = dayAfter.getDate();
    const dayAfterMonth = dayAfter.getMonth() + 1;

    const sampleLeads = [
      { name: "Vijayendra Patil", phone: "9980123456", day: todayDay, month: todayMonth },
      { name: "Dr. Rohini Deshmukh", phone: "9886234567", day: todayDay, month: todayMonth },
      { name: "Srinivas Murthy", phone: "9448345678", day: todayDay, month: todayMonth },
      { name: "Ashok Sundaram", phone: "9845456789", day: todayDay, month: todayMonth },
      { name: "Lakshmi Narayana", phone: "9900567890", day: todayDay, month: todayMonth },
      { name: "Chandrashekar H.", phone: "9741678901", day: tomDay, month: tomMonth },
      { name: "Gayatri Ramanathan", phone: "9844789012", day: tomDay, month: tomMonth },
      { name: "Karthik Vaidyanathan", phone: "9611890123", day: tomDay, month: tomMonth },
      { name: "Nirmala Someshwar", phone: "9945901234", day: tomDay, month: tomMonth },
      { name: "Praveen Jagadish", phone: "9880012345", day: dayAfterDay, month: dayAfterMonth },
      { name: "Shashikala Rao", phone: "9845123456", day: dayAfterDay, month: dayAfterMonth },
      { name: "Harishchandra Shetty", phone: "9731234567", day: dayAfterDay, month: dayAfterMonth },
      { name: "Bhavani Shankar", phone: "9986345678", day: dayAfterDay, month: dayAfterMonth },
      { name: "Rajshekar Alva", phone: "9449456789", day: dayAfterDay, month: dayAfterMonth },
      { name: "Vidya Prasanna", phone: "9901567890", day: dayAfterDay, month: dayAfterMonth },
    ];

    for (const l of sampleLeads) {
      await db.insert(agLeads).values({
        name: l.name,
        phone: l.phone,
        dobDay: l.day,
        dobMonth: l.month,
        status: "Pending",
      });
    }

    // Automatically trigger initial round-robin routing
    await distributeBirthdayLeads();
  }
  telecallersSeeded = true;
}

/**
 * 2. Round-Robin Birthday Lead Routing (Today, Tomorrow, Day+2)
 */
export async function distributeBirthdayLeads() {
  await ensureTelecallersAndSeedData();
  const now = new Date();

  const targets = [0, 1, 2].map((offset) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return { day: d.getDate(), month: d.getMonth() + 1 };
  });

  const activeCallers = await db
    .select({ callerId: agTelecallers.callerId })
    .from(agTelecallers)
    .where(eq(agTelecallers.isActive, true))
    .orderBy(agTelecallers.callerId);

  if (activeCallers.length === 0) {
    return { distributed: 0, callersCount: 0, perCaller: {} };
  }

  const conditions = targets.map(
    (t) => sql`(${agLeads.dobMonth} = ${t.month} AND ${agLeads.dobDay} = ${t.day})`
  );

  const pendingLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(
      and(
        sql`(${sql.join(conditions, sql` OR `)})`,
        sql`(${agLeads.assignedCallerId} IS NULL OR ${agLeads.status} = 'Pending')`
      )
    );

  if (pendingLeads.length === 0) {
    return { distributed: 0, callersCount: activeCallers.length, perCaller: {} };
  }

  const ids = pendingLeads.map((l) => l.leadId);
  const result = await distributeSpecificLeads(ids, "balanced");

  return { distributed: result.distributed, callersCount: activeCallers.length, perCaller: result.perCaller };
}

/**
 * 3. Fetch Assigned Leads for a Telecaller (or All Leads if callerId === "ALL" or empty)
 */
export async function getAssignedLeads(callerId?: string | null, limit = 10000) {
  await ensureTelecallersAndSeedData();
  const cid = (callerId || "").trim().toUpperCase();
  if (!cid || cid === "ALL") {
    return db
      .select()
      .from(agLeads)
      .orderBy(agLeads.dobMonth, agLeads.dobDay, desc(agLeads.leadId))
      .limit(limit);
  }
  return db
    .select()
    .from(agLeads)
    .where(eq(agLeads.assignedCallerId, cid))
    .orderBy(agLeads.dobMonth, agLeads.dobDay, desc(agLeads.leadId))
    .limit(limit);
}

/**
 * 3b. Fetch Caller Portal Data (Assigned Leads + Realtime SQL Aggregated Stats)
 * Allows telecallers to load their verified stats directly without calling admin-only endpoints.
 */
export async function getCallerPortalData(callerId?: string | null, limit = 10000) {
  await ensureTelecallersAndSeedData();
  const cid = (callerId || "").trim().toUpperCase();

  const leads = await getAssignedLeads(cid, limit);

  // SQL-indexed aggregate metrics for this specific caller
  const callerCondition = cid && cid !== "ALL" ? eq(agLeads.assignedCallerId, cid) : sql`1=1`;
  const [leadStats] = await db
    .select({
      totalAssigned: sql<number>`count(*)`,
      contactedCount: sql<number>`count(*) filter (where ${agLeads.status} IS NOT NULL and ${agLeads.status} != 'Pending')`,
      convertedCount: sql<number>`count(*) filter (where ${agLeads.status} = 'Donated')`,
      pendingCount: sql<number>`count(*) filter (where ${agLeads.status} = 'Pending' or ${agLeads.status} IS NULL)`,
      interestedCount: sql<number>`count(*) filter (where ${agLeads.status} = 'Interested')`,
      rescheduleCount: sql<number>`count(*) filter (where ${agLeads.status} = 'Reschedule')`,
    })
    .from(agLeads)
    .where(callerCondition);

  const donationCondition = cid && cid !== "ALL" ? eq(agDonations.callerRefId, cid) : sql`1=1`;
  const [revRow] = await db
    .select({
      totalRevenue: sql<number>`coalesce(sum(${agDonations.amount}), 0)`,
    })
    .from(agDonations)
    .where(donationCondition);

  return {
    leads,
    stats: {
      totalAssigned: Number(leadStats?.totalAssigned || 0),
      contactedCount: Number(leadStats?.contactedCount || 0),
      convertedCount: Number(leadStats?.convertedCount || 0),
      pendingCount: Number(leadStats?.pendingCount || 0),
      interestedCount: Number(leadStats?.interestedCount || 0),
      rescheduleCount: Number(leadStats?.rescheduleCount || 0),
      totalRevenue: Number(revRow?.totalRevenue || 0),
    },
  };
}

/**
 * 4. Log Call Disposition & Notes
 */
export async function logCallDisposition(
  leadId: number,
  callerId: string,
  disposition: string,
  notes?: string,
  callbackTime?: string | null
) {
  // Insert call history log
  await db.insert(agCallLogs).values({
    leadId,
    callerId,
    disposition,
    notes: notes || null,
    callbackTime: callbackTime ? new Date(callbackTime) : null,
  });

  // Update lead current status
  await db
    .update(agLeads)
    .set({
      status: disposition,
      rescheduleDate: callbackTime ? new Date(callbackTime) : null,
      lastContactedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agLeads.leadId, leadId));

  return { success: true };
}

/**
 * 5. Generate WhatsApp Click-To-Chat URL with Anti-Ban Protection, Media, & Unique Tracking
 */
export async function generateWhatsAppLink(
  leadId: number,
  callerId: string,
  baseUrl?: string,
  options?: {
    language?: AntiBanLanguage;
    angle?: OutreachAngle;
    mediaId?: string;
    senderMode?: "central" | "individual";
    amount?: number;
  }
) {
  const [lead] = await db.select().from(agLeads).where(eq(agLeads.leadId, leadId)).limit(1);
  if (!lead) throw new Error("Lead not found");

  const [caller] = await db
    .select()
    .from(agTelecallers)
    .where(eq(agTelecallers.callerId, callerId.toUpperCase()))
    .limit(1);

  const callerName = caller?.name || "Janaseva Ashrama Volunteer";
  const callerWhatsApp = caller?.whatsappNumber ? caller.whatsappNumber.replace(/\D/g, "").slice(-10) : "";

  const customerPhoneInfo = parseCustomerPhone(lead.phone);
  const formattedPhone = customerPhoneInfo.waNumber;
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://www.janasevaorphanage.org";

  const settings = await getCrmWhatsAppSettings();
  const effectiveSenderMode = options?.senderMode || settings.senderMode || "central";

  const generated = generateAntiBanMessage({
    donorName: lead.name,
    callerId: callerId.toUpperCase(),
    callerName,
    language: options?.language || settings.defaultLanguage || "kanglish",
    angle: options?.angle || settings.defaultAngle || "annadana",
    mediaId: options?.mediaId || "annadana_feast",
    amount: options?.amount,
    baseUrl: siteUrl,
  });

  const masterClean = settings.masterWhatsAppNumber.replace(/\D/g, "");
  const activeSender =
    effectiveSenderMode === "central"
      ? (masterClean.startsWith("91") ? masterClean : `91${masterClean.slice(-10)}`)
      : (callerWhatsApp ? `91${callerWhatsApp}` : (masterClean.startsWith("91") ? masterClean : `91${masterClean.slice(-10)}`));

  return {
    leadName: lead.name,
    phone: formattedPhone,
    messageText: generated.messageText,
    captionText: generated.captionText,
    actionButtons: generated.actionButtons,
    mapsUrl: generated.mapsUrl,
    ashramaAddress: generated.ashramaAddress,
    whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(generated.messageText)}`,
    trackingRef: callerId.toUpperCase(),
    saltToken: generated.saltToken,
    greeting: generated.greeting,
    language: generated.language,
    angle: generated.angle,
    mediaAsset: generated.mediaAsset,
    senderMode: effectiveSenderMode,
    activeSenderNumber: activeSender,
    masterWhatsAppNumber: settings.masterWhatsAppNumber,
    availableMedia: CURATED_OUTREACH_MEDIA,
  };
}

/**
 * 6. Record Gateway Webhook Payment Attribution
 */
export async function recordPaymentAttribution(data: {
  txnId: string;
  gatewayOrderId: string;
  amount: number;
  callerRefId?: string | null;
  leadId?: number | null;
  donorName?: string | null;
  donorPhone?: string | null;
  donorEmail?: string | null;
  metadata?: any;
}) {
  const cleanRef = data.callerRefId ? data.callerRefId.toUpperCase() : null;

  // Insert or ignore duplicate txn
  await db
    .insert(agDonations)
    .values({
      txnId: data.txnId,
      gatewayOrderId: data.gatewayOrderId,
      amount: Math.round(data.amount),
      currency: "INR",
      paymentStatus: "captured",
      callerRefId: cleanRef,
      leadId: data.leadId || null,
      donorName: data.donorName || null,
      donorPhone: data.donorPhone || null,
      donorEmail: data.donorEmail || null,
      metadata: data.metadata || null,
    })
    .onConflictDoNothing({ target: agDonations.txnId });

  // If lead is linked, mark as Donated
  if (data.leadId) {
    await db
      .update(agLeads)
      .set({ status: "Donated", updatedAt: new Date() })
      .where(eq(agLeads.leadId, data.leadId));
  }

  return { success: true, txnId: data.txnId, callerRefId: cleanRef };
}

/**
 * 7. Super Admin Leaderboard & Conversion Metrics
 * High-performance SQL aggregation: zero full table scans into memory.
 */
export async function getAdminLeaderboard(): Promise<{
  callers: TelecallerStats[];
  totalLeads: number;
  totalDonations: number;
  totalRevenue: number;
  crmWhatsAppSettings: CrmWhatsAppSettings;
}> {
  // Ensure tables and telecallers exist
  await ensureTelecallersAndSeedData();

  const allCallers = await db.select().from(agTelecallers).orderBy(agTelecallers.callerId);

  // 1. Total leads count
  const [totalLeadsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agLeads);
  const totalLeads = Number(totalLeadsResult?.count || 0);

  // 2. Lead counts grouped by assignedCallerId and status (Index Scan)
  const leadStatsRows = await db
    .select({
      callerId: agLeads.assignedCallerId,
      status: agLeads.status,
      count: sql<number>`count(*)`,
    })
    .from(agLeads)
    .where(sql`${agLeads.assignedCallerId} IS NOT NULL`)
    .groupBy(agLeads.assignedCallerId, agLeads.status);

  // 3. Donation stats
  const [donationAgg] = await db
    .select({
      count: sql<number>`count(*)`,
      totalRevenue: sql<number>`coalesce(sum(${agDonations.amount}), 0)`,
    })
    .from(agDonations);
  const totalDonations = Number(donationAgg?.count || 0);
  const totalRevenue = Number(donationAgg?.totalRevenue || 0);

  // 4. Donations grouped by callerRefId
  const callerDonationRows = await db
    .select({
      callerRefId: agDonations.callerRefId,
      totalAmount: sql<number>`coalesce(sum(${agDonations.amount}), 0)`,
    })
    .from(agDonations)
    .where(sql`${agDonations.callerRefId} IS NOT NULL`)
    .groupBy(agDonations.callerRefId);

  const donationsByCaller: Record<string, number> = {};
  for (const row of callerDonationRows) {
    if (row.callerRefId) {
      donationsByCaller[row.callerRefId] = Number(row.totalAmount || 0);
    }
  }

  const assignedByCaller: Record<string, number> = {};
  const contactedByCaller: Record<string, number> = {};
  const convertedByCaller: Record<string, number> = {};

  for (const row of leadStatsRows) {
    if (!row.callerId) continue;
    const cnt = Number(row.count || 0);
    assignedByCaller[row.callerId] = (assignedByCaller[row.callerId] || 0) + cnt;
    if (row.status !== "Pending") {
      contactedByCaller[row.callerId] = (contactedByCaller[row.callerId] || 0) + cnt;
    }
    if (row.status === "Donated") {
      convertedByCaller[row.callerId] = (convertedByCaller[row.callerId] || 0) + cnt;
    }
  }

  const statsList: TelecallerStats[] = allCallers.map((c) => {
    const assigned = assignedByCaller[c.callerId] || 0;
    const contacted = contactedByCaller[c.callerId] || 0;
    const converted = convertedByCaller[c.callerId] || 0;
    const totalAmount = donationsByCaller[c.callerId] || 0;
    const rate = assigned > 0 ? (converted / assigned) * 100 : 0;

    return {
      callerId: c.callerId,
      name: c.name,
      whatsappNumber: c.whatsappNumber,
      email: c.email,
      isActive: c.isActive,
      dailyQuota: c.dailyQuota,
      assignedCount: assigned,
      contactedCount: contacted,
      convertedCount: converted,
      conversionRate: Math.round(rate * 10) / 10,
      totalDonationAmount: totalAmount,
      rank: 0,
      exportToken: signCallerToken(c.callerId),
    };
  });

  // Rank by Total Revenue descending, then Conversion Rate descending
  statsList.sort((a, b) => b.totalDonationAmount - a.totalDonationAmount || b.conversionRate - a.conversionRate);
  statsList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const crmWhatsAppSettings = await getCrmWhatsAppSettings();

  return {
    callers: statsList,
    totalLeads,
    totalDonations,
    totalRevenue,
    crmWhatsAppSettings,
  };
}

/**
 * 8. Bulk Reassign Leads
 */
export async function bulkReassignLeads(leadIds: number[], targetCallerId: string) {
  if (leadIds.length === 0) return { updated: 0 };

  await db
    .update(agLeads)
    .set({
      assignedCallerId: targetCallerId.toUpperCase(),
      updatedAt: new Date(),
    })
    .where(inArray(agLeads.leadId, leadIds));

  return { updated: leadIds.length, targetCallerId };
}

/**
 * 9. Add New Telecaller
 */
export async function addTelecaller(data: {
  callerId?: string;
  name: string;
  whatsappNumber: string;
  email?: string;
  password?: string;
  dailyQuota?: number;
}) {
  await ensureTelecallersAndSeedData();
  const allCallers = await db
    .select({ callerId: agTelecallers.callerId, email: agTelecallers.email })
    .from(agTelecallers);

  let callerId = (data.callerId || "").trim().toUpperCase();
  if (!callerId) {
    const numbers = allCallers
      .map((c) => parseInt(c.callerId.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    callerId = `TC${String(maxNum + 1).padStart(2, "0")}`;
  }

  const exists = allCallers.some((c) => c.callerId === callerId);
  if (exists) {
    throw new Error(`Telecaller ID ${callerId} already exists. Please choose a different ID.`);
  }

  const cleanPhone = data.whatsappNumber.replace(/\D/g, "");
  if (cleanPhone.length < 10) {
    throw new Error("WhatsApp mobile number must have at least 10 digits.");
  }

  const email = (data.email || `${callerId.toLowerCase()}@janaseva.org`).trim().toLowerCase();
  const emailExists = allCallers.some((c) => (c.email || "").toLowerCase() === email);
  if (emailExists) {
    throw new Error(`Email address "${email}" is already used by another telecaller. Please specify a unique email.`);
  }

  const rawPassword =
    data.password && data.password.trim().length >= 4 ? data.password.trim() : "ashrama@123";
  const passwordHash = hashPassword(rawPassword);

  await db.insert(agTelecallers).values({
    callerId,
    name: data.name.trim(),
    whatsappNumber: cleanPhone.slice(-10),
    email,
    passwordHash,
    dailyQuota: data.dailyQuota || 50,
    isActive: true,
  });

  return { callerId, name: data.name, email };
}

/**
 * 10. Delete Telecaller (Unassigns leads and optionally redistributes them to active callers)
 */
export async function deleteTelecaller(callerId: string, redistributeLeads = true) {
  await ensureTelecallersAndSeedData();
  const cid = callerId.trim().toUpperCase();

  // Find all leads assigned to this caller
  const assignedLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(eq(agLeads.assignedCallerId, cid));

  if (assignedLeads.length > 0) {
    await db
      .update(agLeads)
      .set({ assignedCallerId: null, updatedAt: new Date() })
      .where(eq(agLeads.assignedCallerId, cid));
  }

  // Delete caller from agTelecallers
  await db.delete(agTelecallers).where(eq(agTelecallers.callerId, cid));

  let redistributedCount = 0;
  if (redistributeLeads && assignedLeads.length > 0) {
    const res = await distributeAllPendingLeads("balanced");
    redistributedCount = res.distributed;
  }

  return {
    success: true,
    deletedCallerId: cid,
    unassignedLeads: assignedLeads.length,
    redistributedCount,
  };
}

/**
 * 11. Toggle Telecaller Active Status
 */
export async function toggleTelecallerStatus(callerId: string, isActive: boolean, redistribute = true) {
  await ensureTelecallersAndSeedData();
  const cid = callerId.trim().toUpperCase();
  await db
    .update(agTelecallers)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(agTelecallers.callerId, cid));

  let redistributed = 0;
  if (!isActive && redistribute) {
    // Unassign pending leads
    await db
      .update(agLeads)
      .set({ assignedCallerId: null, updatedAt: new Date() })
      .where(and(eq(agLeads.assignedCallerId, cid), eq(agLeads.status, "Pending")));

    const res = await distributeAllPendingLeads("balanced");
    redistributed = res.distributed;
  }

  return { success: true, callerId: cid, isActive, redistributed };
}

/**
 * 12. Update Telecaller Details (Name, WhatsApp Number, Email, Quota, Active Status)
 */
export async function updateTelecallerDetails(
  callerId: string,
  updates: {
    name?: string;
    whatsappNumber?: string;
    email?: string;
    dailyQuota?: number;
    isActive?: boolean;
  }
) {
  await ensureTelecallersAndSeedData();
  const cid = callerId.trim().toUpperCase();

  const toSet: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (updates.name && updates.name.trim()) {
    toSet.name = updates.name.trim();
  }
  if (updates.whatsappNumber) {
    const clean = updates.whatsappNumber.replace(/\D/g, "");
    if (clean.length < 10) {
      throw new Error("WhatsApp number must have at least 10 digits.");
    }
    toSet.whatsappNumber = clean.slice(-10);
  }
  if (updates.email) {
    toSet.email = updates.email.trim().toLowerCase();
  }
  if (typeof updates.dailyQuota === "number" && updates.dailyQuota > 0) {
    toSet.dailyQuota = updates.dailyQuota;
  }
  if (typeof updates.isActive === "boolean") {
    toSet.isActive = updates.isActive;
  }

  await db
    .update(agTelecallers)
    .set(toSet)
    .where(eq(agTelecallers.callerId, cid));

  return { success: true, callerId: cid };
}

export interface LeadUploadItem {
  name: string;
  phone: string;
  email?: string;
  dobDay?: number | string;
  dobMonth?: number | string;
}

/**
 * 12. Bulk Upload Leads & Instant Equal Distribution with Complete Deduplication
 * - Deduplicates within the uploaded payload (removes internal duplicate numbers)
 * - Deduplicates against existing database leads (prevents multiple telecallers contacting same donor)
 */
export async function uploadBulkLeads(
  rawLeads: LeadUploadItem[],
  autoDistribute = true,
  mode: "balanced" | "round_robin" = "balanced"
) {
  await ensureTelecallersAndSeedData();
  if (!rawLeads || rawLeads.length === 0) {
    throw new Error("No lead records provided.");
  }

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;

  // 1. Extract 10-digit candidate phone numbers from this batch
  const candidatePhones = new Set<string>();
  for (const item of rawLeads) {
    const rawDigits = (item.phone || "").replace(/\D/g, "");
    if (rawDigits.length >= 10) {
      candidatePhones.add(rawDigits.slice(-10));
    }
  }

  // 2. Fast indexed database check ONLY for candidate numbers in this batch (uses ag_leads_phone_idx)
  const existingPhonesSet = new Set<string>();
  if (candidatePhones.size > 0) {
    const candidateArray = Array.from(candidatePhones);
    const BATCH_LOOKUP = 500;
    for (let i = 0; i < candidateArray.length; i += BATCH_LOOKUP) {
      const slice = candidateArray.slice(i, i + BATCH_LOOKUP);
      const existingRows = await db
        .select({ phone: agLeads.phone })
        .from(agLeads)
        .where(inArray(agLeads.phone, slice));
      for (const r of existingRows) {
        if (r.phone) {
          const digits = r.phone.replace(/\D/g, "").slice(-10);
          if (digits.length === 10) existingPhonesSet.add(digits);
        }
      }
    }
  }

  const validLeads = [];
  const seenInUpload = new Set<string>();
  let internalDuplicatesSkipped = 0;
  let alreadyInDbSkipped = 0;

  for (const item of rawLeads) {
    const rawName = (item.name || "").trim() || "Well-wisher";
    const rawDigits = (item.phone || "").replace(/\D/g, "");
    if (rawDigits.length < 10) continue;
    const phone10 = rawDigits.slice(-10);

    // Skip duplicate inside the current upload file
    if (seenInUpload.has(phone10)) {
      internalDuplicatesSkipped++;
      continue;
    }
    seenInUpload.add(phone10);

    // Skip if already in database
    if (existingPhonesSet.has(phone10)) {
      alreadyInDbSkipped++;
      continue;
    }

    let day = parseInt(String(item.dobDay || currentDay), 10);
    if (isNaN(day) || day < 1 || day > 31) day = currentDay;

    let month = parseInt(String(item.dobMonth || currentMonth), 10);
    if (isNaN(month) || month < 1 || month > 12) month = currentMonth;

    validLeads.push({
      name: rawName,
      phone: phone10,
      email: item.email ? item.email.trim() : null,
      dobDay: day,
      dobMonth: month,
      status: "Pending",
    });
  }

  if (validLeads.length === 0) {
    return {
      success: true,
      totalReceived: rawLeads.length,
      validParsed: seenInUpload.size,
      internalDuplicatesSkipped,
      alreadyInDbSkipped,
      validInserted: 0,
      distributed: 0,
      perCaller: {},
      insertedLeadIds: [] as number[],
      message: `No new leads to import. ${alreadyInDbSkipped} numbers already exist in database, and ${internalDuplicatesSkipped} duplicates were skipped.`,
    };
  }

  // Insert in batches of 500 for maximum throughput and safety
  const insertedLeadIds: number[] = [];
  const BATCH_SIZE = 500;
  for (let i = 0; i < validLeads.length; i += BATCH_SIZE) {
    const batch = validLeads.slice(i, i + BATCH_SIZE);
    const inserted = await db.insert(agLeads).values(batch).returning({ leadId: agLeads.leadId });
    insertedLeadIds.push(...inserted.map((r) => r.leadId));
  }

  let distributedSummary: Record<string, number> = {};
  if (autoDistribute && insertedLeadIds.length > 0) {
    const res = await distributeSpecificLeads(insertedLeadIds, mode);
    distributedSummary = res.perCaller;
  }

  return {
    success: true,
    totalReceived: rawLeads.length,
    validParsed: seenInUpload.size,
    internalDuplicatesSkipped,
    alreadyInDbSkipped,
    validInserted: validLeads.length,
    distributed: autoDistribute ? insertedLeadIds.length : 0,
    perCaller: distributedSummary,
    insertedLeadIds: autoDistribute ? [] : insertedLeadIds,
    message: `Successfully uploaded ${validLeads.length} unique leads (${alreadyInDbSkipped} already in database skipped, ${internalDuplicatesSkipped} file duplicates skipped).`,
  };
}

/**
 * 13. Agency-Grade Equal Distribution Algorithm
 * Balanced mode: dynamically balances workload across all active callers by assigning next leads to the caller with minimum pending load.
 * Round-robin mode: distributes via standard modular round-robin arithmetic.
 */
export async function distributeSpecificLeads(
  leadIds: number[],
  mode: "balanced" | "round_robin" = "balanced"
) {
  if (leadIds.length === 0) return { distributed: 0, perCaller: {} };

  const activeCallers = await db
    .select({ callerId: agTelecallers.callerId })
    .from(agTelecallers)
    .where(eq(agTelecallers.isActive, true))
    .orderBy(agTelecallers.callerId);

  if (activeCallers.length === 0) {
    throw new Error("Cannot distribute leads: No active telecallers found.");
  }

  const perCaller: Record<string, number> = {};
  const assignmentBuckets = new Map<string, number[]>();
  activeCallers.forEach((c) => {
    perCaller[c.callerId] = 0;
    assignmentBuckets.set(c.callerId, []);
  });

  if (mode === "balanced") {
    const pendingCounts = await db
      .select({
        callerId: agLeads.assignedCallerId,
        count: sql<number>`count(*)`,
      })
      .from(agLeads)
      .where(and(eq(agLeads.status, "Pending"), sql`${agLeads.assignedCallerId} IS NOT NULL`))
      .groupBy(agLeads.assignedCallerId);

    const loadMap = new Map<string, number>();
    activeCallers.forEach((c) => loadMap.set(c.callerId, 0));
    pendingCounts.forEach((p) => {
      if (p.callerId && loadMap.has(p.callerId)) {
        loadMap.set(p.callerId, Number(p.count));
      }
    });

    for (const leadId of leadIds) {
      let minCaller = activeCallers[0].callerId;
      let minLoad = loadMap.get(minCaller) ?? 0;

      for (const caller of activeCallers) {
        const load = loadMap.get(caller.callerId) ?? 0;
        if (load < minLoad) {
          minLoad = load;
          minCaller = caller.callerId;
        }
      }

      loadMap.set(minCaller, minLoad + 1);
      assignmentBuckets.get(minCaller)!.push(leadId);
      perCaller[minCaller] = (perCaller[minCaller] || 0) + 1;
    }
  } else {
    let idx = 0;
    for (const leadId of leadIds) {
      const callerId = activeCallers[idx % activeCallers.length].callerId;
      idx++;
      assignmentBuckets.get(callerId)!.push(leadId);
      perCaller[callerId] = (perCaller[callerId] || 0) + 1;
    }
  }

  // Robust sequential batch update using inArray (1,000 per batch prevents connection pool strain)
  const BATCH_SIZE = 1000;
  for (const [callerId, ids] of assignmentBuckets.entries()) {
    if (ids.length === 0) continue;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);
      await db
        .update(agLeads)
        .set({
          assignedCallerId: callerId,
          status: "Pending",
          updatedAt: new Date(),
        })
        .where(inArray(agLeads.leadId, chunk));
    }
  }

  return { distributed: leadIds.length, perCaller };
}

/**
 * 13b. Distribute Only Unassigned Leads (assignedCallerId IS NULL)
 * Used after chunked lead upload to assign newly ingested leads without altering existing callers' workloads.
 */
export async function distributeUnassignedLeads(mode: "balanced" | "round_robin" = "balanced") {
  const unassigned = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(isNull(agLeads.assignedCallerId))
    .orderBy(agLeads.leadId);

  if (unassigned.length === 0) {
    return { distributed: 0, perCaller: {} };
  }

  const ids = unassigned.map((l) => l.leadId);
  return distributeSpecificLeads(ids, mode);
}

/**
 * 14. Distribute All Unassigned or Pending Leads Equally
 */
export async function distributeAllPendingLeads(mode: "balanced" | "round_robin" = "balanced") {
  const pendingLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(or(isNull(agLeads.assignedCallerId), eq(agLeads.status, "Pending")));

  if (pendingLeads.length === 0) {
    return { distributed: 0, perCaller: {} };
  }

  const ids = pendingLeads.map((l) => l.leadId);
  return distributeSpecificLeads(ids, mode);
}

/**
 * 14b. Reset All Leads for Daily Limit / Queue
 * - Keeps actual 'Donated' donors intact
 * - Resets all pending, reschedule, and non-donated leads back to 'Pending'
 * - Mathematically rebalances them across active telecallers so callers start fresh with their daily targets
 */
export async function resetDailyQuotaLeads(mode: "balanced" | "round_robin" = "balanced") {
  await ensureTelecallersAndSeedData();

  const activeCallers = await db
    .select({ callerId: agTelecallers.callerId })
    .from(agTelecallers)
    .where(eq(agTelecallers.isActive, true))
    .orderBy(agTelecallers.callerId);

  if (activeCallers.length === 0) {
    throw new Error("Cannot reset daily queue: No active telecallers found.");
  }

  // Find all leads that are NOT 'Donated'
  const nonDonatedLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(or(isNull(agLeads.status), sql`${agLeads.status} != 'Donated'`));

  if (nonDonatedLeads.length === 0) {
    return {
      success: true,
      resetCount: 0,
      distributed: 0,
      perCaller: {},
      message: "No uncompleted leads to reset.",
    };
  }

  const ids = nonDonatedLeads.map((l) => l.leadId);
  const dist = await distributeSpecificLeads(ids, mode);

  return {
    success: true,
    resetCount: ids.length,
    distributed: dist.distributed,
    perCaller: dist.perCaller,
    message: `Daily queue reset successfully: ${dist.distributed} leads refreshed to 'Pending' and balanced across ${activeCallers.length} active telecallers.`,
  };
}

/**
 * 14c. Complete Wipe of All Leads & Call Logs
 * Retains telecaller login accounts (TC01-TC16) while clearing the leads queue completely for a fresh start.
 */
export async function deleteAllLeads() {
  await ensureDbSchema();
  // Clear call logs first due to foreign key constraint
  await db.delete(agCallLogs);
  await db.delete(agLeads);
  return {
    success: true,
    message: "All leads and call logs deleted. Telecaller staff accounts are preserved.",
  };
}

/**
 * 14d. Clear Demo Leads or Wipe Entire Leads Queue for Real Donor Data
 */
export async function clearDemoLeads(onlySample = false) {
  if (!onlySample) {
    return deleteAllLeads();
  }
  await ensureDbSchema();
  await db.delete(agCallLogs);
  await db.delete(agLeads).where(
    or(
      sql`${agLeads.name} LIKE 'Patron Donor%'`,
      sql`${agLeads.name} LIKE 'Sample%'`,
      sql`${agLeads.name} LIKE 'Test%'`,
      sql`${agLeads.phone} LIKE '9800000%'`
    )
  );
  return { success: true, message: "Sample test leads removed successfully." };
}

/**
 * 15. Agency-Grade CSV Export Generator
 */
export async function generateAgencyCSVExport(
  type: "performance" | "leads" | "donations" | "roster" | "caller_leads",
  callerId?: string
) {
  if (type === "caller_leads") {
    const targetCaller = (callerId || "").trim().toUpperCase();
    const query = db
      .select({
        leadId: agLeads.leadId,
        name: agLeads.name,
        phone: agLeads.phone,
        email: agLeads.email,
        dobDay: agLeads.dobDay,
        dobMonth: agLeads.dobMonth,
        status: agLeads.status,
        assignedCallerId: agLeads.assignedCallerId,
        lastContactedAt: agLeads.lastContactedAt,
        rescheduleDate: agLeads.rescheduleDate,
        createdAt: agLeads.createdAt,
      })
      .from(agLeads);

    const leads = targetCaller && targetCaller !== "ALL"
      ? await query.where(eq(agLeads.assignedCallerId, targetCaller)).orderBy(agLeads.dobMonth, agLeads.dobDay, desc(agLeads.leadId))
      : await query.orderBy(agLeads.dobMonth, agLeads.dobDay, desc(agLeads.leadId));

    const latestNotesMap = new Map<number, string>();
    const leadIds = leads.map((l) => l.leadId);
    if (leadIds.length > 0) {
      // Query recent call logs for these specific leads in safe chunks of 500
      for (let i = 0; i < Math.min(leadIds.length, 5000); i += 500) {
        const slice = leadIds.slice(i, i + 500);
        const callLogs = await db
          .select({ leadId: agCallLogs.leadId, notes: agCallLogs.notes })
          .from(agCallLogs)
          .where(inArray(agCallLogs.leadId, slice))
          .orderBy(desc(agCallLogs.createdAt));

        for (const log of callLogs) {
          if (!latestNotesMap.has(log.leadId) && log.notes) {
            latestNotesMap.set(log.leadId, log.notes);
          }
        }
      }
    }

    const rows = [
      [
        "Lead ID",
        "Donor Name",
        "Mobile Number",
        "Email",
        "Birthday Day",
        "Birthday Month",
        "Current Status",
        "Assigned Caller ID",
        "Latest Call Notes",
        "Last Contacted Date",
        "Scheduled Callback Date",
        "Assigned Date",
      ],
    ];

    for (const l of leads) {
      const latestNotes = latestNotesMap.get(l.leadId) || "";
      rows.push([
        String(l.leadId),
        `"${l.name.replace(/"/g, '""')}"`,
        `"+91${l.phone}"`,
        l.email ? `"${l.email.replace(/"/g, '""')}"` : '""',
        String(l.dobDay),
        String(l.dobMonth),
        l.status,
        l.assignedCallerId || "Unassigned",
        latestNotes ? `"${latestNotes.replace(/"/g, '""')}"` : '""',
        l.lastContactedAt ? l.lastContactedAt.toISOString().slice(0, 19).replace("T", " ") : "",
        l.rescheduleDate ? l.rescheduleDate.toISOString().slice(0, 19).replace("T", " ") : "",
        l.createdAt.toISOString().slice(0, 10),
      ]);
    }

    const fileSuffix = targetCaller ? `_${targetCaller}` : "";
    return {
      filename: `janaseva_assigned_leads${fileSuffix}_${new Date().toISOString().slice(0, 10)}.csv`,
      csv: rows.map((r) => r.join(",")).join("\n"),
    };
  }

  if (type === "performance") {
    const data = await getAdminLeaderboard();
    const rows = [
      [
        "Rank",
        "Caller ID",
        "Caller Name",
        "WhatsApp Mobile",
        "Email",
        "Status",
        "Daily Quota",
        "Assigned Leads",
        "Contacted Leads",
        "Contact Rate %",
        "Conversions (Donations)",
        "Conversion Rate %",
        "Total Attributed Revenue (INR)",
        "Avg Ticket Size (INR)",
      ],
    ];

    for (const c of data.callers) {
      const contactRate =
        c.assignedCount > 0 ? ((c.contactedCount / c.assignedCount) * 100).toFixed(1) : "0.0";
      const avgTicket =
        c.convertedCount > 0 ? Math.round(c.totalDonationAmount / c.convertedCount) : 0;
      rows.push([
        String(c.rank),
        c.callerId,
        `"${c.name.replace(/"/g, '""')}"`,
        `"+91${c.whatsappNumber}"`,
        c.email ? `"${c.email.replace(/"/g, '""')}"` : '""',
        c.isActive ? "Active" : "Inactive",
        String(c.dailyQuota || 50),
        String(c.assignedCount),
        String(c.contactedCount),
        `${contactRate}%`,
        String(c.convertedCount),
        `${c.conversionRate}%`,
        String(c.totalDonationAmount),
        String(avgTicket),
      ]);
    }

    return {
      filename: `janaseva_telecaller_agency_performance_${new Date().toISOString().slice(0, 10)}.csv`,
      csv: rows.map((r) => r.join(",")).join("\n"),
    };
  }

  if (type === "leads") {
    const leads = await db
      .select({
        leadId: agLeads.leadId,
        name: agLeads.name,
        phone: agLeads.phone,
        email: agLeads.email,
        dobDay: agLeads.dobDay,
        dobMonth: agLeads.dobMonth,
        status: agLeads.status,
        assignedCallerId: agLeads.assignedCallerId,
        lastContactedAt: agLeads.lastContactedAt,
        rescheduleDate: agLeads.rescheduleDate,
        createdAt: agLeads.createdAt,
      })
      .from(agLeads)
      .orderBy(agLeads.dobMonth, agLeads.dobDay, desc(agLeads.leadId));

    const callers = await db.select({ callerId: agTelecallers.callerId, name: agTelecallers.name }).from(agTelecallers);
    const callerNameMap = new Map<string, string>();
    callers.forEach((c) => callerNameMap.set(c.callerId, c.name));

    const callLogs = await db
      .select({ leadId: agCallLogs.leadId, notes: agCallLogs.notes, callbackTime: agCallLogs.callbackTime })
      .from(agCallLogs)
      .orderBy(desc(agCallLogs.createdAt));

    const callCountMap = new Map<number, number>();
    const latestNotesMap = new Map<number, string>();
    for (const log of callLogs) {
      callCountMap.set(log.leadId, (callCountMap.get(log.leadId) || 0) + 1);
      if (!latestNotesMap.has(log.leadId) && log.notes) {
        latestNotesMap.set(log.leadId, log.notes);
      }
    }

    const rows = [
      [
        "Lead ID",
        "Lead Name",
        "Phone Number",
        "Email",
        "Birthday Day",
        "Birthday Month",
        "Call Disposition Status",
        "Assigned Caller ID",
        "Assigned Caller Name",
        "Total Calls Made",
        "Latest Call Notes",
        "Last Contacted Date",
        "Reschedule Callback Date",
        "Created Date",
      ],
    ];

    for (const l of leads) {
      const callerName = l.assignedCallerId ? (callerNameMap.get(l.assignedCallerId) || l.assignedCallerId) : "Unassigned";
      const totalCalls = callCountMap.get(l.leadId) || 0;
      const latestNotes = latestNotesMap.get(l.leadId) || "";

      rows.push([
        String(l.leadId),
        `"${l.name.replace(/"/g, '""')}"`,
        `"+91${l.phone}"`,
        l.email ? `"${l.email.replace(/"/g, '""')}"` : '""',
        String(l.dobDay),
        String(l.dobMonth),
        l.status,
        l.assignedCallerId || "Unassigned",
        `"${callerName.replace(/"/g, '""')}"`,
        String(totalCalls),
        latestNotes ? `"${latestNotes.replace(/"/g, '""')}"` : '""',
        l.lastContactedAt ? l.lastContactedAt.toISOString().slice(0, 19).replace("T", " ") : "",
        l.rescheduleDate ? l.rescheduleDate.toISOString().slice(0, 19).replace("T", " ") : "",
        l.createdAt.toISOString().slice(0, 10),
      ]);
    }

    return {
      filename: `janaseva_campaign_leads_registry_${new Date().toISOString().slice(0, 10)}.csv`,
      csv: rows.map((r) => r.join(",")).join("\n"),
    };
  }

  if (type === "roster") {
    const callers = await db.select().from(agTelecallers).orderBy(agTelecallers.callerId);
    const leaderboard = await getAdminLeaderboard();
    const statsMap = new Map(leaderboard.callers.map((c) => [c.callerId, c]));

    const rows = [
      [
        "Caller ID",
        "Full Name",
        "WhatsApp Mobile",
        "Email Address",
        "Account Status",
        "Daily Quota",
        "Assigned Leads",
        "Contacted Leads",
        "Conversions",
        "Conversion Rate %",
        "Total Attributed Revenue (INR)",
        "Created Date",
      ],
    ];

    for (const c of callers) {
      const stat = statsMap.get(c.callerId);
      rows.push([
        c.callerId,
        `"${c.name.replace(/"/g, '""')}"`,
        `"+91${c.whatsappNumber}"`,
        `"${c.email.replace(/"/g, '""')}"`,
        c.isActive ? "Active" : "Paused",
        String(c.dailyQuota || 50),
        String(stat?.assignedCount || 0),
        String(stat?.contactedCount || 0),
        String(stat?.convertedCount || 0),
        `${stat?.conversionRate || 0}%`,
        String(stat?.totalDonationAmount || 0),
        c.createdAt.toISOString().slice(0, 10),
      ]);
    }

    return {
      filename: `janaseva_telecaller_roster_${new Date().toISOString().slice(0, 10)}.csv`,
      csv: rows.map((r) => r.join(",")).join("\n"),
    };
  }

  // type === 'donations'
  const donations = await db.select().from(agDonations).orderBy(desc(agDonations.createdAt));

  const rows = [
    [
      "Transaction ID",
      "Gateway Order ID",
      "Amount (INR)",
      "Currency",
      "Payment Status",
      "Attributed Caller Ref ID",
      "Donor Name",
      "Donor Phone",
      "Donor Email",
      "Donation Date",
    ],
  ];

  for (const d of donations) {
    rows.push([
      d.txnId,
      d.gatewayOrderId,
      String(d.amount),
      d.currency,
      d.paymentStatus,
      d.callerRefId || "DIRECT",
      d.donorName ? `"${d.donorName.replace(/"/g, '""')}"` : '""',
      d.donorPhone ? `"+91${d.donorPhone}"` : '""',
      d.donorEmail ? `"${d.donorEmail.replace(/"/g, '""')}"` : '""',
      d.createdAt.toISOString().slice(0, 19).replace("T", " "),
    ]);
  }

  return {
    filename: `janaseva_attributed_donations_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
    csv: rows.map((r) => r.join(",")).join("\n"),
  };
}

/**
 * 16. Reset Telecaller Password
 */
export async function resetTelecallerPassword(callerId: string, newPassword: string) {
  await ensureTelecallersAndSeedData();
  const cid = callerId.trim().toUpperCase();
  if (!newPassword || newPassword.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }
  const passwordHash = hashPassword(newPassword);

  await db
    .update(agTelecallers)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(agTelecallers.callerId, cid));

  return { success: true, callerId: cid };
}

// ==============================================================================
// 17. INSTAGRAM INFLUENCER & CREATOR REFERRAL ENGINE
// ==============================================================================

export interface InfluencerStats {
  id: number;
  influencerCode: string;
  displayName: string;
  instagramHandle: string | null;
  whatsappNumber: string;
  targetGoalAmount: number;
  campaignStory: string | null;
  coverImageUrl: string | null;
  status: string;
  totalDonationAmount: number;
  totalDonorsCount: number;
  averageDonation: number;
  progressPercent: number;
  createdAt: string;
  referralLink: string;
  vanityLink: string;
  whatsappKitUrl: string;
  whatsappReportUrl: string;
}

export async function getInfluencerProfiles(baseUrl?: string): Promise<{
  influencers: InfluencerStats[];
  totalInfluencers: number;
  totalFundsRaised: number;
  totalDonors: number;
}> {
  await ensureDbSchema();
  const origin = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://janasevaashrama.org").replace(/\/$/, "");

  const profiles = await db
    .select()
    .from(influencerProfiles)
    .orderBy(desc(influencerProfiles.id));

  // Query aggregated donation stats grouped by callerRefId for all influencers
  const statsRows = await db
    .select({
      code: agDonations.callerRefId,
      totalAmount: sql<number>`coalesce(sum(${agDonations.amount}), 0)`,
      totalDonors: sql<number>`count(*)`,
    })
    .from(agDonations)
    .where(sql`${agDonations.callerRefId} IS NOT NULL`)
    .groupBy(agDonations.callerRefId);

  const statsMap = new Map<string, { totalAmount: number; totalDonors: number }>();
  statsRows.forEach((r) => {
    if (r.code) {
      statsMap.set(r.code.toUpperCase(), {
        totalAmount: Number(r.totalAmount || 0),
        totalDonors: Number(r.totalDonors || 0),
      });
    }
  });

  let grandTotalRaised = 0;
  let grandTotalDonors = 0;

  const influencers: InfluencerStats[] = profiles.map((p) => {
    const code = p.influencerCode.toUpperCase();
    const stat = statsMap.get(code) || { totalAmount: 0, totalDonors: 0 };
    grandTotalRaised += stat.totalAmount;
    grandTotalDonors += stat.totalDonors;

    const avg = stat.totalDonors > 0 ? Math.round(stat.totalAmount / stat.totalDonors) : 0;
    const goal = p.targetGoalAmount || 50000;
    const pct = Math.min(100, Math.round((stat.totalAmount / goal) * 100));

    const refLink = `${origin}/give?ref=${code}`;
    const vanityLink = `${origin}/campaigns/${code.toLowerCase()}`;

    // 1-Click WhatsApp Creator Kit (ready to send to influencer so they can share on IG)
    const kitText = encodeURIComponent(
      `Namaste ${p.displayName} ji! 🙏\n\n` +
      `Here is your official Janaseva Ashrama Instagram Campaign link:\n` +
      `🔗 ${refLink}\n\n` +
      `📌 Add this link to your Instagram Bio or Story sticker ("Support 25 Boys")!\n` +
      `Every donation gives donors 100% Section 80G tax benefits and provides hot meals to our 25 resident boys in Bangalore.\n\n` +
      `Track your live fundraising impact anytime at:\n` +
      `${vanityLink}`
    );
    const whatsappKitUrl = `https://wa.me/91${p.whatsappNumber.replace(/\D/g, "").slice(-10)}?text=${kitText}`;

    // 1-Click WhatsApp EOD Report Card (ready to send to influencer)
    const reportText = encodeURIComponent(
      `🌟 JANASEVA ASHRAMA × INFLUENCER IMPACT UPDATE 🌟\n\n` +
      `Namaste ${p.displayName} (${p.instagramHandle || "@creator"})! 🙏\n\n` +
      `Here is the latest live fundraising update from your audience:\n` +
      `💰 Total Funds Raised: ₹${stat.totalAmount.toLocaleString()}\n` +
      `🎯 Campaign Goal: ₹${goal.toLocaleString()} (${pct}% Achieved!)\n` +
      `👥 Generous Donors: ${stat.totalDonors} supporters\n` +
      `🍲 Wholesome Meals Sponsored: ${Math.round(stat.totalAmount / 50)} meals for our 25 resident boys\n\n` +
      `🔗 Live Campaign Tracker:\n${vanityLink}\n\n` +
      `Thank you for being a loving voice for our children! 👦✨`
    );
    const whatsappReportUrl = `https://wa.me/91${p.whatsappNumber.replace(/\D/g, "").slice(-10)}?text=${reportText}`;

    return {
      id: p.id,
      influencerCode: code,
      displayName: p.displayName,
      instagramHandle: p.instagramHandle,
      whatsappNumber: p.whatsappNumber,
      targetGoalAmount: goal,
      campaignStory: p.campaignStory,
      coverImageUrl: p.coverImageUrl,
      status: p.status,
      totalDonationAmount: stat.totalAmount,
      totalDonorsCount: stat.totalDonors,
      averageDonation: avg,
      progressPercent: pct,
      createdAt: p.createdAt.toISOString(),
      referralLink: refLink,
      vanityLink,
      whatsappKitUrl,
      whatsappReportUrl,
    };
  });

  return {
    influencers,
    totalInfluencers: profiles.length,
    totalFundsRaised: grandTotalRaised,
    totalDonors: grandTotalDonors,
  };
}

export async function createOrUpdateInfluencer(input: {
  influencerCode: string;
  displayName: string;
  instagramHandle?: string;
  whatsappNumber: string;
  targetGoalAmount?: number;
  campaignStory?: string;
  coverImageUrl?: string;
}) {
  await ensureDbSchema();
  const cleanCode = (input.influencerCode || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!cleanCode || cleanCode.length < 3) {
    throw new Error("Referral code must be at least 3 alphanumeric characters.");
  }

  const cleanName = (input.displayName || "").trim();
  if (!cleanName) throw new Error("Influencer name is required.");

  const cleanPhone = (input.whatsappNumber || "").replace(/\D/g, "").slice(-10);
  if (cleanPhone.length < 10) throw new Error("Valid 10-digit WhatsApp number required.");

  const goal = Math.max(1000, Number(input.targetGoalAmount || 50000));
  const handle = input.instagramHandle ? input.instagramHandle.trim().replace(/^@?/, "@") : null;

  const [existing] = await db
    .select({ id: influencerProfiles.id })
    .from(influencerProfiles)
    .where(eq(influencerProfiles.influencerCode, cleanCode))
    .limit(1);

  if (existing) {
    await db
      .update(influencerProfiles)
      .set({
        displayName: cleanName,
        instagramHandle: handle,
        whatsappNumber: cleanPhone,
        targetGoalAmount: goal,
        campaignStory: input.campaignStory || null,
        coverImageUrl: input.coverImageUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(influencerProfiles.id, existing.id));
    return { success: true, action: "updated", influencerCode: cleanCode };
  }

  await db.insert(influencerProfiles).values({
    influencerCode: cleanCode,
    displayName: cleanName,
    instagramHandle: handle,
    whatsappNumber: cleanPhone,
    targetGoalAmount: goal,
    campaignStory: input.campaignStory || null,
    coverImageUrl: input.coverImageUrl || null,
    status: "ACTIVE",
  });

  return { success: true, action: "created", influencerCode: cleanCode };
}

export async function toggleInfluencerStatus(influencerCode: string, status: "ACTIVE" | "PAUSED") {
  await ensureDbSchema();
  const cleanCode = influencerCode.trim().toUpperCase();
  await db
    .update(influencerProfiles)
    .set({ status, updatedAt: new Date() })
    .where(eq(influencerProfiles.influencerCode, cleanCode));
  return { success: true, influencerCode: cleanCode, status };
}

export async function getInfluencerDonations(influencerCode: string, limit = 1000) {
  await ensureDbSchema();
  const code = influencerCode.trim().toUpperCase();
  return db
    .select()
    .from(agDonations)
    .where(eq(agDonations.callerRefId, code))
    .orderBy(desc(agDonations.createdAt))
    .limit(limit);
}

export async function exportInfluencerDonationsCsv(influencerCode?: string | null) {
  await ensureDbSchema();
  const cid = influencerCode ? influencerCode.trim().toUpperCase() : null;

  if (cid && cid !== "ALL") {
    // Export single influencer ledger
    const donations = await db
      .select()
      .from(agDonations)
      .where(eq(agDonations.callerRefId, cid))
      .orderBy(desc(agDonations.createdAt));

    const rows: string[][] = [
      [
        "Transaction ID",
        "Gateway Order ID",
        "Influencer Code",
        "Donor Name",
        "Donor Phone",
        "Donor Email",
        "Amount (INR)",
        "Currency",
        "Payment Status",
        "80G Tax Exemption",
        "Donation Date (IST)",
      ],
    ];

    for (const d of donations) {
      rows.push([
        d.txnId,
        d.gatewayOrderId,
        cid,
        d.donorName ? `"${d.donorName.replace(/"/g, '""')}"` : '""',
        d.donorPhone ? `"+91${d.donorPhone}"` : '""',
        d.donorEmail ? `"${d.donorEmail.replace(/"/g, '""')}"` : '""',
        String(d.amount),
        d.currency,
        d.paymentStatus,
        "Eligible (Section 80G Form 10AC)",
        d.createdAt.toISOString().slice(0, 19).replace("T", " "),
      ]);
    }

    return {
      filename: `influencer_${cid.toLowerCase()}_donations_ledger_${new Date().toISOString().slice(0, 10)}.csv`,
      csv: rows.map((r) => r.join(",")).join("\n"),
    };
  }

  // Export consolidated summary for all influencers
  const { influencers } = await getInfluencerProfiles();
  const rows: string[][] = [
    [
      "Rank",
      "Influencer Code",
      "Display Name",
      "Instagram Handle",
      "WhatsApp Number",
      "Status",
      "Goal (INR)",
      "Total Funds Raised (INR)",
      "Goal Progress (%)",
      "Total Donors",
      "Average Ticket (INR)",
      "Referral URL",
      "Created Date",
    ],
  ];

  // Sort by funds raised descending
  const sorted = [...influencers].sort((a, b) => b.totalDonationAmount - a.totalDonationAmount);
  sorted.forEach((inf, idx) => {
    rows.push([
      String(idx + 1),
      inf.influencerCode,
      `"${inf.displayName.replace(/"/g, '""')}"`,
      inf.instagramHandle || "",
      `"+91${inf.whatsappNumber}"`,
      inf.status,
      String(inf.targetGoalAmount),
      String(inf.totalDonationAmount),
      `${inf.progressPercent}%`,
      String(inf.totalDonorsCount),
      String(inf.averageDonation),
      inf.referralLink,
      inf.createdAt.slice(0, 10),
    ]);
  });

  return {
    filename: `janaseva_all_influencers_summary_${new Date().toISOString().slice(0, 10)}.csv`,
    csv: rows.map((r) => r.join(",")).join("\n"),
  };
}

