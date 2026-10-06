import { NextResponse } from "next/server";
import { requireAdminApi, getAdminSession } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { donations, impactMissions, missionContributions } from "@/db/schema";
import { clean, clientIp, publicToken, rateLimit, slugify } from "@/lib/server-utils";

const STATUS = new Set(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "EXPIRED", "ARCHIVED"]);

export async function GET() {
  if (!(await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN"]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const rows = await db.select().from(impactMissions).orderBy(desc(impactMissions.createdAt));
  const out = await Promise.all(rows.map(async (m) => {
    const [s] = await db
      .select({ raised: sql<number>`coalesce(sum(${missionContributions.allocatedAmount}),0)::int`, supporters: count() })
      .from(missionContributions)
      .innerJoin(donations, eq(donations.id, missionContributions.donationId))
      .where(sql`${missionContributions.missionId}=${m.id} and ${donations.status}='paid'`);
    return { ...m, raised: s.raised, supporters: s.supporters };
  }));
  return NextResponse.json({ missions: out });
}

/** Basic admin endpoint for V1.1 mission foundation. Replace with role auth in next phase. */
export async function POST(req: Request) {
  if (!(await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN"]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`mission:${clientIp(req)}`, 20, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const b = await req.json().catch(() => null);
  const title = clean(b?.title, 120);
  const description = clean(b?.description, 2000);
  const status = clean(b?.status, 20) || "DRAFT";
  const unitLabel = clean(b?.unitLabel, 60);
  const targetUnits = Number.isFinite(Number(b?.targetUnits)) ? Math.max(0, Math.floor(Number(b.targetUnits))) : null;
  const targetAmount = Number.isFinite(Number(b?.targetAmount)) ? Math.max(0, Math.floor(Number(b.targetAmount))) : null;

  if (title.length < 3 || description.length < 10) return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  if (!STATUS.has(status)) return NextResponse.json({ error: "Invalid mission status." }, { status: 400 });

  const slug = `${slugify(title)}-${publicToken().slice(0, 5)}`;
  const [created] = await db.insert(impactMissions).values({ title, description, status, unitLabel: unitLabel || null, targetUnits, targetAmount, slug }).returning();
  const session = await getAdminSession();
  await writeAudit({ actorAdminUserId: session?.user.id, action: "create", entity: "impact_mission", entityId: created.id, afterState: created, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, mission: created });
}
