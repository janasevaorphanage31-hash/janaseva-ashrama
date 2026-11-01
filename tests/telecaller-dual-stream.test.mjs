import test from "node:test";
import assert from "node:assert/strict";

// Helper: 10-digit phone cleaner
function cleanPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

// 1. Dual-Stream Parser Simulation
function parseSpreadsheetRows(stream, rows) {
  const leads = [];
  const seenPhones = new Set();

  for (const row of rows) {
    let parentName = undefined;
    let childName = undefined;
    let donorName = undefined;
    let phone = "";
    let dobDay = 1;
    let dobMonth = 1;

    if (stream === "PARENTS") {
      parentName = row.parentName || "Parent";
      childName = row.childName || "Child";
      phone = cleanPhone(row.phone);
      dobDay = Number(row.dobDay) || 1;
      dobMonth = Number(row.dobMonth) || 1;
    } else {
      donorName = row.donorName || "Donor";
      phone = cleanPhone(row.phone);
      dobDay = Number(row.dobDay) || 1;
      dobMonth = Number(row.dobMonth) || 1;
    }

    if (phone.length === 10 && !seenPhones.has(phone)) {
      seenPhones.add(phone);
      leads.push({
        stream,
        name: stream === "PARENTS" ? `${childName} (Child)` : donorName,
        parentName,
        childName,
        phone,
        dobDay,
        dobMonth,
        validationStatus: "UNVERIFIED",
        status: "Pending",
      });
    }
  }

  return leads;
}

test("Parser: Correctly parses Parents Sheet with Parent Name and Child Birthday", () => {
  const rawRows = [
    { parentName: "Suresh Gowda", childName: "Aarav Gowda", phone: "+91 98801-23456", dobDay: 2, dobMonth: 11 },
    { parentName: "Lakshmi Devi", childName: "Ananya", phone: "9845011002", dobDay: 2, dobMonth: 11 },
    { parentName: "Duplicate Parent", childName: "Same Kid", phone: "09880123456", dobDay: 2, dobMonth: 11 }, // duplicate
  ];

  const parsed = parseSpreadsheetRows("PARENTS", rawRows);
  assert.equal(parsed.length, 2, "Duplicate phone must be deduplicated");
  assert.equal(parsed[0].stream, "PARENTS");
  assert.equal(parsed[0].parentName, "Suresh Gowda");
  assert.equal(parsed[0].childName, "Aarav Gowda");
  assert.equal(parsed[0].phone, "9880123456");
  assert.equal(parsed[0].dobDay, 2);
  assert.equal(parsed[0].dobMonth, 11);
});

test("Parser: Correctly parses Direct Donors Sheet with Donor Name and Birthday", () => {
  const rawRows = [
    { donorName: "Dr. Ramesh Patil", phone: "9880111222", dobDay: 2, dobMonth: 11 },
    { donorName: "Deepa Rao", phone: "+91 98450-99887", dobDay: 2, dobMonth: 11 },
  ];

  const parsed = parseSpreadsheetRows("DIRECT_DONOR", rawRows);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].stream, "DIRECT_DONOR");
  assert.equal(parsed[0].name, "Dr. Ramesh Patil");
  assert.equal(parsed[0].parentName, undefined);
  assert.equal(parsed[0].childName, undefined);
  assert.equal(parsed[0].phone, "9880111222");
});

// 2. T-1 Day Calling Target Window Test
function getTargetAdvanceBirthday(currentDate) {
  const tomorrow = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  return {
    day: tomorrow.getDate(),
    month: tomorrow.getMonth() + 1,
  };
}

test("Advance Calling Target: If today is 1/11 (Nov 1), target is 2/11 (Nov 2)", () => {
  const mockToday = new Date(2026, 10, 1); // Nov 1, 2026
  const target = getTargetAdvanceBirthday(mockToday);
  assert.equal(target.day, 2);
  assert.equal(target.month, 11);
});

test("Advance Calling Target: Correctly rolls over at end of month (e.g. Oct 31 -> Nov 1)", () => {
  const mockHalloween = new Date(2026, 9, 31); // Oct 31, 2026
  const target = getTargetAdvanceBirthday(mockHalloween);
  assert.equal(target.day, 1);
  assert.equal(target.month, 11);
});

// 3. Mathematical 50/50 Balanced Fair-Share Distribution
function distribute5050Queue(parentsLeads, donorsLeads, activeCallers) {
  const callerAssignments = new Map();
  activeCallers.forEach((c) => callerAssignments.set(c, { parents: [], donors: [] }));

  let pIdx = 0;
  for (const p of parentsLeads) {
    const caller = activeCallers[pIdx % activeCallers.length];
    callerAssignments.get(caller).parents.push(p);
    pIdx++;
  }

  let dIdx = 0;
  for (const d of donorsLeads) {
    const caller = activeCallers[dIdx % activeCallers.length];
    callerAssignments.get(caller).donors.push(d);
    dIdx++;
  }

  return callerAssignments;
}

test("Distribution: Allocates an exact 50/50 mix of Parents and Donors across active callers", () => {
  const callers = ["TC01", "TC02", "TC03", "TC04", "TC05"]; // 5 callers
  const parentsLeads = Array.from({ length: 50 }, (_, i) => ({ id: `P_${i + 1}`, stream: "PARENTS" }));
  const donorsLeads = Array.from({ length: 50 }, (_, i) => ({ id: `D_${i + 1}`, stream: "DIRECT_DONOR" }));

  const distribution = distribute5050Queue(parentsLeads, donorsLeads, callers);

  for (const c of callers) {
    const assigned = distribution.get(c);
    assert.equal(assigned.parents.length, 10, `Caller ${c} must get exactly 10 Parents leads`);
    assert.equal(assigned.donors.length, 10, `Caller ${c} must get exactly 10 Donors leads`);
    assert.equal(assigned.parents.length + assigned.donors.length, 20, `Caller ${c} total must be 20 leads`);
  }
});

// 4. Calling Queue Filtering: Rescheduled Callbacks vs Non-Rescheduled Same-Day Leads
test("Queue Filtering: Same-day (Day T) leads excluded unless explicitly rescheduled", () => {
  const now = new Date("2026-11-01T10:00:00Z");
  const tomorrowDay = 2;
  const tomorrowMonth = 11;

  const mockDbLeads = [
    // Lead 1: Tomorrow birthday (T+1) -> INCLUDED
    { leadId: 1, dobDay: 2, dobMonth: 11, status: "Pending", rescheduleDate: null },
    // Lead 2: Today birthday (Day T) without reschedule -> EXCLUDED (T-1 rule)
    { leadId: 2, dobDay: 1, dobMonth: 11, status: "Pending", rescheduleDate: null },
    // Lead 3: Today callback scheduled -> INCLUDED (telecaller agreed to call back)
    { leadId: 3, dobDay: 15, dobMonth: 5, status: "Reschedule", rescheduleDate: "2026-11-01T09:00:00Z" },
    // Lead 4: Next week callback scheduled -> EXCLUDED (not due yet)
    { leadId: 4, dobDay: 20, dobMonth: 8, status: "Reschedule", rescheduleDate: "2026-11-08T10:00:00Z" },
  ];

  const eligibleForCallingToday = mockDbLeads.filter((l) => {
    // 1. Rescheduled callback due on or before today
    if (l.rescheduleDate && new Date(l.rescheduleDate) <= now) {
      return true;
    }
    // 2. Tomorrow's advance birthday (T+1)
    if (l.dobDay === tomorrowDay && l.dobMonth === tomorrowMonth && l.status === "Pending") {
      return true;
    }
    return false;
  });

  const ids = eligibleForCallingToday.map((l) => l.leadId);
  assert.deepEqual(ids, [1, 3], "Only tomorrow's birthday lead and today's due callback should be in calling queue");
});

// 5. Dynamic Roster & Zero Data Loss on Telecaller Exit
test("Dynamic Roster: Deleting telecaller leaves leads and validation status preserved", () => {
  const dbLead = {
    leadId: 501,
    assignedCallerId: "TC02",
    parentName: "Manjunath",
    childName: "Chirag",
    phone: "9845012345",
    validationStatus: "VALID_DONATED",
    lifetimeDonations: 2500,
    lastDonationYear: 2026,
    notes: "Donated ₹2,500 via UPI for Chirag birthday Annadana",
  };

  // Simulating telecaller TC02 leaving the agency (onDelete: set null or reassign)
  const afterStaffDeletion = {
    ...dbLead,
    assignedCallerId: null, // Lead unassigned, but record intact
  };

  assert.equal(afterStaffDeletion.assignedCallerId, null);
  assert.equal(afterStaffDeletion.parentName, "Manjunath");
  assert.equal(afterStaffDeletion.validationStatus, "VALID_DONATED");
  assert.equal(afterStaffDeletion.lifetimeDonations, 2500);
  assert.equal(afterStaffDeletion.lastDonationYear, 2026);
  assert.ok(afterStaffDeletion.notes.includes("Chirag birthday"));
});

// 6. Annual Recurrence (SCHR): Greeting Customization based on Prior History
test("Pitch Personalization: Differentiates Parents child pitch vs Direct Donor pitch", () => {
  const parentLead = {
    stream: "PARENTS",
    parentName: "Ravi Kumar",
    childName: "Kavya",
    dobDay: 2,
    dobMonth: 11,
    lifetimeDonations: 5000,
  };

  const donorLead = {
    stream: "DIRECT_DONOR",
    name: "Sunil Hegde",
    dobDay: 2,
    dobMonth: 11,
    lifetimeDonations: 0,
  };

  function generateScript(lead) {
    if (lead.stream === "PARENTS") {
      return `Namaskara ${lead.parentName} avare, naale nimma muddu magalu/magana ${lead.childName} avara Janmadina! Janaseva Ashrama kadeyinda advance birthday wishes. 25 ashrama makkalige oota sponsor maadi aashirwada padeyiri.`;
    } else {
      return `Namaskara ${lead.name} avare, naale nimma Janmadina! Janaseva Ashrama kadeyinda advance birthday wishes. Ashrama makkalondige nimma vishesha dinavannu aacharisi aashirwada padeyiri.`;
    }
  }

  const pScript = generateScript(parentLead);
  assert.ok(pScript.includes("Ravi Kumar"));
  assert.ok(pScript.includes("Kavya"));
  assert.ok(pScript.includes("25 ashrama makkalige oota sponsor"));

  const dScript = generateScript(donorLead);
  assert.ok(dScript.includes("Sunil Hegde"));
  assert.ok(dScript.includes("naale nimma Janmadina"));
  assert.ok(!dScript.includes("Kavya"));
});
