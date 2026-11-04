import { db, ensureDbSchema, pool } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL || "";
  const maskedUrl = rawUrl.replace(/:[^:@]+@/, ":***@");

  try {
    const dbInfoRes = await pool.query("SELECT current_database(), current_user");
    const tablesRes = await pool.query("SELECT count(*)::int as count FROM information_schema.tables WHERE table_schema='public'");
    
    await ensureDbSchema();
    await db.execute(sql`select 1`);
    
    return Response.json({
      ok: true,
      migrated: true,
      databaseUrl: maskedUrl,
      dbInfo: dbInfoRes.rows[0],
      tableCount: tablesRes.rows[0]?.count,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Health check / schema migration failed:", err);
    return Response.json({
      ok: false,
      error: err?.message || String(err),
      databaseUrl: maskedUrl,
    }, { status: 500 });
  }
}

