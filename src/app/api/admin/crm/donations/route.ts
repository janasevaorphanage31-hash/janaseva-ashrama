import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, donationLines } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { isEmail, isPhone, normalizePhone } from "@/lib/server-utils";
import { NAME_REGEX, PAN_REGEX } from "@/lib/validation";

export async function GET(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE", "DONATION_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "all").trim().toLowerCase();

  let conditions: any[] = [];
  if (status && status !== "all") {
    conditions.push(eq(donations.status, status));
  }
  if (q) {
    conditions.push(
      or(
        ilike(donations.donorName, `%${q}%`),
        ilike(donations.donorEmail, `%${q}%`),
        ilike(donations.donorPhone, `%${q}%`),
        ilike(donations.receiptNo, `%${q}%`),
        ilike(donations.publicId, `%${q}%`),
      ),
    );
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const donationRows = await db
    .select()
    .from(donations)
    .where(whereClause || sql`true`)
    .orderBy(desc(donations.createdAt))
    .limit(100);

  // Fetch donation lines for these rows
  const ids = donationRows.map((d) => d.id);
  const lines = ids.length
    ? await db
        .select()
        .from(donationLines)
        .where(sql`${donationLines.donationId} in (${sql.join(ids, sql`, `)})`)
    : [];

  const linesByDonation = lines.reduce<Record<number, typeof lines>>((acc, l) => {
    if (!l.donationId) return acc;
    if (!acc[l.donationId]) acc[l.donationId] = [];
    acc[l.donationId].push(l);
    return acc;
  }, {});

  const items = donationRows.map((d) => ({
    ...d,
    lines: linesByDonation[d.id] || [],
  }));

  // Summary counts
  const [totals] = await db
    .select({
      totalRaised: sql<number>`coalesce(sum(case when ${donations.status} = 'paid' then ${donations.amount} else 0 end), 0)::int`,
      paidCount: sql<number>`count(case when ${donations.status} = 'paid' then 1 else null end)::int`,
      totalCount: sql<number>`count(*)::int`,
    })
    .from(donations);

  return NextResponse.json({
    items,
    totals: {
      totalRaised: totals.totalRaised,
      paidCount: totals.paidCount,
      totalCount: totals.totalCount,
    },
  });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid donation data." }, { status: 400 });

  const donorName = (b.donorName || "").trim();
  const donorEmail = (b.donorEmail || "").trim().toLowerCase();
  const donorPhone = normalizePhone((b.donorPhone || "").trim());
  const donorPan = (b.donorPan || "").trim().toUpperCase();
  const amount = Math.max(10, Math.floor(Number(b.amount) || 0));
  const paymentMode = (b.paymentMode || "cash").trim();
  const purpose = (b.purpose || "General Ashrama Seva").trim();
  const notes = (b.notes || "").trim();

  if (!donorName || donorName.length < 2 || !NAME_REGEX.test(donorName)) {
    return NextResponse.json({ error: "Please enter a valid donor name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (!donorEmail && !donorPhone) {
    return NextResponse.json({ error: "Either email or phone is required to generate receipt." }, { status: 400 });
  }
  if (donorEmail && !isEmail(donorEmail)) {
    return NextResponse.json({ error: "Please enter a valid donor email address." }, { status: 400 });
  }
  if (donorPhone && !isPhone(donorPhone)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
  }
  if (donorPan && !PAN_REGEX.test(donorPan)) {
    return NextResponse.json({ error: "Invalid PAN card format. Standard format is 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F)." }, { status: 400 });
  }
  if (amount < 10) {
    return NextResponse.json({ error: "Amount must be at least ₹10." }, { status: 400 });
  }

  const y = new Date().getFullYear();
  const start = new Date().getMonth() >= 3 ? y : y - 1;
  const fy = `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
  const publicId = "off_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const idempotencyKey = "manual_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  const [created] = await db
    .insert(donations)
    .values({
      publicId,
      amount,
      donorName,
      donorEmail: donorEmail || "offline@janasevaashrama.org",
      donorPhone: donorPhone || null,
      mode: paymentMode,
      status: "paid",
      paidAt: new Date(),
      idempotencyKey,
      meta: {
        pan: donorPan || null,
        purpose,
        notes,
        recordedBy: session.user.displayName,
        paymentMode,
        isOfflineManual: true,
      },
    })
    .returning();

  // Assign formal receipt number: JSA/YY-YY/000123
  const [updated] = await db
    .update(donations)
    .set({
      receiptNo: sql`${"JSA/" + fy + "/"} || lpad(${created.id}::text, 6, '0')`,
    })
    .where(eq(donations.id, created.id))
    .returning();

  // Create line item
  await db.insert(donationLines).values({
    donationId: created.id,
    itemSlug: "offline",
    label: purpose,
    unitPrice: amount,
    qty: 1,
  });

  return NextResponse.json({ ok: true, donation: updated });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !body.id) {
    return NextResponse.json({ error: "Invalid donation ID." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.status) {
    updates.status = String(body.status);
    if (body.status === "paid" && !body.paidAt) {
      updates.paidAt = new Date();
    }
  }

  await db
    .update(donations)
    .set(updates)
    .where(eq(donations.id, Number(body.id)));

  return NextResponse.json({ ok: true });
}
