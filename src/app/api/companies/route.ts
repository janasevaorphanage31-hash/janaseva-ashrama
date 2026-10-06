import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { clean, clientIp, isEmail, isPhone, normalizePhone, rateLimit, slugify } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";

export async function GET() {
  if (!(await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN", "PARTNER_ADMIN"]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const rows = await db.select().from(companies).orderBy(desc(companies.createdAt));
  return NextResponse.json({ companies: rows });
}

export async function POST(req: Request) {
  if (!rateLimit(`company:${clientIp(req)}`, 6, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const b = await req.json().catch(() => null);
  const name = clean(b?.name, 120);
  const contactPerson = clean(b?.contactPerson, 100);
  const email = clean(b?.email, 200);
  const phone = normalizePhone(clean(b?.phone, 24));
  const website = clean(b?.website, 250);
  const industry = clean(b?.industry, 120);
  const csrInterest = clean(b?.csrInterest, 1000);
  const employeeCount = Number.isFinite(Number(b?.employeeCount)) ? Math.max(0, Math.floor(Number(b.employeeCount))) : null;

  if (!name || !isEmail(email)) return NextResponse.json({ error: "Company name and valid email are required." }, { status: 400 });
  if (contactPerson && !NAME_REGEX.test(contactPerson)) {
    return NextResponse.json({ error: "Contact person name can only contain letters and spaces." }, { status: 400 });
  }
  if (phone && !isPhone(phone)) {
    return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
  }
  const slug = `${slugify(name)}-${Date.now().toString(36).slice(-4)}`;
  const [row] = await db.insert(companies).values({ name, slug, contactPerson, email, phone: phone || null, website: website || null, industry: industry || null, csrInterest: csrInterest || null, employeeCount }).returning({ id: companies.id, slug: companies.slug });
  return NextResponse.json({ ok: true, company: row });
}
