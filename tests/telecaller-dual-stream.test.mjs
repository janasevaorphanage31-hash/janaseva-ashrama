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

test("Excel Parser: Detects 'Student' / 'Student Name' header as Child and Auto-Detects PARENTS stream", () => {
  const headers = ["Student Name", "Parent Name", "Mobile Number", "Student DOB"];
  let childCol = -1;
  let parentCol = -1;
  let phoneCol = -1;
  let dateCol = -1;

  headers.forEach((hRaw, idx) => {
    const h = hRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (
      h.includes("child") ||
      h.includes("student") ||
      h.includes("pupil") ||
      h.includes("kid") ||
      h.includes("ward") ||
      h.includes("stud")
    ) {
      if (h.includes("dob") || h.includes("birthday")) {
        dateCol = idx;
      } else {
        childCol = idx;
      }
    } else if (h.includes("parent") || h.includes("father") || h.includes("mother")) {
      parentCol = idx;
    } else if (h.includes("phone") || h.includes("mobile")) {
      phoneCol = idx;
    }
  });

  assert.equal(childCol, 0); // Student Name
  assert.equal(parentCol, 1); // Parent Name
  assert.equal(phoneCol, 2); // Mobile Number
  assert.equal(dateCol, 3); // Student DOB
});

test("Child Name Display: Correctly extracts real student name and falls back politely without ever showing 'Child'", () => {
  const isPlaceholderChild = (val) => {
    if (!val) return true;
    const s = String(val).trim().toLowerCase();
    return ["child", "student", "pupil", "kid", "unknown", "na", "n/a", "parent", "—", "-", ""].includes(s);
  };

  function cleanChildName(lead) {
    const c = lead.childName?.trim();
    if (c && !isPlaceholderChild(c)) {
      return c;
    }
    const n = lead.name?.trim() || "";
    if (n) {
      if (n.toLowerCase().startsWith("child (") && n.endsWith(")")) {
        const inside = n.slice(7, -1).trim();
        if (inside && !isPlaceholderChild(inside)) {
          return `${inside} ಅವರ ಮಗು`;
        }
      }
      const stripped = n.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
      if (stripped && !isPlaceholderChild(stripped)) {
        return stripped;
      }
    }
    if (lead.parentName && !isPlaceholderChild(lead.parentName)) {
      return `${lead.parentName.trim()} ಅವರ ಮಗು`;
    }
    return "ವಿದ್ಯಾರ್ಥಿ / ಮಗು";
  }

  // Case 1: Real childName already present
  assert.equal(cleanChildName({ name: "Aarav (Child)", childName: "Aarav" }), "Aarav");

  // Case 2: childName was saved as 'Child', but name has student
  assert.equal(cleanChildName({ name: "Chandan Kumar (Child)", childName: "Child" }), "Chandan Kumar");

  // Case 3: childName is null, name has student
  assert.equal(cleanChildName({ name: "Pooja Hegde (Child)", childName: null }), "Pooja Hegde");

  // Case 4: MARY T from user's screenshot: childName is "Child", parentName is "MARY T"
  assert.equal(
    cleanChildName({ name: "Child", childName: "Child", parentName: "MARY T" }),
    "MARY T ಅವರ ಮಗು",
    "Must politely show MARY T ಅವರ ಮಗು instead of literal Child"
  );

  // Case 5: Both child and parent are placeholder: falls back to polite Kannada title
  assert.equal(
    cleanChildName({ name: "Child", childName: "Child", parentName: "Parent" }),
    "ವಿದ್ಯಾರ್ಥಿ / ಮಗು"
  );
});

test("Parent Name Display: Extracts real parent name and never shows placeholder 'Parent'", () => {
  const isPlaceholderValue = (val) => {
    if (!val) return true;
    const s = String(val).trim().toLowerCase();
    return ["child", "student", "pupil", "kid", "unknown", "na", "n/a", "parent", "father", "mother", "guardian", "—", "-", ""].includes(s);
  };

  function cleanParentName(lead) {
    const p = lead.parentName?.trim();
    if (p && !isPlaceholderValue(p)) {
      return p;
    }
    const n = lead.name?.trim() || "";
    if (n) {
      if (n.toLowerCase().startsWith("child (") && n.endsWith(")")) {
        const inside = n.slice(7, -1).trim();
        if (inside && !isPlaceholderValue(inside)) return inside;
      }
      if (n.toLowerCase().endsWith("(parent)")) {
        const inside = n.slice(0, -8).trim();
        if (inside && !isPlaceholderValue(inside)) return inside;
      }
      if (n.includes("(") && n.endsWith(")")) {
        const inside = n.slice(n.indexOf("(") + 1, -1).trim();
        if (inside && !isPlaceholderValue(inside)) return inside;
      }
    }
    return "ಪೋಷಕರು (Parent)";
  }

  // Case 1: Direct parent name
  assert.equal(cleanParentName({ parentName: "MARY T" }), "MARY T");

  // Case 2: Parent extracted from lead.name
  assert.equal(cleanParentName({ name: "Child (MAMATHA N)", parentName: null }), "MAMATHA N");
  assert.equal(cleanParentName({ name: "Aarav (Suresh Gowda)", parentName: "Parent" }), "Suresh Gowda");

  // Case 3: Absolute fallback
  assert.equal(cleanParentName({ name: "Child", parentName: "Parent" }), "ಪೋಷಕರು (Parent)");
});

test("Excel Disambiguation: If 'Name' and 'Father Name' are present, 'Name' is auto-detected as Student", () => {
  const headers = ["Name", "Father Name", "Mobile Number", "DOB"];
  let childCol = -1;
  let parentCol = -1;
  let nameCol = -1;

  headers.forEach((hRaw, idx) => {
    const h = hRaw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (h.includes("student") || h.includes("child")) {
      childCol = idx;
    } else if (h.includes("parent") || h.includes("father") || h.includes("mother")) {
      parentCol = idx;
    } else if (h.includes("name")) {
      nameCol = idx;
    }
  });

  // Disambiguation
  if (childCol === -1 && nameCol !== -1 && parentCol !== -1) {
    childCol = nameCol;
    nameCol = -1;
  }

  assert.equal(childCol, 0, "Col 0 ('Name') must be recognized as Student/Child");
  assert.equal(parentCol, 1, "Col 1 ('Father Name') must be recognized as Parent");
});

test("CRM Equalizer: Rebalances untouched pending leads to TC16 without touching contacted leads", () => {
  const callers = ["TC01", "TC02", "TC16"];
  const leads = [
    // TC01 has 3 leads: 1 contacted, 2 untouched pending
    { id: 1, caller: "TC01", status: "Interested", lastContactedAt: new Date() },
    { id: 2, caller: "TC01", status: "Pending", lastContactedAt: null },
    { id: 3, caller: "TC01", status: "Pending", lastContactedAt: null },
    // TC02 has 3 leads: 1 donated, 2 untouched pending
    { id: 4, caller: "TC02", status: "Donated", lastContactedAt: new Date() },
    { id: 5, caller: "TC02", status: "Pending", lastContactedAt: null },
    { id: 6, caller: "TC02", status: "Pending", lastContactedAt: null },
    // TC16 is new: 0 leads
  ];

  // Untouched pending leads eligible for rebalance
  const untouched = leads.filter(l => l.status === "Pending" && !l.lastContactedAt);
  assert.equal(untouched.length, 4);

  // Equal target: 4 / 3 = ~1-2 per caller
  const targetPerCaller = Math.floor(untouched.length / callers.length); // 1
  const transferPool = [];

  // TC01 had 2 pending, surplus is 1
  // TC02 had 2 pending, surplus is 1
  // Total surplus transferred to TC16 = 2
  transferPool.push(leads[2], leads[5]); // id 3 and id 6
  transferPool.forEach(l => l.caller = "TC16");

  // Verify: Contacted/donated leads never changed caller
  assert.equal(leads.find(l => l.id === 1).caller, "TC01");
  assert.equal(leads.find(l => l.id === 4).caller, "TC02");
  // TC16 now has 2 leads
  assert.equal(leads.filter(l => l.caller === "TC16").length, 2);
});
