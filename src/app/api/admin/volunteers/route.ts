import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { volunteerApplications } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp } from "@/lib/server-utils";

const ROLES = ["SUPER_ADMIN", "STAFF_ADMIN", "VOLUNTEER_ADMIN"] as const;
const STATUSES = new Set(["NEW", "REVIEWING", "CONTACTED", "APPROVED", "DECLINED", "COMPLETED"]);

export async function GET() {
  if (!(await requireAdminApi([...ROLES]))) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ volunteers: await db.select().from(volunteerApplications).orderBy(desc(volunteerApplications.createdAt)) });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi([...ROLES]);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  const status = clean(b?.status, 20);
  const adminNotes = clean(b?.adminNotes, 2000);
  if (!Number.isInteger(id) || !STATUSES.has(status)) return NextResponse.json({ error: "Valid id and status are required." }, { status: 400 });
  const [before] = await db.select().from(volunteerApplications).where(eq(volunteerApplications.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "Volunteer application not found." }, { status: 404 });
  const [row] = await db.update(volunteerApplications).set({ status, adminNotes: adminNotes || before.adminNotes, updatedAt: new Date() }).where(eq(volunteerApplications.id, id)).returning();
  await writeAudit({ actorAdminUserId: session.user.id, action: "update", entity: "volunteer_application", entityId: id, beforeState: before, afterState: row, ipAddress: clientIp(req) });
  return NextResponse.json({ ok: true, volunteer: row });
}
