import { db, ensureDbSchema } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDbSchema();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, migrated: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("Health check / schema migration failed:", err);
    return Response.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

