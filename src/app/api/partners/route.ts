import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ngoPartners } from "@/db/schema";
import { clean, clientIp, isEmail, rateLimit } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";

export async function GET() {
  if (!(await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN", "PARTNER_ADMIN"]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const rows = await db.select().from(ngoPartners).orderBy(desc(ngoPartners.createdAt));
  return NextResponse.json({ partners: rows });
}

export async function POST(req: Request) {
  if (!rateLimit(`partner:${clientIp(req)}`, 6, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const b = await req.json().catch(() => null);
  const name = clean(b?.name, 140);
  const contactName = clean(b?.contactName, 100);
  const contactEmail = clean(b?.contactEmail, 200);
  const location = clean(b?.location, 160);
  const focusAreas = clean(b?.focusAreas, 1200);
  const registrationInfo = clean(b?.registrationInfo, 1200);
  const message = clean(b?.message, 2000);
  const website = clean(b?.website, 250);
  if (!name || !contactName || !NAME_REGEX.test(contactName) || !isEmail(contactEmail)) {
    return NextResponse.json({ error: "Organisation name, valid contact person (letters only) and valid email are required." }, { status: 400 });
  }
  const [row] = await db.insert(ngoPartners).values({ name, contactName, contactEmail, location: location || null, focusAreas: focusAreas || null, registrationInfo: [registrationInfo, message].filter(Boolean).join(" - ") || null, website: website || null }).returning({ id: ngoPartners.id });
  return NextResponse.json({ ok: true, partner: row });
}
