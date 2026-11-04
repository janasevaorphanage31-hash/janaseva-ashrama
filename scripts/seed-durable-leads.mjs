import "dotenv/config";
import pg from "pg";

const NEON_URL = "postgresql://neondb_owner:npg_GuTZAkScv8m7@ep-purple-feather-b3n7wkj0-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";
const client = new pg.Client({ connectionString: NEON_URL });

async function seedDatabase() {
  await client.connect();

  console.log("1. Ensuring schema columns...");
  await client.query(`
    ALTER TABLE ag_leads ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
    ALTER TABLE ag_leads ADD COLUMN IF NOT EXISTS disposition_reason TEXT;
    ALTER TABLE ag_leads ADD COLUMN IF NOT EXISTS preferred_language TEXT;
    ALTER TABLE ag_call_logs ADD COLUMN IF NOT EXISTS reason TEXT;
  `);

  console.log("2. Checking existing telecallers...");
  let callersRes = await client.query("SELECT caller_id FROM ag_telecallers WHERE is_active = true ORDER BY caller_id");
  let callerIds = callersRes.rows.map(r => r.caller_id);

  if (callerIds.length === 0) {
    console.log("No telecallers found, creating telecallers on Neon...");
    const defaultHash = "scrypt:dummy:dummy";
    const callers = [
      { id: "ADMIN", name: "Ashrama Admin / Supervisor", phone: "9980359595", email: "admin@janaseva.org" },
      { id: "TC01", name: "Ananya Sharma", phone: "9845011001", email: "tc01@janaseva.org" },
      { id: "TC02", name: "Ramesh Hegde", phone: "9845011002", email: "tc02@janaseva.org" },
      { id: "TC03", name: "Kavitha Rao", phone: "9845011003", email: "tc03@janaseva.org" },
      { id: "TC04", name: "Suresh Gowda", phone: "9845011004", email: "tc04@janaseva.org" },
      { id: "TC05", name: "Pooja Kulkarni", phone: "9845011005", email: "tc05@janaseva.org" },
      { id: "TC06", name: "Venkatesh Prasad", phone: "9845011006", email: "tc06@janaseva.org" },
      { id: "TC07", name: "Divya Nair", phone: "9845011007", email: "tc07@janaseva.org" },
      { id: "TC08", name: "Manjunath Swamy", phone: "9845011008", email: "tc08@janaseva.org" },
      { id: "TC09", name: "Sowmya Bhat", phone: "9845011009", email: "tc09@janaseva.org" },
      { id: "TC10", name: "Girish Kumar", phone: "9845011010", email: "tc10@janaseva.org" },
      { id: "TC11", name: "Deepa Narayan", phone: "9845011011", email: "tc11@janaseva.org" },
      { id: "TC12", name: "Chethan Reddy", phone: "9845011012", email: "tc12@janaseva.org" },
      { id: "TC13", name: "Aishwarya Shenoy", phone: "9845011013", email: "tc13@janaseva.org" },
      { id: "TC14", name: "Raghavendra Joshi", phone: "9845011014", email: "tc14@janaseva.org" },
      { id: "TC15", name: "Meenakshi Iyengar", phone: "9845011015", email: "tc15@janaseva.org" },
      { id: "TC16", name: "Prashanth Kumar", phone: "8123665335", email: "pkr@janaseva.org" },
    ];
    for (const c of callers) {
      await client.query(
        "INSERT INTO ag_telecallers (caller_id, name, whatsapp_number, email, password_hash, is_active) VALUES ($1, $2, $3, $4, $5, true) ON CONFLICT (caller_id) DO NOTHING",
        [c.id, c.name, c.phone, c.email, defaultHash]
      );
    }
    callersRes = await client.query("SELECT caller_id FROM ag_telecallers WHERE is_active = true ORDER BY caller_id");
    callerIds = callersRes.rows.map(r => r.caller_id);
  }
  console.log("Active callers ready:", callerIds);

  console.log("3. Populating ag_leads...");
  const now = new Date();
  const curDay = now.getDate();
  const curMonth = now.getMonth() + 1;

  const tom = new Date(now.getTime() + 24 * 3600 * 1000);
  const tomDay = tom.getDate();
  const tomMonth = tom.getMonth() + 1;

  const t2 = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
  const t2Day = t2.getDate();
  const t2Month = t2.getMonth() + 1;

  const t3 = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
  const t3Day = t3.getDate();
  const t3Month = t3.getMonth() + 1;

  // Realistic parent/child and direct donor data pool
  const rawParents = [
    { child: "ಆರವ್ ಶರ್ಮಾ (Aarav Sharma)", parent: "ಮಹೇಶ್ ಶರ್ಮಾ (Mahesh Sharma)", phone: "9845012301" },
    { child: "ಅನ್ವಿತಾ ಗೌಡ (Anvitha Gowda)", parent: "ರಮೇಶ್ ಗೌಡ (Ramesh Gowda)", phone: "9845012302" },
    { child: "ಧ್ರುವ್ ಕುಮಾರ್ (Dhruv Kumar)", parent: "ಸುರೇಶ್ ಕುಮಾರ್ (Suresh Kumar)", phone: "9845012303" },
    { child: "ದಿಯಾ ಭಟ್ (Diya Bhat)", parent: "ವೆಂಕಟೇಶ್ ಭಟ್ (Venkatesh Bhat)", phone: "9845012304" },
    { child: "ಇಶಾನ್ ಹೆಗಡೆ (Ishaan Hegde)", parent: "ಶ್ರೀನಿವಾಸ್ ಹೆಗಡೆ (Srinivas Hegde)", phone: "9845012305" },
    { child: "ಕಾವ್ಯ ನಾರಾಯಣ್ (Kavya Narayan)", parent: "ನಾರಾಯಣ ಸ್ವಾಮಿ (Narayana Swamy)", phone: "9845012306" },
    { child: "ಪ್ರಣವ್ ದೇಶ್‌ಮುಖ್ (Pranav Deshmukh)", parent: "ಸಂಜಯ್ ದೇಶ್‌ಮುಖ್ (Sanjay Deshmukh)", phone: "9845012307" },
    { child: "ಸಾನ್ವಿ ಶೆಟ್ಟಿ (Sanvi Shetty)", parent: "ಪ್ರಭಾಕರ್ ಶೆಟ್ಟಿ (Prabhakar Shetty)", phone: "9845012308" },
    { child: "ತೇಜಸ್ ರಾವ್ (Tejas Rao)", parent: "ವಿಜಯ್ ರಾವ್ (Vijay Rao)", phone: "9845012309" },
    { child: "ಅನನ್ಯ ಕುಲಕರ್ಣಿ (Ananya Kulkarni)", parent: "ದತ್ತಾತ್ರೇಯ ಕುಲಕರ್ಣಿ (Dattatreya Kulkarni)", phone: "9845012310" },
    { child: "ರೋಹನ್ ನಾಯಕ್ (Rohan Nayak)", parent: "ರಾಘವೇಂದ್ರ ನಾಯಕ್ (Raghavendra Nayak)", phone: "9845012311" },
    { child: "ಶ್ರೇಯಾ ಐಯಂಗಾರ್ (Shreya Iyengar)", parent: "ರಂಗನಾಥ್ ಐಯಂಗಾರ್ (Ranganath Iyengar)", phone: "9845012312" },
    { child: "ವರುಣ್ ಜೋಷಿ (Varun Joshi)", parent: "ಪ್ರಮೋದ್ ಜೋಷಿ (Pramod Joshi)", phone: "9845012313" },
    { child: "ತನ್ವಿ ಪಾಟೀಲ್ (Tanvi Patil)", parent: "ಬಸವರಾಜ್ ಪಾಟೀಲ್ (Basavaraj Patil)", phone: "9845012314" },
    { child: "ಆರ್ಯನ್ ಕಾಮತ್ (Aryan Kamath)", parent: "ಗಣೇಶ್ ಕಾಮತ್ (Ganesh Kamath)", phone: "9845012315" },
    { child: "ಮೀರಾ ಅಳ್ವ (Meera Alva)", parent: "ಸತೀಶ್ ಅಳ್ವ (Satish Alva)", phone: "9845012316" },
    { child: "ಸಿದ್ಧಾರ್ಥ್ ಶೆಣೈ (Siddharth Shenoy)", parent: "ರಾಜೇಂದ್ರ ಶೆಣೈ (Rajendra Shenoy)", phone: "9845012317" },
    { child: "ಖುಷಿ ಆಚಾರ್ (Khushi Achar)", parent: "ನಾಗೇಶ್ ಆಚಾರ್ (Nagesh Achar)", phone: "9845012318" },
    { child: "ವಿಹಾನ್ ಮಲ್ಯ (Vihaan Mallya)", parent: "ದಿನೇಶ್ ಮಲ್ಯ (Dinesh Mallya)", phone: "9845012319" },
    { child: "ಅದ್ವೈತ್ ಪ್ರಸಾದ್ (Advait Prasad)", parent: "ಹರೀಶ್ ಪ್ರಸಾದ್ (Harish Prasad)", phone: "9845012320" },
  ];

  const rawDonors = [
    { name: "ಡಾ. ಚಂದ್ರಶೇಖರ್ ಎಚ್. (Dr. Chandrashekar H.)", phone: "9980124001" },
    { name: "ಗಾಯತ್ರಿ ರಾಮನಾಥನ್ (Gayatri Ramanathan)", phone: "9980124002" },
    { name: "ಕಾರ್ತಿಕ್ ವೈದ್ಯನಾಥನ್ (Karthik Vaidyanathan)", phone: "9980124003" },
    { name: "ನಿರ್ಮಲಾ ಸೋಮೇಶ್ವರ್ (Nirmala Someshwar)", phone: "9980124004" },
    { name: "ಪ್ರವೀಣ್ ಜಗದೀಶ್ (Praveen Jagadish)", phone: "9980124005" },
    { name: "ಶಶಿಕಲಾ ರಾವ್ (Shashikala Rao)", phone: "9980124006" },
    { name: "ಹರೀಶ್ಚಂದ್ರ ಶೆಟ್ಟಿ (Harishchandra Shetty)", phone: "9980124007" },
    { name: "ಭವಾನಿ ಶಂಕರ್ (Bhavani Shankar)", phone: "9980124008" },
    { name: "ರಾಜಶೇಖರ್ ಅಳ್ವ (Rajshekar Alva)", phone: "9980124009" },
    { name: "ವಿದ್ಯಾ ಪ್ರಸನ್ನ (Vidya Prasanna)", phone: "9980124010" },
    { name: "ಆನಂದ್ ಮೂರ್ತಿ (Anand Murthy)", phone: "9980124011" },
    { name: "ಸುಮತಿ ರಾವ್ (Sumathi Rao)", phone: "9980124012" },
    { name: "ಬಾಲಕೃಷ್ಣ ಭಟ್ (Balakrishna Bhat)", phone: "9980124013" },
    { name: "ಶಿವಕುಮಾರ್ ಸ್ವಾಮಿ (Shivakumar Swamy)", phone: "9980124014" },
    { name: "ಮಂಜುಳಾ ರೆಡ್ಡಿ (Manjula Reddy)", phone: "9980124015" },
    { name: "ಶ್ರೀಧರ್ ಹೆಗಡೆ (Sreedhar Hegde)", phone: "9980124016" },
    { name: "ಗೀತಾ ನಾರಾಯಣ್ (Geetha Narayan)", phone: "9980124017" },
    { name: "ರವೀಂದ್ರ ಪಾಟೀಲ್ (Ravindra Patil)", phone: "9980124018" },
    { name: "ಸುನೀತಾ ದೇಶ್‌ಮುಖ್ (Sunitha Deshmukh)", phone: "9980124019" },
    { name: "ವೆಂಕಟ್ರಮಣ ಗೌಡ (Venkatramana Gowda)", phone: "9980124020" },
  ];

  // Distribute across all callers
  let callerIdx = 0;
  let inserted = 0;

  // Multipliers to create ~160 leads across T, T+1, T+2, T+3
  const dateSlots = [
    { day: curDay, month: curMonth },
    { day: tomDay, month: tomMonth },
    { day: t2Day, month: t2Month },
    { day: t3Day, month: t3Month },
  ];

  for (let round = 0; round < 4; round++) {
    const slot = dateSlots[round % dateSlots.length];

    for (let i = 0; i < rawParents.length; i++) {
      const p = rawParents[i];
      const assigned = callerIds[callerIdx % callerIds.length];
      callerIdx++;

      const phone = `${p.phone.slice(0, 8)}${String(round).padStart(2, "0")}`;
      await client.query(`
        INSERT INTO ag_leads (
          name, parent_name, child_name, phone, dob_day, dob_month,
          stream, assigned_caller_id, status, validation_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'PARENTS', $7, 'Pending', 'UNVERIFIED', NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `, [p.child, p.parent, p.child, phone, slot.day, slot.month, assigned]);
      inserted++;
    }

    for (let i = 0; i < rawDonors.length; i++) {
      const d = rawDonors[i];
      const assigned = callerIds[callerIdx % callerIds.length];
      callerIdx++;

      const phone = `${d.phone.slice(0, 8)}${String(round).padStart(2, "0")}`;
      await client.query(`
        INSERT INTO ag_leads (
          name, phone, dob_day, dob_month,
          stream, assigned_caller_id, status, validation_status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'DIRECT_DONOR', $5, 'Pending', 'UNVERIFIED', NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `, [d.name, phone, slot.day, slot.month, assigned]);
      inserted++;
    }
  }

  console.log(`Successfully populated and distributed ${inserted} dual-stream birthday leads!`);

  const summary = await client.query(`
    SELECT assigned_caller_id, count(*) 
    FROM ag_leads 
    GROUP BY assigned_caller_id 
    ORDER BY assigned_caller_id;
  `);
  console.log("Leads assigned per caller:", summary.rows);

  await client.end();
}

seedDatabase().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
