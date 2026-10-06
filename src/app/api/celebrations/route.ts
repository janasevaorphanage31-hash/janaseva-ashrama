import { NextResponse } from "next/server";
import { and, desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { celebrationBookings } from "@/db/schema";
import { clean, clientIp, isEmail, isPhone, normalizePhone, rateLimit } from "@/lib/server-utils";
import { NAME_REGEX, PAN_REGEX } from "@/lib/validation";

export async function POST(req: Request) {
  if (!rateLimit(`celeb-book:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid booking request." }, { status: 400 });

  const celebrantName = clean(b.celebrantName, 120);
  const occasion = clean(b.occasion, 80) || "Birthday";
  const celebrationDate = clean(b.celebrationDate, 20); // YYYY-MM-DD
  const packageId = clean(b.packageId, 50) || "lunch-special";
  const packageName = clean(b.packageName, 120) || "Special Feast";
  const amount = Math.max(100, Math.floor(Number(b.amount) || 3500));
  const visitMode = b.visitMode === "remote" ? "remote" : "in_person";
  const timeSlot = clean(b.timeSlot, 40) || (visitMode === "remote" ? "remote" : "morning");
  const guestCount = clean(b.guestCount, 20) || "2-4";
  const blessingMessage = clean(b.blessingMessage, 500);

  const donorName = clean(b.donorName, 120);
  const donorPhoneRaw = clean(b.donorPhone, 24);
  const donorPhone = normalizePhone(donorPhoneRaw);
  const donorEmail = clean(b.donorEmail, 200).toLowerCase();
  const donorPan = clean(b.donorPan, 15).toUpperCase();
  // Public creation is strictly initialized as PENDING and unverified
  const paymentStatus = "pending";
  const celebrationStatus = "PENDING";

  if (!celebrantName || celebrantName.length < 2 || !NAME_REGEX.test(celebrantName)) {
    return NextResponse.json({ error: "Please enter a valid celebrant name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (!celebrationDate || !/^\d{4}-\d{2}-\d{2}$/.test(celebrationDate)) {
    return NextResponse.json({ error: "Please choose a valid celebration date." }, { status: 400 });
  }
  const dateObj = new Date(celebrationDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    return NextResponse.json({ error: "Celebration date cannot be in the past. Please choose today or an upcoming date." }, { status: 400 });
  }
  if (!donorName || donorName.length < 2 || !NAME_REGEX.test(donorName)) {
    return NextResponse.json({ error: "Please enter a valid coordinator name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (!donorPhone || !isPhone(donorPhone)) {
    return NextResponse.json({ error: "Please enter a valid 10-digit mobile number for WhatsApp coordination." }, { status: 400 });
  }
  if (donorEmail && !isEmail(donorEmail)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (donorPan && !PAN_REGEX.test(donorPan)) {
    return NextResponse.json({ error: "Invalid PAN card format. Standard format is 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F)." }, { status: 400 });
  }

  // Generate unique memorable reference
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
      celebrationStatus,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    reference: booking.reference,
    booking: {
      id: booking.id,
      reference: booking.reference,
      celebrantName: booking.celebrantName,
      occasion: booking.occasion,
      celebrationDate: booking.celebrationDate,
      packageName: booking.packageName,
      amount: booking.amount,
      visitMode: booking.visitMode,
      timeSlot: booking.timeSlot,
      celebrationStatus: booking.celebrationStatus,
    },
  });
}

export async function GET() {
  // Public feed of recent and upcoming celebrations (safeguarded: no phone/email/PAN exposed)
  const todayStr = new Date().toISOString().slice(0, 10);
  const rows = await db
    .select({
      id: celebrationBookings.id,
      reference: celebrationBookings.reference,
      celebrantName: celebrationBookings.celebrantName,
      occasion: celebrationBookings.occasion,
      celebrationDate: celebrationBookings.celebrationDate,
      packageName: celebrationBookings.packageName,
      celebrationStatus: celebrationBookings.celebrationStatus,
      photoProofUrl: celebrationBookings.photoProofUrl,
    })
    .from(celebrationBookings)
    .where(gte(celebrationBookings.celebrationDate, sql`to_char(now() - interval '30 days', 'YYYY-MM-DD')`))
    .orderBy(desc(celebrationBookings.celebrationDate))
    .limit(20);

  return NextResponse.json({ celebrations: rows });
}
