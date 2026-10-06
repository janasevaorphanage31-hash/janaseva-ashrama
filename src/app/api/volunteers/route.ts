import { NextResponse } from "next/server";
import { db } from "@/db";
import { volunteerApplications, volunteerSignups } from "@/db/schema";
import { clean, clientIp, isEmail, isPhone, normalizePhone, rateLimit } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";

const INTERESTS = new Set([
  "Teaching",
  "Events",
  "Healthcare support",
  "Technology",
  "Photography",
  "Video",
  "Design",
  "Marketing",
  "Fundraising",
  "Other",
]);

/** V1.1 volunteer workflow with statuses while preserving legacy table compatibility. */
export async function POST(req: Request) {
  if (!rateLimit(`vol:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  const name = clean(b?.name, 120);
  const email = clean(b?.email, 200);
  const phoneRaw = clean(b?.phone, 24);
  const phone = normalizePhone(phoneRaw);
  const interestArea = clean(b?.interestArea ?? b?.interest, 60);
  const skills = clean(b?.skills, 500);
  const availability = clean(b?.availability, 120);
  const message = clean(b?.message, 1500);
  const consent = b?.consent === true;

  if (!name || name.length < 2 || !NAME_REGEX.test(name)) {
    return NextResponse.json({ error: "Please provide a valid name (letters only, minimum 2 characters)." }, { status: 400 });
  }
  if (!isEmail(email) || !interestArea || !consent) {
    return NextResponse.json({ error: "Please complete valid email, interest area, and consent." }, { status: 400 });
  }
  if (!INTERESTS.has(interestArea)) {
    return NextResponse.json({ error: "Please select a valid interest area." }, { status: 400 });
  }
  if ((phoneRaw && !phone) || (phone && !isPhone(phone))) {
    return NextResponse.json({ error: "Please enter a valid phone number (10-15 digits)." }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx.insert(volunteerApplications).values({
      name,
      email,
      phone: phone || null,
      skills: skills || null,
      availability: availability || null,
      interestArea,
      message: message || null,
      consent,
      status: "NEW",
    });
    // Legacy compatibility feed
    await tx.insert(volunteerSignups).values({
      name,
      email,
      phone: phone || null,
      interest: interestArea,
      message: message || null,
    });
  });

  return NextResponse.json({ ok: true });
}
