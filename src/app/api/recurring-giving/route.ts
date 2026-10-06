import { NextResponse } from "next/server";
import { db } from "@/db";
import { rateLimit, clientIp, clean, isEmail } from "@/lib/server-utils";
import { NAME_REGEX } from "@/lib/validation";
import { recurringGivingRequests } from "@/db/schema";

export async function POST(req: Request) {
  if (!rateLimit(`recurring:${clientIp(req)}`, 5, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const form = await req.formData();
  const name = clean(String(form.get("name") ?? ""), 100);
  const email = clean(String(form.get("email") ?? ""), 200);
  const amount = Math.floor(Number(form.get("amount")));
  if (!name || !NAME_REGEX.test(name) || !isEmail(email) || ![250, 500, 1000].includes(amount)) {
    return NextResponse.json({ error: "Valid name (letters only), email and amount are required." }, { status: 400 });
  }
  await db.insert(recurringGivingRequests).values({ name, email, amount, status: "PENDING" });
  return NextResponse.redirect(new URL("/recurring-giving?sent=1", req.url), 303);
}
