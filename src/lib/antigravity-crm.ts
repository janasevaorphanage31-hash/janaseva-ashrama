import { db, ensureDbSchema } from "@/db";
import { agTelecallers, agLeads, agCallLogs, agDonations, contentEntries, influencerProfiles, donations } from "@/db/schema";
import { eq, and, or, sql, desc, inArray, isNull, like } from "drizzle-orm";
import { hashPassword } from "@/lib/admin-auth";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";
import { signCallerToken } from "@/lib/caller-auth";
import { randomUUID } from "node:crypto";
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
let legacyNamesRepaired = false;

/**
 * 1. Seeds 15 telecallers (TC01 to TC15) and realistic birthday leads if tables are fresh.
 */
export async function ensureTelecallersAndSeedData(forceCheck = false) {
  if (telecallersSeeded && !forceCheck) return;
  await ensureDbSchema();

  // One-time auto-repair of legacy records where child_name was stored as 'Child'
  if (!legacyNamesRepaired) {
    legacyNamesRepaired = true;
    try {
      await repairStudentNamesInDb();
    } catch (e) {
      console.error("[CRM] Auto-repair student names notice:", e);
    }
  }
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
      { id: "ADMIN", name: "Ashrama Admin / Supervisor", phone: "9980359595", email: "admin@janaseva.org" },
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
 * 2. Distribute Tomorrow's Birthday Leads with 50/50 Dual-Stream Balancing:
 * - Calculates Tomorrow's date (T+1 day) with month/leap-year rollover.
 * - Pulls unassigned Pending leads for Parents (Child Birthday) and Direct Donors.
 * - Allocates an equal mix (50% Parents + 50% Donors) mathematically across all active callers.
 * - If a caller is inactive/deleted, they receive 0 leads.
 */
export async function distributeTomorrowBirthdayLeads(mode: "balanced" | "round_robin" = "balanced") {
  await ensureTelecallersAndSeedData();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const targetDay = tomorrow.getDate();
  const targetMonth = tomorrow.getMonth() + 1;

  const activeCallers = await db
    .select({ callerId: agTelecallers.callerId })
    .from(agTelecallers)
    .where(eq(agTelecallers.isActive, true))
    .orderBy(agTelecallers.callerId);

  const K = activeCallers.length;
  if (K === 0) {
    return { distributed: 0, parentsDistributed: 0, donorsDistributed: 0, callersCount: 0, perCaller: {} };
  }

  // 1. Fetch unassigned Pending leads for Parents (Child Birthday Tomorrow)
  const parentsLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(
      and(
        eq(agLeads.stream, "PARENTS"),
        eq(agLeads.dobDay, targetDay),
        eq(agLeads.dobMonth, targetMonth),
        isNull(agLeads.assignedCallerId),
        or(eq(agLeads.status, "Pending"), isNull(agLeads.status))
      )
    )
    .orderBy(desc(agLeads.leadId));

  // 2. Fetch unassigned Pending leads for Direct Donors (Donor Birthday Tomorrow)
  const donorLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(
      and(
        or(eq(agLeads.stream, "DIRECT_DONOR"), isNull(agLeads.stream)),
        eq(agLeads.dobDay, targetDay),
        eq(agLeads.dobMonth, targetMonth),
        isNull(agLeads.assignedCallerId),
        or(eq(agLeads.status, "Pending"), isNull(agLeads.status))
      )
    )
    .orderBy(desc(agLeads.leadId));

  const perCaller: Record<string, number> = {};
  for (const c of activeCallers) {
    perCaller[c.callerId] = 0;
  }

  const updates: Array<{ leadId: number; callerId: string }> = [];

  // 3. Mathematical fair-share distribution for Parents stream
  const P = parentsLeads.length;
  if (P > 0) {
    const qP = Math.floor(P / K);
    const rP = P % K;
    let pIdx = 0;
    for (let i = 0; i < K; i++) {
      const callerId = activeCallers[i].callerId;
      const count = qP + (i < rP ? 1 : 0);
      for (let j = 0; j < count && pIdx < P; j++) {
        updates.push({ leadId: parentsLeads[pIdx].leadId, callerId });
        perCaller[callerId] = (perCaller[callerId] || 0) + 1;
        pIdx++;
      }
    }
  }

  // 4. Mathematical fair-share distribution for Direct Donors stream
  const D = donorLeads.length;
  if (D > 0) {
    const qD = Math.floor(D / K);
    const rD = D % K;
    let dIdx = 0;
    for (let i = 0; i < K; i++) {
      const callerId = activeCallers[i].callerId;
      const count = qD + (i < rD ? 1 : 0);
      for (let j = 0; j < count && dIdx < D; j++) {
        updates.push({ leadId: donorLeads[dIdx].leadId, callerId });
        perCaller[callerId] = (perCaller[callerId] || 0) + 1;
        dIdx++;
      }
    }
  }

  // 5. Batch update in database
  if (updates.length > 0) {
    const callerToLeadIds = new Map<string, number[]>();
    for (const u of updates) {
      if (!callerToLeadIds.has(u.callerId)) callerToLeadIds.set(u.callerId, []);
      callerToLeadIds.get(u.callerId)!.push(u.leadId);
    }

    for (const [callerId, ids] of callerToLeadIds.entries()) {
      for (let i = 0; i < ids.length; i += 200) {
        const chunk = ids.slice(i, i + 200);
        await db
          .update(agLeads)
          .set({ assignedCallerId: callerId, updatedAt: new Date() })
          .where(inArray(agLeads.leadId, chunk));
      }
    }
  }

  return {
    distributed: updates.length,
    parentsDistributed: P,
    donorsDistributed: D,
    callersCount: K,
    perCaller,
    targetDay,
    targetMonth,
  };
}

export async function distributeBirthdayLeads() {
  return distributeTomorrowBirthdayLeads("balanced");
}

/**
 * 3. Fetch Assigned Leads for a Telecaller (or All Leads if callerId === "ALL" or empty)
 * Guaranteed priority ordering:
 * 1. Rescheduled Callbacks due today or earlier (pinned to top)
 * 2. Fresh uncalled Pending leads
 * 3. Tomorrow's birthdays (T+1 advance calling target)
 * 4. Deterministic order by leadId (prevents card jumping)
 */
export async function getAssignedLeads(callerId?: string | null, limit = 10000, offset = 0) {
  await ensureTelecallersAndSeedData();
  const cid = (callerId || "").trim().toUpperCase();
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const targetDay = tomorrow.getDate();
  const targetMonth = tomorrow.getMonth() + 1;

  const orderClauses = [
    sql`case when ${agLeads.status} = 'Reschedule' and ${agLeads.rescheduleDate} <= ${now} then 0 else 1 end`,
    sql`case when ${agLeads.status} = 'Pending' or ${agLeads.status} is null then 0 else 1 end`,
    sql`case when ${agLeads.dobMonth} = ${targetMonth} and ${agLeads.dobDay} = ${targetDay} then 0 else 1 end`,
    sql`case when ${agLeads.dobMonth} = ${todayMonth} and ${agLeads.dobDay} = ${todayDay} then 0 else 1 end`,
    agLeads.dobMonth,
    agLeads.dobDay,
    desc(agLeads.leadId),
  ];

  const selectFields = {
    leadId: agLeads.leadId,
    stream: agLeads.stream,
    name: agLeads.name,
    parentName: agLeads.parentName,
    childName: agLeads.childName,
    phone: agLeads.phone,
    email: agLeads.email,
    dobDay: agLeads.dobDay,
    dobMonth: agLeads.dobMonth,
    assignedCallerId: agLeads.assignedCallerId,
    status: agLeads.status,
    validationStatus: agLeads.validationStatus,
    rescheduleDate: agLeads.rescheduleDate,
    lastContactedAt: agLeads.lastContactedAt,
    createdAt: agLeads.createdAt,
    updatedAt: agLeads.updatedAt,
  };

  const rawLeads = (!cid || cid === "ALL")
    ? await db
        .select(selectFields)
        .from(agLeads)
        .orderBy(...orderClauses)
        .limit(limit)
        .offset(offset)
    : await db
        .select(selectFields)
        .from(agLeads)
        .where(eq(agLeads.assignedCallerId, cid))
        .orderBy(...orderClauses)
        .limit(limit)
        .offset(offset);

  // Auto-resolve childName, parentName, and stream for existing leads
  return rawLeads.map((l) => {
    const isParent = l.stream === "PARENTS" || Boolean(l.parentName || l.childName);
    let childName = l.childName?.trim() || null;
    let parentName = l.parentName?.trim() || null;

    if (isParent) {
      // 1. Resolve Parent Name
      if (!parentName || ["parent", "father", "mother", "guardian"].includes(parentName.toLowerCase())) {
        const rawName = (l.name || "").trim();
        if (rawName.toLowerCase().startsWith("child (") && rawName.endsWith(")")) {
          parentName = rawName.slice(7, -1).trim();
        } else if (rawName.toLowerCase().endsWith("(parent)")) {
          parentName = rawName.slice(0, -8).trim();
        } else if (rawName.includes("(") && rawName.endsWith(")")) {
          const inside = rawName.slice(rawName.indexOf("(") + 1, -1).trim();
          if (inside && !["child", "student", "parent"].includes(inside.toLowerCase())) {
            parentName = inside;
          }
        }
      }

      // 2. Resolve Child / Student Name
      const isChildPlaceholder = !childName || ["child", "student", "pupil", "kid", "unknown"].includes(childName.toLowerCase());
      if (isChildPlaceholder) {
        const rawName = (l.name || "").trim();
        if (rawName.includes("(") && rawName.endsWith(")")) {
          const beforeParen = rawName.slice(0, rawName.indexOf("(")).trim();
          if (beforeParen && !["child", "student", "parent", "unknown"].includes(beforeParen.toLowerCase())) {
            childName = beforeParen;
          }
        } else {
          const stripped = rawName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
          if (stripped && !["child", "student", "unknown"].includes(stripped.toLowerCase()) && stripped !== parentName) {
            childName = stripped;
          }
        }
      }

      const effectiveParent = parentName && parentName.toLowerCase() !== "parent" ? parentName : "ಪೋಷಕರು";
      const effectiveChild = childName && !["child", "student", "unknown"].includes(childName.toLowerCase())
        ? childName
        : (effectiveParent !== "ಪೋಷಕರು" ? `${effectiveParent} ಅವರ ಮಗು` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು");

      childName = effectiveChild;
      parentName = effectiveParent;
    }

    return {
      ...l,
      stream: isParent ? "PARENTS" : l.stream,
      childName: isParent ? childName : l.childName,
      parentName: isParent ? parentName : l.parentName,
    };
  });
}

/**
 * 3b. Fetch Caller Portal Data (Assigned Leads + Realtime SQL Aggregated Stats)
 * Allows telecallers to load their verified stats directly without calling admin-only endpoints.
 */
export async function getCallerPortalData(callerId?: string | null, limit = 10000, offset = 0) {
  await ensureTelecallersAndSeedData();
  const cid = (callerId || "").trim().toUpperCase();

  const leads = await getAssignedLeads(cid, limit, offset);

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
 * 4. Log Call Disposition, Validation Quality & Notes
 */
export async function logCallDisposition(
  leadId: number,
  callerId: string,
  disposition: string,
  notes?: string,
  callbackTime?: string | null
) {
  await ensureDbSchema();
  // Insert call history log safely without blocking lead status updates
  try {
    const validCallbackDate =
      callbackTime && !isNaN(new Date(callbackTime).getTime())
        ? new Date(callbackTime)
        : null;

    await db.insert(agCallLogs).values({
      leadId,
      callerId,
      disposition,
      notes: notes?.trim() || null,
      callbackTime: validCallbackDate,
    });
  } catch (logErr) {
    console.error(`[CRM] Failed to insert agCallLogs for lead ${leadId}, caller ${callerId}:`, logErr);
    // Continue: Lead update must always succeed
  }

  let validationStatus = "UNVERIFIED";
  if (disposition === "Donated") {
    validationStatus = "VALID_DONATED";
  } else if (disposition === "Interested") {
    validationStatus = "VALID_INTERESTED";
  } else if (disposition === "Reschedule") {
    validationStatus = "VALID_CALLBACK";
  } else if (disposition === "Rejected" || disposition === "Not Interested") {
    validationStatus = "SOFT_REJECT";
  } else if (
    disposition === "Wrong_Number" ||
    disposition === "Junk" ||
    disposition === "Invalid"
  ) {
    validationStatus = "JUNK_INVALID";
  }

  // Update lead current status
  await db
    .update(agLeads)
    .set({
      status: disposition,
      validationStatus,
      rescheduleDate: callbackTime ? new Date(callbackTime) : null,
      lastContactedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(agLeads.leadId, leadId));

  return { success: true, validationStatus };
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
  const effectiveSenderMode = options?.senderMode || "individual";

  const generated = generateAntiBanMessage({
    leadId: lead.leadId,
    leadName: lead.stream === "PARENTS" ? (lead.parentName || lead.name) : lead.name,
    donorName: lead.stream === "PARENTS" ? (lead.parentName || lead.name) : lead.name,
    childName: lead.childName || undefined,
    parentName: lead.parentName || undefined,
    stream: lead.stream as any,
    callerId: callerId.toUpperCase(),
    callerName,
    language: options?.language || settings.defaultLanguage || "kanglish",
    angle: options?.angle || (lead.stream === "PARENTS" ? "birthday" : settings.defaultAngle || "annadana"),
    mediaId: options?.mediaId || "annadana_feast",
    amount: options?.amount,
    baseUrl: siteUrl,
    mode: "concise",
    senderMode: effectiveSenderMode,
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
/**
 * 6. Record Gateway Webhook Payment Attribution & Dual-Ledger Sync
 * Atomically writes to both agDonations (influencer & telecaller attribution)
 * AND primary donations table (public donor wall, 80G tax receipt, WhatsApp receipt).
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
  await ensureDbSchema();
  const cleanRef = data.callerRefId ? data.callerRefId.trim().toUpperCase() : null;
  const roundedAmount = Math.max(1, Math.round(data.amount));

  // Determine effective leadId: if leadId is missing, attempt smart phone matching against caller's assigned leads
  let effectiveLeadId: number | null = data.leadId ? Number(data.leadId) : null;
  const cleanPhoneDigits = (data.donorPhone || "").replace(/\D/g, "").slice(-10);

  if (!effectiveLeadId && cleanPhoneDigits.length === 10) {
    try {
      // 1. Prioritize matching a lead assigned to this specific caller with this phone number
      const callerMatched = cleanRef
        ? await db
            .select({ leadId: agLeads.leadId })
            .from(agLeads)
            .where(
              and(
                eq(agLeads.assignedCallerId, cleanRef),
                like(agLeads.phone, `%${cleanPhoneDigits}`)
              )
            )
            .limit(1)
        : [];

      if (callerMatched.length > 0) {
        effectiveLeadId = callerMatched[0].leadId;
      } else {
        // 2. Fallback: match any lead in agLeads with this 10-digit phone number
        const anyMatched = await db
          .select({ leadId: agLeads.leadId })
          .from(agLeads)
          .where(like(agLeads.phone, `%${cleanPhoneDigits}`))
          .limit(1);

        if (anyMatched.length > 0) {
          effectiveLeadId = anyMatched[0].leadId;
        }
      }
    } catch (matchErr) {
      console.warn("Lead phone lookup warning in recordPaymentAttribution:", matchErr);
    }
  }

  // 1. Insert into agDonations (influencer/telecaller ledger)
  await db
    .insert(agDonations)
    .values({
      txnId: data.txnId,
      gatewayOrderId: data.gatewayOrderId,
      amount: roundedAmount,
      currency: "INR",
      paymentStatus: "captured",
      callerRefId: cleanRef,
      leadId: effectiveLeadId,
      donorName: data.donorName || null,
      donorPhone: data.donorPhone || null,
      donorEmail: data.donorEmail || null,
      metadata: data.metadata || null,
    })
    .onConflictDoNothing({ target: agDonations.txnId });

  // 2. If lead is linked (or matched by phone), mark lead as Donated in real-time and increment lifetime donation
  if (effectiveLeadId) {
    const curYear = new Date().getFullYear();
    await db
      .update(agLeads)
      .set({
        status: "Donated",
        validationStatus: "VALID_DONATED",
        lastDonationYear: curYear,
        lifetimeDonations: sql`${agLeads.lifetimeDonations} + ${roundedAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(agLeads.leadId, effectiveLeadId));
  }

  // 3. Financial year helper for official 80G receipt number (e.g. JSA/26-27/000123)
  const now = new Date();
  const fyYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const fyStr = `${String(fyYear).slice(-2)}-${String(fyYear + 1).slice(-2)}`;

  // 4. Synchronize into primary `donations` table (for public donor wall, 80G receipt, live stats)
  let primaryDonationId: number | null = null;
  try {
    const existing = await db
      .select({ id: donations.id, status: donations.status })
      .from(donations)
      .where(or(eq(donations.razorpayPaymentId, data.txnId), eq(donations.razorpayOrderId, data.gatewayOrderId)))
      .limit(1);

    if (existing.length === 0) {
      const publicId = "rec_" + randomUUID().replace(/-/g, "").slice(0, 20);
      const cleanPhoneDigits = (data.donorPhone || "").replace(/\D/g, "").slice(-10);
      const defaultEmail = cleanPhoneDigits ? `donor_${cleanPhoneDigits}@janasevaashrama.org` : "donor@janasevaashrama.org";

      const [inserted] = await db
        .insert(donations)
        .values({
          publicId,
          mode: "razorpay",
          status: "paid",
          amount: roundedAmount,
          donorName: data.donorName || "Janaseva Supporter",
          donorEmail: data.donorEmail || defaultEmail,
          donorPhone: data.donorPhone || null,
          anonymous: false,
          razorpayOrderId: data.gatewayOrderId,
          razorpayPaymentId: data.txnId,
          idempotencyKey: `idemp_${data.txnId || Date.now()}`,
          paidAt: new Date(),
          meta: {
            callerRefId: cleanRef,
            leadId: data.leadId || null,
            ...data.metadata,
          },
        })
        .returning({ id: donations.id });

      primaryDonationId = inserted.id;

      // Assign official 80G receipt number
      await db
        .update(donations)
        .set({
          receiptNo: sql`${"JSA/" + fyStr + "/"} || lpad(${inserted.id}::text, 6, '0')`,
        })
        .where(eq(donations.id, inserted.id));
    } else {
      primaryDonationId = existing[0].id;
      if (existing[0].status !== "paid") {
        await db
          .update(donations)
          .set({
            status: "paid",
            paidAt: new Date(),
            razorpayPaymentId: data.txnId,
            receiptNo: sql`${"JSA/" + fyStr + "/"} || lpad(${existing[0].id}::text, 6, '0')`,
            meta: sql`coalesce(meta, '{}'::jsonb) || ${JSON.stringify({ callerRefId: cleanRef, leadId: data.leadId || null })}::jsonb`,
          })
          .where(eq(donations.id, existing[0].id));
      }
    }
  } catch (syncErr) {
    console.error("Dual-ledger synchronization to donations table failed:", syncErr);
  }

  // 5. Trigger automated WhatsApp 80G receipt & blessing
  if (primaryDonationId && data.donorPhone) {
    try {
      const [updatedDonation] = await db
        .select()
        .from(donations)
        .where(eq(donations.id, primaryDonationId))
        .limit(1);

      if (updatedDonation && updatedDonation.receiptNo && updatedDonation.donorPhone) {
        const { triggerDonationWhatsAppAutomation } = await import("./whatsapp-automation");
        await triggerDonationWhatsAppAutomation({
          donationId: updatedDonation.id,
          donorName: updatedDonation.donorName,
          donorPhone: updatedDonation.donorPhone,
          donorEmail: updatedDonation.donorEmail || undefined,
          amount: updatedDonation.amount,
          receiptNumber: updatedDonation.receiptNo,
          pan: (updatedDonation.meta as any)?.donorPan || undefined,
        });
      }
    } catch (err) {
      console.error("Failed to trigger automated WhatsApp donation receipt:", err);
    }
  }

  return { success: true, txnId: data.txnId, callerRefId: cleanRef, primaryDonationId };
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
  stream?: "PARENTS" | "DIRECT_DONOR";
  name?: string;
  parentName?: string;
  childName?: string;
  phone: string;
  email?: string;
  dobDay?: number | string;
  dobMonth?: number | string;
}

/**
 * 12. Bulk Upload Leads & Instant Equal Distribution with Complete Deduplication
 * - Supports dual streams: PARENTS (Child Birthday) and DIRECT_DONOR (Donor Birthday)
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
  const existingLeadMap = new Map<string, {
    leadId: number;
    phone: string;
    name: string;
    parentName: string | null;
    childName: string | null;
    stream: string;
  }>();

  if (candidatePhones.size > 0) {
    const candidateArray = Array.from(candidatePhones);
    const BATCH_LOOKUP = 500;
    for (let i = 0; i < candidateArray.length; i += BATCH_LOOKUP) {
      const slice = candidateArray.slice(i, i + BATCH_LOOKUP);
      // Check exact 10-digit candidate plus all common stored database variants (+91, 91, 0)
      const lookupVariants = slice.flatMap((p) => [p, `+91${p}`, `91${p}`, `0${p}`, `+91 ${p}`]);
      const existingRows = await db
        .select({
          leadId: agLeads.leadId,
          phone: agLeads.phone,
          name: agLeads.name,
          parentName: agLeads.parentName,
          childName: agLeads.childName,
          stream: agLeads.stream,
        })
        .from(agLeads)
        .where(inArray(agLeads.phone, lookupVariants));
      for (const r of existingRows) {
        if (r.phone) {
          const digits = r.phone.replace(/\D/g, "").slice(-10);
          if (digits.length === 10) existingLeadMap.set(digits, r);
        }
      }
    }
  }

  const validLeads = [];
  const seenInUpload = new Set<string>();
  let internalDuplicatesSkipped = 0;
  let alreadyInDbSkipped = 0;
  let enrichedUpdatedCount = 0;

  for (const item of rawLeads) {
    const rawDigits = (item.phone || "").replace(/\D/g, "");
    if (rawDigits.length < 10) continue;
    const phone10 = rawDigits.slice(-10);

    // Skip duplicate inside the current upload file
    if (seenInUpload.has(phone10)) {
      internalDuplicatesSkipped++;
      continue;
    }
    seenInUpload.add(phone10);

    let day = parseInt(String(item.dobDay || currentDay), 10);
    if (isNaN(day) || day < 1 || day > 31) day = currentDay;

    let month = parseInt(String(item.dobMonth || currentMonth), 10);
    if (isNaN(month) || month < 1 || month > 12) month = currentMonth;

    const isParent = item.stream === "PARENTS" || Boolean(item.parentName || item.childName);
    const stream = isParent ? "PARENTS" : "DIRECT_DONOR";

    let childCandidate = (item.childName || "").trim().replace(/\s*\((Child|Parent|Student)\)$/i, "");
    let parentCandidate = (item.parentName || "").trim().replace(/\s*\((Child|Parent|Student)\)$/i, "");
    const nameCandidate = (item.name || "").trim().replace(/\s*\((Child|Parent|Student)\)$/i, "");

    if (isParent) {
      if (!childCandidate || childCandidate.toLowerCase() === "child") {
        if (nameCandidate && nameCandidate.toLowerCase() !== "child" && nameCandidate !== parentCandidate) {
          childCandidate = nameCandidate;
        }
      }
      if (!parentCandidate || parentCandidate.toLowerCase() === "parent") {
        if (item.parentName) {
          parentCandidate = item.parentName.trim();
        } else {
          parentCandidate = "Parent";
        }
      }
    }

    const isPlaceholderStr = (s?: string | null) => {
      if (!s) return true;
      return ["child", "student", "pupil", "kid", "unknown", "na", "n/a", "parent", "—", "-", ""].includes(s.trim().toLowerCase());
    };

    const incomingHasRealChild = Boolean(childCandidate && !isPlaceholderStr(childCandidate));
    const incomingHasRealParent = Boolean(parentCandidate && !isPlaceholderStr(parentCandidate));

    // Check if already in database: smart update / enrich if existing lead needs real names
    if (existingLeadMap.has(phone10)) {
      const existing = existingLeadMap.get(phone10)!;
      const existingNeedsChild = isPlaceholderStr(existing.childName) || (existing.name && existing.name.toLowerCase().startsWith("child"));
      const existingNeedsParent = isPlaceholderStr(existing.parentName);

      if (isParent && (incomingHasRealChild || incomingHasRealParent || existingNeedsChild || existingNeedsParent)) {
        const effectiveChild = incomingHasRealChild
          ? childCandidate
          : (!isPlaceholderStr(existing.childName)
              ? existing.childName!
              : (incomingHasRealParent ? `${parentCandidate} ಅವರ ಮಗು` : (!isPlaceholderStr(existing.parentName) ? `${existing.parentName} ಅವರ ಮಗು` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು")));

        const effectiveParent = incomingHasRealParent
          ? parentCandidate
          : (!isPlaceholderStr(existing.parentName) ? existing.parentName! : "ಪೋಷಕರು");

        const effectiveDisplayName = incomingHasRealChild
          ? `${effectiveChild} (${effectiveParent})`
          : (effectiveParent !== "ಪೋಷಕರು" ? `${effectiveParent} ಅವರ ಮಗು (${effectiveParent})` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು");

        await db
          .update(agLeads)
          .set({
            stream: "PARENTS",
            childName: effectiveChild,
            parentName: effectiveParent,
            name: effectiveDisplayName,
            dobDay: day,
            dobMonth: month,
            updatedAt: new Date(),
          })
          .where(eq(agLeads.leadId, existing.leadId));

        enrichedUpdatedCount++;
        continue;
      }

      alreadyInDbSkipped++;
      continue;
    }

    const cleanChild = incomingHasRealChild
      ? childCandidate
      : (incomingHasRealParent ? `${parentCandidate} ಅವರ ಮಗು` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು");
    const cleanParent = incomingHasRealParent ? parentCandidate : "ಪೋಷಕರು";

    const childName = isParent ? cleanChild : null;
    const parentName = isParent ? cleanParent : null;
    const displayName = isParent
      ? (incomingHasRealChild
          ? `${cleanChild} (${cleanParent})`
          : (cleanParent !== "ಪೋಷಕರು" ? `${cleanParent} ಅವರ ಮಗು (${cleanParent})` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು"))
      : (item.name?.trim() || "Well-wisher");

    validLeads.push({
      stream,
      name: displayName,
      parentName,
      childName,
      phone: phone10,
      email: item.email ? item.email.trim() : null,
      dobDay: day,
      dobMonth: month,
      status: "Pending",
      validationStatus: "UNVERIFIED",
      lifetimeDonations: 0,
    });
  }

  if (validLeads.length === 0) {
    return {
      success: true,
      totalReceived: rawLeads.length,
      validParsed: seenInUpload.size,
      internalDuplicatesSkipped,
      alreadyInDbSkipped,
      enrichedUpdatedCount,
      validInserted: 0,
      distributed: 0,
      perCaller: {},
      insertedLeadIds: [] as number[],
      message: enrichedUpdatedCount > 0
        ? `Successfully enriched and updated ${enrichedUpdatedCount} existing leads with Student Names & Details! (${alreadyInDbSkipped} unchanged duplicates skipped).`
        : `No new leads to import. ${alreadyInDbSkipped} numbers already exist in database, and ${internalDuplicatesSkipped} duplicates were skipped.`,
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
    const res = await distributeDualStreamBalanced({ unassignedOnly: true, mode });
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
    message: enrichedUpdatedCount > 0
      ? `Successfully uploaded ${validLeads.length} leads and updated ${enrichedUpdatedCount} existing leads with Student Names!`
      : `Successfully uploaded ${validLeads.length} unique leads (${alreadyInDbSkipped} already in database skipped, ${internalDuplicatesSkipped} file duplicates skipped).`,
    enrichedUpdatedCount,
  };
}

/**
 * 12b. Repair & Normalize Student Names for Existing Database Leads
 * Replaces placeholder 'Child' with actual parent/student relationship or extracts parent from 'Child (NAME)'
 */
export async function repairStudentNamesInDb() {
  await ensureDbSchema();
  const leadsToFix = await db
    .select({
      leadId: agLeads.leadId,
      name: agLeads.name,
      parentName: agLeads.parentName,
      childName: agLeads.childName,
      stream: agLeads.stream,
    })
    .from(agLeads)
    .where(
      or(
        sql`TRIM(LOWER(COALESCE(${agLeads.childName}, ''))) IN ('child', 'student', 'pupil', 'kid', 'unknown', '')`,
        sql`TRIM(LOWER(${agLeads.name})) = 'child'`,
        sql`LOWER(${agLeads.name}) LIKE 'child (%'`,
        sql`LOWER(${agLeads.name}) LIKE '%(child)'`,
        sql`${agLeads.parentName} IS NOT NULL AND (${agLeads.childName} IS NULL OR TRIM(LOWER(${agLeads.childName})) IN ('child', 'student', ''))`
      )
    );

  let updatedCount = 0;
  for (const lead of leadsToFix) {
    let pName = lead.parentName?.trim() || "";
    let rawName = lead.name?.trim() || "";

    if (!pName) {
      if (rawName.toLowerCase().startsWith("child (") && rawName.endsWith(")")) {
        pName = rawName.slice(7, -1).trim();
      } else if (rawName.toLowerCase().endsWith("(parent)")) {
        pName = rawName.slice(0, -8).trim();
      }
    }

    let realChild = "";
    if (rawName && !rawName.toLowerCase().startsWith("child") && !rawName.toLowerCase().endsWith("(parent)")) {
      const stripped = rawName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
      if (stripped && !["child", "student", "unknown"].includes(stripped.toLowerCase()) && stripped !== pName) {
        realChild = stripped;
      }
    }

    const effectiveChild = realChild || (pName ? `${pName} ಅವರ ಮಗು` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು");
    const effectiveParent = pName || "Parent";
    const effectiveDisplay = realChild
      ? (pName && pName !== "Parent" ? `${realChild} (${pName})` : `${realChild} (Child)`)
      : (pName && pName !== "Parent" ? `${pName} ಅವರ ಮಗು (${pName})` : "ವಿದ್ಯಾರ್ಥಿ / ಮಗು (Student)");

    await db
      .update(agLeads)
      .set({
        stream: "PARENTS",
        parentName: effectiveParent,
        childName: effectiveChild,
        name: effectiveDisplay,
        updatedAt: new Date(),
      })
      .where(eq(agLeads.leadId, lead.leadId));
    updatedCount++;
  }

  return {
    success: true,
    message: `Repaired ${updatedCount} leads in database. Placeholder 'Child' replaced with polite student/parent indicators.`,
    updatedCount,
  };
}

/**
 * 12c. Scan & Merge Database Duplicates
 * - Normalizes all phones in ag_leads to their clean 10-digit number.
 * - Identifies all duplicate groups (multiple rows having the same 10-digit phone).
 * - For each group:
 *   - Chooses the PRIMARY lead:
 *     - Prefers highest progression: Donated > Interested > Reschedule > Contacted > Pending.
 *     - Breaks ties by: most recent lastContactedAt, then presence of real childName/parentName, then lowest leadId.
 *   - For the duplicate rows:
 *     - Updates any `ag_call_logs` pointing to duplicate leadId -> sets leadId = primaryLead.leadId.
 *     - Updates any `ag_donations` pointing to duplicate leadId -> sets leadId = primaryLead.leadId.
 *     - If primary lead lacks parentName, childName, email, or dob, absorbs them from duplicates.
 *     - Deletes duplicate lead rows from `ag_leads`.
 *   - Returns detailed statistics: totalScanned, duplicateGroups, rowsMerged, rowsPurged.
 */
export async function deduplicateDatabaseLeads() {
  await ensureDbSchema();

  const allLeads = await db
    .select({
      leadId: agLeads.leadId,
      stream: agLeads.stream,
      name: agLeads.name,
      parentName: agLeads.parentName,
      childName: agLeads.childName,
      phone: agLeads.phone,
      email: agLeads.email,
      dobDay: agLeads.dobDay,
      dobMonth: agLeads.dobMonth,
      assignedCallerId: agLeads.assignedCallerId,
      status: agLeads.status,
      validationStatus: agLeads.validationStatus,
      lastContactedAt: agLeads.lastContactedAt,
      rescheduleDate: agLeads.rescheduleDate,
      createdAt: agLeads.createdAt,
    })
    .from(agLeads);

  const totalScanned = allLeads.length;
  if (totalScanned === 0) {
    return {
      success: true,
      totalScanned: 0,
      duplicateGroupsFound: 0,
      duplicateRowsPurged: 0,
      message: "No leads in database to deduplicate.",
    };
  }

  // Group by normalized 10-digit phone
  const groups = new Map<string, typeof allLeads>();
  for (const lead of allLeads) {
    const rawDigits = (lead.phone || "").replace(/\D/g, "");
    if (rawDigits.length >= 10) {
      const phone10 = rawDigits.slice(-10);
      const list = groups.get(phone10) || [];
      list.push(lead);
      groups.set(phone10, list);
    }
  }

  const STATUS_PRIORITY: Record<string, number> = {
    Donated: 5,
    Interested: 4,
    Reschedule: 3,
    Contacted: 2,
    Pending: 1,
  };

  let duplicateGroupsFound = 0;
  let duplicateRowsPurged = 0;

  for (const [phone10, list] of groups.entries()) {
    if (list.length <= 1) continue;
    duplicateGroupsFound++;

    // Sort to determine primary lead
    list.sort((a, b) => {
      const pA = STATUS_PRIORITY[a.status] || 0;
      const pB = STATUS_PRIORITY[b.status] || 0;
      if (pA !== pB) return pB - pA;
      if (a.lastContactedAt && b.lastContactedAt) {
        return new Date(b.lastContactedAt).getTime() - new Date(a.lastContactedAt).getTime();
      }
      if (a.lastContactedAt) return -1;
      if (b.lastContactedAt) return 1;

      const aChild = Boolean(a.childName && a.childName.trim().toLowerCase() !== "child");
      const bChild = Boolean(b.childName && b.childName.trim().toLowerCase() !== "child");
      if (aChild && !bChild) return -1;
      if (!aChild && bChild) return 1;

      if (a.assignedCallerId && !b.assignedCallerId) return -1;
      if (!a.assignedCallerId && b.assignedCallerId) return 1;

      return a.leadId - b.leadId;
    });

    const primary = list[0];
    const duplicates = list.slice(1);
    const duplicateIds = duplicates.map((d) => d.leadId);

    // 1. Re-link call logs safely
    try {
      await db
        .update(agCallLogs)
        .set({ leadId: primary.leadId })
        .where(inArray(agCallLogs.leadId, duplicateIds));
    } catch (logErr) {
      console.error("[CRM Dedup] Failed to re-link call logs:", logErr);
    }

    // 2. Re-link donations safely
    try {
      await db
        .update(agDonations)
        .set({ leadId: primary.leadId })
        .where(inArray(agDonations.leadId, duplicateIds));
    } catch (donErr) {
      console.error("[CRM Dedup] Failed to re-link donations:", donErr);
    }

    // 3. Absorb missing fields into primary
    let updatedParent = primary.parentName;
    let updatedChild = primary.childName;
    let updatedEmail = primary.email;
    let updatedStream = primary.stream;

    for (const dup of duplicates) {
      if ((!updatedChild || updatedChild.toLowerCase() === "child") && dup.childName && dup.childName.toLowerCase() !== "child") {
        updatedChild = dup.childName;
      }
      if ((!updatedParent || updatedParent.toLowerCase() === "parent") && dup.parentName && dup.parentName.toLowerCase() !== "parent") {
        updatedParent = dup.parentName;
      }
      if (!updatedEmail && dup.email) {
        updatedEmail = dup.email;
      }
      if (dup.stream === "PARENTS" && updatedStream !== "PARENTS") {
        updatedStream = "PARENTS";
      }
    }

    const needsNameFix = primary.name.toLowerCase().startsWith("child (") || primary.name === "Child";
    let finalDisplayName = primary.name;
    if (updatedStream === "PARENTS") {
      if (updatedChild && updatedChild.toLowerCase() !== "child") {
        finalDisplayName = updatedParent && updatedParent !== "Parent" ? `${updatedChild} (${updatedParent})` : `${updatedChild} (Child)`;
      } else if (updatedParent && updatedParent !== "Parent") {
        finalDisplayName = `${updatedParent} ಅವರ ಮಗು (${updatedParent})`;
      }
    }

    await db
      .update(agLeads)
      .set({
        phone: phone10,
        parentName: updatedParent,
        childName: updatedChild,
        email: updatedEmail,
        stream: updatedStream,
        name: needsNameFix ? finalDisplayName : primary.name,
        updatedAt: new Date(),
      })
      .where(eq(agLeads.leadId, primary.leadId));

    // 4. Delete duplicate rows
    await db.delete(agLeads).where(inArray(agLeads.leadId, duplicateIds));
    duplicateRowsPurged += duplicateIds.length;
  }

  return {
    success: true,
    totalScanned,
    duplicateGroupsFound,
    duplicateRowsPurged,
    message: duplicateRowsPurged > 0
      ? `Deduplication complete: Scanned ${totalScanned} leads, found ${duplicateGroupsFound} duplicate groups. Successfully merged all call history and purged ${duplicateRowsPurged} redundant rows with 0 data loss!`
      : `Deduplication check: Scanned ${totalScanned} leads. Zero duplicate phone numbers found! Database is 100% clean.`,
  };
}

/**
 * 12d. Equalize Pending Workload across Active Telecallers
 * - Safely balances untouched pending leads without touching contacted, callback, or interested leads.
 * - Used when a new telecaller (e.g. TC16) is added, or to ensure fair queue distribution mid-campaign.
 */
export async function equalizePendingWorkload() {
  await ensureTelecallersAndSeedData();

  const activeCallers = await db
    .select({ callerId: agTelecallers.callerId, name: agTelecallers.name })
    .from(agTelecallers)
    .where(eq(agTelecallers.isActive, true))
    .orderBy(agTelecallers.callerId);

  const K = activeCallers.length;
  if (K === 0) {
    throw new Error("No active telecallers found.");
  }

  // Find all untouched pending leads ONLY:
  // Must be 'Pending' or NULL, lastContactedAt IS NULL, rescheduleDate IS NULL
  const untouchedPendingLeads = await db
    .select({
      leadId: agLeads.leadId,
      assignedCallerId: agLeads.assignedCallerId,
      stream: agLeads.stream,
      dobMonth: agLeads.dobMonth,
      dobDay: agLeads.dobDay,
    })
    .from(agLeads)
    .where(
      and(
        or(eq(agLeads.status, "Pending"), isNull(agLeads.status)),
        isNull(agLeads.lastContactedAt),
        isNull(agLeads.rescheduleDate)
      )
    );

  const totalUntouched = untouchedPendingLeads.length;
  if (totalUntouched === 0) {
    return {
      success: true,
      reallocatedCount: 0,
      totalUntouched: 0,
      perCallerSummary: {},
      message: "No untouched pending leads found to equalize.",
    };
  }

  // Group current untouched pending leads per caller
  const callerPendingMap = new Map<string, typeof untouchedPendingLeads>();
  activeCallers.forEach((c) => callerPendingMap.set(c.callerId, []));

  const unassignedPool: typeof untouchedPendingLeads = [];
  for (const lead of untouchedPendingLeads) {
    if (lead.assignedCallerId && callerPendingMap.has(lead.assignedCallerId)) {
      callerPendingMap.get(lead.assignedCallerId)!.push(lead);
    } else {
      unassignedPool.push(lead);
    }
  }

  const targetPerCaller = Math.floor(totalUntouched / K);
  const transferPool: number[] = unassignedPool.map((l) => l.leadId);

  // Take surplus from callers who have more than targetPerCaller
  for (const caller of activeCallers) {
    const list = callerPendingMap.get(caller.callerId) || [];
    if (list.length > targetPerCaller) {
      const surplus = list.slice(targetPerCaller);
      callerPendingMap.set(caller.callerId, list.slice(0, targetPerCaller));
      transferPool.push(...surplus.map((l) => l.leadId));
    }
  }

  // Allocate from transferPool to callers who have fewer than targetPerCaller (e.g. newly added callers)
  let reallocatedCount = 0;
  const perCallerSummary: Record<string, number> = {};
  activeCallers.forEach((c) => {
    perCallerSummary[c.callerId] = callerPendingMap.get(c.callerId)!.length;
  });

  for (const caller of activeCallers) {
    const currentCount = callerPendingMap.get(caller.callerId)!.length;
    const needed = targetPerCaller - currentCount;
    if (needed > 0 && transferPool.length > 0) {
      const toAssign = transferPool.splice(0, needed);
      if (toAssign.length > 0) {
        await db
          .update(agLeads)
          .set({ assignedCallerId: caller.callerId, updatedAt: new Date() })
          .where(inArray(agLeads.leadId, toAssign));
        reallocatedCount += toAssign.length;
        perCallerSummary[caller.callerId] += toAssign.length;
      }
    }
  }

  // Distribute any remainder leads round-robin
  if (transferPool.length > 0) {
    let callerIdx = 0;
    for (const leadId of transferPool) {
      const caller = activeCallers[callerIdx % K];
      await db
        .update(agLeads)
        .set({ assignedCallerId: caller.callerId, updatedAt: new Date() })
        .where(eq(agLeads.leadId, leadId));
      reallocatedCount++;
      perCallerSummary[caller.callerId]++;
      callerIdx++;
    }
  }

  return {
    success: true,
    totalUntouched,
    targetPerCaller,
    reallocatedCount,
    perCallerSummary,
    message: `Workload equalized across all ${K} active telecallers! ${reallocatedCount} untouched pending leads rebalanced (~${targetPerCaller} leads each). All contacted and in-progress leads were 100% preserved.`,
  };
}

/**
 * 13. Agency-Grade Equal Distribution Algorithm
 * Balanced mode: dynamically balances workload across all active callers by assigning next leads to the caller with minimum pending load.
 * Round-robin mode: distributes via standard modular round-robin arithmetic.
 */
export async function distributeSpecificLeads(
  leadIds: number[],
  mode: "balanced" | "round_robin" = "balanced",
  cleanSlate = false
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

  const loadMap = new Map<string, number>();
  activeCallers.forEach((c) => loadMap.set(c.callerId, 0));

  if (mode === "balanced" && !cleanSlate) {
    const pendingCounts = await db
      .select({
        callerId: agLeads.assignedCallerId,
        count: sql<number>`count(*)`,
      })
      .from(agLeads)
      .where(and(eq(agLeads.status, "Pending"), sql`${agLeads.assignedCallerId} IS NOT NULL`))
      .groupBy(agLeads.assignedCallerId);

    pendingCounts.forEach((p) => {
      if (p.callerId && loadMap.has(p.callerId)) {
        loadMap.set(p.callerId, Number(p.count));
      }
    });
  }

  let idx = 0;
  for (const leadId of leadIds) {
    let targetCaller: string;
    if (mode === "balanced") {
      let minCaller = activeCallers[0].callerId;
      let minLoad = loadMap.get(minCaller) ?? 0;

      for (const caller of activeCallers) {
        const load = loadMap.get(caller.callerId) ?? 0;
        if (load < minLoad) {
          minLoad = load;
          minCaller = caller.callerId;
        }
      }
      targetCaller = minCaller;
      loadMap.set(targetCaller, minLoad + 1);
    } else {
      targetCaller = activeCallers[idx % activeCallers.length].callerId;
      idx++;
    }

    assignmentBuckets.get(targetCaller)!.push(leadId);
    perCaller[targetCaller] = (perCaller[targetCaller] || 0) + 1;
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
 * 13b. Full-Workload Dual-Stream 50/50 Balanced Distribution
 * - Supports distributing either unassignedOnly leads (after bulk upload) or all pending leads.
 * - Sorts both Pools (Parents and Direct Donors) by Tomorrow's Birthday (T+1 advance calling target) first,
 *   then Today's birthdays, then calendar order.
 * - Mathematically interleaves Pool A (Parents) and Pool B (Donors) 50/50: [P0, D0, P1, D1, P2, D2...].
 * - Round-robin allocates across active callers so every caller receives an exact equal share,
 *   fair share of advance targets, and balanced stream mix.
 */
export async function distributeDualStreamBalanced(options?: {
  unassignedOnly?: boolean;
  mode?: "balanced" | "round_robin";
}) {
  await ensureTelecallersAndSeedData();
  const unassignedOnly = options?.unassignedOnly ?? false;

  const activeCallers = await db
    .select({ callerId: agTelecallers.callerId })
    .from(agTelecallers)
    .where(eq(agTelecallers.isActive, true))
    .orderBy(agTelecallers.callerId);

  const K = activeCallers.length;
  if (K === 0) {
    throw new Error("Cannot distribute leads: No active telecallers found.");
  }

  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomDay = tomorrow.getDate();
  const tomMonth = tomorrow.getMonth() + 1;

  const orderClauses = [
    sql`case when ${agLeads.dobMonth} = ${tomMonth} and ${agLeads.dobDay} = ${tomDay} then 0 else 1 end`,
    sql`case when ${agLeads.dobMonth} = ${todayMonth} and ${agLeads.dobDay} = ${todayDay} then 0 else 1 end`,
    agLeads.dobMonth,
    agLeads.dobDay,
    desc(agLeads.leadId),
  ];

  const baseCondition = unassignedOnly
    ? isNull(agLeads.assignedCallerId)
    : or(isNull(agLeads.assignedCallerId), eq(agLeads.status, "Pending"), isNull(agLeads.status));

  // 1. Fetch Parents Pool
  const parentsLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(and(eq(agLeads.stream, "PARENTS"), baseCondition))
    .orderBy(...orderClauses);

  // 2. Fetch Direct Donors Pool
  const donorLeads = await db
    .select({ leadId: agLeads.leadId })
    .from(agLeads)
    .where(and(or(eq(agLeads.stream, "DIRECT_DONOR"), isNull(agLeads.stream)), baseCondition))
    .orderBy(...orderClauses);

  // 3. Interleave Pool A and Pool B 50/50: [P0, D0, P1, D1, P2, D2...]
  const interleavedLeadIds: number[] = [];
  const maxLen = Math.max(parentsLeads.length, donorLeads.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < parentsLeads.length) interleavedLeadIds.push(parentsLeads[i].leadId);
    if (i < donorLeads.length) interleavedLeadIds.push(donorLeads[i].leadId);
  }

  const perCaller: Record<string, number> = {};
  activeCallers.forEach((c) => {
    perCaller[c.callerId] = 0;
  });

  if (interleavedLeadIds.length === 0) {
    return {
      distributed: 0,
      parentsDistributed: 0,
      donorsDistributed: 0,
      callersCount: K,
      perCaller,
    };
  }

  // 4. Group assignments per caller
  const assignmentBuckets = new Map<string, number[]>();
  activeCallers.forEach((c) => assignmentBuckets.set(c.callerId, []));

  interleavedLeadIds.forEach((leadId, idx) => {
    const callerId = activeCallers[idx % K].callerId;
    assignmentBuckets.get(callerId)!.push(leadId);
    perCaller[callerId] = (perCaller[callerId] || 0) + 1;
  });

  // 5. Sequential batch updates (500 per chunk)
  const BATCH_SIZE = 500;
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

  return {
    distributed: interleavedLeadIds.length,
    parentsDistributed: parentsLeads.length,
    donorsDistributed: donorLeads.length,
    callersCount: K,
    perCaller,
  };
}

export async function distributeUnassignedLeads(mode: "balanced" | "round_robin" = "balanced") {
  return distributeDualStreamBalanced({ unassignedOnly: true, mode });
}

/**
 * 14. Distribute All Unassigned or Pending Leads Equally (Clean-Slate Balanced)
 * Pre-sorts deterministic birthday priorities:
 * 1. Today's birthdays
 * 2. Tomorrow's birthdays
 * 3. Calendar order
 * Distributes evenly so each caller receives an exact equal share without double-counting.
 */
export async function distributeAllPendingLeads(mode: "balanced" | "round_robin" = "balanced") {
  return distributeDualStreamBalanced({ unassignedOnly: false, mode });
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
  const dist = await distributeSpecificLeads(ids, mode, true);

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
        stream: agLeads.stream,
        name: agLeads.name,
        parentName: agLeads.parentName,
        childName: agLeads.childName,
        phone: agLeads.phone,
        email: agLeads.email,
        dobDay: agLeads.dobDay,
        dobMonth: agLeads.dobMonth,
        status: agLeads.status,
        validationStatus: agLeads.validationStatus,
        lifetimeDonations: agLeads.lifetimeDonations,
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
        "Stream",
        "Celebrant / Donor Name",
        "Parent Name",
        "Child Name",
        "Mobile Number",
        "Email",
        "Birthday Day",
        "Birthday Month",
        "Call Disposition Status",
        "Validation Quality",
        "Lifetime Donated (INR)",
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
        l.stream || "DIRECT_DONOR",
        `"${(l.name || "").replace(/"/g, '""')}"`,
        l.parentName ? `"${l.parentName.replace(/"/g, '""')}"` : '""',
        l.childName ? `"${l.childName.replace(/"/g, '""')}"` : '""',
        `"+91${l.phone}"`,
        l.email ? `"${l.email.replace(/"/g, '""')}"` : '""',
        String(l.dobDay),
        String(l.dobMonth),
        l.status || "Pending",
        l.validationStatus || "UNVERIFIED",
        String(l.lifetimeDonations || 0),
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
        stream: agLeads.stream,
        name: agLeads.name,
        parentName: agLeads.parentName,
        childName: agLeads.childName,
        phone: agLeads.phone,
        email: agLeads.email,
        dobDay: agLeads.dobDay,
        dobMonth: agLeads.dobMonth,
        status: agLeads.status,
        validationStatus: agLeads.validationStatus,
        lifetimeDonations: agLeads.lifetimeDonations,
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
        "Stream",
        "Lead Name",
        "Parent Name",
        "Child Name",
        "Phone Number",
        "Email",
        "Birthday Day",
        "Birthday Month",
        "Call Disposition Status",
        "Validation Quality",
        "Lifetime Donated (INR)",
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
        l.stream || "DIRECT_DONOR",
        `"${(l.name || "").replace(/"/g, '""')}"`,
        l.parentName ? `"${l.parentName.replace(/"/g, '""')}"` : '""',
        l.childName ? `"${l.childName.replace(/"/g, '""')}"` : '""',
        `"+91${l.phone}"`,
        l.email ? `"${l.email.replace(/"/g, '""')}"` : '""',
        String(l.dobDay),
        String(l.dobMonth),
        l.status || "Pending",
        l.validationStatus || "UNVERIFIED",
        String(l.lifetimeDonations || 0),
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

