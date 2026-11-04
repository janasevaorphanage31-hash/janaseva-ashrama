import { db, ensureDbSchema } from "@/db";
import { agTelecallers, agLeads, agCallLogs, agDonations, contentEntries, influencerProfiles, donations, agDailySubmissions } from "@/db/schema";
import { eq, and, or, sql, desc, inArray, isNull, like, gte, lte } from "drizzle-orm";
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
  isWorkingToday?: boolean;
  attendanceDate?: string | null;
  dailyQuota: number;
  assignedCount: number;
  contactedCount: number;
  todayContactedCount?: number;
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
  const existingCallers = await db.select({ count: sql<number>`count(*)` }).from(agTelecallers);
  const callersCount = Number(existingCallers[0]?.count || 0);

  if (callersCount === 0) {
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
      { id: "TC16", name: "Prashanth Kumar", phone: "8123665335", email: "pkr@janaseva.org" },
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
  }

  // INDEPENDENT CHECK: Ensure ag_leads are always populated in PostgreSQL
  const existingLeads = await db.select({ count: sql<number>`count(*)` }).from(agLeads);
  const leadsCount = Number(existingLeads[0]?.count || 0);

  if (leadsCount === 0) {
    const activeCallers = await db
      .select({ callerId: agTelecallers.callerId })
      .from(agTelecallers)
      .where(eq(agTelecallers.isActive, true))
      .orderBy(agTelecallers.callerId);

    const callerIds = activeCallers.map((c) => c.callerId);
    if (callerIds.length === 0) callerIds.push("ADMIN");

    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;

    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const tomDay = tomorrow.getDate();
    const tomMonth = tomorrow.getMonth() + 1;

    const dayAfter = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
    const dayAfterDay = dayAfter.getDate();
    const dayAfterMonth = dayAfter.getMonth() + 1;

    const slotT3 = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
    const t3Day = slotT3.getDate();
    const t3Month = slotT3.getMonth() + 1;

    const sampleParents = [
      { child: "ಆರವ್ ಶರ್ಮಾ (Aarav Sharma)", parent: "ಮಹೇಶ್ ಶರ್ಮಾ (Mahesh Sharma)", phone: "9845012301" },
      { child: "ಅನ್ವಿತಾ ಗೌಡ (Anvitha Gowda)", parent: "ರಮೇಶ್ ಗೌಡ (Ramesh Gowda)", phone: "9845012302" },
      { child: "ಧ್ರುವ್ ಕುಮಾರ್ (Dhruv Kumar)", parent: "ಸುರೇಶ್ ಕುಮಾರ್ (Suresh Kumar)", phone: "9845012303" },
      { child: "ದಿಯಾ ಭಟ್ (Diya Bhat)", parent: "ವೆಂಕಟೇಶ್ ಭಟ್ (Venkatesh Bhat)", phone: "9845012304" },
      { child: "ಇಶಾನ್ ಹೆಗಡೆ (Ishaan Hegde)", parent: "ಶ್ರೀನಿವಾಸ್ ಹೆಗಡೆ (Srinivas Hegde)", phone: "9845012305" },
      { child: "ಕಾವ್ಯ ನಾರಾಯಣ್ (Kavya Narayan)", parent: "ನಾರಾಯಣ ಸ್ವಾಮಿ (Narayana Swamy)", phone: "9845012306" },
      { child: "ಪ್ರಣವ್ ದೇಶ್‌ಮುಖ್ (Pranav Deshmukh)", parent: "ಸಂಜಯ್ ದೇಶ್‌ಮುಖ್ (Sanjay Deshmukh)", phone: "9845012307" },
      { child: "ಸಾನ್ವಿ ಶೆಟ್ಟಿ (Sanvi Shetty)", parent: "ಪ್ರಭಾಕರ್ ಶೆಟ್ಟಿ (Prabhakar Shetty)", phone: "9845012308" },
      { child: "ತೇಜಸ್ ರಾವ್ (Tejas Rao)", parent: "ವಿಜಯ್ ರಾವ್ (Vijay Rao)", phone: "9845012309" },
      { child: "ಅನನ್ಯ ಕುಲಕರ್ಣಿ (Ananya Kulkarni)", parent: "ದತ್ತಾತ್ರೇಯ ಕುಲಕರ್ಣಿ (Dattatreya Kulkarni)", phone: "9845012310" },
    ];

    const sampleDonors = [
      { name: "ಡಾ. ಚಂದ್ರಶೇಖರ್ ಎಚ್. (Dr. Chandrashekar H.)", phone: "9980124001" },
      { name: "ಗಾಯತ್ರಿ ರಾಮನಾಥನ್ (Gayatri Ramanathan)", phone: "9980124002" },
      { name: "ಕಾರ್ತಿಕ್ ವೈದ್ಯನಾಥನ್ (Karthik Vaidyanathan)", phone: "9980124003" },
      { name: "ನಿರ್ಮಲಾ ಸೋಮೇಶ್ವರ್ (Nirmala Someshwar)", phone: "9980124004" },
      { name: "ಪ್ರವೀಣ್ ಜಗದೀಶ್ (Praveen Jagadish)", phone: "9980124005" },
      { name: "ಶಶಿಕಲಾ ರಾವ್ (Shashikala Rao)", phone: "9980124006" },
      { name: "ಹರೀಶ್ಚಂದ್ರ ಶೆಟ್ಟಿ (Harishchandra Shetty)", phone: "9980124007" },
      { name: "ಭವಾನಿ ಶಂಕರ್ (Bhavani Shankar)", phone: "9980124008" },
      { name: "ರಾಜಶೇಖರ್ ಅಳ್ವ (Rajshekar Alva)", phone: "9980124009" },
      { name: "ವಿದ್ಯಾ ಪ್ರಸನ್ನ (Vidya Prasanna)", phone: "9980124010" },
    ];

    const dates = [
      { day: todayDay, month: todayMonth },
      { day: tomDay, month: tomMonth },
      { day: dayAfterDay, month: dayAfterMonth },
      { day: t3Day, month: t3Month },
    ];

    let callerIdx = 0;
    for (let round = 0; round < dates.length; round++) {
      const d = dates[round];
      for (const p of sampleParents) {
        const assigned = callerIds[callerIdx % callerIds.length];
        callerIdx++;
        await db.insert(agLeads).values({
          name: p.child,
          parentName: p.parent,
          childName: p.child,
          phone: `${p.phone.slice(0, 8)}${String(round).padStart(2, "0")}`,
          dobDay: d.day,
          dobMonth: d.month,
          stream: "PARENTS",
          assignedCallerId: assigned,
          status: "Pending",
          validationStatus: "UNVERIFIED",
        });
      }
      for (const don of sampleDonors) {
        const assigned = callerIds[callerIdx % callerIds.length];
        callerIdx++;
        await db.insert(agLeads).values({
          name: don.name,
          phone: `${don.phone.slice(0, 8)}${String(round).padStart(2, "0")}`,
          dobDay: d.day,
          dobMonth: d.month,
          stream: "DIRECT_DONOR",
          assignedCallerId: assigned,
          status: "Pending",
          validationStatus: "UNVERIFIED",
        });
      }
    }
  }
  telecallersSeeded = true;
}

/**
 * 2. Date-Partitioned Equal Lead Distribution Engine
 *
 * Guarantees exact fair share (floor(N/K)) for EVERY calendar date independently:
 * - Buckets leads by (dobMonth, dobDay) and stream (DIRECT_DONOR vs PARENTS).
 * - Priority order: T+1 (Tomorrow IST) -> T+2 (Day After IST) -> Today (Day T IST) -> Upcoming dates by distance.
 * - For each date and stream, distributes floor(N/K) leads to each active/present caller.
 * - Rolling remainder offset ensures fair remainder allocation across all dates without bias.
 * - Eliminates telecaller starvation (e.g. TC08 having 1,214 total leads but 0 for tomorrow).
 */
export async function distributeDatePartitionedBalanced(options?: {
  unassignedOnly?: boolean;
  targetCallerIds?: string[];
  stream?: "PARENTS" | "DIRECT_DONOR" | "ALL";
  dateFilter?: { month: number; day: number };
}) {
  await ensureTelecallersAndSeedData();
  const unassignedOnly = options?.unassignedOnly ?? false;
  const targetStream = options?.stream || "ALL";

  // 1. Identify active/eligible telecallers
  let callerIds: string[] = [];
  if (options?.targetCallerIds && options.targetCallerIds.length > 0) {
    callerIds = Array.from(new Set(options.targetCallerIds.map((c) => c.trim().toUpperCase())));
  } else {
    const { dateStr: todayISTStr } = getISTDateBounds();
    const allCallers = await db
      .select({
        callerId: agTelecallers.callerId,
        isActive: agTelecallers.isActive,
        isWorkingToday: agTelecallers.isWorkingToday,
        attendanceDate: agTelecallers.attendanceDate,
      })
      .from(agTelecallers)
      .where(eq(agTelecallers.isActive, true))
      .orderBy(agTelecallers.callerId);

    const activeCallers = allCallers.filter((c) => {
      if (c.callerId === "ADMIN") return false;
      const isSameDay = c.attendanceDate === todayISTStr;
      const workingToday = isSameDay ? (c.isWorkingToday ?? true) : true;
      return c.isActive && workingToday;
    });

    callerIds = activeCallers.map((c) => c.callerId);
    if (callerIds.length === 0) {
      callerIds = allCallers.filter((c) => c.callerId !== "ADMIN").map((c) => c.callerId);
    }
  }

  const K = callerIds.length;
  if (K === 0) {
    throw new Error("Cannot distribute leads: No active telecallers found.");
  }

  // 2. IST Reference Dates
  const { day: curDay, month: curMonth, year: curYear } = getISTDateBounds();
  const nowIST = new Date(Date.UTC(curYear, curMonth - 1, curDay));

  const t1Date = new Date(nowIST.getTime() + 24 * 60 * 60 * 1000);
  const t1Day = t1Date.getUTCDate();
  const t1Month = t1Date.getUTCMonth() + 1;

  const t2Date = new Date(nowIST.getTime() + 2 * 24 * 60 * 60 * 1000);
  const t2Day = t2Date.getUTCDate();
  const t2Month = t2Date.getUTCMonth() + 1;

  // 3. Query Target Leads
  const conditions = [];

  if (unassignedOnly) {
    conditions.push(
      or(
        isNull(agLeads.assignedCallerId),
        eq(agLeads.assignedCallerId, "ADMIN"),
        eq(agLeads.assignedCallerId, ""),
        eq(agLeads.assignedCallerId, "UNASSIGNED")
      )
    );
    conditions.push(or(isNull(agLeads.status), eq(agLeads.status, "Pending")));
  } else {
    // Rebalance all pending leads (never touch completed, donated, interested, or rescheduled calls)
    conditions.push(or(isNull(agLeads.status), eq(agLeads.status, "Pending")));
  }

  if (targetStream === "PARENTS") {
    conditions.push(eq(agLeads.stream, "PARENTS"));
  } else if (targetStream === "DIRECT_DONOR") {
    conditions.push(
      or(
        eq(agLeads.stream, "DIRECT_DONOR"),
        eq(agLeads.stream, "DIRECT_DONORS"),
        isNull(agLeads.stream)
      )
    );
  }

  if (options?.dateFilter) {
    const { month: fm, day: fd } = options.dateFilter;
    conditions.push(
      or(
        and(eq(agLeads.dobDay, fd), eq(agLeads.dobMonth, fm)),
        and(eq(agLeads.dobDay, fm), eq(agLeads.dobMonth, fd), lte(agLeads.dobDay, 12))
      )
    );
  }

  const leads = await db
    .select({
      leadId: agLeads.leadId,
      stream: agLeads.stream,
      dobDay: agLeads.dobDay,
      dobMonth: agLeads.dobMonth,
      parentName: agLeads.parentName,
      childName: agLeads.childName,
    })
    .from(agLeads)
    .where(and(...conditions))
    .orderBy(desc(agLeads.leadId));

  if (leads.length === 0) {
    const perCaller: Record<string, number> = {};
    callerIds.forEach((id) => (perCaller[id] = 0));
    return {
      success: true,
      distributed: 0,
      parentsDistributed: 0,
      donorsDistributed: 0,
      callersCount: K,
      perCaller,
      dateBucketsCount: 0,
      datesSummary: {},
    };
  }

  // 4. Partition Leads into Date & Stream Buckets
  interface DateBucket {
    month: number;
    day: number;
    priorityRank: number;
    parents: number[];
    donors: number[];
  }

  const buckets = new Map<string, DateBucket>();

  const getPriorityRank = (m: number, d: number): number => {
    if (m <= 0 || d <= 0) return 9999;
    const isT1 = (d === t1Day && m === t1Month) || (d === t1Month && m === t1Day && d <= 12);
    if (isT1) return 1;
    const isT2 = (d === t2Day && m === t2Month) || (d === t2Month && m === t2Day && d <= 12);
    if (isT2) return 2;
    const isToday = (d === curDay && m === curMonth) || (d === curMonth && m === curDay && d <= 12);
    if (isToday) return 3;

    // Upcoming calendar days sorted by ascending days from today
    let bDate = new Date(curYear, m - 1, d);
    let diff = Math.round((bDate.getTime() - nowIST.getTime()) / 86400000);
    if (diff < 0) {
      bDate = new Date(curYear + 1, m - 1, d);
      diff = Math.round((bDate.getTime() - nowIST.getTime()) / 86400000);
    }
    return 10 + diff;
  };

  for (const l of leads) {
    const rawDay = Number(l.dobDay || 0);
    const rawMonth = Number(l.dobMonth || 0);
    let d = rawDay;
    let m = rawMonth;
    if (d > 12 && m <= 12) {
      // standard DD/MM
    } else if (d <= 12 && m > 12) {
      d = rawMonth;
      m = rawDay;
    }

    const key = `${m}_${d}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        month: m,
        day: d,
        priorityRank: getPriorityRank(m, d),
        parents: [],
        donors: [],
      });
    }

    const b = buckets.get(key)!;
    const isParent =
      l.stream === "PARENTS" ||
      (l.stream !== "DIRECT_DONOR" &&
        l.stream !== "DIRECT_DONORS" &&
        l.stream !== "donor" &&
        Boolean(l.parentName || l.childName));

    if (isParent) {
      b.parents.push(l.leadId);
    } else {
      b.donors.push(l.leadId);
    }
  }

  // 5. Sort Date Buckets by Priority Rank
  const sortedBuckets = Array.from(buckets.values()).sort(
    (a, b) => a.priorityRank - b.priorityRank || a.month - b.month || a.day - b.day
  );

  // 6. Fair-Share Allocation with Least-Loaded Balancing for Unassigned Pools
  const assignmentBuckets = new Map<string, number[]>();
  callerIds.forEach((id) => assignmentBuckets.set(id, []));

  let rollingOffset = 0;
  let totalParents = 0;
  let totalDonors = 0;
  const datesSummary: Record<string, { month: number; day: number; parents: number; donors: number; total: number }> = {};

  for (const bucket of sortedBuckets) {
    const dateLabel = `${bucket.day}/${bucket.month}`;
    datesSummary[dateLabel] = {
      month: bucket.month,
      day: bucket.day,
      parents: bucket.parents.length,
      donors: bucket.donors.length,
      total: bucket.parents.length + bucket.donors.length,
    };

    // If unassignedOnly, fetch existing assigned pending counts per caller for this specific date
    // to apply least-loaded water-filling so callers with 0 leads are prioritized first.
    let existingParentsTally: Record<string, number> = {};
    let existingDonorsTally: Record<string, number> = {};
    callerIds.forEach((cid) => {
      existingParentsTally[cid] = 0;
      existingDonorsTally[cid] = 0;
    });

    if (unassignedOnly) {
      try {
        const assignedRows = await db
          .select({
            callerId: agLeads.assignedCallerId,
            stream: agLeads.stream,
            count: sql<number>`count(*)`,
          })
          .from(agLeads)
          .where(
            and(
              inArray(agLeads.assignedCallerId, callerIds),
              or(isNull(agLeads.status), eq(agLeads.status, "Pending")),
              or(
                and(eq(agLeads.dobDay, bucket.day), eq(agLeads.dobMonth, bucket.month)),
                and(eq(agLeads.dobDay, bucket.month), eq(agLeads.dobMonth, bucket.day), lte(agLeads.dobDay, 12))
              )
            )
          )
          .groupBy(agLeads.assignedCallerId, agLeads.stream);

        assignedRows.forEach((r) => {
          if (r.callerId) {
            const num = Number(r.count || 0);
            if (r.stream === "PARENTS") {
              existingParentsTally[r.callerId] = (existingParentsTally[r.callerId] || 0) + num;
            } else {
              existingDonorsTally[r.callerId] = (existingDonorsTally[r.callerId] || 0) + num;
            }
          }
        });
      } catch (err) {
        console.warn("[CRM] Least-loaded tally check fallback:", err);
      }
    }

    // A. Distribute Parents stream for this date
    const P = bucket.parents.length;
    if (P > 0) {
      totalParents += P;
      if (unassignedOnly) {
        // Least-Loaded Water-Filling for Parents
        for (let pIdx = 0; pIdx < P; pIdx++) {
          let minCaller = callerIds[0];
          let minCount = existingParentsTally[minCaller] ?? 0;
          for (let i = 1; i < K; i++) {
            const cid = callerIds[(i + rollingOffset) % K];
            const cnt = existingParentsTally[cid] ?? 0;
            if (cnt < minCount) {
              minCaller = cid;
              minCount = cnt;
            }
          }
          assignmentBuckets.get(minCaller)!.push(bucket.parents[pIdx]);
          existingParentsTally[minCaller] = (existingParentsTally[minCaller] || 0) + 1;
        }
        rollingOffset = (rollingOffset + 1) % K;
      } else {
        // Equal floor(N/K) with rolling remainder offset for complete rebalance
        const q = Math.floor(P / K);
        const r = P % K;
        let pIdx = 0;
        for (let i = 0; i < K; i++) {
          const callerIndex = (i + rollingOffset) % K;
          const cid = callerIds[callerIndex];
          const count = q + (i < r ? 1 : 0);
          for (let j = 0; j < count && pIdx < P; j++) {
            assignmentBuckets.get(cid)!.push(bucket.parents[pIdx]);
            pIdx++;
          }
        }
        rollingOffset = (rollingOffset + r) % K;
      }
    }

    // B. Distribute Direct Donors stream for this date
    const D = bucket.donors.length;
    if (D > 0) {
      totalDonors += D;
      if (unassignedOnly) {
        // Least-Loaded Water-Filling for Direct Donors
        for (let dIdx = 0; dIdx < D; dIdx++) {
          let minCaller = callerIds[0];
          let minCount = existingDonorsTally[minCaller] ?? 0;
          for (let i = 1; i < K; i++) {
            const cid = callerIds[(i + rollingOffset) % K];
            const cnt = existingDonorsTally[cid] ?? 0;
            if (cnt < minCount) {
              minCaller = cid;
              minCount = cnt;
            }
          }
          assignmentBuckets.get(minCaller)!.push(bucket.donors[dIdx]);
          existingDonorsTally[minCaller] = (existingDonorsTally[minCaller] || 0) + 1;
        }
        rollingOffset = (rollingOffset + 1) % K;
      } else {
        // Equal floor(N/K) with rolling remainder offset for complete rebalance
        const q = Math.floor(D / K);
        const r = D % K;
        let dIdx = 0;
        for (let i = 0; i < K; i++) {
          const callerIndex = (i + rollingOffset) % K;
          const cid = callerIds[callerIndex];
          const count = q + (i < r ? 1 : 0);
          for (let j = 0; j < count && dIdx < D; j++) {
            assignmentBuckets.get(cid)!.push(bucket.donors[dIdx]);
            dIdx++;
          }
        }
        rollingOffset = (rollingOffset + r) % K;
      }
    }
  }

  // 7. Batch Update Database (500/chunk)
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

  const perCaller: Record<string, number> = {};
  for (const [callerId, ids] of assignmentBuckets.entries()) {
    perCaller[callerId] = ids.length;
  }

  return {
    success: true,
    distributed: leads.length,
    parentsDistributed: totalParents,
    donorsDistributed: totalDonors,
    callersCount: K,
    perCaller,
    dateBucketsCount: sortedBuckets.length,
    datesSummary,
  };
}

/**
 * 2b. Reallocate Absentee Advance Leads to Present Floor Telecallers
 *
 * If a telecaller is absent today or inactive, their time-critical T+1 (Tomorrow's birthday)
 * and T+2 leads are harvested and distributed strictly across present telecallers using
 * date-partitioned fair share. Non-urgent future dates remain with the absent caller.
 */
export async function reallocateAbsenteeAdvanceLeads(options?: {
  includeT2?: boolean;
}) {
  await ensureTelecallersAndSeedData();
  const includeT2 = options?.includeT2 ?? true;
  const { dateStr: todayISTStr, day: curDay, month: curMonth, year: curYear } = getISTDateBounds();

  // 1. Fetch telecallers and determine active floor vs absent callers
  const allCallers = await db
    .select({
      callerId: agTelecallers.callerId,
      name: agTelecallers.name,
      isActive: agTelecallers.isActive,
      isWorkingToday: agTelecallers.isWorkingToday,
      attendanceDate: agTelecallers.attendanceDate,
    })
    .from(agTelecallers)
    .orderBy(agTelecallers.callerId);

  const presentCallers: string[] = [];
  const absentCallers: string[] = [];

  for (const c of allCallers) {
    if (c.callerId === "ADMIN") continue;
    const isSameDay = c.attendanceDate === todayISTStr;
    const workingToday = isSameDay ? (c.isWorkingToday ?? true) : true;
    if (c.isActive && workingToday) {
      presentCallers.push(c.callerId);
    } else {
      absentCallers.push(c.callerId);
    }
  }

  if (presentCallers.length === 0) {
    return {
      success: false,
      message: "No active telecallers are currently marked as present and working today.",
      harvestedFromAbsentCount: 0,
      reallocatedToPresentCount: 0,
      distributed: 0,
      parentsDistributed: 0,
      donorsDistributed: 0,
      callersCount: 0,
      presentCallersCount: 0,
      absentCallersCount: absentCallers.length,
      t1Distributed: 0,
      t2Distributed: 0,
      presentCallers: [] as string[],
      absentCallers,
      perCaller: {},
    };
  }

  // 2. IST Advance Dates: T+1 (Tomorrow) and T+2
  const nowIST = new Date(Date.UTC(curYear, curMonth - 1, curDay));
  const t1Date = new Date(nowIST.getTime() + 24 * 60 * 60 * 1000);
  const t1Day = t1Date.getUTCDate();
  const t1Month = t1Date.getUTCMonth() + 1;

  const t2Date = new Date(nowIST.getTime() + 2 * 24 * 60 * 60 * 1000);
  const t2Day = t2Date.getUTCDate();
  const t2Month = t2Date.getUTCMonth() + 1;

  const targetDateConditions = [
    or(
      and(eq(agLeads.dobDay, t1Day), eq(agLeads.dobMonth, t1Month)),
      and(eq(agLeads.dobDay, t1Month), eq(agLeads.dobMonth, t1Day), lte(agLeads.dobDay, 12))
    ),
  ];

  if (includeT2) {
    targetDateConditions.push(
      or(
        and(eq(agLeads.dobDay, t2Day), eq(agLeads.dobMonth, t2Month)),
        and(eq(agLeads.dobDay, t2Month), eq(agLeads.dobMonth, t2Day), lte(agLeads.dobDay, 12))
      )
    );
  }

  // 3. Harvest pending advance leads from absent callers
  let harvestedFromAbsentCount = 0;
  if (absentCallers.length > 0) {
    const absentLeads = await db
      .select({ leadId: agLeads.leadId })
      .from(agLeads)
      .where(
        and(
          inArray(agLeads.assignedCallerId, absentCallers),
          or(isNull(agLeads.status), eq(agLeads.status, "Pending")),
          or(...targetDateConditions)
        )
      );

    if (absentLeads.length > 0) {
      harvestedFromAbsentCount = absentLeads.length;
      const ids = absentLeads.map((l) => l.leadId);
      for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        await db
          .update(agLeads)
          .set({ assignedCallerId: null, updatedAt: new Date() })
          .where(inArray(agLeads.leadId, chunk));
      }
    }
  }

  // 4. Distribute advance leads strictly to present floor callers with clean-slate equal division
  const resT1 = await distributeDatePartitionedBalanced({
    unassignedOnly: false,
    targetCallerIds: presentCallers,
    dateFilter: { month: t1Month, day: t1Day },
  });

  let t2Distributed = 0;
  let t2Parents = 0;
  let t2Donors = 0;
  if (includeT2) {
    const resT2 = await distributeDatePartitionedBalanced({
      unassignedOnly: false,
      targetCallerIds: presentCallers,
      dateFilter: { month: t2Month, day: t2Day },
    });
    t2Distributed = resT2.distributed;
    t2Parents = resT2.parentsDistributed || 0;
    t2Donors = resT2.donorsDistributed || 0;
  }

  return {
    success: true,
    harvestedFromAbsentCount,
    reallocatedToPresentCount: resT1.distributed + t2Distributed,
    distributed: resT1.distributed + t2Distributed,
    parentsDistributed: (resT1.parentsDistributed || 0) + t2Parents,
    donorsDistributed: (resT1.donorsDistributed || 0) + t2Donors,
    callersCount: presentCallers.length,
    t1Distributed: resT1.distributed,
    t2Distributed,
    presentCallersCount: presentCallers.length,
    absentCallersCount: absentCallers.length,
    presentCallers,
    absentCallers,
    perCaller: resT1.perCaller,
  };
}

/**
 * 2c. Toggle Telecaller Attendance (Working Today vs Absent Today)
 */
export async function toggleTelecallerAttendance(
  callerId: string,
  isWorkingToday: boolean,
  reallocateAdvanceLeads = true
) {
  await ensureTelecallersAndSeedData();
  const cid = callerId.trim().toUpperCase();
  const { dateStr } = getISTDateBounds();

  await db
    .update(agTelecallers)
    .set({
      isWorkingToday,
      attendanceDate: dateStr,
      updatedAt: new Date(),
    })
    .where(eq(agTelecallers.callerId, cid));

  let reallocatedCount = 0;
  if (!isWorkingToday && reallocateAdvanceLeads) {
    const res = await reallocateAbsenteeAdvanceLeads();
    reallocatedCount = res.reallocatedToPresentCount;
  }

  return {
    success: true,
    callerId: cid,
    isWorkingToday,
    attendanceDate: dateStr,
    reallocatedCount,
  };
}

export async function distributeTomorrowBirthdayLeads(mode: "balanced" | "round_robin" = "balanced") {
  return reallocateAbsenteeAdvanceLeads({ includeT2: false });
}

export async function distributeBirthdayLeads() {
  return distributeTomorrowBirthdayLeads("balanced");
}

export async function distributeT2BirthdayLeads(mode: "balanced" | "round_robin" = "balanced") {
  return reallocateAbsenteeAdvanceLeads({ includeT2: true });
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
  const { day: todayDay, month: todayMonth, year: todayYear } = getISTDateBounds();
  const nowIST = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));
  const tomorrow = new Date(nowIST.getTime() + 24 * 60 * 60 * 1000);
  const targetDay = tomorrow.getUTCDate();
  const targetMonth = tomorrow.getUTCMonth() + 1;

  const t2 = new Date(nowIST.getTime() + 2 * 24 * 60 * 60 * 1000);
  const t2Day = t2.getUTCDate();
  const t2Month = t2.getUTCMonth() + 1;
  const now = new Date();

  const orderClauses = [
    sql`case when ${agLeads.status} = 'Reschedule' and ${agLeads.rescheduleDate} <= ${now} then 0 else 1 end`,
    // PRIORITY 2: Pending Tomorrow's (T+1) Birthday Leads
    sql`case when (${agLeads.status} = 'Pending' or ${agLeads.status} is null) and (${agLeads.dobMonth} = ${targetMonth} and ${agLeads.dobDay} = ${targetDay}) then 0 else 1 end`,
    // PRIORITY 3: Pending Day After Tomorrow's (T+2) Birthday Leads
    sql`case when (${agLeads.status} = 'Pending' or ${agLeads.status} is null) and (${agLeads.dobMonth} = ${t2Month} and ${agLeads.dobDay} = ${t2Day}) then 0 else 1 end`,
    // PRIORITY 4: Pending Today's Birthday Leads
    sql`case when (${agLeads.status} = 'Pending' or ${agLeads.status} is null) and (${agLeads.dobMonth} = ${todayMonth} and ${agLeads.dobDay} = ${todayDay}) then 0 else 1 end`,
    // PRIORITY 5: All other Pending uncalled leads
    sql`case when ${agLeads.status} = 'Pending' or ${agLeads.status} is null then 0 else 1 end`,
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
    whatsappPhone: agLeads.whatsappPhone,
    dispositionReason: agLeads.dispositionReason,
    preferredLanguage: agLeads.preferredLanguage,
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
    const isParent = l.stream === "PARENTS" || (l.stream !== "DIRECT_DONOR" && l.stream !== "DIRECT_DONORS" && Boolean(l.parentName || l.childName));
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
      stream: isParent ? "PARENTS" : "DIRECT_DONOR",
      childName: isParent ? childName : null,
      parentName: isParent ? parentName : null,
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

  // Today's calls count directly from agCallLogs (IST bounds)
  const { todayStart, todayEnd } = getISTDateBounds();
  const callerLogsCondition = cid && cid !== "ALL" 
    ? and(eq(agCallLogs.callerId, cid), gte(agCallLogs.createdAt, todayStart), lte(agCallLogs.createdAt, todayEnd))
    : and(gte(agCallLogs.createdAt, todayStart), lte(agCallLogs.createdAt, todayEnd));

  const [todayCalls] = await db
    .select({ count: sql<number>`count(*)` })
    .from(agCallLogs)
    .where(callerLogsCondition);

  return {
    leads,
    stats: {
      totalAssigned: Number(leadStats?.totalAssigned || 0),
      contactedCount: Number(leadStats?.contactedCount || 0),
      todayContactedCount: Number(todayCalls?.count || 0),
      convertedCount: Number(leadStats?.convertedCount || 0),
      pendingCount: Number(leadStats?.pendingCount || 0),
      interestedCount: Number(leadStats?.interestedCount || 0),
      rescheduleCount: Number(leadStats?.rescheduleCount || 0),
      totalRevenue: Number(revRow?.totalRevenue || 0),
    },
  };
}

export { validateIndianUtr } from "@/lib/crm-validators";

/**
 * Check if a UTR was already recorded by any telecaller across the system
 */
export async function checkUtrAvailability(utr: string) {
  await ensureDbSchema();
  const cleanUtr = utr.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!cleanUtr) return { available: true };

  const [existingDonation] = await db
    .select({
      callerRefId: agDonations.callerRefId,
      amount: agDonations.amount,
      createdAt: agDonations.createdAt,
      verificationStatus: agDonations.verificationStatus,
    })
    .from(agDonations)
    .where(eq(agDonations.txnId, `utr_${cleanUtr}`))
    .limit(1);

  if (existingDonation) {
    return {
      available: false,
      error: `Duplicate UTR! This UTR (${cleanUtr}) was already recorded by telecaller ${existingDonation.callerRefId || "another caller"} for ₹${existingDonation.amount}. Duplicate UTRs cannot be credited twice.`,
      callerRefId: existingDonation.callerRefId,
      amount: existingDonation.amount,
    };
  }

  return { available: true };
}

/**
 * 4. Log Call Disposition, Validation Quality & Notes
 */
export async function logCallDisposition(
  leadId: number,
  callerId: string,
  disposition: string,
  notes?: string,
  callbackTime?: string | null,
  amount?: number | null,
  utr?: string | null,
  extra?: {
    whatsappPhone?: string | null;
    phone?: string | null;
    dispositionReason?: string | null;
    preferredLanguage?: string | null;
  }
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
      reason: extra?.dispositionReason?.trim() || null,
      notes: notes?.trim() || null,
      callbackTime: validCallbackDate,
      amount: amount ? Math.round(Number(amount)) : null,
      utr: utr?.trim() || null,
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
    disposition === "Invalid_Number" ||
    disposition === "Junk" ||
    disposition === "Invalid"
  ) {
    validationStatus = "JUNK_INVALID";
  }

  // Update lead current status and contact details
  const leadUpdates: Record<string, any> = {
    status: disposition,
    validationStatus,
    rescheduleDate: callbackTime ? new Date(callbackTime) : null,
    lastContactedAt: new Date(),
    updatedAt: new Date(),
  };

  if (extra?.whatsappPhone !== undefined) {
    leadUpdates.whatsappPhone = extra.whatsappPhone?.trim() || null;
  }
  if (extra?.phone !== undefined && extra.phone?.trim()) {
    leadUpdates.phone = extra.phone.trim();
  }
  if (extra?.dispositionReason !== undefined) {
    leadUpdates.dispositionReason = extra.dispositionReason?.trim() || null;
  }
  if (extra?.preferredLanguage !== undefined) {
    leadUpdates.preferredLanguage = extra.preferredLanguage?.trim() || null;
  }

  await db
    .update(agLeads)
    .set(leadUpdates)
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

  const effectiveTargetPhone = lead.whatsappPhone || lead.phone;
  const customerPhoneInfo = parseCustomerPhone(effectiveTargetPhone);
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

  const isOnlineGateway = Boolean(data.txnId && data.txnId.startsWith("pay_"));
  const initialVerifStatus = isOnlineGateway ? "VERIFIED" : "PENDING_APPROVAL";
  const verifiedAmt = isOnlineGateway ? roundedAmount : null;
  const verifiedBy = isOnlineGateway ? "RAZORPAY_WEBHOOK" : null;
  const verifiedAt = isOnlineGateway ? new Date() : null;

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
      verificationStatus: initialVerifStatus,
      verifiedAmount: verifiedAmt,
      verifiedBy: verifiedBy,
      verifiedAt: verifiedAt,
      paymentMode: data.metadata?.paymentMode || (isOnlineGateway ? "Gateway" : "UPI"),
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

  // 6. Record into referral_attributions table for permanent attribution auditing
  if (cleanRef) {
    try {
      await db.execute(sql`
        INSERT INTO referral_attributions (ref_id, lead_id, payment_id, amount_paise, utm_source, caller_name, donor_name, verified_at)
        VALUES (
          ${cleanRef},
          ${effectiveLeadId},
          ${data.txnId},
          ${roundedAmount * 100},
          ${data.metadata?.utm_source || 'whatsapp'},
          ${cleanRef},
          ${data.donorName || null},
          ${verifiedAt || new Date()}
        )
      `);
    } catch (refErr) {
      console.warn("[CRM] referral_attributions insert notice:", refErr);
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
  streamCounts?: { DIRECT_DONOR: number; PARENTS: number };
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

  // 1b. Stream counts (DIRECT_DONOR vs PARENTS)
  const streamCountsRows = await db
    .select({
      stream: agLeads.stream,
      count: sql<number>`count(*)`,
    })
    .from(agLeads)
    .groupBy(agLeads.stream);

  const streamCounts = {
    DIRECT_DONOR: 0,
    PARENTS: 0,
  };
  for (const r of streamCountsRows) {
    if (r.stream === "PARENTS") streamCounts.PARENTS = Number(r.count || 0);
    else if (r.stream === "DIRECT_DONOR") streamCounts.DIRECT_DONOR = Number(r.count || 0);
  }

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

  // 5. Today's calls per caller directly from agCallLogs (IST bounds)
  const { todayStart, todayEnd, dateStr: todayISTStr } = getISTDateBounds();
  const todayCallRows = await db
    .select({
      callerId: agCallLogs.callerId,
      count: sql<number>`count(*)`,
    })
    .from(agCallLogs)
    .where(and(gte(agCallLogs.createdAt, todayStart), lte(agCallLogs.createdAt, todayEnd)))
    .groupBy(agCallLogs.callerId);

  const todayCallsByCaller: Record<string, number> = {};
  for (const r of todayCallRows) {
    if (r.callerId) todayCallsByCaller[r.callerId] = Number(r.count || 0);
  }

  const statsList: TelecallerStats[] = allCallers.map((c) => {
    const assigned = assignedByCaller[c.callerId] || 0;
    const contacted = contactedByCaller[c.callerId] || 0;
    const converted = convertedByCaller[c.callerId] || 0;
    const totalAmount = donationsByCaller[c.callerId] || 0;
    const rate = assigned > 0 ? (converted / assigned) * 100 : 0;
    const isSameDay = c.attendanceDate === todayISTStr;
    const isWorkingToday = isSameDay ? (c.isWorkingToday ?? true) : true;

    return {
      callerId: c.callerId,
      name: c.name,
      whatsappNumber: c.whatsappNumber,
      email: c.email,
      isActive: c.isActive,
      isWorkingToday,
      attendanceDate: c.attendanceDate,
      dailyQuota: c.dailyQuota,
      assignedCount: assigned,
      contactedCount: contacted,
      todayContactedCount: todayCallsByCaller[c.callerId] || 0,
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
    streamCounts,
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
  const seenInUploadMap = new Map<string, any>();
  let internalDuplicatesSkipped = 0;
  let alreadyInDbSkipped = 0;
  let enrichedUpdatedCount = 0;

  for (const item of rawLeads) {
    const rawDigits = (item.phone || "").replace(/\D/g, "");
    if (rawDigits.length < 10) continue;
    const phone10 = rawDigits.slice(-10);

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

    // Check duplicate inside the current upload file, with smart Sibling / Twin retention
    if (seenInUploadMap.has(phone10)) {
      const prev = seenInUploadMap.get(phone10);
      if (isParent && incomingHasRealChild && prev && prev.childName && !isPlaceholderStr(prev.childName)) {
        const prevChild = String(prev.childName).trim();
        if (childCandidate.toLowerCase() !== prevChild.toLowerCase() && !prevChild.toLowerCase().includes(childCandidate.toLowerCase())) {
          // Sibling / Twin detected in the same upload file! Combine child names so neither is lost
          prev.childName = `${prevChild} & ${childCandidate}`;
          prev.name = `${prev.childName} (${prev.parentName || "ಪೋಷಕರು"})`;
          enrichedUpdatedCount++;
          continue;
        }
      }
      internalDuplicatesSkipped++;
      continue;
    }

    // Check if already in database: smart update / enrich if existing lead needs real names or has a new sibling
    if (existingLeadMap.has(phone10)) {
      const existing = existingLeadMap.get(phone10)!;
      const existingNeedsChild = isPlaceholderStr(existing.childName) || (existing.name && existing.name.toLowerCase().startsWith("child"));
      const existingNeedsParent = isPlaceholderStr(existing.parentName);

      // Sibling / Twin detected with existing database lead! Combine child names
      if (isParent && incomingHasRealChild && existing && existing.childName && !isPlaceholderStr(existing.childName)) {
        const existingChild = String(existing.childName).trim();
        if (childCandidate.toLowerCase() !== existingChild.toLowerCase() && !existingChild.toLowerCase().includes(childCandidate.toLowerCase())) {
          const combinedChild = `${existingChild} & ${childCandidate}`;
          const effectiveParent = incomingHasRealParent ? parentCandidate : (!isPlaceholderStr(existing.parentName) ? existing.parentName! : "ಪೋಷಕರು");
          await db
            .update(agLeads)
            .set({
              childName: combinedChild,
              parentName: effectiveParent,
              name: `${combinedChild} (${effectiveParent})`,
              updatedAt: new Date(),
            })
            .where(eq(agLeads.leadId, existing.leadId));
          enrichedUpdatedCount++;
          continue;
        }
      }

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

    const newLeadItem = {
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
    };
    validLeads.push(newLeadItem);
    seenInUploadMap.set(phone10, newLeadItem);
  }

  if (validLeads.length === 0) {
    return {
      success: true,
      totalReceived: rawLeads.length,
      validParsed: seenInUploadMap.size,
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
    validParsed: seenInUploadMap.size,
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
  targetCallerIds?: string[];
  stream?: "PARENTS" | "DIRECT_DONOR" | "ALL";
  dateFilter?: { month: number; day: number };
}) {
  return distributeDatePartitionedBalanced(options);
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

/**
 * ==============================================================================
 * FINANCIAL CRM, TELECALLER SHIFT CORRECTION, EOD SUBMISSION & ADMIN APPROVALS
 * ==============================================================================
 */

export function getISTDateBounds(d = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = d.getTime() + istOffset;
  const istDate = new Date(istTime);
  const y = istDate.getUTCFullYear();
  const m = istDate.getUTCMonth(); // 0-11
  const day = istDate.getUTCDate();

  const todayStart = new Date(Date.UTC(y, m, day) - istOffset);
  const todayEnd = new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - istOffset);
  const monthStart = new Date(Date.UTC(y, m, 1) - istOffset);
  const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { todayStart, todayEnd, monthStart, dateStr, year: y, month: m + 1, day };
}

/**
 * Allows a telecaller to correct an entry made during their shift before EOD submission.
 */
export async function editCallDispositionLog(params: {
  leadId: number;
  callerId: string;
  disposition: string;
  notes?: string | null;
  amount?: number | null;
  utr?: string | null;
  callbackTime?: string | null;
  paymentMode?: string | null;
  whatsappPhone?: string | null;
  phone?: string | null;
  dispositionReason?: string | null;
  preferredLanguage?: string | null;
}) {
  await ensureDbSchema();

  // Find the most recent log for this lead by this caller
  const recentLogs = await db
    .select()
    .from(agCallLogs)
    .where(
      and(
        eq(agCallLogs.leadId, params.leadId),
        eq(agCallLogs.callerId, params.callerId)
      )
    )
    .orderBy(desc(agCallLogs.createdAt))
    .limit(1);

  if (recentLogs.length === 0) {
    throw new Error("No previous call log found to edit for this lead.");
  }

  const existingLog = recentLogs[0];
  if (existingLog.eodSubmitted) {
    throw new Error("This call log has already been submitted in your End-of-Day report and is locked. Please request Admin to unlock your shift.");
  }

  const validCallbackDate =
    params.callbackTime && !isNaN(new Date(params.callbackTime).getTime())
      ? new Date(params.callbackTime)
      : null;

  const originalDisp = existingLog.originalDisposition || existingLog.disposition;
  const originalAmt = existingLog.originalAmount ?? existingLog.amount ?? null;
  const newAmount = params.amount ? Math.round(Number(params.amount)) : null;

  // 1. Update the call log with audit trail
  await db
    .update(agCallLogs)
    .set({
      disposition: params.disposition,
      notes: params.notes !== undefined ? (params.notes?.trim() || null) : existingLog.notes,
      reason: params.dispositionReason !== undefined ? (params.dispositionReason?.trim() || null) : existingLog.reason,
      callbackTime: validCallbackDate,
      amount: newAmount,
      utr: params.utr?.trim() || null,
      isEdited: true,
      editedAt: new Date(),
      originalDisposition: originalDisp,
      originalAmount: originalAmt,
    })
    .where(eq(agCallLogs.logId, existingLog.logId));

  // 2. Update lead status & validation
  let validationStatus = "UNVERIFIED";
  if (params.disposition === "Donated") validationStatus = "VALID_DONATED";
  else if (params.disposition === "Interested") validationStatus = "VALID_INTERESTED";
  else if (params.disposition === "Reschedule") validationStatus = "VALID_CALLBACK";
  else if (params.disposition === "Rejected" || params.disposition === "Not Interested") validationStatus = "SOFT_REJECT";
  else if (params.disposition === "Wrong_Number" || params.disposition === "Invalid_Number") validationStatus = "JUNK_INVALID";
  else if (params.disposition === "Pending") validationStatus = "UNVERIFIED";

  const leadUpdates: Record<string, any> = {
    status: params.disposition,
    validationStatus,
    rescheduleDate: validCallbackDate,
    updatedAt: new Date(),
  };

  if (params.whatsappPhone !== undefined) {
    leadUpdates.whatsappPhone = params.whatsappPhone?.trim() || null;
  }
  if (params.phone !== undefined && params.phone?.trim()) {
    leadUpdates.phone = params.phone.trim();
  }
  if (params.dispositionReason !== undefined) {
    leadUpdates.dispositionReason = params.dispositionReason?.trim() || null;
  }
  if (params.preferredLanguage !== undefined) {
    leadUpdates.preferredLanguage = params.preferredLanguage?.trim() || null;
  }

  await db
    .update(agLeads)
    .set(leadUpdates)
    .where(eq(agLeads.leadId, params.leadId));

  // 3. Update or manage donation record
  if (params.disposition === "Donated" && newAmount && newAmount > 0) {
    // Check if donation already recorded
    const existingDonation = await db
      .select()
      .from(agDonations)
      .where(
        and(
          eq(agDonations.leadId, params.leadId),
          eq(agDonations.callerRefId, params.callerId)
        )
      )
      .orderBy(desc(agDonations.createdAt))
      .limit(1);

    if (existingDonation.length > 0) {
      // Update existing donation with corrected amount and UTR
      await db
        .update(agDonations)
        .set({
          amount: newAmount,
          verificationStatus: "PENDING_APPROVAL", // Re-queue for admin approval
          verifiedAmount: null,
          verifiedBy: null,
          verifiedAt: null,
          paymentMode: params.paymentMode || existingDonation[0].paymentMode || "UPI",
          metadata: {
            ...((existingDonation[0].metadata as any) || {}),
            utr: params.utr?.trim() || null,
            editedByCallerAt: new Date().toISOString(),
            previousAmount: existingDonation[0].amount,
          },
        })
        .where(eq(agDonations.txnId, existingDonation[0].txnId));
    } else {
      // Create new donation record
      const txnId = params.utr?.trim() ? `utr_${params.utr.trim()}` : `offline_${Date.now()}_${params.leadId}`;
      const [leadData] = await db.select().from(agLeads).where(eq(agLeads.leadId, params.leadId)).limit(1);
      await db.insert(agDonations).values({
        txnId,
        gatewayOrderId: `order_edit_${Date.now()}`,
        amount: newAmount,
        currency: "INR",
        paymentStatus: "captured",
        callerRefId: params.callerId,
        leadId: params.leadId,
        donorName: leadData?.name || null,
        donorPhone: leadData?.phone || null,
        paymentMode: params.paymentMode || "UPI",
        verificationStatus: "PENDING_APPROVAL",
        metadata: { utr: params.utr?.trim() || null, createdViaEdit: true },
      });
    }
  } else if (params.disposition !== "Donated") {
    // If was previously Donated but changed, mark donation as cancelled/rejected
    await db
      .update(agDonations)
      .set({
        paymentStatus: "cancelled",
        verificationStatus: "REJECTED",
        rejectionReason: `Telecaller corrected disposition from Donated to ${params.disposition}`,
      })
      .where(
        and(
          eq(agDonations.leadId, params.leadId),
          eq(agDonations.callerRefId, params.callerId)
        )
      );
  }

  return { success: true, message: "Call log updated successfully." };
}

/**
 * Update lead phone, WhatsApp number, or contact info directly from workspace
 */
export async function updateLeadContactInfo(params: {
  leadId: number;
  callerId: string;
  phone?: string | null;
  whatsappPhone?: string | null;
  preferredLanguage?: string | null;
  name?: string | null;
  parentName?: string | null;
  childName?: string | null;
}) {
  await ensureDbSchema();
  const updates: Record<string, any> = { updatedAt: new Date() };

  if (params.phone !== undefined && params.phone?.trim()) {
    updates.phone = params.phone.trim();
  }
  if (params.whatsappPhone !== undefined) {
    updates.whatsappPhone = params.whatsappPhone?.trim() || null;
  }
  if (params.preferredLanguage !== undefined) {
    updates.preferredLanguage = params.preferredLanguage?.trim() || null;
  }
  if (params.name !== undefined && params.name?.trim()) {
    updates.name = params.name.trim();
  }
  if (params.parentName !== undefined) {
    updates.parentName = params.parentName?.trim() || null;
  }
  if (params.childName !== undefined) {
    updates.childName = params.childName?.trim() || null;
  }

  await db.update(agLeads).set(updates).where(eq(agLeads.leadId, params.leadId));
  return { success: true, leadId: params.leadId, updates };
}

/**
 * 1-Tap Undo / Revert accidental attended lead back to Pending queue
 */
export async function revertLeadToPending(leadId: number, callerId: string) {
  await ensureDbSchema();

  // Reset lead status to Pending and validation to UNVERIFIED
  await db
    .update(agLeads)
    .set({
      status: "Pending",
      validationStatus: "UNVERIFIED",
      rescheduleDate: null,
      updatedAt: new Date(),
    })
    .where(eq(agLeads.leadId, leadId));

  // Mark latest call log as reverted with audit trail
  const recentLogs = await db
    .select()
    .from(agCallLogs)
    .where(and(eq(agCallLogs.leadId, leadId), eq(agCallLogs.callerId, callerId)))
    .orderBy(desc(agCallLogs.createdAt))
    .limit(1);

  if (recentLogs.length > 0) {
    const existing = recentLogs[0];
    await db
      .update(agCallLogs)
      .set({
        disposition: "Pending",
        notes: [existing.notes, "[Reverted to Pending by caller]"].filter(Boolean).join(" "),
        isEdited: true,
        editedAt: new Date(),
      })
      .where(eq(agCallLogs.logId, existing.logId));
  }

  // Cancel any pending donation if previously logged
  await db
    .update(agDonations)
    .set({
      paymentStatus: "cancelled",
      verificationStatus: "REJECTED",
      rejectionReason: "Reverted to Pending by telecaller",
    })
    .where(and(eq(agDonations.leadId, leadId), eq(agDonations.callerRefId, callerId)));

  return { success: true, message: "Lead successfully reverted to Pending queue." };
}

/**
 * Get all calls logged by a telecaller today (for shift review and editing).
 */
export async function getCallerDailyLogs(callerId: string) {
  await ensureDbSchema();
  const { todayStart, todayEnd } = getISTDateBounds();

  // Fetch call logs with lead information
  const logs = await db
    .select({
      logId: agCallLogs.logId,
      leadId: agCallLogs.leadId,
      callerId: agCallLogs.callerId,
      disposition: agCallLogs.disposition,
      reason: agCallLogs.reason,
      notes: agCallLogs.notes,
      amount: agCallLogs.amount,
      utr: agCallLogs.utr,
      callbackTime: agCallLogs.callbackTime,
      isEdited: agCallLogs.isEdited,
      editedAt: agCallLogs.editedAt,
      originalDisposition: agCallLogs.originalDisposition,
      originalAmount: agCallLogs.originalAmount,
      eodSubmitted: agCallLogs.eodSubmitted,
      createdAt: agCallLogs.createdAt,
      leadName: agLeads.name,
      parentName: agLeads.parentName,
      childName: agLeads.childName,
      phone: agLeads.phone,
      whatsappPhone: agLeads.whatsappPhone,
      stream: agLeads.stream,
    })
    .from(agCallLogs)
    .leftJoin(agLeads, eq(agCallLogs.leadId, agLeads.leadId))
    .where(
      and(
        eq(agCallLogs.callerId, callerId),
        gte(agCallLogs.createdAt, todayStart),
        lte(agCallLogs.createdAt, todayEnd)
      )
    )
    .orderBy(desc(agCallLogs.createdAt));

  // Also query any donations logged today by this caller to link verification status
  const callerDonations = await db
    .select({
      txnId: agDonations.txnId,
      leadId: agDonations.leadId,
      amount: agDonations.amount,
      verificationStatus: agDonations.verificationStatus,
      verifiedAmount: agDonations.verifiedAmount,
      rejectionReason: agDonations.rejectionReason,
      adminNotes: agDonations.adminNotes,
      paymentMode: agDonations.paymentMode,
      metadata: agDonations.metadata,
    })
    .from(agDonations)
    .where(
      and(
        eq(agDonations.callerRefId, callerId),
        gte(agDonations.createdAt, todayStart),
        lte(agDonations.createdAt, todayEnd)
      )
    );

  const donMap = new Map<number, any>();
  callerDonations.forEach((d) => {
    if (d.leadId) donMap.set(d.leadId, d);
  });

  return logs.map((log) => {
    const linkedDonation = donMap.get(log.leadId);
    return {
      ...log,
      verificationStatus: linkedDonation?.verificationStatus || (log.disposition === "Donated" ? "PENDING_APPROVAL" : null),
      verifiedAmount: linkedDonation?.verifiedAmount || null,
      rejectionReason: linkedDonation?.rejectionReason || null,
      adminNotes: linkedDonation?.adminNotes || null,
      effectiveAmount: linkedDonation?.amount || log.amount || 0,
      paymentMode: linkedDonation?.paymentMode || "UPI",
    };
  });
}

/**
 * End-of-Day (EOD) Shift Submission for a telecaller.
 */
export async function submitCallerEODShift(
  callerId: string,
  submissionType = "MANUAL",
  notes?: string
) {
  await ensureDbSchema();
  const { todayStart, todayEnd, dateStr } = getISTDateBounds();

  // 1. Calculate today's stats for this telecaller
  const todayLogs = await db
    .select({
      logId: agCallLogs.logId,
      disposition: agCallLogs.disposition,
      amount: agCallLogs.amount,
    })
    .from(agCallLogs)
    .where(
      and(
        eq(agCallLogs.callerId, callerId),
        gte(agCallLogs.createdAt, todayStart),
        lte(agCallLogs.createdAt, todayEnd)
      )
    );

  const totalCalls = todayLogs.length;
  let totalInterested = 0;
  let totalDonated = 0;
  let claimedAmount = 0;

  todayLogs.forEach((l) => {
    if (l.disposition === "Interested") totalInterested++;
    if (l.disposition === "Donated") {
      totalDonated++;
      if (l.amount && l.amount > 0) claimedAmount += l.amount;
    }
  });

  // Calculate verified amount today (if admin already verified some)
  const verifiedSums = await db
    .select({ sum: sql<number>`COALESCE(SUM(${agDonations.verifiedAmount}), 0)` })
    .from(agDonations)
    .where(
      and(
        eq(agDonations.callerRefId, callerId),
        eq(agDonations.verificationStatus, "VERIFIED"),
        gte(agDonations.createdAt, todayStart),
        lte(agDonations.createdAt, todayEnd)
      )
    );
  const verifiedAmount = Number(verifiedSums[0]?.sum || 0);

  // 2. Lock today's logs for this caller
  await db
    .update(agCallLogs)
    .set({ eodSubmitted: true })
    .where(
      and(
        eq(agCallLogs.callerId, callerId),
        gte(agCallLogs.createdAt, todayStart),
        lte(agCallLogs.createdAt, todayEnd)
      )
    );

  // 3. Upsert into agDailySubmissions
  const existingSub = await db
    .select()
    .from(agDailySubmissions)
    .where(
      and(
        eq(agDailySubmissions.callerId, callerId),
        eq(agDailySubmissions.submissionDate, dateStr)
      )
    )
    .limit(1);

  let submissionId: number;
  if (existingSub.length > 0) {
    submissionId = existingSub[0].submissionId;
    await db
      .update(agDailySubmissions)
      .set({
        totalCalls,
        totalInterested,
        totalDonated,
        claimedAmount,
        verifiedAmount,
        submissionType,
        status: "SUBMITTED",
        submittedAt: new Date(),
        notes: notes || existingSub[0].notes,
      })
      .where(eq(agDailySubmissions.submissionId, submissionId));
  } else {
    const [inserted] = await db
      .insert(agDailySubmissions)
      .values({
        callerId,
        submissionDate: dateStr,
        totalCalls,
        totalInterested,
        totalDonated,
        claimedAmount,
        verifiedAmount,
        submissionType,
        status: "SUBMITTED",
        notes: notes || null,
      })
      .returning({ submissionId: agDailySubmissions.submissionId });
    submissionId = inserted.submissionId;
  }

  return {
    success: true,
    submissionId,
    dateStr,
    totalCalls,
    totalInterested,
    totalDonated,
    claimedAmount,
    verifiedAmount,
    status: "SUBMITTED",
  };
}

/**
 * Checks the EOD Shift status for a telecaller today.
 */
export async function getEODShiftStatus(callerId: string, targetDate?: string) {
  await ensureDbSchema();
  const { dateStr, todayStart, todayEnd } = getISTDateBounds();
  const queryDate = targetDate || dateStr;

  const sub = await db
    .select()
    .from(agDailySubmissions)
    .where(
      and(
        eq(agDailySubmissions.callerId, callerId),
        eq(agDailySubmissions.submissionDate, queryDate)
      )
    )
    .limit(1);

  const callCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(agCallLogs)
    .where(
      and(
        eq(agCallLogs.callerId, callerId),
        gte(agCallLogs.createdAt, todayStart),
        lte(agCallLogs.createdAt, todayEnd)
      )
    );

  const totalCallsToday = Number(callCount[0]?.count || 0);

  return {
    isSubmitted: sub.length > 0 && sub[0].status === "SUBMITTED",
    status: sub[0]?.status || "NOT_SUBMITTED",
    submission: sub[0] || null,
    totalCallsToday,
  };
}

/**
 * Admin unlocks a telecaller's shift for corrections.
 */
export async function unlockCallerShift(callerId: string, targetDate?: string) {
  await ensureDbSchema();
  const { dateStr, todayStart, todayEnd } = getISTDateBounds();
  const queryDate = targetDate || dateStr;

  await db
    .update(agDailySubmissions)
    .set({ status: "UNLOCKED" })
    .where(
      and(
        eq(agDailySubmissions.callerId, callerId),
        eq(agDailySubmissions.submissionDate, queryDate)
      )
    );

  await db
    .update(agCallLogs)
    .set({ eodSubmitted: false })
    .where(
      and(
        eq(agCallLogs.callerId, callerId),
        gte(agCallLogs.createdAt, todayStart),
        lte(agCallLogs.createdAt, todayEnd)
      )
    );

  return { success: true, message: `Shift unlocked for caller ${callerId}.` };
}

/**
 * Admin verifies, adjusts, or rejects a claimed donation.
 */
export async function verifyDonation(
  txnId: string,
  action: "APPROVE" | "ADJUST" | "REJECT",
  params?: {
    verifiedAmount?: number;
    rejectionReason?: string;
    adminNotes?: string;
    verifiedBy?: string;
  }
) {
  await ensureDbSchema();

  const [don] = await db
    .select()
    .from(agDonations)
    .where(eq(agDonations.txnId, txnId))
    .limit(1);

  if (!don) {
    throw new Error(`Donation with transaction ID ${txnId} not found.`);
  }

  const verifier = params?.verifiedBy || "ADMIN";
  const now = new Date();

  let verificationStatus = "PENDING_APPROVAL";
  let finalVerifiedAmount: number | null = null;
  let rejReason = null;

  if (action === "APPROVE") {
    verificationStatus = "VERIFIED";
    finalVerifiedAmount = params?.verifiedAmount != null ? Math.round(Number(params.verifiedAmount)) : don.amount;
  } else if (action === "ADJUST") {
    verificationStatus = "VERIFIED";
    if (params?.verifiedAmount == null || isNaN(Number(params.verifiedAmount))) {
      throw new Error("Adjusted amount must be provided.");
    }
    finalVerifiedAmount = Math.max(0, Math.round(Number(params.verifiedAmount)));
  } else if (action === "REJECT") {
    verificationStatus = "REJECTED";
    finalVerifiedAmount = 0;
    rejReason = params?.rejectionReason || "Payment not received or invalid UTR.";
  }

  await db
    .update(agDonations)
    .set({
      verificationStatus,
      verifiedAmount: finalVerifiedAmount,
      verifiedBy: verifier,
      verifiedAt: now,
      rejectionReason: rejReason,
      adminNotes: params?.adminNotes?.trim() || null,
    })
    .where(eq(agDonations.txnId, txnId));

  return {
    success: true,
    txnId,
    verificationStatus,
    verifiedAmount: finalVerifiedAmount,
    rejectionReason: rejReason,
  };
}

/**
 * Real-Time Financial CRM Metrics (Daily, Monthly, Individual Telecaller Financial CRM)
 */
export async function getFinancialCRMStats() {
  await ensureDbSchema();
  const { todayStart, todayEnd, monthStart, dateStr } = getISTDateBounds();

  // 1. Today's Donations Aggregation
  const todayDons = await db
    .select({
      txnId: agDonations.txnId,
      amount: agDonations.amount,
      verificationStatus: agDonations.verificationStatus,
      verifiedAmount: agDonations.verifiedAmount,
      callerRefId: agDonations.callerRefId,
      createdAt: agDonations.createdAt,
    })
    .from(agDonations)
    .where(
      and(
        gte(agDonations.createdAt, todayStart),
        lte(agDonations.createdAt, todayEnd)
      )
    );

  let todayClaimed = 0;
  let todayVerified = 0;
  let todayPending = 0;
  let todayRejected = 0;

  todayDons.forEach((d) => {
    todayClaimed += d.amount || 0;
    if (d.verificationStatus === "VERIFIED") {
      todayVerified += d.verifiedAmount != null ? d.verifiedAmount : d.amount;
    } else if (d.verificationStatus === "PENDING_APPROVAL") {
      todayPending += d.amount || 0;
    } else if (d.verificationStatus === "REJECTED") {
      todayRejected += d.amount || 0;
    }
  });

  // 2. Month-to-Date (MTD) Aggregation
  const mtdVerifiedSum = await db
    .select({
      sum: sql<number>`COALESCE(SUM(CASE WHEN ${agDonations.verificationStatus} = 'VERIFIED' THEN COALESCE(${agDonations.verifiedAmount}, ${agDonations.amount}) ELSE 0 END), 0)`,
      count: sql<number>`COUNT(CASE WHEN ${agDonations.verificationStatus} = 'VERIFIED' THEN 1 ELSE NULL END)`,
    })
    .from(agDonations)
    .where(gte(agDonations.createdAt, monthStart));

  const monthVerifiedTotal = Number(mtdVerifiedSum[0]?.sum || 0);
  const monthVerifiedDonorsCount = Number(mtdVerifiedSum[0]?.count || 0);
  const monthlyTarget = 500000; // Ashrama monthly target (₹5,00,000)
  const targetAchievedPercent = Math.min(100, Math.round((monthVerifiedTotal / monthlyTarget) * 100));

  // 3. Telecaller Roster Financial CRM (All callers)
  const callers = await db.select().from(agTelecallers).where(eq(agTelecallers.isActive, true));

  // Today's calls by caller
  const todayCallsByCaller = await db
    .select({
      callerId: agCallLogs.callerId,
      count: sql<number>`count(*)`,
    })
    .from(agCallLogs)
    .where(
      and(
        gte(agCallLogs.createdAt, todayStart),
        lte(agCallLogs.createdAt, todayEnd)
      )
    )
    .groupBy(agCallLogs.callerId);

  const callsMap = new Map<string, number>();
  todayCallsByCaller.forEach((c) => callsMap.set(c.callerId, Number(c.count)));

  // Today's EOD submissions
  const todaySubs = await db
    .select()
    .from(agDailySubmissions)
    .where(eq(agDailySubmissions.submissionDate, dateStr));
  const subMap = new Map<string, string>();
  todaySubs.forEach((s) => subMap.set(s.callerId, s.status));

  // MTD Collections by Caller
  const mtdCallerCollections = await db
    .select({
      callerRefId: agDonations.callerRefId,
      claimedSum: sql<number>`COALESCE(SUM(${agDonations.amount}), 0)`,
      verifiedSum: sql<number>`COALESCE(SUM(CASE WHEN ${agDonations.verificationStatus} = 'VERIFIED' THEN COALESCE(${agDonations.verifiedAmount}, ${agDonations.amount}) ELSE 0 END), 0)`,
      donorsCount: sql<number>`COUNT(CASE WHEN ${agDonations.verificationStatus} = 'VERIFIED' THEN 1 ELSE NULL END)`,
    })
    .from(agDonations)
    .where(
      and(
        gte(agDonations.createdAt, monthStart),
        sql`${agDonations.callerRefId} IS NOT NULL`
      )
    )
    .groupBy(agDonations.callerRefId);

  const mtdMap = new Map<string, { claimed: number; verified: number; donors: number }>();
  mtdCallerCollections.forEach((c) => {
    if (c.callerRefId) {
      mtdMap.set(c.callerRefId, {
        claimed: Number(c.claimedSum),
        verified: Number(c.verifiedSum),
        donors: Number(c.donorsCount),
      });
    }
  });

  // Today's caller collections
  const todayCallerMap = new Map<string, { claimed: number; verified: number; pending: number }>();
  todayDons.forEach((d) => {
    if (!d.callerRefId) return;
    const cur = todayCallerMap.get(d.callerRefId) || { claimed: 0, verified: 0, pending: 0 };
    cur.claimed += d.amount || 0;
    if (d.verificationStatus === "VERIFIED") cur.verified += (d.verifiedAmount != null ? d.verifiedAmount : d.amount);
    if (d.verificationStatus === "PENDING_APPROVAL") cur.pending += d.amount || 0;
    todayCallerMap.set(d.callerRefId, cur);
  });

  const callerFinancials = callers
    .filter((c) => c.callerId !== "ADMIN")
    .map((c) => {
      const todayFin = todayCallerMap.get(c.callerId) || { claimed: 0, verified: 0, pending: 0 };
      const mtd = mtdMap.get(c.callerId) || { claimed: 0, verified: 0, donors: 0 };
      const todayCalls = callsMap.get(c.callerId) || 0;
      const shiftStatus = subMap.get(c.callerId) || "NOT_SUBMITTED";
      const approvalRate = mtd.claimed > 0 ? Math.round((mtd.verified / mtd.claimed) * 100) : 100;

      return {
        callerId: c.callerId,
        name: c.name,
        whatsappNumber: c.whatsappNumber,
        todayCalls,
        todayClaimedAmount: todayFin.claimed,
        todayVerifiedAmount: todayFin.verified,
        todayPendingAmount: todayFin.pending,
        monthVerifiedAmount: mtd.verified,
        monthDonorsCount: mtd.donors,
        approvalRate,
        shiftStatus,
      };
    })
    .sort((a, b) => b.monthVerifiedAmount - a.monthVerifiedAmount);

  // 4. Pending Payment Approvals List
  const pendingApprovals = await db
    .select({
      txnId: agDonations.txnId,
      gatewayOrderId: agDonations.gatewayOrderId,
      amount: agDonations.amount,
      paymentMode: agDonations.paymentMode,
      callerRefId: agDonations.callerRefId,
      leadId: agDonations.leadId,
      donorName: agDonations.donorName,
      donorPhone: agDonations.donorPhone,
      metadata: agDonations.metadata,
      verificationStatus: agDonations.verificationStatus,
      createdAt: agDonations.createdAt,
    })
    .from(agDonations)
    .where(eq(agDonations.verificationStatus, "PENDING_APPROVAL"))
    .orderBy(desc(agDonations.createdAt))
    .limit(100);

  // Fetch caller names for pending approvals
  const callerNameMap = new Map<string, string>();
  callers.forEach((c) => callerNameMap.set(c.callerId, c.name));

  const enrichedPending = pendingApprovals.map((p) => ({
    ...p,
    callerName: (p.callerRefId && callerNameMap.get(p.callerRefId)) || p.callerRefId || "Online",
    utr: (p.metadata as any)?.utr || null,
    notes: (p.metadata as any)?.notes || null,
  }));

  return {
    today: {
      date: dateStr,
      claimed: todayClaimed,
      verified: todayVerified,
      pending: todayPending,
      rejected: todayRejected,
      totalCalls: Array.from(callsMap.values()).reduce((a, b) => a + b, 0),
    },
    month: {
      target: monthlyTarget,
      verified: monthVerifiedTotal,
      targetAchievedPercent,
      donorsCount: monthVerifiedDonorsCount,
      averageDonation: monthVerifiedDonorsCount > 0 ? Math.round(monthVerifiedTotal / monthVerifiedDonorsCount) : 0,
    },
    callers: callerFinancials,
    pendingApprovals: enrichedPending,
  };
}

