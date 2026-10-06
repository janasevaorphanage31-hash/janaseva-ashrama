import { NextResponse } from "next/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { clean, isEmail, isPhone, normalizePhone, rateLimit, clientIp, slugify } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";

export async function POST(req: Request) {
  if (!rateLimit(`corporate:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const form = await req.formData();
  const name = clean(String(form.get("companyName") ?? ""), 120);
  const contactPerson = clean(String(form.get("contactName") ?? ""), 100);
  const email = clean(String(form.get("email") ?? ""), 200);
  const phone = normalizePhone(clean(String(form.get("phone") ?? ""), 24));
  const interest = clean(String(form.get("interest") ?? ""), 120);
  const message = clean(String(form.get("message") ?? ""), 2000);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Please enter a valid company name." }, { status: 400 });
  }
  if (!contactPerson || contactPerson.length < 2 || !NAME_REGEX.test(contactPerson)) {
    return NextResponse.json({ error: "Please enter a valid contact person name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid work email address." }, { status: 400 });
  }
  if (phone && !isPhone(phone)) {
    return NextResponse.json({ error: "Please enter a valid phone number (10-15 digits)." }, { status: 400 });
  }

  const slug = `${slugify(name)}-${Date.now().toString(36).slice(-5)}`;
  await db.insert(companies).values({
    name,
    slug,
    contactPerson,
    email,
    phone: phone || null,
    csrInterest: [interest, message].filter(Boolean).join(" - ") || null,
  });

  return NextResponse.json({ ok: true });
}
