import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, impactGifts } from "@/db/schema";
import { clean, clientIp, makeRef, rateLimit } from "@/lib/server-utils";

const OCCASIONS = new Set(["Birthday", "Anniversary", "Graduation", "First Salary", "Achievement", "Festival", "Thank You", "Tribute", "Just Because", "Custom"]);

/** V1.1 Gift an Impact: generated only from verified donations. */
export async function POST(req: Request) {
  if (!rateLimit(`gift:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again." }, { status: 429 });
  }
  const b = await req.json().catch(() => null);
  const donationPublicId = clean(b?.donationPublicId, 80);
  const occasion = clean(b?.occasion, 40);
  const recipientName = clean(b?.recipientName, 120);
  const senderName = clean(b?.senderName, 120);
  const message = clean(b?.message, 500);
  const allowSenderName = b?.allowSenderName !== false;

  if (!donationPublicId || !recipientName || !OCCASIONS.has(occasion)) {
    return NextResponse.json({ error: "Please complete recipient name and valid occasion." }, { status: 400 });
  }

  const [d] = await db.select().from(donations).where(eq(donations.publicId, donationPublicId)).limit(1);
  if (!d || d.status !== "paid") {
    return NextResponse.json({ error: "Gift cards can be generated only after payment verification." }, { status: 400 });
  }

  const [exists] = await db.select().from(impactGifts).where(and(eq(impactGifts.donationId, d.id), eq(impactGifts.recipientName, recipientName))).limit(1);
  if (exists) return NextResponse.json({ ok: true, reference: exists.reference });

  const reference = makeRef("GIFT");
  await db.insert(impactGifts).values({
    reference,
    donationId: d.id,
    occasion,
    recipientName,
    senderName: senderName || null,
    message: message || null,
    allowSenderName,
    status: "ready",
  });

  return NextResponse.json({ ok: true, reference });
}
