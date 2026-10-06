import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, impactGifts } from "@/db/schema";
import { markDemoPaid, razorpayConfigured } from "@/lib/payments";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

/**
 * Demo mode only (no Razorpay keys configured). Produces a clearly-labelled DEMO receipt;
 * demo donations are never counted in verified totals or campaign progress.
 */
export async function POST(req: Request) {
  if (razorpayConfigured()) return NextResponse.json({ error: "Not available." }, { status: 404 });
  if (!rateLimit(`demo:${clientIp(req)}`, 20, 10 * 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const publicId = clean(b?.publicId, 64);
  const [d] = await db.select().from(donations).where(eq(donations.publicId, publicId)).limit(1);
  if (!d || d.mode !== "demo") return NextResponse.json({ error: "Not found." }, { status: 404 });
  await markDemoPaid(d.id);
  return NextResponse.json({ ok: true, publicId });
}
