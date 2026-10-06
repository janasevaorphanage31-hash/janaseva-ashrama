import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { todayUpdates } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN"] as const;
const STATUSES = new Set(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]);

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ updates: await db.select().from(todayUpdates).orderBy(desc(todayUpdates.publishedAt)) });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`admin-today:${clientIp(req)}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const title = clean(b?.title, 160);
  const body = clean(b?.body, 5000);
  const category = clean(b?.category, 80);
  const imageUrl = clean(b?.imageUrl, 500);
  const status = clean(b?.status, 20) || "DRAFT";
  if (title.length < 3 || body.length < 10 || !category || !STATUSES.has(status)) return NextResponse.json({ error: "Title, body, category and valid status are required." }, { status: 400 });
  const [row] = await db.insert(todayUpdates).values({ title, body, category, imageUrl: imageUrl || null, status, isSample: false, publishedAt: new Date() }).returning();
  await writeAudit({ actorAdminUserId: session.user.id, action: "create", entity: "today_update", entityId: row.id, afterState: row, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, update: row });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid update id." }, { status: 400 });
  const [before] = await db.select().from(todayUpdates).where(eq(todayUpdates.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Update not found." }, { status: 404 });
  const patch: Partial<typeof todayUpdates.$inferInsert> = {};
  if (b?.title !== undefined) patch.title = clean(b.title, 160);
  if (b?.body !== undefined) patch.body = clean(b.body, 5000);
  if (b?.category !== undefined) patch.category = clean(b.category, 80);
  if (b?.imageUrl !== undefined) patch.imageUrl = clean(b.imageUrl, 500) || null;
  if (b?.status !== undefined) {
    const status = clean(b.status, 20);
    if (!STATUSES.has(status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    patch.status = status;
    if (status === "PUBLISHED") patch.publishedAt = new Date();
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  const [row] = await db.update(todayUpdates).set(patch).where(eq(todayUpdates.id, id)).returning();
  await writeAudit({ actorAdminUserId: session.user.id, action: "update", entity: "today_update", entityId: id, beforeState: before, afterState: row, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, update: row });
}
