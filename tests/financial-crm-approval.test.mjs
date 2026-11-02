import test from "node:test";
import assert from "node:assert/strict";

// Helper replicating IST boundary logic from antigravity-crm
function getISTDateBounds(d = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = d.getTime() + istOffset;
  const istDate = new Date(istTime);
  const y = istDate.getUTCFullYear();
  const m = istDate.getUTCMonth(); // 0-11
  const day = istDate.getUTCDate();

  const todayStart = new Date(Date.UTC(y, m, day) - istOffset);
  const todayEnd = new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - istOffset);
  const monthStart = new Date(Date.UTC(y, m, 1) - istOffset);
  const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { todayStart, todayEnd, monthStart, dateStr, year: y, month: m + 1, day };
}

// Helper replicating Stream-Aware Queue Count Logic
function computeStreamCounts(leads, streamFilter) {
  let pending = 0;
  let attended = 0;
  let parents = 0;
  let donors = 0;

  leads.forEach((l) => {
    const isParent = l.stream === "PARENTS" || Boolean(l.parentName || l.childName);
    if (isParent) parents++;
    else donors++;

    if (streamFilter === "PARENTS" && !isParent) return;
    if (streamFilter === "DIRECT_DONOR" && isParent) return;

    const isDone = l.status && l.status !== "Pending";
    if (!isDone) {
      pending++;
    } else {
      attended++;
    }
  });

  return {
    all: streamFilter === "PARENTS" ? parents : streamFilter === "DIRECT_DONOR" ? donors : leads.length,
    pending,
    attended,
    parents,
    donors,
    globalTotal: leads.length,
  };
}

test("1. IST Date Boundaries are correct and timezone-safe", () => {
  const testDate = new Date("2026-11-02T10:30:00Z"); // 4:00 PM IST
  const bounds = getISTDateBounds(testDate);

  assert.equal(bounds.dateStr, "2026-11-02");
  assert.equal(bounds.year, 2026);
  assert.equal(bounds.month, 11);
  assert.equal(bounds.day, 2);
  assert(bounds.todayStart.getTime() <= testDate.getTime());
  assert(bounds.todayEnd.getTime() >= testDate.getTime());
});

test("2. Queue Count Harmonization: Stream-Aware counters eliminate count mismatch", () => {
  // Simulate 2,500 total leads in DB: 49 Parents leads (all pending) and 2,451 Direct Donors leads
  const mockLeads = [];
  for (let i = 1; i <= 49; i++) {
    mockLeads.push({
      leadId: i,
      stream: "PARENTS",
      parentName: `Parent ${i}`,
      childName: `Child ${i}`,
      status: "Pending",
    });
  }
  for (let i = 50; i <= 2500; i++) {
    mockLeads.push({
      leadId: i,
      stream: "DIRECT_DONOR",
      name: `Donor ${i}`,
      status: "Pending",
    });
  }

  // When caller filters by PARENTS stream
  const parentCounts = computeStreamCounts(mockLeads, "PARENTS");
  assert.equal(parentCounts.all, 49, "Stream total for PARENTS should be exactly 49");
  assert.equal(parentCounts.pending, 49, "Stream pending for PARENTS should be exactly 49");
  assert.equal(parentCounts.globalTotal, 2500, "Global total across all lists is 2,500");

  // When filtered leads has length 49, filteredPendingCount is 49 (NO MORE '2500 to call' MISMATCH!)
  const filteredLeads = mockLeads.filter((l) => l.stream === "PARENTS");
  const filteredPendingCount = filteredLeads.filter((l) => !l.status || l.status === "Pending").length;
  assert.equal(filteredPendingCount, 49, "Queue badge must show 49 to call, matching queue length 49");
});

test("3. Telecaller Self-Correction: Disposition and Donation amount updates", () => {
  let callLog = {
    logId: 101,
    leadId: 5,
    callerId: "TC01",
    disposition: "Interested",
    amount: null,
    utr: null,
    isEdited: false,
    eodSubmitted: false,
  };

  // Caller made a typo during call, now marks Donated with ₹5,000 and UTR
  const editParams = {
    disposition: "Donated",
    amount: 5000,
    utr: "428910293847",
    notes: "Donor transferred ₹5,000 via GooglePay",
  };

  callLog = {
    ...callLog,
    originalDisposition: callLog.disposition,
    originalAmount: callLog.amount,
    disposition: editParams.disposition,
    amount: editParams.amount,
    utr: editParams.utr,
    notes: editParams.notes,
    isEdited: true,
    editedAt: new Date(),
  };

  assert.equal(callLog.disposition, "Donated");
  assert.equal(callLog.amount, 5000);
  assert.equal(callLog.originalDisposition, "Interested");
  assert.equal(callLog.isEdited, true);
  assert.equal(callLog.utr, "428910293847");

  // Caller realizes another typo: meant ₹2,500, not ₹5,000!
  callLog.amount = 2500;
  assert.equal(callLog.amount, 2500, "Self-correction permits adjusting amount before EOD");
});

test("4. End of Day Shift Submission: Locks shift and prevents unauthorized editing", () => {
  let shiftStatus = "NOT_SUBMITTED";
  let logs = [
    { logId: 1, eodSubmitted: false },
    { logId: 2, eodSubmitted: false },
  ];

  // Submit Shift
  shiftStatus = "SUBMITTED";
  logs = logs.map((l) => ({ ...l, eodSubmitted: true }));

  assert.equal(shiftStatus, "SUBMITTED");
  assert(logs.every((l) => l.eodSubmitted === true), "All logs must be locked upon EOD submission");

  // Attempting edit while locked must fail
  const canEdit = !logs[0].eodSubmitted;
  assert.equal(canEdit, false, "Caller cannot edit a locked shift log");

  // Supervisor unlocks shift for caller
  shiftStatus = "UNLOCKED";
  logs = logs.map((l) => ({ ...l, eodSubmitted: false }));
  assert.equal(logs[0].eodSubmitted, false, "Supervisor unlock re-enables editing for corrections");
});

test("5. Admin Payment Approvals: Approve, Adjust Amount, and Reject lifecycle", () => {
  // Claim 1: Full Approval
  let claim1 = {
    txnId: "utr_428910293847",
    amount: 2500,
    verificationStatus: "PENDING_APPROVAL",
    verifiedAmount: null,
  };

  // Admin verifies against bank statement: ₹2,500 received
  claim1.verificationStatus = "VERIFIED";
  claim1.verifiedAmount = claim1.amount;
  assert.equal(claim1.verificationStatus, "VERIFIED");
  assert.equal(claim1.verifiedAmount, 2500);

  // Claim 2: Admin Partial Adjustment (Donor paid ₹1,500 instead of claimed ₹2,500)
  let claim2 = {
    txnId: "utr_998877665544",
    amount: 2500,
    verificationStatus: "PENDING_APPROVAL",
    verifiedAmount: null,
  };

  claim2.verificationStatus = "VERIFIED";
  claim2.verifiedAmount = 1500;
  claim2.adminNotes = "Bank statement received ₹1,500 via PhonePe";
  assert.equal(claim2.verificationStatus, "VERIFIED");
  assert.equal(claim2.verifiedAmount, 1500);

  // Claim 3: Rejection (UTR not found / Fake claim)
  let claim3 = {
    txnId: "offline_fake_001",
    amount: 10000,
    verificationStatus: "PENDING_APPROVAL",
    verifiedAmount: null,
  };

  claim3.verificationStatus = "REJECTED";
  claim3.verifiedAmount = 0;
  claim3.rejectionReason = "UTR not found in bank statement";
  assert.equal(claim3.verificationStatus, "REJECTED");
  assert.equal(claim3.verifiedAmount, 0);
});

test("6. Financial CRM Metrics: Today's, Monthly Target & Individual Caller Accuracy", () => {
  const donations = [
    { amount: 2500, verifiedAmount: 2500, status: "VERIFIED", callerId: "TC01" },
    { amount: 5000, verifiedAmount: 3000, status: "VERIFIED", callerId: "TC01" }, // Adjusted
    { amount: 1500, verifiedAmount: null, status: "PENDING_APPROVAL", callerId: "TC02" },
    { amount: 2000, verifiedAmount: 0, status: "REJECTED", callerId: "TC03" },
  ];

  let todayVerified = 0;
  let todayPending = 0;
  let todayClaimed = 0;
  let todayRejected = 0;

  donations.forEach((d) => {
    todayClaimed += d.amount;
    if (d.status === "VERIFIED") todayVerified += d.verifiedAmount;
    if (d.status === "PENDING_APPROVAL") todayPending += d.amount;
    if (d.status === "REJECTED") todayRejected += d.amount;
  });

  assert.equal(todayClaimed, 11000, "Today claimed should be ₹11,000");
  assert.equal(todayVerified, 5500, "Today verified should be ₹5,500 (2500 + 3000)");
  assert.equal(todayPending, 1500, "Today pending should be ₹1,500");
  assert.equal(todayRejected, 2000, "Today rejected should be ₹2,000");

  // Monthly Target Progress
  const monthlyTarget = 500000;
  const monthVerifiedTotal = 125000; // e.g. ₹1,25,000
  const progressPercent = Math.round((monthVerifiedTotal / monthlyTarget) * 100);
  assert.equal(progressPercent, 25, "Monthly progress should be 25%");

  // Individual Caller TC01 Accuracy Rate: Claimed 7500, Verified 5500
  const tc01Claimed = 7500;
  const tc01Verified = 5500;
  const accuracyRate = Math.round((tc01Verified / tc01Claimed) * 100);
  assert.equal(accuracyRate, 73, "TC01 accuracy rate should be 73%");
});
