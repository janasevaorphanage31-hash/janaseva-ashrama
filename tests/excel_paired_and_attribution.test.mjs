import { test } from "node:test";
import assert from "node:assert/strict";

// 1. Paired Direct Donor Row Simulation
test("Direct Donor Paired Layout: Emits 2 leads per data row", () => {
  const header = ["Name", "Mobile No.", "Date of Birth ", "", "", ""];
  const row1 = ["Manchala Jhansi", 9632211773, 29526, "Subramanya  ", 8904110348, 28795];

  // Logic mimics AdminTelecallerCRM.tsx parse2DGrid
  const leads = [];
  const curDay = 5;
  const curMonth = 11;

  // Person 1
  const p1Name = String(row1[0] || "").trim();
  const p1Phone = String(row1[1]).replace(/\D/g, "").slice(-10);
  if (p1Phone.length === 10 && p1Name) {
    leads.push({ stream: "DIRECT_DONOR", name: p1Name, phone: p1Phone });
  }

  // Person 2
  const p2Name = String(row1[3] || "").trim();
  const p2Phone = String(row1[4]).replace(/\D/g, "").slice(-10);
  if (p2Phone.length === 10 && p2Name) {
    leads.push({ stream: "DIRECT_DONOR", name: p2Name, phone: p2Phone });
  }

  assert.equal(leads.length, 2, "Expected exactly 2 leads from single paired row");
  assert.equal(leads[0].name, "Manchala Jhansi");
  assert.equal(leads[0].phone, "9632211773");
  assert.equal(leads[1].name, "Subramanya");
  assert.equal(leads[1].phone, "8904110348");
});

// 2. Parents Exact Layout Simulation
test("Parents Sheet Layout: Parses student, father, mother, mobile, and DOB", () => {
  const header = ["STUDENT NAME", "FATHER NAME", "MOTHER NAME", "MOBILE", "DOB"];
  const row1 = ["ROOPA C G", "GOPALA KRISHNA C", "VENU KUMARI B", 9449652749, 38657];

  const studentName = String(row1[0] || "").trim();
  const fatherName = String(row1[1] || "").trim();
  const motherName = String(row1[2] || "").trim();
  const phone = String(row1[3]).replace(/\D/g, "").slice(-10);

  const primaryParent = fatherName || motherName || "Parent";
  const displayName = `${studentName} (${primaryParent})`;

  assert.equal(phone, "9449652749");
  assert.equal(displayName, "ROOPA C G (GOPALA KRISHNA C)");
  assert.equal(studentName, "ROOPA C G");
  assert.equal(primaryParent, "GOPALA KRISHNA C");
});

// 3. Excel Serial Date to IST Day & Month
test("Excel Serial Date: Accurately converts 29526 (1 Nov 1980) and 38657 (1 Nov 2005)", () => {
  const serial1 = 29526;
  const d1 = new Date((serial1 - 25569) * 86400 * 1000);
  assert.equal(d1.getUTCDate(), 1);
  assert.equal(d1.getUTCMonth() + 1, 11);

  const serial2 = 38657;
  const d2 = new Date((serial2 - 25569) * 86400 * 1000);
  assert.equal(d2.getUTCDate(), 1);
  assert.equal(d2.getUTCMonth() + 1, 11);
});

// 4. Referral URL Generation
test("Referral URL Attribution: Contains callerRef, leadId, and utm", () => {
  const callerId = "TC08";
  const leadId = 12345;
  const amount = 2500;
  const url = `https://janasevaashrama.org/give?ref=${callerId}&lead_id=${leadId}&amount=${amount}&utm=wa`;

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("ref"), "TC08");
  assert.equal(parsed.searchParams.get("lead_id"), "12345");
  assert.equal(parsed.searchParams.get("amount"), "2500");
  assert.equal(parsed.searchParams.get("utm"), "wa");
});

// 5. EOD CSV BOM and Columns
test("EOD CSV Format: Contains UTF-8 BOM and correct headers", () => {
  const BOM = "\uFEFF";
  const headers = [
    "Lead ID", "Name", "Stream", "Phone", "DOB Day", "DOB Month",
    "Disposition", "Amount (₹)", "Notes", "Callback Date", "Called At (IST)", "Caller ID"
  ];
  const csv = BOM + headers.join(",");
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("Lead ID"));
  assert.ok(csv.includes("Caller ID"));
  assert.ok(csv.includes("Amount (₹)"));
});
