import { db, ensureDbSchema, pool } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL || "";
  const maskedUrl = rawUrl.replace(/:[^:@]+@/, ":***@");

  try {
    const dbInfoRes = await pool.query("SELECT current_database(), current_user, current_schema()");
    const tablesRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
    
    await ensureDbSchema();
    await db.execute(sql`select 1`);
    
    return Response.json({
      ok: true,
      migrated: true,
      databaseUrl: maskedUrl,
      dbInfo: dbInfoRes.rows[0],
      tables: tablesRes.rows.map(r => r.table_name),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    let tables: string[] = [];
    try {
      const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
      tables = res.rows.map(r => r.table_name);
    } catch {}

    console.error("Health check / schema migration failed:", err);
    return Response.json({
      ok: false,
      error: err?.message || String(err),
      databaseUrl: maskedUrl,
      tablesInDb: tables,
    }, { status: 500 });
  }
}

