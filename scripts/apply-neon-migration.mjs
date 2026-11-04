import "dotenv/config";
import fs from "fs";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
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

  console.log(`Migration complete! Applied: ${applied}, Skipped existing: ${skipped}`);
  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  pool.end();
  process.exit(1);
});
