import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "CAMPAIGN_ADMIN"] as const;
const STATUSES = new Set(["pending", "approved", "rejected", "paused", "archived"]);

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ campaigns: await db.select().from(campaigns).orderBy(desc(campaigns.createdAt)) });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  const status = clean(b?.status, 20);
  const moderationNote = clean(b?.moderationNote, 2000);
  const updates: Record<string, any> = {};
  if (status && STATUSES.has(status)) updates.status = status;
  if (moderationNote !== undefined) updates.moderationNote = moderationNote;
  if (b?.coverImage !== undefined) updates.coverImage = clean(b.coverImage, 500);
  if (b?.videoUrl !== undefined) updates.videoUrl = clean(b.videoUrl, 500);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Valid campaign id is required." }, { status: 400 });
  const [before] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  const [row] = await db.update(campaigns).set(updates).where(eq(campaigns.id, id)).returning();
  await writeAudit({ actorAdminUserId: session.user.id, action: "moderate", entity: "campaign", entityId: id, beforeState: before, afterState: row, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, campaign: row });
}
