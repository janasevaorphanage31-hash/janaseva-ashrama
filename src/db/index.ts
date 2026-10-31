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

          CREATE TABLE IF NOT EXISTS community_members (
            id SERIAL PRIMARY KEY,
            role TEXT NOT NULL DEFAULT 'VOLUNTEER',
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            city TEXT,
            handle_or_org TEXT,
            reach TEXT,
            skills TEXT,
            message TEXT,
            whatsapp_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
            status TEXT NOT NULL DEFAULT 'NEW',
            admin_notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS comm_mem_role_idx ON community_members(role);
          CREATE INDEX IF NOT EXISTS comm_mem_status_idx ON community_members(status);
          CREATE INDEX IF NOT EXISTS comm_mem_phone_idx ON community_members(phone);

          CREATE INDEX IF NOT EXISTS don_lines_donation_idx ON donation_lines(donation_id);
          CREATE INDEX IF NOT EXISTS donations_paid_at_idx ON donations(paid_at);
          CREATE INDEX IF NOT EXISTS donations_created_at_idx ON donations(created_at);
          CREATE INDEX IF NOT EXISTS celebration_date_idx ON celebration_bookings(celebration_date);
          CREATE INDEX IF NOT EXISTS celebration_status_idx ON celebration_bookings(celebration_status);

          -- Antigravity Telecaller CRM & Birthday Lead Attribution Tables
          CREATE TABLE IF NOT EXISTS ag_telecallers (
            caller_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            whatsapp_number TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            daily_quota INTEGER NOT NULL DEFAULT 50,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS ag_leads (
            lead_id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            dob_day INTEGER NOT NULL,
            dob_month INTEGER NOT NULL,
            assigned_caller_id TEXT REFERENCES ag_telecallers(caller_id) ON DELETE SET NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            reschedule_date TIMESTAMP,
            last_contacted_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS ag_call_logs (
            log_id SERIAL PRIMARY KEY,
            lead_id INTEGER NOT NULL REFERENCES ag_leads(lead_id) ON DELETE CASCADE,
            caller_id TEXT NOT NULL REFERENCES ag_telecallers(caller_id) ON DELETE CASCADE,
            disposition TEXT NOT NULL,
            callback_time TIMESTAMP,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS ag_donations (
            txn_id TEXT PRIMARY KEY,
            gateway_order_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            payment_status TEXT NOT NULL DEFAULT 'captured',
            caller_ref_id TEXT REFERENCES ag_telecallers(caller_id) ON DELETE SET NULL,
            lead_id INTEGER REFERENCES ag_leads(lead_id) ON DELETE SET NULL,
            donor_name TEXT,
            donor_phone TEXT,
            donor_email TEXT,
            metadata JSONB,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS influencer_profiles (
            id SERIAL PRIMARY KEY,
            influencer_code TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            instagram_handle TEXT,
            whatsapp_number TEXT NOT NULL,
            target_goal_amount INTEGER NOT NULL DEFAULT 50000,
            campaign_story TEXT,
            cover_image_url TEXT,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          );

          -- Safe migration: allow caller_ref_id to accept telecallers or influencer codes without foreign key crashes
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'ag_donations_caller_ref_id_ag_telecallers_caller_id_fk' 
              AND table_name = 'ag_donations'
            ) THEN
              ALTER TABLE ag_donations DROP CONSTRAINT ag_donations_caller_ref_id_ag_telecallers_caller_id_fk;
            END IF;
          END $$;

          CREATE INDEX IF NOT EXISTS ag_leads_dob_idx ON ag_leads(dob_month, dob_day);
          CREATE INDEX IF NOT EXISTS ag_leads_assigned_idx ON ag_leads(assigned_caller_id, status);
          CREATE INDEX IF NOT EXISTS ag_leads_phone_idx ON ag_leads(phone);
          CREATE INDEX IF NOT EXISTS ag_call_logs_lead_idx ON ag_call_logs(lead_id);
          CREATE INDEX IF NOT EXISTS ag_call_logs_caller_idx ON ag_call_logs(caller_id, created_at);
          CREATE INDEX IF NOT EXISTS ag_donations_caller_idx ON ag_donations(caller_ref_id, created_at);
          CREATE INDEX IF NOT EXISTS ag_donations_order_idx ON ag_donations(gateway_order_id);
          CREATE INDEX IF NOT EXISTS influencer_code_idx ON influencer_profiles(influencer_code);
          CREATE INDEX IF NOT EXISTS influencer_status_idx ON influencer_profiles(status);
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

