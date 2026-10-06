import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { hashPassword, requireAdminApi, type AdminRole } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clean, clientIp, isEmail } from "@/lib/server-utils";

const VALID_ROLES = new Set<AdminRole>([
  "SUPER_ADMIN",
  "STAFF_ADMIN",
  "FINANCE",
  "CONTENT_ADMIN",
  "DONATION_ADMIN",
  "CAMPAIGN_ADMIN",
  "CSR_ADMIN",
  "VOLUNTEER_ADMIN",
  "MEDIA_REVIEWER",
  "PARTNER_ADMIN",
]);

export async function GET(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });

  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
    })
    .from(adminUsers)
    .orderBy(asc(adminUsers.id));

  return NextResponse.json({ users: rows, currentUserId: session.user.id });
}

export async function POST(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const displayName = clean(b?.displayName, 100);
  const email = clean(b?.email, 200).toLowerCase();
  const password = String(b?.password || "");
  const role = clean(b?.role, 50) as AdminRole;

  if (!displayName || displayName.length < 2) {
    return NextResponse.json({ error: "Please provide a valid full name." }, { status: 400 });
  }
  if (!email || !isEmail(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  }
  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ error: "Please select a valid job role." }, { status: 400 });
  }

  // Check uniqueness
  const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "An employee account with this email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const [created] = await db
    .insert(adminUsers)
    .values({
      email,
      displayName,
      role,
      passwordHash,
      active: true,
    })
    .returning({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
    });

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "create_team_member",
    entity: "admin_user",
    entityId: created.id,
    afterState: created,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, user: created });
}

export async function PATCH(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });

  const b = await req.json().catch(() => null);
  const id = Number(b?.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid user ID." }, { status: 400 });

  const [before] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (b?.displayName !== undefined) {
    const name = clean(b.displayName, 100);
    if (name.length < 2) return NextResponse.json({ error: "Invalid display name." }, { status: 400 });
    updates.displayName = name;
  }

  if (b?.role !== undefined) {
    const role = clean(b.role, 50) as AdminRole;
    if (!VALID_ROLES.has(role)) return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    // Prevent removing super admin from oneself if only one
    updates.role = role;
  }

  if (b?.active !== undefined) {
    updates.active = Boolean(b.active);
    if (!updates.active) {
      // Force logout of deactivated employee immediately
      await db.delete(adminSessions).where(eq(adminSessions.adminUserId, id));
    }
  }

  if (b?.newPassword) {
    const newPass = String(b.newPassword);
    if (newPass.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters long." }, { status: 400 });
    updates.passwordHash = hashPassword(newPass);
    // Invalidate sessions so employee must log in with new password
    await db.delete(adminSessions).where(eq(adminSessions.adminUserId, id));
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes provided." }, { status: 400 });
  }

  const [updated] = await db
    .update(adminUsers)
    .set(updates)
    .where(eq(adminUsers.id, id))
    .returning({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
    });

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "update_team_member",
    entity: "admin_user",
    entityId: id,
    beforeState: before,
    afterState: updated,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true, user: updated });
}

export async function DELETE(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN"]);
  if (!session) return NextResponse.json({ error: "Unauthorized. Super Admin access required." }, { status: 401 });

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own administrative account." }, { status: 400 });
  }

  const [before] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!before) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Delete sessions first, then user
  await db.delete(adminSessions).where(eq(adminSessions.adminUserId, id));
  await db.delete(adminUsers).where(eq(adminUsers.id, id));

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "delete_team_member",
    entity: "admin_user",
    entityId: id,
    beforeState: before,
    ipAddress: clientIp(req),
  });

  return NextResponse.json({ ok: true });
}
