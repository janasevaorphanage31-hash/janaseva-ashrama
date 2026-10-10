import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { impactMetrics } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN", "FINANCE"] as const;

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const rows = await db.select().from(impactMetrics).orderBy(asc(impactMetrics.sortOrder));
  return NextResponse.json({ metrics: rows });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`admin-metrics:${clientIp(req)}`, 30, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const b = await req.json().catch(() => null);
  const key = clean(b?.key, 60);
  const label = clean(b?.label, 120);
  const value = Math.floor(Number(b?.value) || 0);
  const unit = clean(b?.unit, 40);
  const source = clean(b?.source, 200);
  const periodLabel = clean(b?.periodLabel, 60);
  const published = b?.published !== false;
  const sortOrder = Math.floor(Number(b?.sortOrder) || 0);

  if (!key || !label) {
    return NextResponse.json({ error: "Key and label are required." }, { status: 400 });
  }

  const [row] = await db
    .insert(impactMetrics)
    .values({
      key,
      label,
      value,
      unit: unit || null,
      source: source || null,
      periodLabel: periodLabel || null,
      published,
      sortOrder,
    })
    .returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create",
    entity: "impact_metric",
    entityId: row.id,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, metric: row });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid metric id." }, { status: 400 });

  const [before] = await db.select().from(impactMetrics).where(eq(impactMetrics.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Metric not found." }, { status: 404 });

  const patch: Partial<typeof impactMetrics.$inferInsert> = {};
  if (b?.label !== undefined) patch.label = clean(b.label, 120);
  if (b?.value !== undefined) patch.value = Math.floor(Number(b.value) || 0);
  if (b?.unit !== undefined) patch.unit = clean(b.unit, 40) || null;
  if (b?.source !== undefined) patch.source = clean(b.source, 200) || null;
  if (b?.periodLabel !== undefined) patch.periodLabel = clean(b.periodLabel, 60) || null;
  if (b?.published !== undefined) patch.published = !!b.published;
  if (b?.sortOrder !== undefined) patch.sortOrder = Math.floor(Number(b.sortOrder) || 0);

  if (!Object.keys(patch).length) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });

  const [row] = await db.update(impactMetrics).set(patch).where(eq(impactMetrics.id, id)).returning();

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "update",
    entity: "impact_metric",
    entityId: id,
    beforeState: before,
    afterState: row,
    ipAddress: clientIp(req),
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/");
    revalidatePath("/admin/content");
  } catch {}

  return NextResponse.json({ ok: true, metric: row });
}
