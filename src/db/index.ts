import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsSchemaPromise?: Promise<void>;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DB_POOL_MAX || 20),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

globalForDb.__arenaNextJsPostgresqlPool = pool;

export const db = drizzle(pool);

export async function ensureDbSchema(): Promise<void> {
  if (!globalForDb.__arenaNextJsSchemaPromise) {
    globalForDb.__arenaNextJsSchemaPromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS recurring_subscriptions (
            id SERIAL PRIMARY KEY,
            public_id TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'created',
            mode TEXT NOT NULL DEFAULT 'razorpay',
            amount INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            frequency TEXT NOT NULL DEFAULT 'monthly',
            donor_name TEXT NOT NULL,
            donor_email TEXT NOT NULL,
            donor_phone TEXT,
            donor_pan TEXT,
            razorpay_plan_id TEXT,
            razorpay_subscription_id TEXT UNIQUE,
            mandate_status TEXT NOT NULL DEFAULT 'pending',
            current_cycle INTEGER NOT NULL DEFAULT 0,
            total_cycles INTEGER NOT NULL DEFAULT 60,
            charge_count INTEGER NOT NULL DEFAULT 0,
            next_charge_at TIMESTAMP,
            last_payment_id TEXT,
            last_payment_at TIMESTAMP,
            cancelled_at TIMESTAMP,
            cancel_reason TEXT,
            idempotency_key TEXT NOT NULL UNIQUE,
            meta JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS rec_subs_status_idx ON recurring_subscriptions(status);
          CREATE INDEX IF NOT EXISTS rec_subs_email_idx ON recurring_subscriptions(donor_email);
          CREATE INDEX IF NOT EXISTS rec_subs_rzp_sub_idx ON recurring_subscriptions(razorpay_subscription_id);

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'donations' AND column_name = 'subscription_id'
            ) THEN
              ALTER TABLE donations ADD COLUMN subscription_id INTEGER REFERENCES recurring_subscriptions(id) ON DELETE SET NULL;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'donations' AND column_name = 'recurring_cycle'
            ) THEN
              ALTER TABLE donations ADD COLUMN recurring_cycle INTEGER;
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS celebration_bookings (
            id SERIAL PRIMARY KEY,
            reference TEXT NOT NULL UNIQUE,
            celebrant_name TEXT NOT NULL,
            occasion TEXT NOT NULL,
            celebration_date TEXT NOT NULL,
            package_id TEXT NOT NULL,
            package_name TEXT NOT NULL,
            amount INTEGER NOT NULL,
            visit_mode TEXT NOT NULL DEFAULT 'in_person',
            time_slot TEXT,
            guest_count TEXT,
            blessing_message TEXT,
            donor_name TEXT NOT NULL,
            donor_phone TEXT NOT NULL,
            donor_email TEXT,
            donor_pan TEXT,
            payment_status TEXT NOT NULL DEFAULT 'pending',
            donation_id INTEGER REFERENCES donations(id) ON DELETE SET NULL,
            celebration_status TEXT NOT NULL DEFAULT 'CONFIRMED',
            photo_proof_url TEXT,
            video_proof_url TEXT,
            staff_notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS recurring_giving_requests (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            provider_subscription_id TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          ALTER TABLE celebration_bookings ADD COLUMN IF NOT EXISTS wish_video_url TEXT;
          ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS video_url TEXT;
          ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP;
          ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;
          ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP;
          ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
        `);
      } catch (err) {
        console.error("ensureDbSchema failed:", err);
        delete globalForDb.__arenaNextJsSchemaPromise;
        throw err;
      }
    })();
  }
  return globalForDb.__arenaNextJsSchemaPromise;
}

