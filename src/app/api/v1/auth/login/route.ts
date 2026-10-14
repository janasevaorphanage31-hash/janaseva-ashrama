import { NextResponse } from "next/server";
import { db } from "@/db";
import { agTelecallers } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { verifyPassword, hashPassword } from "@/lib/admin-auth";
import { signCallerToken, verifyCallerToken } from "@/lib/caller-auth";
import { ensureTelecallersAndSeedData } from "@/lib/antigravity-crm";

export async function GET(req: Request) {
  try {
    await ensureTelecallersAndSeedData();

    // Secure cookie-only authentication (reject insecure query param bypass)
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/ag_caller_session=([^;]+)/);
    const rawToken = match ? match[1].trim() : null;
    const sessionCallerId = rawToken ? verifyCallerToken(rawToken) : null;

    if (!sessionCallerId) {
      return NextResponse.json({ authenticated: false });
    }

    const caller = await db
      .select()
      .from(agTelecallers)
      .where(eq(agTelecallers.callerId, sessionCallerId.trim().toUpperCase()))
      .limit(1);

    if (caller.length === 0 || !caller[0].isActive) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      caller: {
        callerId: caller[0].callerId,
        name: caller[0].name,
        whatsappNumber: caller[0].whatsappNumber,
        email: caller[0].email,
        dailyQuota: caller[0].dailyQuota,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTelecallersAndSeedData();
    const body = await req.json();

    // 1. Logout
    if (body.action === "logout") {
      const response = NextResponse.json({ success: true, message: "Logged out successfully" });
      response.cookies.set("ag_caller_session", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
      });
      return response;
    }

    // 2. Change Password
    if (body.action === "change_password") {
      const { callerId, currentPassword, newPassword } = body;
      const cid = (callerId || "").trim().toUpperCase();
      if (!cid || !currentPassword || !newPassword) {
        return NextResponse.json({ error: "All password fields are required" }, { status: 400 });
      }
      if (newPassword.length < 4) {
        return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
      }

      const caller = await db
        .select()
        .from(agTelecallers)
        .where(eq(agTelecallers.callerId, cid))
        .limit(1);

      if (caller.length === 0) {
        return NextResponse.json({ error: "Caller not found" }, { status: 404 });
      }

      const validCurrent = verifyPassword(currentPassword, caller[0].passwordHash);
      if (!validCurrent) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }

      await db
        .update(agTelecallers)
        .set({ passwordHash: hashPassword(newPassword), updatedAt: new Date() })
        .where(eq(agTelecallers.callerId, cid));

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // 3. Login
    const inputIdentifier = (body.callerId || body.email || "").trim();
    const password = body.password || "";

    if (!inputIdentifier || !password) {
      return NextResponse.json({ error: "Caller ID / Email and password are required" }, { status: 400 });
    }

    const caller = await db
      .select()
      .from(agTelecallers)
      .where(
        or(
          eq(agTelecallers.callerId, inputIdentifier.toUpperCase()),
          eq(agTelecallers.email, inputIdentifier.toLowerCase())
        )
      )
      .limit(1);

    if (caller.length === 0 || !caller[0].isActive) {
      return NextResponse.json({ error: "Invalid credentials or account is paused" }, { status: 401 });
    }

    const valid = verifyPassword(password, caller[0].passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      caller: {
        callerId: caller[0].callerId,
        name: caller[0].name,
        whatsappNumber: caller[0].whatsappNumber,
        email: caller[0].email,
        dailyQuota: caller[0].dailyQuota,
      },
    });

    // Set cryptographically signed telecaller session cookie
    response.cookies.set("ag_caller_session", signCallerToken(caller[0].callerId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

