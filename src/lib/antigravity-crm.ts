import { db } from "@/db";
import { agTelecallers, agLeads, agCallLogs, agDonations } from "@/db/schema";
import { eq, and, or, sql, desc, inArray, isNull } from "drizzle-orm";
import { hashPassword } from "@/lib/admin-auth";

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
}

/**
 * 1. Seeds 15 telecallers (TC01 to TC15) and realistic birthday leads if tables are fresh.
 */
export async function ensureTelecallersAndSeedData() {
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
}

/**
 * 2. Round-Robin Birthday Lead Routing (Today, Tomorrow, Day+2)
 */
export async function distributeBirthdayLeads() {
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
    return { distributed: 0, callersCount: 0 };
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
    return { distributed: 0, callersCount: activeCallers.length };
  }

  let index = 0;
  for (const lead of pendingLeads) {
    const callerId = activeCallers[index % activeCallers.length].callerId;
    index++;

    await db
      .update(agLeads)
      .set({
        assignedCallerId: callerId,
        status: "Pending",
        updatedAt: new Date(),
      })
      .where(eq(agLeads.leadId, lead.leadId));
  }

  return { distributed: pendingLeads.length, callersCount: activeCallers.length };
}

/**
 * 3. Fetch Assigned Leads for a Telecaller
 */
export async function getAssignedLeads(callerId: string) {
  return db
    .select()
    .from(agLeads)
    .where(eq(agLeads.assignedCallerId, callerId.toUpperCase()))
    .orderBy(agLeads.dobMonth, agLeads.dobDay, desc(agLeads.leadId));
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
 * 5. Generate WhatsApp Click-To-Chat URL with Tracking Token
 */
export async function generateWhatsAppLink(leadId: number, callerId: string, baseUrl?: string) {
  const lead = await db.select().from(agLeads).where(eq(agLeads.leadId, leadId)).limit(1);
  if (lead.length === 0) throw new Error("Lead not found");

  const cleanPhone = lead[0].phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://janasevaorphanage.org";

  const message = `Namaskara ${lead[0].name} Ji! 🙏 Warmest Birthday Greetings from all 25 young resident boys at Janaseva Ashrama, Bangalore! 🎂✨ May this year bless you with good health, joy, and peace.\n\nTo dedicate a nutritious festive meal or birthday cake to the boys on your special day, kindly visit:\n${siteUrl}/donate?ref=${callerId.toUpperCase()}\n\n100% Tax Deductible under Section 80G. Thank you for your kind heart!`;

  return {
    leadName: lead[0].name,
    phone: formattedPhone,
    whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`,
    trackingRef: callerId.toUpperCase(),
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
 */
export async function getAdminLeaderboard(): Promise<{
  callers: TelecallerStats[];
  totalLeads: number;
  totalDonations: number;
  totalRevenue: number;
}> {
  // Ensure tables and telecallers exist
  await ensureTelecallersAndSeedData();

  const allCallers = await db.select().from(agTelecallers).orderBy(agTelecallers.callerId);
  const leads = await db.select().from(agLeads);
  const donations = await db.select().from(agDonations);

  let totalRevenue = 0;
  const donationsByCaller: Record<string, number> = {};
  for (const d of donations) {
    totalRevenue += d.amount;
    if (d.callerRefId) {
      donationsByCaller[d.callerRefId] = (donationsByCaller[d.callerRefId] || 0) + d.amount;
    }
  }

  const assignedByCaller: Record<string, number> = {};
  const contactedByCaller: Record<string, number> = {};
  const convertedByCaller: Record<string, number> = {};

  for (const l of leads) {
    if (l.assignedCallerId) {
      assignedByCaller[l.assignedCallerId] = (assignedByCaller[l.assignedCallerId] || 0) + 1;
      if (l.status !== "Pending") {
        contactedByCaller[l.assignedCallerId] = (contactedByCaller[l.assignedCallerId] || 0) + 1;
      }
      if (l.status === "Donated") {
        convertedByCaller[l.assignedCallerId] = (convertedByCaller[l.assignedCallerId] || 0) + 1;
      }
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
    };
  });

  // Rank by Total Revenue descending, then Conversion Rate descending
  statsList.sort((a, b) => b.totalDonationAmount - a.totalDonationAmount || b.conversionRate - a.conversionRate);
  statsList.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return {
    callers: statsList,
    totalLeads: leads.length,
    totalDonations: donations.length,
    totalRevenue,
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
  const allCallers = await db.select({ callerId: agTelecallers.callerId }).from(agTelecallers);

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

export interface LeadUploadItem {
  name: string;
  phone: string;
  email?: string;
  dobDay?: number | string;
  dobMonth?: number | string;
}

/**
 * 12. Bulk Upload Leads & Instant Equal Distribution
 */
export async function uploadBulkLeads(
  rawLeads: LeadUploadItem[],
  autoDistribute = true,
  mode: "balanced" | "round_robin" = "balanced"
) {
  if (!rawLeads || rawLeads.length === 0) {
    throw new Error("No lead records provided.");
  }

  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;

  const validLeads = [];
  for (const item of rawLeads) {
    const rawName = (item.name || "").trim();
    const rawPhone = (item.phone || "").replace(/\D/g, "");
    if (!rawName || rawPhone.length < 10) continue;

    let day = parseInt(String(item.dobDay || currentDay), 10);
    if (isNaN(day) || day < 1 || day > 31) day = currentDay;

    let month = parseInt(String(item.dobMonth || currentMonth), 10);
    if (isNaN(month) || month < 1 || month > 12) month = currentMonth;

    validLeads.push({
      name: rawName,
      phone: rawPhone.slice(-10),
      email: item.email ? item.email.trim() : null,
      dobDay: day,
      dobMonth: month,
      status: "Pending",
    });
  }

  if (validLeads.length === 0) {
    throw new Error("No valid lead rows found. Please ensure each row contains a Name and a 10-digit Phone number.");
  }

  // Insert in batches of 100
  const insertedLeadIds: number[] = [];
  const BATCH_SIZE = 100;
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
    validInserted: validLeads.length,
    distributed: autoDistribute ? insertedLeadIds.length : 0,
    perCaller: distributedSummary,
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
  activeCallers.forEach((c) => (perCaller[c.callerId] = 0));

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

      await db
        .update(agLeads)
        .set({ assignedCallerId: minCaller, status: "Pending", updatedAt: new Date() })
        .where(eq(agLeads.leadId, leadId));

      loadMap.set(minCaller, minLoad + 1);
      perCaller[minCaller] = (perCaller[minCaller] || 0) + 1;
    }
  } else {
    let idx = 0;
    for (const leadId of leadIds) {
      const callerId = activeCallers[idx % activeCallers.length].callerId;
      idx++;

      await db
        .update(agLeads)
        .set({ assignedCallerId: callerId, status: "Pending", updatedAt: new Date() })
        .where(eq(agLeads.leadId, leadId));

      perCaller[callerId] = (perCaller[callerId] || 0) + 1;
    }
  }

  return { distributed: leadIds.length, perCaller };
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
 * 15. Agency-Grade CSV Export Generator
 */
export async function generateAgencyCSVExport(type: "performance" | "leads" | "donations") {
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
        "Last Contacted Date",
        "Reschedule Callback Date",
        "Created Date",
      ],
    ];

    for (const l of leads) {
      rows.push([
        String(l.leadId),
        `"${l.name.replace(/"/g, '""')}"`,
        `"+91${l.phone}"`,
        l.email ? `"${l.email.replace(/"/g, '""')}"` : '""',
        String(l.dobDay),
        String(l.dobMonth),
        l.status,
        l.assignedCallerId || "Unassigned",
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
