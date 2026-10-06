import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Create .env before running db:sync.");
  process.exit(1);
}

const client = new Client({ connectionString: url });

const statements = [
  // 1. Admin auth & sessions
  `CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash TEXT`,
  `CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  // 2. Content entries & recurring giving
  `CREATE TABLE IF NOT EXISTS content_entries (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    author_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS recurring_giving_requests (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    provider_subscription_id TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )`,

  // 3. Audit logs alignment
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS actor_admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entity TEXT`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS before_state JSONB`,
  `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS after_state JSONB`,
  `DO $$ BEGIN UPDATE audit_logs SET entity = entity_type WHERE entity IS NULL AND entity_type IS NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,

  // 4. Media assets alignment
  `DO $$ BEGIN ALTER TABLE media_assets ALTER COLUMN storage_key DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,
  `DO $$ BEGIN ALTER TABLE media_assets ALTER COLUMN type DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS key TEXT`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS kind TEXT`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS original_url TEXT`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS poster_url TEXT`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP`,
  `ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
  `DO $$ BEGIN UPDATE media_assets SET key = storage_key WHERE key IS NULL AND storage_key IS NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,
  `DO $$ BEGIN UPDATE media_assets SET kind = type WHERE kind IS NULL AND type IS NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,

  // 5. Media consents alignment
  `DO $$ BEGIN ALTER TABLE media_consents ALTER COLUMN approved_by DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,
  `ALTER TABLE media_consents ADD COLUMN IF NOT EXISTS reviewer_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL`,
  `ALTER TABLE media_consents ADD COLUMN IF NOT EXISTS consented_at TIMESTAMP`,

  // 6. Campaigns alignment
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS display_name TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS moderation_note TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`,

  // 7. Impact items alignment
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general'`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS unit_label TEXT`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS image_url TEXT`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS today_need BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS future_flag BOOLEAN NOT NULL DEFAULT FALSE`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS accounting_meaning TEXT`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS operational_meaning TEXT`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS finance_approval TEXT NOT NULL DEFAULT 'pending'`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS starts_at TIMESTAMP`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS future_project BOOLEAN`,
  `ALTER TABLE impact_items ADD COLUMN IF NOT EXISTS accounting_approved BOOLEAN`,

  `DO $$ BEGIN UPDATE impact_items SET future_flag = COALESCE(future_flag, future_project, FALSE) WHERE future_project IS NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,
  `DO $$ BEGIN UPDATE impact_items SET finance_approval = CASE WHEN accounting_approved = TRUE THEN 'approved' ELSE COALESCE(finance_approval, 'pending') END WHERE accounting_approved IS NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;`,

  // 8. Performance and integrity indexes
  `CREATE INDEX IF NOT EXISTS donations_status_idx ON donations (status)`,
  `CREATE INDEX IF NOT EXISTS donations_campaign_idx ON donations (campaign_id)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity, entity_id)`,
  `CREATE INDEX IF NOT EXISTS volunteer_app_status_idx ON volunteer_applications (status)`,
  `CREATE INDEX IF NOT EXISTS analytics_event_idx ON analytics_events (event)`,

  // 9. Synchronize GiveA-style impact items catalog
  `INSERT INTO impact_items (slug, name, description, unit_price, icon, sort_order, category, unit_label, image_url, featured, today_need, accounting_meaning, operational_meaning, finance_approval, active)
   VALUES
     ('meal', 'Meal Support', 'Contributes toward nutritious, balanced meals prepared daily in the Ashrama kitchen.', 100, 'meal', 1, 'Food', 'meal', '/media/food.jpg', true, true, 'Covers wholesome groceries, grains, lentils, fresh vegetables, cooking fuel, and dairy procured from verified local vendors.', 'Ensures three fresh, hygienic, and balanced meals daily prepared with dignified care for every child at Janaseva Ashrama.', 'approved', true),
     ('fruits', 'Fruit & Milk Basket', 'Fresh seasonal fruits (apples, bananas, oranges) and dairy providing essential daily nutrition.', 150, 'fruits', 2, 'Food', 'basket', '/media/fruits.jpg', true, true, 'Direct procurement of fresh local orchard fruits and pasteurized milk from Karnataka milk federation.', 'Supplements breakfast and evening snack with vital micronutrients, vitamins, and protein for immunity.', 'approved', true),
     ('school-kit', 'Complete School Kit', 'Full set of notebooks, geometric tools, ballpoint pens, pencils, eraser, and sturdy school bag.', 250, 'school-kit', 3, 'Education', 'kit', '/media/school-kit.jpg', true, true, 'Direct purchase of educational stationery, school course materials, exam fees, and tutoring resources with GST receipts.', 'Empowers children with reliable academic tools, daily study hour mentoring, and encouragement to complete their schooling.', 'approved', true),
     ('education', 'Tuition & Learning Support', 'School supplies, textbooks, reference materials, and dedicated evening academic tutor support.', 250, 'education', 4, 'Education', 'learner unit', '/media/education.jpg', false, false, 'Coursebooks, syllabus reference books, and dedicated visiting tutor compensation vouchers.', 'Provides small-group evening tutoring in English, Mathematics, and Science for school confidence.', 'approved', true),
     ('essentials', 'Hygiene & Personal Care', 'Soaps, toothpaste, toothbrush, coconut oil, shampoo, towel, and clean personal toiletries.', 300, 'essentials', 5, 'Essentials', 'care kit', '/media/essentials.jpg', false, false, 'Bulk procurement of hygiene soaps, toothpaste, oral hygiene kits, and sanitizers audited quarterly.', 'Upholds dignity, health, and cleanliness in daily residential life so every child feels cared for and protected.', 'approved', true),
     ('activities', 'Sports & Creative Kit', 'Cricket bats, footballs, carrom boards, sketchbooks, watercolours, and craft supplies.', 350, 'activities', 6, 'Activities', 'activity kit', '/media/play.jpg', false, false, 'Sports equipment, art supplies, musical instruments, and visiting instructor honorariums supported by purchase vouchers.', 'Nurtures creativity, physical fitness, teamwork, and joy through regular weekend activities and festive celebrations.', 'approved', true),
     ('uniform', 'School Uniform & Footwear', 'Tailored pair of school uniforms, durable black shoes, socks, and comfortable everyday wear.', 400, 'uniform', 7, 'Essentials', 'uniform set', '/media/learning.jpg', true, true, 'Cloth fabric, local tailor stitching charges, and school-specification shoes with audited invoices.', 'Instills equality and confidence among peers, ensuring every child attends school dressed with pride.', 'approved', true),
     ('health', 'Health & Wellbeing Care', 'Preventative health check-ups, doctor consultation, prescription medicines, and first-aid care.', 500, 'health', 8, 'Health', 'health checkup', '/media/health.jpg', true, true, 'Doctor consultation fees, prescribed medicines, first-aid replenishments, and dental/vision screening clinic invoices.', 'Provides routine pediatric health monitoring, emergency care readiness, and wellbeing attention when a child falls unwell.', 'approved', true),
     ('bedding', 'Bedding & Warm Blanket Set', 'Clean cotton mattress sheet, pillow with cover, and warm winter fleece blanket for restorative sleep.', 600, 'bedding', 9, 'Essentials', 'bedding set', '/media/garden.jpg', false, false, 'Wholesale bedding procurement, heavy-duty blankets, and laundry sanitization supplies.', 'Guarantees a cozy, warm, and secure night''s sleep in well-maintained dormitories.', 'approved', true),
     ('digital-lab', 'Digital Literacy & Computer Skills', 'One month of computer lab access, educational software, and beginner programming instruction.', 750, 'digital-lab', 10, 'Education', 'student month', '/media/poster.jpg', false, false, 'Broadband connection costs, computer peripheral maintenance, and computer instructor stipends.', 'Bridges the digital divide by training students in typing, spreadsheets, research, and safe internet usage.', 'approved', true),
     ('birthday-feast', 'Birthday Special Feast', 'Sponsor a grand celebratory festive meal with sweets (payasam / laddoo) for all children on your special day.', 1500, 'birthday-feast', 11, 'Celebrations', 'ashrama feast', '/media/food.jpg', true, true, 'Special feast grocery list (pure ghee, dry fruits, sweets, special curries, paneer) audited for Ashrama celebrations.', 'Transforms an ordinary day into a festive celebration where the children celebrate together in honour of your occasion.', 'approved', true),
     ('pantry', 'Month Pantry Staples (50kg Rice & Dal)', 'Wholesale sacks of premium Sona Masoori rice, Toor dal, cooking oil, and lentils for the Ashrama kitchen.', 2500, 'pantry', 12, 'Food', '50kg staples', '/media/pantry.jpg', true, true, 'Wholesale agricultural market committee (APMC) invoices for bulk grain bags and edible oils.', 'Provides the backbone of food security, ensuring the Ashrama kitchen never faces staple ingredient shortages.', 'approved', true)
   ON CONFLICT (slug) DO UPDATE SET
     name = EXCLUDED.name,
     description = EXCLUDED.description,
     unit_price = EXCLUDED.unit_price,
     category = EXCLUDED.category,
     unit_label = EXCLUDED.unit_label,
     image_url = EXCLUDED.image_url,
     accounting_meaning = EXCLUDED.accounting_meaning,
     operational_meaning = EXCLUDED.operational_meaning,
     finance_approval = 'approved',
     active = true`,

  // 12. Special Day Celebrations table
  `CREATE TABLE IF NOT EXISTS celebration_bookings (
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
  )`,
  `ALTER TABLE celebration_bookings ADD COLUMN IF NOT EXISTS wish_video_url TEXT`,
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS video_url TEXT`,
  `CREATE INDEX IF NOT EXISTS celebration_date_idx ON celebration_bookings(celebration_date)`,
  `CREATE INDEX IF NOT EXISTS celebration_status_idx ON celebration_bookings(celebration_status)`,
];

try {
  await client.connect();
  await client.query("BEGIN");
  for (const sql of statements) await client.query(sql);
  await client.query("COMMIT");
  console.log("Safe database synchronization completed successfully. All schema tables and columns are up to date.");
} catch (error) {
  try { await client.query("ROLLBACK"); } catch {}
  console.error("Safe database synchronization failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}
