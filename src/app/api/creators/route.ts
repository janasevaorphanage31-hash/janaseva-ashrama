import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { creatorProfiles } from "@/db/schema";
import { clean, clientIp, rateLimit, slugify, isEmail } from "@/lib/server-utils";

export async function GET() {
  if (!(await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN", "PARTNER_ADMIN"]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const rows = await db.select().from(creatorProfiles).orderBy(desc(creatorProfiles.createdAt));
  return NextResponse.json({ creators: rows });
}

export async function POST(req: Request) {
  if (!rateLimit(`creator:${clientIp(req)}`, 8, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const b = await req.json().catch(() => null);
  const displayName = clean(b?.displayName, 120);
  const email = clean(b?.email, 200);
  const bio = clean(b?.bio, 1200);
  const instagram = clean(b?.instagram, 250);
  const youtube = clean(b?.youtube, 250);
  if (!displayName || displayName.length < 2 || !isEmail(email)) return NextResponse.json({ error: "Valid creator / channel name (at least 2 characters) and valid email are required." }, { status: 400 });
  const slug = `${slugify(displayName)}-${Date.now().toString(36).slice(-4)}`;
  const [row] = await db.insert(creatorProfiles).values({ displayName, slug, bio: bio || null, socialLinks: { instagram, youtube, email } }).returning({ id: creatorProfiles.id, slug: creatorProfiles.slug });
  return NextResponse.json({ ok: true, creator: row });
}
