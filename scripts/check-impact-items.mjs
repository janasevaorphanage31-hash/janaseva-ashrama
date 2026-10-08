import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const res = await client.query('SELECT slug, name, category, unit_price FROM impact_items ORDER BY sort_order ASC');
console.log(`TOTAL IMPACT ITEMS IN DB: ${res.rows.length}`);
console.log(res.rows);

await client.end();
