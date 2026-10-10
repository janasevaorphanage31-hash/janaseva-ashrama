import pg from "pg";
const { Client } = pg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  console.log("Connected to PostgreSQL. Creating recurring_subscriptions table...");

  await client.query(`
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
  `);

  console.log("Migration executed successfully!");
  await client.end();
}

main().catch(console.error);
