import { NextResponse } from "next/server";
import { loginAdmin } from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/server-utils";

export async function POST(req: Request) {
  if (!rateLimit(`admin-login:${clientIp(req)}`, 8, 10 * 60_000)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const body = await req.json().catch(() => null);
  const ok = body && await loginAdmin(String(body.email || ""), String(body.password || ""));
  if (!ok) return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  return NextResponse.json({ ok: true });
}
