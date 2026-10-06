import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { impactItems } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, publicToken, rateLimit, slugify } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CONTENT_ADMIN", "DONATION_ADMIN", "FINANCE"] as const;
const APPROVALS = new Set(["pending", "approved", "rejected"]);

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ items: await db.select().from(impactItems).orderBy(asc(impactItems.sortOrder)) });
}

export async function POST(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`admin-impact:${clientIp(req)}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const name = clean(b?.name, 120);
  const description = clean(b?.description, 1000);
  const category = clean(b?.category, 60) || "general";
  const unitLabel = clean(b?.unitLabel, 80);
  const unitPrice = Math.floor(Number(b?.unitPrice));
  const accountingMeaning = clean(b?.accountingMeaning, 1000);
  const operationalMeaning = clean(b?.operationalMeaning, 1000);
  const requestedFinanceApproval = clean(b?.financeApproval, 20) || "pending";
  const financeApproval = session.user.role === "FINANCE" || session.user.role === "SUPER_ADMIN" ? requestedFinanceApproval : "pending";
  if (name.length < 2 || description.length < 5 || !Number.isFinite(unitPrice) || unitPrice < 1 || unitPrice > 500000) return NextResponse.json({ error: "Valid name, description and price are required." }, { status: 400 });
  if (!APPROVALS.has(financeApproval)) return NextResponse.json({ error: "Invalid finance approval status." }, { status: 400 });
  const gallery = clean(b?.gallery, 4000);
  const schemes = clean(b?.schemes, 4000);
  const slug = `${slugify(name)}-${publicToken().slice(0, 5)}`;
  const [row] = await db.insert(impactItems).values({ slug, name, description, unitPrice, category, unitLabel: unitLabel || null, imageUrl: clean(b?.imageUrl, 500) || null, gallery: gallery || null, schemes: schemes || null, featured: !!b?.featured, todayNeed: !!b?.todayNeed, futureFlag: !!b?.futureFlag, accountingMeaning: accountingMeaning || null, operationalMeaning: operationalMeaning || null, financeApproval, active: b?.active !== false, sortOrder: Math.floor(Number(b?.sortOrder) || 0) }).returning();
  await writeAudit({ actorAdminUserId: session.user.id, action: "create", entity: "impact_item", entityId: row.id, afterState: row, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, item: row });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid item id." }, { status: 400 });
  const [before] = await db.select().from(impactItems).where(eq(impactItems.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Impact item not found." }, { status: 404 });
  const patch: Partial<typeof impactItems.$inferInsert> = {};
  if (b?.name !== undefined) patch.name = clean(b.name, 120);
  if (b?.description !== undefined) patch.description = clean(b.description, 1000);
  if (b?.category !== undefined) patch.category = clean(b.category, 60) || "general";
  if (b?.unitLabel !== undefined) patch.unitLabel = clean(b.unitLabel, 80) || null;
  if (b?.imageUrl !== undefined) patch.imageUrl = clean(b.imageUrl, 500) || null;
  if (b?.gallery !== undefined) patch.gallery = clean(b.gallery, 4000) || null;
  if (b?.schemes !== undefined) patch.schemes = clean(b.schemes, 4000) || null;
  if (b?.accountingMeaning !== undefined) patch.accountingMeaning = clean(b.accountingMeaning, 1000) || null;
  if (b?.operationalMeaning !== undefined) patch.operationalMeaning = clean(b.operationalMeaning, 1000) || null;
  if (b?.unitPrice !== undefined) { const n = Math.floor(Number(b.unitPrice)); if (!Number.isFinite(n) || n < 1 || n > 500000) return NextResponse.json({ error: "Invalid price." }, { status: 400 }); patch.unitPrice = n; }
  for (const key of ["featured", "todayNeed", "futureFlag", "active"] as const) if (b?.[key] !== undefined) patch[key] = !!b[key];
  if (b?.sortOrder !== undefined) patch.sortOrder = Math.floor(Number(b.sortOrder) || 0);
  if (b?.financeApproval !== undefined) {
    if (session.user.role !== "FINANCE" && session.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Only Finance or Super Admin can change finance approval." }, { status: 403 });
    const s = clean(b.financeApproval, 20);
    if (!APPROVALS.has(s)) return NextResponse.json({ error: "Invalid finance approval status." }, { status: 400 });
    patch.financeApproval = s;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
  const [row] = await db.update(impactItems).set(patch).where(eq(impactItems.id, id)).returning();
  await writeAudit({ actorAdminUserId: session.user.id, action: "update", entity: "impact_item", entityId: id, beforeState: before, afterState: row, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, item: row });
}
