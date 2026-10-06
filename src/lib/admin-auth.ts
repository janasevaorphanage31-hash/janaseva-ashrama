import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

const COOKIE = "janaseva_admin_session";
const TTL_MS = 8 * 60 * 60 * 1000;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be configured with at least 32 characters.");
  return value;
}

function sign(id: string) {
  return createHmac("sha256", secret()).update(id).digest("hex");
}

function verifyToken(token: string) {
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const expected = sign(id);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, expectedHex] = parts;
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(derivedKey, "hex");
  const b = Buffer.from(expectedHex, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const id = verifyToken(token);
  if (!id) return null;
  const [row] = await db
    .select({ session: adminSessions, user: adminUsers })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminUserId))
    .where(and(eq(adminSessions.id, id), gt(adminSessions.expiresAt, new Date()), eq(adminUsers.active, true)))
    .limit(1);
  return row ? row : null;
}

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export type AdminRole = "SUPER_ADMIN" | "STAFF_ADMIN" | "FINANCE" | "CONTENT_ADMIN" | "DONATION_ADMIN" | "CAMPAIGN_ADMIN" | "CSR_ADMIN" | "VOLUNTEER_ADMIN" | "MEDIA_REVIEWER" | "PARTNER_ADMIN";

export async function requireAdminApi(allowedRoles?: AdminRole[]) {
  const session = await getAdminSession();
  if (!session) return null;
  if (allowedRoles?.length && !allowedRoles.includes(session.user.role as AdminRole)) return null;
  return session;
}

export async function loginAdmin(email: string, password: string) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return false;

  const configuredEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD || "";

  let user: typeof adminUsers.$inferSelect | undefined;

  // 1. Check if input matches the primary Super Admin defined in environment variables
  if (configuredEmail && configuredPassword && configuredPassword.length >= 8) {
    const emailBuf = createHmac("sha256", secret()).update(normalizedEmail).digest();
    const confEmailBuf = createHmac("sha256", secret()).update(configuredEmail).digest();
    const passBuf = createHmac("sha256", secret()).update(password).digest();
    const confPassBuf = createHmac("sha256", secret()).update(configuredPassword).digest();

    if (timingSafeEqual(emailBuf, confEmailBuf) && timingSafeEqual(passBuf, confPassBuf)) {
      [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, configuredEmail)).limit(1);
      if (!user) {
        [user] = await db.insert(adminUsers).values({ email: configuredEmail, displayName: "Janaseva Super Admin", role: "SUPER_ADMIN" }).returning();
      }
    }
  }

  // 2. If not the environment Super Admin, authenticate against database employee accounts
  if (!user) {
    const [dbUser] = await db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.email, normalizedEmail), eq(adminUsers.active, true)))
      .limit(1);

    if (dbUser && dbUser.passwordHash && verifyPassword(password, dbUser.passwordHash)) {
      user = dbUser;
    }
  }

  if (!user) return false;

  const id = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.insert(adminSessions).values({ id, adminUserId: user.id, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function logoutAdmin() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  const id = token ? verifyToken(token) : null;
  if (id) await db.delete(adminSessions).where(eq(adminSessions.id, id));
  jar.delete(COOKIE);
}
