import fs from "fs";
import pg from "pg";

const { Pool } = pg;
const NEON_URL = "postgresql://neondb_owner:npg_GuTZAkScv8m7@ep-purple-feather-b3n7wkj0-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: NEON_URL });

async function run() {
  console.log("Connecting directly to Neon database:", NEON_URL.replace(/:[^:@]+@/, ":***@"));
  const content = fs.readFileSync("drizzle/0000_right_bedlam.sql", "utf8");
  // Split on statement breakpoint "--> statement-breakpoint"
  const statements = content.split("--> statement-breakpoint");
  console.log(`Applying ${statements.length} statements to Neon database...`);

  let applied = 0;
  let skipped = 0;

  for (const raw of statements) {
    const stmt = raw.trim();
    if (!stmt) continue;
    try {
      await pool.query(stmt);
      applied++;
    } catch (err) {
      if (err.code === "42P07" || err.message?.includes("already exists")) {
        skipped++;
      } else {
        console.warn(`Statement warning (${err.code}):`, err.message);
      }
    }
  }

  console.log(`Migration complete on Neon! Applied: ${applied}, Skipped: ${skipped}`);
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  pool.end();
  process.exit(1);
});
