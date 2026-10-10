import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { celebrationBookings } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, normalizePhone } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE", "CONTENT_ADMIN", "DONATION_ADMIN"] as const;

export async function GET(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const status = (url.searchParams.get("status") || "all").trim();
  const occasion = (url.searchParams.get("occasion") || "all").trim();

  const conditions: any[] = [];
  if (status && status !== "all") {
    conditions.push(eq(celebrationBookings.celebrationStatus, status));
  }
  if (occasion && occasion !== "all") {
    conditions.push(eq(celebrationBookings.occasion, occasion));
  }
  if (q) {
    conditions.push(
      or(
        ilike(celebrationBookings.celebrantName, `%${q}%`),
        ilike(celebrationBookings.donorName, `%${q}%`),
        ilike(celebrationBookings.donorPhone, `%${q}%`),
        ilike(celebrationBookings.reference, `%${q}%`),
        ilike(celebrationBookings.packageName, `%${q}%`),
      ),
    );
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const items = await db
    .select()
    .from(celebrationBookings)
    .where(whereClause || sql`true`)
    .orderBy(desc(celebrationBookings.celebrationDate), desc(celebrationBookings.createdAt))
    .limit(100);

  // Summary counts
  const todayStr = new Date().toISOString().slice(0, 10);
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      totalAmount: sql<number>`coalesce(sum(${celebrationBookings.amount}), 0)::int`,
      todayCount: sql<number>`count(case when ${celebrationBookings.celebrationDate} = ${todayStr} then 1 else null end)::int`,
      pendingCount: sql<number>`count(case when ${celebrationBookings.celebrationStatus} = 'PENDING' then 1 else null end)::int`,
      confirmedCount: sql<number>`count(case when ${celebrationBookings.celebrationStatus} = 'CONFIRMED' then 1 else null end)::int`,
      celebratedCount: sql<number>`count(case when ${celebrationBookings.celebrationStatus} = 'CELEBRATED' then 1 else null end)::int`,
    })
    .from(celebrationBookings);

  return NextResponse.json({
    items,
    counts: {
      total: counts?.total ?? 0,
      totalAmount: counts?.totalAmount ?? 0,
      todayCount: counts?.todayCount ?? 0,
      pendingCount: counts?.pendingCount ?? 0,
      confirmedCount: counts?.confirmedCount ?? 0,
      celebratedCount: counts?.celebratedCount ?? 0,
    },
  });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid booking data." }, { status: 400 });

  const celebrantName = clean(b.celebrantName, 120);
  const occasion = clean(b.occasion, 80) || "Birthday";
  const celebrationDate = clean(b.celebrationDate, 20);
  const packageName = clean(b.packageName, 120) || "Special Feast";
  const packageId = clean(b.packageId, 50) || "lunch-special";
  const amount = Math.max(100, Math.floor(Number(b.amount) || 3500));
  const visitMode = b.visitMode === "remote" ? "remote" : "in_person";
  const timeSlot = clean(b.timeSlot, 40) || (visitMode === "remote" ? "remote" : "morning");
  const guestCount = clean(b.guestCount, 20) || "2-4";
  const blessingMessage = clean(b.blessingMessage, 500);

  const donorName = clean(b.donorName, 120);
  const donorPhone = normalizePhone(clean(b.donorPhone, 24));
  const donorEmail = clean(b.donorEmail, 200);
  const donorPan = clean(b.donorPan, 15).toUpperCase();
  const paymentStatus = clean(b.paymentStatus, 30) || "paid";
  const staffNotes = clean(b.staffNotes, 500);

  if (!celebrantName || !celebrationDate || !donorName || !donorPhone) {
    return NextResponse.json({ error: "Celebrant name, date, donor name, and phone are required." }, { status: 400 });
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const dateTag = celebrationDate.replace(/-/g, "").slice(2);
  const reference = `JA-CELEB-${dateTag}-${randomSuffix}`;

  const [booking] = await db
    .insert(celebrationBookings)
    .values({
      reference,
      celebrantName,
      occasion,
      celebrationDate,
      packageId,
      packageName,
      amount,
      visitMode,
      timeSlot,
      guestCount,
      blessingMessage,
      donorName,
      donorPhone,
      donorEmail: donorEmail || null,
      donorPan: donorPan || null,
      paymentStatus,
      celebrationStatus: "CONFIRMED",
      staffNotes: staffNotes || "Booked by admin / staff at Turahalli Ashrama.",
    })
    .returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create",
    entity: "celebration_booking",
    entityId: booking.id,
    afterState: booking,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/celebrate-birthday");
    revalidatePath("/make-a-day-matter");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, booking });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => null);
  if (!b || !b.id) return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });

  const [before] = await db.select().from(celebrationBookings).where(eq(celebrationBookings.id, Number(b.id))).limit(1);
  if (!before) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (b.celebrationStatus) updates.celebrationStatus = clean(b.celebrationStatus, 40);
  if (b.paymentStatus) updates.paymentStatus = clean(b.paymentStatus, 30);
  if (b.photoProofUrl !== undefined) updates.photoProofUrl = clean(b.photoProofUrl, 500);
  if (b.videoProofUrl !== undefined) updates.videoProofUrl = clean(b.videoProofUrl, 500);
  if (b.wishVideoUrl !== undefined) updates.wishVideoUrl = clean(b.wishVideoUrl, 500);
  if (b.staffNotes !== undefined) updates.staffNotes = clean(b.staffNotes, 500);
  if (b.timeSlot) updates.timeSlot = clean(b.timeSlot, 40);

  const [updated] = await db
    .update(celebrationBookings)
    .set(updates)
    .where(eq(celebrationBookings.id, Number(b.id)))
    .returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "update",
    entity: "celebration_booking",
    entityId: updated.id,
    beforeState: before,
    afterState: updated,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/celebrate-birthday");
    revalidatePath("/make-a-day-matter");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, booking: updated });
}

export async function DELETE(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

  const [before] = await db.select().from(celebrationBookings).where(eq(celebrationBookings.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  await db.delete(celebrationBookings).where(eq(celebrationBookings.id, id));

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "delete",
    entity: "celebration_booking",
    entityId: id,
    beforeState: before,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/celebrate-birthday");
    revalidatePath("/make-a-day-matter");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true });
}
