import test from "node:test";
import assert from "node:assert/strict";

// Helper: 10-digit phone cleaner
function cleanPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

// 1. Referral Link Generation Test
test("Referral Link: Generates valid referral URLs with telecaller ID and optional leadId", () => {
  const origin = "https://janasevaashrama.org";
  const callerId = "TC01";
  const leadId = 104;
  const amount = 2500;

  // General referral link
  const generalLink = `${origin}/give?ref=${callerId}`;
  assert.equal(generalLink, "https://janasevaashrama.org/give?ref=TC01");

  // Lead-specific WhatsApp chat link
  const leadLink = `${origin}/give?ref=${callerId}&lead_id=${leadId}&amount=${amount}`;
  assert.equal(leadLink, "https://janasevaashrama.org/give?ref=TC01&lead_id=104&amount=2500");

  const url = new URL(leadLink);
  assert.equal(url.searchParams.get("ref"), "TC01");
  assert.equal(url.searchParams.get("lead_id"), "104");
  assert.equal(url.searchParams.get("amount"), "2500");
});

// 2. Gateway Order Notes Packing
test("Gateway Notes: Properly serializes callerRefId and leadId for Razorpay notes", () => {
  const callerRefId = "TC02";
  const leadId = 205;
  const donorName = "Suresh Gowda";
  const donorPhone = "9880123456";

  const safeNotes = {};
  if (callerRefId) safeNotes.caller_ref_id = callerRefId;
  if (leadId) safeNotes.lead_id = String(leadId);
  if (donorName) safeNotes.donor_name = donorName;
  if (donorPhone) safeNotes.donor_phone = donorPhone;

  assert.equal(safeNotes.caller_ref_id, "TC02");
  assert.equal(safeNotes.lead_id, "205");
  assert.equal(safeNotes.donor_name, "Suresh Gowda");
  assert.equal(safeNotes.donor_phone, "9880123456");
});

// 3. Attribution Engine: Explicit Lead ID Attribution
test("Attribution Engine: Direct payment with leadId updates donation and lead status", () => {
  const leadsDatabase = [
    {
      leadId: 101,
      name: "Aarav (Child)",
      phone: "9880123456",
      assignedCallerId: "TC01",
      status: "Pending",
      validationStatus: "UNVERIFIED",
      lifetimeDonations: 0,
    },
    {
      leadId: 102,
      name: "Ramesh Patil",
      phone: "9845099881",
      assignedCallerId: "TC02",
      status: "Pending",
      validationStatus: "UNVERIFIED",
      lifetimeDonations: 0,
    },
  ];

  const donationsLedger = [];

  function recordPayment({ txnId, gatewayOrderId, amount, callerRefId, leadId, donorPhone }) {
    const cleanRef = callerRefId ? callerRefId.trim().toUpperCase() : null;
    let effectiveLeadId = leadId ? Number(leadId) : null;
    const cleanPhoneDigits = cleanPhone(donorPhone);

    // Fallback phone matching if leadId is omitted
    if (!effectiveLeadId && cleanPhoneDigits.length === 10) {
      const match = leadsDatabase.find(
        (l) => cleanPhone(l.phone) === cleanPhoneDigits && (!cleanRef || l.assignedCallerId === cleanRef)
      );
      if (match) {
        effectiveLeadId = match.leadId;
      }
    }

    // Insert into donations ledger
    donationsLedger.push({
      txnId,
      gatewayOrderId,
      amount,
      callerRefId: cleanRef,
      leadId: effectiveLeadId,
      donorPhone,
    });

    // Update lead record
    if (effectiveLeadId) {
      const lead = leadsDatabase.find((l) => l.leadId === effectiveLeadId);
      if (lead) {
        lead.status = "Donated";
        lead.validationStatus = "VALID_DONATED";
        lead.lifetimeDonations += amount;
      }
    }
  }

  // Simulate payment with explicit leadId
  recordPayment({
    txnId: "pay_test_001",
    gatewayOrderId: "order_test_001",
    amount: 2500,
    callerRefId: "TC01",
    leadId: 101,
    donorPhone: "9880123456",
  });

  assert.equal(donationsLedger.length, 1);
  assert.equal(donationsLedger[0].callerRefId, "TC01");
  assert.equal(donationsLedger[0].leadId, 101);

  const updatedLead101 = leadsDatabase.find((l) => l.leadId === 101);
  assert.equal(updatedLead101.status, "Donated");
  assert.equal(updatedLead101.validationStatus, "VALID_DONATED");
  assert.equal(updatedLead101.lifetimeDonations, 2500);

  // 4. Attribution Engine: Fallback Phone Matching when leadId is absent
  recordPayment({
    txnId: "pay_test_002",
    gatewayOrderId: "order_test_002",
    amount: 1500,
    callerRefId: "TC02",
    leadId: null, // Donor paid via general link ?ref=TC02 without lead_id
    donorPhone: "+91-98450-99881",
  });

  assert.equal(donationsLedger.length, 2);
  assert.equal(donationsLedger[1].callerRefId, "TC02");
  assert.equal(donationsLedger[1].leadId, 102); // Successfully matched by phone!

  const updatedLead102 = leadsDatabase.find((l) => l.leadId === 102);
  assert.equal(updatedLead102.status, "Donated");
  assert.equal(updatedLead102.validationStatus, "VALID_DONATED");
  assert.equal(updatedLead102.lifetimeDonations, 1500);
});

// 5. Leaderboard Aggregation Test
test("Leaderboard: Correctly calculates total revenue and donation count per telecaller", () => {
  const donations = [
    { callerRefId: "TC01", amount: 2500 },
    { callerRefId: "TC01", amount: 1000 },
    { callerRefId: "TC02", amount: 5000 },
    { callerRefId: "TC01", amount: 500 },
    { callerRefId: "DIRECT", amount: 2000 },
  ];

  const callerStats = {};
  for (const d of donations) {
    if (!callerStats[d.callerRefId]) {
      callerStats[d.callerRefId] = { totalRevenue: 0, donationsCount: 0 };
    }
    callerStats[d.callerRefId].totalRevenue += d.amount;
    callerStats[d.callerRefId].donationsCount += 1;
  }

  assert.equal(callerStats["TC01"].totalRevenue, 4000);
  assert.equal(callerStats["TC01"].donationsCount, 3);

  assert.equal(callerStats["TC02"].totalRevenue, 5000);
  assert.equal(callerStats["TC02"].donationsCount, 1);
});
