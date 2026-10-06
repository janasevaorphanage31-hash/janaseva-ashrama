import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import pg from "pg";

const { Client } = pg;

test("Database Schema Integrity", async (t) => {
  const url = process.env.DATABASE_URL;
  assert.ok(url, "DATABASE_URL must be set in environment");

  const client = new Client({ connectionString: url });
  await client.connect();

  await t.test("All critical platform tables exist in PostgreSQL", async () => {
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"
    );
    const tables = new Set(res.rows.map((r) => r.table_name));

    const requiredTables = [
      "admin_users",
      "admin_sessions",
      "content_entries",
      "audit_logs",
      "campaigns",
      "campaign_members",
      "donations",
      "donation_lines",
      "impact_items",
      "impact_missions",
      "mission_contributions",
      "impact_gifts",
      "impact_certificates",
      "volunteer_applications",
      "companies",
      "creator_profiles",
      "ngo_partners",
      "recurring_giving_requests",
      "today_updates",
      "documents",
      "impact_metrics",
      "media_assets",
      "media_consents",
    ];

    for (const table of requiredTables) {
      assert.ok(tables.has(table), `Table '${table}' must exist in the database`);
    }
  });

  await client.end();
});
