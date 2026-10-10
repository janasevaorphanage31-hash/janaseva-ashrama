import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN", "FINANCE"] as const;

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const rows = await db.select().from(documents).orderBy(asc(documents.sortOrder));
  return NextResponse.json({ documents: rows });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`admin-docs:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  const title = clean(b?.title, 120);
  const category = clean(b?.category, 60) || "Governance";
  const version = clean(b?.version, 40);
  const publishedOn = clean(b?.publishedOn, 40);
  const fileUrl = clean(b?.fileUrl, 500);
  const note = clean(b?.note, 500);
  const status = clean(b?.status, 20) || "published";
  const sortOrder = Math.floor(Number(b?.sortOrder) || 0);

  if (!title || !fileUrl) {
    return NextResponse.json({ error: "Title and file URL are required." }, { status: 400 });
  }

  const [row] = await db
    .insert(documents)
    .values({
      title,
      category,
      version: version || null,
      publishedOn: publishedOn || null,
      fileUrl,
      note: note || null,
      status,
      sortOrder,
    })
    .returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create",
    entity: "document",
    entityId: row.id,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/transparency");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, document: row });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid document id." }, { status: 400 });

  const [before] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Document not found." }, { status: 404 });

  const patch: Partial<typeof documents.$inferInsert> = {};
  if (b?.title !== undefined) patch.title = clean(b.title, 120);
  if (b?.category !== undefined) patch.category = clean(b.category, 60);
  if (b?.version !== undefined) patch.version = clean(b.version, 40) || null;
  if (b?.publishedOn !== undefined) patch.publishedOn = clean(b.publishedOn, 40) || null;
  if (b?.fileUrl !== undefined) patch.fileUrl = clean(b.fileUrl, 500);
  if (b?.note !== undefined) patch.note = clean(b.note, 500) || null;
  if (b?.status !== undefined) patch.status = clean(b.status, 20);
  if (b?.sortOrder !== undefined) patch.sortOrder = Math.floor(Number(b.sortOrder) || 0);

  if (!Object.keys(patch).length) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });

  const [row] = await db.update(documents).set(patch).where(eq(documents.id, id)).returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "update",
    entity: "document",
    entityId: id,
    beforeState: before,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/transparency");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, document: row });
}

export async function DELETE(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(req.url);
  let id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id)) {
    const b = await req.json().catch(() => null);
    id = Number(b?.id);
  }

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Valid document id is required." }, { status: 400 });
  }

  const [before] = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  if (!before) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  await db.delete(documents).where(eq(documents.id, id));

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "delete",
    entity: "document",
    entityId: id,
    beforeState: before,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/transparency");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, deletedId: id });
}
