import { NextResponse } from "next/server";
import { requireAdminApi, getAdminSession } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { impactMissions } from "@/db/schema";
import { clean, clientIp, rateLimit } from "@/lib/server-utils";

const STATUS = new Set(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "EXPIRED", "ARCHIVED"]);

/** Basic admin update endpoint for V1.1 mission foundation. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "CSR_ADMIN"]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!rateLimit(`mission-upd:${clientIp(req)}`, 30, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id } = await params;
  const missionId = Number(id);
  if (!Number.isFinite(missionId)) return NextResponse.json({ error: "Invalid mission id" }, { status: 400 });

  const b = await req.json().catch(() => null);
  const status = clean(b?.status, 20);
  const title = clean(b?.title, 120);
  const description = clean(b?.description, 2000);

  const patch: Partial<typeof impactMissions.$inferInsert> = {};
  if (status) {
    if (!STATUS.has(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    patch.status = status;
  }
  if (title) patch.title = title;
  if (description) patch.description = description;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const [before] = await db.select().from(impactMissions).where(eq(impactMissions.id, missionId)).limit(1);
  if (!before) return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  const [m] = await db.update(impactMissions).set(patch).where(eq(impactMissions.id, missionId)).returning();
  const session = await getAdminSession();
  await writeAudit({ actorAdminUserId: session?.user.id, action: "update", entity: "impact_mission", entityId: m.id, beforeState: before, afterState: m, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, mission: m });
}
