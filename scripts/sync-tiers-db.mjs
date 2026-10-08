import "dotenv/config";
import pg from "pg";
import { DEFAULT_ITEMS, TODAY_SEED } from "../src/lib/seed-data.ts";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log("Upserting all impact items into database...");

for (const item of DEFAULT_ITEMS) {
  const query = `
    INSERT INTO impact_items (
      slug, name, description, unit_price, icon, category,
      unit_label, image_url, featured, today_need, future_flag,
      accounting_meaning, operational_meaning, finance_approval,
      active, sort_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      unit_price = EXCLUDED.unit_price,
      icon = EXCLUDED.icon,
      category = EXCLUDED.category,
      unit_label = EXCLUDED.unit_label,
      image_url = EXCLUDED.image_url,
      featured = EXCLUDED.featured,
      today_need = EXCLUDED.today_need,
      accounting_meaning = EXCLUDED.accounting_meaning,
      operational_meaning = EXCLUDED.operational_meaning,
      finance_approval = 'approved',
      active = true,
      sort_order = EXCLUDED.sort_order;
  `;
  await client.query(query, [
    item.slug,
    item.name,
    item.description,
    item.unitPrice,
    item.icon,
    item.category,
    item.unitLabel || null,
    item.imageUrl || null,
    !!item.featured,
    !!item.todayNeed,
    !!item.futureFlag,
    item.accountingMeaning || null,
    item.operationalMeaning || null,
    item.financeApproval || "approved",
    true,
    item.sortOrder || 0,
  ]);
}

console.log("Upserting authentic today updates into database...");
// Update or insert today updates
for (const [idx, u] of TODAY_SEED.entries()) {
  await client.query(
    `INSERT INTO today_updates (title, body, category, image_url, is_sample, status)
     VALUES ($1, $2, $3, $4, false, 'published')`,
    [u.title, u.body, u.category, u.imageUrl]
  );
}

const countRes = await client.query("SELECT COUNT(*) FROM impact_items");
console.log(`Total impact items now in DB: ${countRes.rows[0].count}`);

const listRes = await client.query("SELECT slug, name, category, unit_price FROM impact_items ORDER BY sort_order ASC");
console.log(listRes.rows);

await client.end();
console.log("Database sync completed successfully!");
