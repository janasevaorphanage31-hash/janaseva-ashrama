import "server-only";
import { db } from "@/db";
import { agTelecallers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminApi } from "@/lib/admin-auth";

import { createHmac, timingSafeEqual } from "node:crypto";

export interface CallerAuthContext {
  callerId: string;
  name: string;
  isAdmin: boolean;
}

function callerSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "janaseva-telecaller-signing-key-production-secret-min32chars";
}

export function signCallerToken(callerId: string): string {
  const normalized = callerId.trim().toUpperCase();
  const sig = createHmac("sha256", callerSecret()).update(`caller:${normalized}`).digest("hex");
  return `${normalized}.${sig}`;
}

export function verifyCallerToken(token: string): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [callerId, sig] = parts;
  if (!callerId || !sig) return null;
  const normalized = callerId.trim().toUpperCase();
  const expectedSig = createHmac("sha256", callerSecret()).update(`caller:${normalized}`).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return normalized;
}

/**
 * Validates telecaller identity or admin identity.
 * Prevents Insecure Direct Object References (IDOR) and enforces Row-Level Security:
 * - A telecaller can ONLY access or update leads and links assigned to their own verified callerId.
 * - An administrator can access or reassign leads on behalf of any telecaller.
 * - Unauthenticated requests are rejected.
 */
export async function authenticateCallerOrAdmin(
  req: Request,
): Promise<CallerAuthContext | null> {
  // 1. Check if an administrator is authenticated
  const adminSession = await requireAdminApi();
  if (adminSession) {
    const url = new URL(req.url);
    const targetCallerId = url.searchParams.get("callerId");
    return {
      callerId: (targetCallerId || "ADMIN").trim().toUpperCase(),
      name: adminSession.user.email || "Admin",
      isAdmin: true,
    };
  }

  // 2. Check cryptographically signed telecaller session cookie
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/ag_caller_session=([^;]+)/);
  const rawToken = match ? match[1].trim() : null;
  const sessionCallerId = rawToken ? verifyCallerToken(rawToken) : null;

  if (!sessionCallerId) {
    return null;
  }

  try {
    const [caller] = await db
      .select({
        callerId: agTelecallers.callerId,
        name: agTelecallers.name,
        isActive: agTelecallers.isActive,
      })
      .from(agTelecallers)
      .where(eq(agTelecallers.callerId, sessionCallerId))
      .limit(1);

    if (!caller || !caller.isActive) {
      return null;
    }

    return {
      callerId: caller.callerId,
      name: caller.name,
      isAdmin: false,
    };
  } catch (err) {
    console.error("Caller authentication check failed:", err);
    return null;
  }
}
