import test from "node:test";
import assert from "node:assert/strict";

test("T+2 Birthday calculation matches exactly day after tomorrow", () => {
  const now = new Date();
  const curDay = now.getDate();
  const curMonth = now.getMonth() + 1;

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDay = tomorrow.getDate();
  const tomorrowMonth = tomorrow.getMonth() + 1;

  const t2 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const t2Day = t2.getDate();
  const t2Month = t2.getMonth() + 1;

  assert.ok(t2Day >= 1 && t2Day <= 31);
  assert.ok(t2Month >= 1 && t2Month <= 12);

  // Simulated lead sample
  const sampleLeads = [
    { leadId: 101, name: "Today Lead", dobDay: curDay, dobMonth: curMonth, status: "Pending" },
    { leadId: 102, name: "Tomorrow Lead", dobDay: tomorrowDay, dobMonth: tomorrowMonth, status: "Pending" },
    { leadId: 103, name: "T2 Lead", dobDay: t2Day, dobMonth: t2Month, status: "Pending" },
    { leadId: 104, name: "Future Lead", dobDay: ((t2Day + 5) % 28) + 1, dobMonth: t2Month, status: "Pending" },
  ];

  const t2Matches = sampleLeads.filter((l) => l.dobDay === t2Day && l.dobMonth === t2Month);
  assert.equal(t2Matches.length, 1);
  assert.equal(t2Matches[0].leadId, 103);
});

test("remainingPending zero-skipping logic selects next subsequent pending lead correctly", () => {
  const filteredLeads = [
    { leadId: 1, status: "Pending" },
    { leadId: 2, status: "Pending" },
    { leadId: 3, status: "Pending" },
    { leadId: 4, status: "Pending" },
  ];

  // Simulating marking leadId 2 as Interested
  const currentLeadId = 2;
  const currentIdx = filteredLeads.findIndex((l) => l.leadId === currentLeadId);
  assert.equal(currentIdx, 1);

  const remainingPending = filteredLeads.filter(
    (l) => l.leadId !== currentLeadId && (!l.status || l.status === "Pending")
  );
  assert.equal(remainingPending.length, 3);

  // Find candidate after currentIdx in original array
  const afterCurrent = remainingPending.find((l) => {
    const idx = filteredLeads.findIndex((fl) => fl.leadId === l.leadId);
    return idx > currentIdx;
  });

  const nextLeadId = afterCurrent ? afterCurrent.leadId : remainingPending[0].leadId;
  // Must advance to 3 without skipping to 4!
  assert.equal(nextLeadId, 3);
});

test("remainingPending handles last element wrapping to first remaining pending lead", () => {
  const filteredLeads = [
    { leadId: 1, status: "Pending" },
    { leadId: 2, status: "Pending" },
    { leadId: 3, status: "Pending" },
  ];

  // Marking the last lead (leadId 3)
  const currentLeadId = 3;
  const currentIdx = filteredLeads.findIndex((l) => l.leadId === currentLeadId);
  assert.equal(currentIdx, 2);

  const remainingPending = filteredLeads.filter(
    (l) => l.leadId !== currentLeadId && (!l.status || l.status === "Pending")
  );

  const afterCurrent = remainingPending.find((l) => {
    const idx = filteredLeads.findIndex((fl) => fl.leadId === l.leadId);
    return idx > currentIdx;
  });

  const nextLeadId = afterCurrent ? afterCurrent.leadId : remainingPending[0].leadId;
  // Wraps around to 1
  assert.equal(nextLeadId, 1);
});

test("Safe resume guard ignores already attended leads in localStorage and defaults to first pending", () => {
  const leadItems = [
    { leadId: 10, status: "Contacted" },
    { leadId: 20, status: "Donated" },
    { leadId: 30, status: "Pending" },
    { leadId: 40, status: "Pending" },
  ];

  // Saved lead was 10 (which is now Contacted)
  const savedLastLead = "10";
  let activeFocusLeadId = null;

  const num = Number(savedLastLead);
  const targetLead = leadItems.find((l) => l.leadId === num);
  if (targetLead && (!targetLead.status || targetLead.status === "Pending")) {
    activeFocusLeadId = num;
  }

  // Target was not restored because it is Contacted!
  assert.equal(activeFocusLeadId, null);

  // Fallback to first pending lead
  const firstPending = leadItems.find((l) => !l.status || l.status === "Pending");
  assert.ok(firstPending);
  assert.equal(firstPending.leadId, 30);
});

test("Telephony dispositions validation includes Wrong_Number, Not_Reachable, RNR", () => {
  const VALID_DISPOSITIONS = [
    "Interested",
    "Reschedule",
    "Rejected",
    "Pending",
    "Donated",
    "No_Answer",
    "Contacted",
    "Busy",
    "Invalid_Number",
    "Wrong_Number",
    "Not_Reachable",
    "RNR",
  ];

  assert.ok(VALID_DISPOSITIONS.includes("Wrong_Number"));
  assert.ok(VALID_DISPOSITIONS.includes("Not_Reachable"));
  assert.ok(VALID_DISPOSITIONS.includes("RNR"));
  assert.ok(VALID_DISPOSITIONS.includes("No_Answer"));
  assert.ok(VALID_DISPOSITIONS.includes("Busy"));
  assert.ok(VALID_DISPOSITIONS.includes("Interested"));
  assert.ok(VALID_DISPOSITIONS.includes("Rejected"));
  assert.ok(VALID_DISPOSITIONS.includes("Donated"));
});

test("Validation status mappings properly categorizes junk and soft rejects", () => {
  const getValidationStatus = (disposition) => {
    if (disposition === "Donated") return "VALID_DONATED";
    if (disposition === "Interested") return "VALID_INTERESTED";
    if (disposition === "Reschedule") return "VALID_CALLBACK";
    if (disposition === "Rejected" || disposition === "Not Interested") return "SOFT_REJECT";
    if (
      disposition === "Wrong_Number" ||
      disposition === "Invalid_Number" ||
      disposition === "Junk" ||
      disposition === "Invalid"
    ) {
      return "JUNK_INVALID";
    }
    return "UNVERIFIED";
  };

  assert.equal(getValidationStatus("Wrong_Number"), "JUNK_INVALID");
  assert.equal(getValidationStatus("Invalid_Number"), "JUNK_INVALID");
  assert.equal(getValidationStatus("Rejected"), "SOFT_REJECT");
  assert.equal(getValidationStatus("Interested"), "VALID_INTERESTED");
  assert.equal(getValidationStatus("Donated"), "VALID_DONATED");
  assert.equal(getValidationStatus("Not_Reachable"), "UNVERIFIED");
  assert.equal(getValidationStatus("No_Answer"), "UNVERIFIED");
});


test("Direct Donor stream filtering matches DIRECT_DONOR and DIRECT_DONORS and never misclassifies direct donors with parentheses as parents", () => {
  const isParent = (l) => l.stream === "PARENTS" || (l.stream !== "DIRECT_DONOR" && l.stream !== "DIRECT_DONORS" && Boolean(l.parentName || l.childName));

  const sampleLeads = [
    { leadId: 1, name: "ಡಾ. ಚಂದ್ರಶೇಖರ್ ಎಚ್. (Dr. Chandrashekar H.)", stream: "DIRECT_DONOR", parentName: null, childName: null },
    { leadId: 2, name: "ಗಾಯತ್ರಿ ರಾಮನಾಥನ್ (Gayatri Ramanathan)", stream: "DIRECT_DONORS", parentName: null, childName: null },
    { leadId: 3, name: "ಆರವ್ ಶರ್ಮಾ (Aarav Sharma)", stream: "PARENTS", parentName: "ಮಹೇಶ್ ಶರ್ಮಾ", childName: "ಆರವ್ ಶರ್ಮಾ" },
    { leadId: 4, name: "ಅನ್ವಿತಾ ಗೌಡ (Anvitha Gowda)", stream: "PARENTS", parentName: "ರಮೇಶ್ ಗೌಡ", childName: "ಅನ್ವಿತಾ ಗೌಡ" },
  ];

  assert.equal(isParent(sampleLeads[0]), false);
  assert.equal(isParent(sampleLeads[1]), false);
  assert.equal(isParent(sampleLeads[2]), true);
  assert.equal(isParent(sampleLeads[3]), true);

  // When streamFilter is DIRECT_DONOR:
  const directDonors = sampleLeads.filter((l) => !isParent(l));
  assert.equal(directDonors.length, 2);
  assert.equal(directDonors[0].leadId, 1);
  assert.equal(directDonors[1].leadId, 2);
});

test("Direct Donor sheet displays tomorrow's birthday data under Tomorrow_Birthday tab", () => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDay = tomorrow.getDate();
  const tomorrowMonth = tomorrow.getMonth() + 1;

  const leads = [
    { leadId: 10, name: "Donor Tomorrow", stream: "DIRECT_DONOR", dobDay: tomorrowDay, dobMonth: tomorrowMonth, status: "Pending" },
    { leadId: 11, name: "Donor Next Week", stream: "DIRECT_DONOR", dobDay: ((tomorrowDay + 7) % 28) + 1, dobMonth: tomorrowMonth, status: "Pending" },
    { leadId: 12, name: "Parent Tomorrow", stream: "PARENTS", parentName: "Father", childName: "Kid", dobDay: tomorrowDay, dobMonth: tomorrowMonth, status: "Pending" },
  ];

  const streamFilter = "DIRECT_DONOR";
  const filter = "Tomorrow_Birthday";

  const isParent = (l) => l.stream === "PARENTS" || (l.stream !== "DIRECT_DONOR" && l.stream !== "DIRECT_DONORS" && Boolean(l.parentName || l.childName));

  const filtered = leads.filter((l) => {
    const parent = isParent(l);
    if (streamFilter === "DIRECT_DONOR" && parent) return false;
    if (streamFilter === "PARENTS" && !parent) return false;
    if (filter === "Tomorrow_Birthday") {
      return l.dobDay === tomorrowDay && l.dobMonth === tomorrowMonth;
    }
    return true;
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].leadId, 10);
  assert.equal(filtered[0].name, "Donor Tomorrow");
});
