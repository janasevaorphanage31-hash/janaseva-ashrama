import test from "node:test";
import assert from "node:assert/strict";

// ── Search & Filter Logic Under Test (Mirroring TelecallerPortal.tsx) ──
function normalizePhoneForSearch(phone) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

function filterAndSortLeads(leads, filter, searchQuery, sortOrder) {
  const q = searchQuery.trim().toLowerCase();
  const qDigits = normalizePhoneForSearch(q);

  let filtered = leads.filter((l) => {
    // 1. Search Query Match
    let matchesSearch = true;
    if (q) {
      const nameMatch = l.name?.toLowerCase().includes(q);
      const childMatch = l.childName?.toLowerCase().includes(q);
      const parentMatch = l.parentName?.toLowerCase().includes(q);
      const notesMatch = l.notes?.toLowerCase().includes(q);
      const reasonMatch = l.dispositionReason?.toLowerCase().includes(q);

      // Phone match: direct or normalized digit search
      const phoneDigits = normalizePhoneForSearch(l.phone);
      const waDigits = normalizePhoneForSearch(l.whatsappPhone);

      const phoneMatch =
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (qDigits.length >= 3 && phoneDigits.includes(qDigits));

      const waMatch =
        (l.whatsappPhone && l.whatsappPhone.toLowerCase().includes(q)) ||
        (qDigits.length >= 3 && waDigits.includes(qDigits));

      matchesSearch = Boolean(
        nameMatch ||
        childMatch ||
        parentMatch ||
        notesMatch ||
        reasonMatch ||
        phoneMatch ||
        waMatch
      );
    }

    // 2. Filter Tab Match (Crucial: When searching, bypass tab filter to surface leads across ALL states)
    if (q) {
      return matchesSearch;
    }

    if (filter === "Pending") {
      return !l.status || l.status === "Pending";
    }
    if (filter === "Interested") {
      return l.status === "Interested";
    }
    if (filter === "Donated") {
      return l.status === "Donated";
    }
    if (filter === "Reschedule") {
      return l.status === "Reschedule";
    }
    if (filter === "Attended") {
      return l.status && l.status !== "Pending";
    }
    return true; // "ALL"
  });

  // 3. Sorting
  return [...filtered].sort((a, b) => {
    if (sortOrder === "interested_first") {
      const aInt = a.status === "Interested" ? 1 : 0;
      const bInt = b.status === "Interested" ? 1 : 0;
      if (aInt !== bInt) return bInt - aInt;
    } else if (sortOrder === "donated_amount_desc") {
      const aAmt = a.amount || 0;
      const bAmt = b.amount || 0;
      if (aAmt !== bAmt) return bAmt - aAmt;
    } else if (sortOrder === "name_asc") {
      return (a.name || "").localeCompare(b.name || "");
    }
    return (a.leadId || 0) - (b.leadId || 0);
  });
}

// ── WhatsApp Link Routing Logic Under Test (Mirroring antigravity-crm.ts & TelecallerPortal.tsx) ──
function resolveWhatsAppNumber(lead) {
  const targetNumber = (lead.whatsappPhone && lead.whatsappPhone.trim())
    ? lead.whatsappPhone.trim()
    : lead.phone;

  const rawDigits = targetNumber.replace(/\D/g, "");
  let cleaned = rawDigits;
  if (rawDigits.length === 10) {
    cleaned = `91${rawDigits}`;
  } else if (rawDigits.length === 11 && rawDigits.startsWith("0")) {
    cleaned = `91${rawDigits.slice(1)}`;
  } else if (rawDigits.length === 12 && rawDigits.startsWith("91")) {
    cleaned = rawDigits;
  }
  return cleaned;
}

// ── Revert / Mistake Correction Logic Under Test ──
function revertLeadRecord(lead) {
  return {
    ...lead,
    status: "Pending",
    validationStatus: "UNVERIFIED",
    rescheduleDate: null,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TEST CASES
// ═════════════════════════════════════════════════════════════════════════════

test("1. Phone Normalization: strips spaces, +91, leading 0, and dashes for uniform 10-digit matching", () => {
  assert.equal(normalizePhoneForSearch("+91 98450-12345"), "9845012345");
  assert.equal(normalizePhoneForSearch("098450 12345"), "9845012345");
  assert.equal(normalizePhoneForSearch("9845012345"), "9845012345");
  assert.equal(normalizePhoneForSearch("+919845012345"), "9845012345");
});

test("2. Smart Search: matches leads by formatted calling phone, raw digits, or partial 3+ digits", () => {
  const leads = [
    { leadId: 1, name: "Ramesh Kumar", phone: "+91 98450-12345", status: "Pending" },
    { leadId: 2, name: "Suresh Gowda", phone: "080 2345-6789", status: "Pending" },
  ];

  // Search by plain 10 digits
  const res1 = filterAndSortLeads(leads, "Pending", "9845012345", "default");
  assert.equal(res1.length, 1);
  assert.equal(res1[0].leadId, 1);

  // Search with +91
  const res2 = filterAndSortLeads(leads, "Pending", "+91 98450", "default");
  assert.equal(res2.length, 1);
  assert.equal(res2[0].leadId, 1);

  // Search by partial 4 digits
  const res3 = filterAndSortLeads(leads, "Pending", "2345", "default");
  assert.equal(res3.length, 2); // Matches both 12345 and 2345-6789
});

test("3. Smart Search: searches across Child Name, Parent Name, Notes, and Reason", () => {
  const leads = [
    {
      leadId: 10,
      name: "Student A",
      childName: "Aarav Sharma",
      parentName: "Mahesh Sharma",
      phone: "9845011111",
      notes: "Likes Annadana Seva",
      dispositionReason: "ಆಶ್ರಮಕ್ಕೆ ನೇರ ಭೇಟಿ",
      status: "Pending",
    },
    {
      leadId: 11,
      name: "Pooja Hegde",
      phone: "9845022222",
      notes: "Busy in meeting",
      dispositionReason: "ಆರ್ಥಿಕ ಸಮಸ್ಯೆ",
      status: "Pending",
    },
  ];

  // Match by Child Name
  const r1 = filterAndSortLeads(leads, "Pending", "Aarav", "default");
  assert.equal(r1.length, 1);
  assert.equal(r1[0].leadId, 10);

  // Match by Parent Name
  const r2 = filterAndSortLeads(leads, "Pending", "Mahesh", "default");
  assert.equal(r2.length, 1);
  assert.equal(r2[0].leadId, 10);

  // Match by Disposition Reason
  const r3 = filterAndSortLeads(leads, "Pending", "ಆರ್ಥಿಕ ಸಮಸ್ಯೆ", "default");
  assert.equal(r3.length, 1);
  assert.equal(r3[0].leadId, 11);
});

test("4. Global Tab Bypass: active search finds leads even if on 'Pending' tab and lead is 'Donated' or 'Attended'", () => {
  const leads = [
    { leadId: 101, name: "Harish Rao", phone: "9845000001", status: "Pending" },
    { leadId: 102, name: "Girish Bhat", phone: "9845000002", status: "Donated", amount: 2500 },
    { leadId: 103, name: "Venkatesh", phone: "9845000003", status: "Interested" },
  ];

  // On Pending tab without search: only lead 101 surfaces
  const pendingOnly = filterAndSortLeads(leads, "Pending", "", "default");
  assert.equal(pendingOnly.length, 1);
  assert.equal(pendingOnly[0].leadId, 101);

  // On Pending tab WITH search for "Girish" (who is Donated): bypasses tab and surfaces Girish!
  const searched = filterAndSortLeads(leads, "Pending", "Girish", "default");
  assert.equal(searched.length, 1);
  assert.equal(searched[0].leadId, 102);
  assert.equal(searched[0].status, "Donated");
});

test("5. Case 1: Alternate WhatsApp Number takes precedence for WhatsApp dispatches", () => {
  const leadWithAlternateWA = {
    leadId: 201,
    name: "Dr. Ananya",
    phone: "9845012345", // Calling number
    whatsappPhone: "9880099887", // Different WhatsApp number
  };

  const leadWithoutAlternateWA = {
    leadId: 202,
    name: "Pradeep",
    phone: "+91 9845054321",
    whatsappPhone: null,
  };

  // Uses secondary WhatsApp number
  assert.equal(resolveWhatsAppNumber(leadWithAlternateWA), "919880099887");

  // Fallback to calling number when whatsappPhone is null
  assert.equal(resolveWhatsAppNumber(leadWithoutAlternateWA), "919845054321");
});

test("6. Smart Search matches alternate WhatsApp phone number", () => {
  const leads = [
    {
      leadId: 301,
      name: "Sunil Kumar",
      phone: "9845000000",
      whatsappPhone: "9916055555",
      status: "Pending",
    },
  ];

  // Search by calling phone
  const r1 = filterAndSortLeads(leads, "Pending", "9845000000", "default");
  assert.equal(r1.length, 1);

  // Search by alternate WhatsApp phone
  const r2 = filterAndSortLeads(leads, "Pending", "9916055555", "default");
  assert.equal(r2.length, 1);
  assert.equal(r2[0].leadId, 301);
});

test("7. Human Floor Mistake Correction: 1-Tap Revert to Pending resets status and unverified flag", () => {
  const accidentallyDonatedLead = {
    leadId: 401,
    name: "Mohan Lal",
    phone: "9845088888",
    status: "Donated",
    validationStatus: "PENDING_VERIFICATION",
    rescheduleDate: "2026-11-05T10:00:00.000Z",
  };

  const reverted = revertLeadRecord(accidentallyDonatedLead);
  assert.equal(reverted.status, "Pending");
  assert.equal(reverted.validationStatus, "UNVERIFIED");
  assert.equal(reverted.rescheduleDate, null);
});

test("8. Sorting: Interested First, Donated Amount Descending, and Name Alphabetical", () => {
  const leads = [
    { leadId: 1, name: "Zara", status: "Pending", amount: 0 },
    { leadId: 2, name: "Anand", status: "Interested", amount: 0 },
    { leadId: 3, name: "Bharat", status: "Donated", amount: 5000 },
    { leadId: 4, name: "Chetan", status: "Donated", amount: 1500 },
  ];

  // Interested first
  const sortedByInterested = filterAndSortLeads(leads, "ALL", "", "interested_first");
  assert.equal(sortedByInterested[0].name, "Anand");

  // Donated amount descending
  const sortedByDonation = filterAndSortLeads(leads, "ALL", "", "donated_amount_desc");
  assert.equal(sortedByDonation[0].name, "Bharat");
  assert.equal(sortedByDonation[0].amount, 5000);
  assert.equal(sortedByDonation[1].name, "Chetan");
  assert.equal(sortedByDonation[1].amount, 1500);

  // Name A-Z
  const sortedByName = filterAndSortLeads(leads, "ALL", "", "name_asc");
  assert.equal(sortedByName[0].name, "Anand");
  assert.equal(sortedByName[1].name, "Bharat");
  assert.equal(sortedByName[2].name, "Chetan");
  assert.equal(sortedByName[3].name, "Zara");
});
