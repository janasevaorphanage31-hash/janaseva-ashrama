import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { donations, impactCertificates } from "@/db/schema";
import { clean, clientIp, makeRef, rateLimit } from "@/lib/server-utils";

/** V1.1 impact certificate: server-generated from verified donation amount and lines. */
export async function POST(req: Request) {
  if (!rateLimit(`cert:${clientIp(req)}`, 15, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again." }, { status: 429 });
  }
  const b = await req.json().catch(() => null);
  const donationPublicId = clean(b?.donationPublicId, 80);
  const displayName = clean(b?.displayName, 120);

  if (!donationPublicId) return NextResponse.json({ error: "Donation reference missing." }, { status: 400 });

  const [d] = await db.select().from(donations).where(eq(donations.publicId, donationPublicId)).limit(1);
  if (!d || d.status !== "paid") {
    return NextResponse.json({ error: "Certificate is available only for verified donations." }, { status: 400 });
  }

  const [existing] = await db.select().from(impactCertificates).where(eq(impactCertificates.donationId, d.id)).limit(1);
  if (existing) return NextResponse.json({ ok: true, reference: existing.reference });

  const reference = makeRef("CERT");
  await db.insert(impactCertificates).values({
    reference,
    donationId: d.id,
    displayName: displayName || null,
    statement: "Your contribution supported Janaseva Ashrama's work in care, education, nutrition and wellbeing.",
  });

  return NextResponse.json({ ok: true, reference });
}
