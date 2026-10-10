import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { todayUpdates } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

export async function GET() {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ updates: await db.select().from(todayUpdates).orderBy(desc(todayUpdates.publishedAt)) });
}

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`admin-today:${clientIp(req)}`, 60, 10 * 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  
  const b = await req.json().catch(() => null);
  const title = clean(b?.title, 200);
  const body = clean(b?.body, 5000) || title;
  const category = clean(b?.category, 80) || "Kitchen & Annadana";
  const imageUrl = clean(b?.imageUrl, 5000000); // Allow long base64 Data URIs and URLs
  const rawStatus = (clean(b?.status, 20) || "published").toLowerCase();
  const status = ["draft", "review", "published", "archived"].includes(rawStatus) ? rawStatus : "published";

  if (title.length < 2) {
    return NextResponse.json({ error: "Title is required (at least 2 characters)." }, { status: 400 });
  }

  const [row] = await db.insert(todayUpdates).values({
    title,
    body,
    category,
    imageUrl: imageUrl || null,
    status,
    isSample: false,
    publishedAt: new Date(),
  }).returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create",
    entity: "today_update",
    entityId: row.id,
    afterState: row,
    ipAddress: clientIp(req),
  });

  // Revalidate public routes so the uploaded photo is immediately live
  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, update: row });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid update id." }, { status: 400 });
  
  const [before] = await db.select().from(todayUpdates).where(eq(todayUpdates.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Update not found." }, { status: 404 });
  
  const patch: Partial<typeof todayUpdates.$inferInsert> = {};
  if (b?.title !== undefined) patch.title = clean(b.title, 200);
  if (b?.body !== undefined) patch.body = clean(b.body, 5000);
  if (b?.category !== undefined) patch.category = clean(b.category, 80);
  if (b?.imageUrl !== undefined) patch.imageUrl = clean(b.imageUrl, 5000000) || null;
  if (b?.status !== undefined) {
    const rawStatus = clean(b.status, 20).toLowerCase();
    patch.status = rawStatus;
    if (rawStatus === "published") patch.publishedAt = new Date();
  }
  
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  
  const [row] = await db.update(todayUpdates).set(patch).where(eq(todayUpdates.id, id)).returning();
  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "update",
    entity: "today_update",
    entityId: id,
    beforeState: before,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, update: row });
}

export async function DELETE(req: Request) {
  const session = await requireAdminApi();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(req.url);
  let id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id)) {
    const b = await req.json().catch(() => null);
    id = Number(b?.id);
  }

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Valid update id is required." }, { status: 400 });
  }

  const [before] = await db.select().from(todayUpdates).where(eq(todayUpdates.id, id)).limit(1);
  if (!before) {
    return NextResponse.json({ error: "Update not found." }, { status: 404 });
  }

  await db.delete(todayUpdates).where(eq(todayUpdates.id, id));

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "delete",
    entity: "today_update",
    entityId: id,
    beforeState: before,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/today");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, deletedId: id });
}
