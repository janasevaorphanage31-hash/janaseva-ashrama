import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { impactGifts } from "@/db/schema";
import { clean, clientIp, makeRef, rateLimit } from "@/lib/server-utils";

const OCCASIONS = new Set(["Birthday", "Anniversary", "Graduation", "First Salary", "Achievement", "Festival", "Thank You", "Tribute", "Just Because", "Custom"]);

export async function POST(req: Request) {
  if (!rateLimit(`gift-intent:${clientIp(req)}`, 20, 10 * 60_000)) return NextResponse.json({ error: "Too many requests. Please try again." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const occasion = clean(b?.occasion, 40);
  const recipientName = clean(b?.recipientName, 120);
  const senderName = clean(b?.senderName, 120);
  const message = clean(b?.message, 500);
  const allowSenderName = b?.allowSenderName !== false;
  if (!recipientName || !OCCASIONS.has(occasion)) return NextResponse.json({ error: "Please choose an occasion and recipient." }, { status: 400 });
  const reference = makeRef("GIFT");
  await db.insert(impactGifts).values({ reference, donationId: null, occasion, recipientName, senderName: senderName || null, message: message || null, allowSenderName, status: "pending" });
  return NextResponse.json({ ok: true, reference });
}
