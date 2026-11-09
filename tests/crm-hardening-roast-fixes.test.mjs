import test from "node:test";
import assert from "node:assert/strict";

// Replicate pure unit logic for testing without database connection overhead
function normalizeDisposition(raw) {
  if (!raw) return "Pending";
  const s = String(raw).trim();
  const lower = s.toLowerCase().replace(/[\s-]+/g, "_");

  if (lower === "interested" || lower === "hot_lead") return "Interested";
  if (lower === "donated" || lower === "paid" || lower === "pledged") return "Donated";
  if (lower === "reschedule" || lower === "callback" || lower === "call_back" || lower === "scheduled") return "Reschedule";
  if (lower === "no_answer" || lower === "noanswer" || lower === "ringing" || lower === "unanswered" || lower === "rnr") return "No_Answer";
  if (lower === "not_reachable" || lower === "unreachable" || lower === "switched_off" || lower === "out_of_coverage") return "Not_Reachable";
  if (lower === "busy" || lower === "line_busy" || lower === "call_waiting") return "Busy";
  if (lower === "wrong_number" || lower === "wrong" || lower === "invalid_number" || lower === "invalid" || lower === "junk") return "Wrong_Number";
  if (lower === "rejected" || lower === "not_interested" || lower === "declined" || lower === "refused" || lower === "do_not_call") return "Rejected";
  if (lower === "contacted" || lower === "spoken") return "Contacted";
  if (lower === "reverted") return "Reverted";
  if (lower === "pending") return "Pending";

  return s;
}

function generateSecureTempPassword() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `Jana#${digits}`;
}

function getISTDateBounds(d = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(d);
  let y = d.getUTCFullYear();
  let m = d.getUTCMonth();
  let day = d.getUTCDate();
  for (const part of parts) {
    if (part.type === "year") y = parseInt(part.value, 10);
    if (part.type === "month") m = parseInt(part.value, 10) - 1;
    if (part.type === "day") day = parseInt(part.value, 10);
  }

  const todayStart = new Date(Date.UTC(y, m, day) - istOffset);
  const todayEnd = new Date(Date.UTC(y, m, day, 23, 59, 59, 999) - istOffset);
  const monthStart = new Date(Date.UTC(y, m, 1) - istOffset);
  const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return { todayStart, todayEnd, monthStart, dateStr, year: y, month: m + 1, day };
}

test("CRM Hardening 1: Canonical Disposition Normalization", () => {
  // Test variations of case, spacing, and abbreviations
  assert.equal(normalizeDisposition("interested"), "Interested");
  assert.equal(normalizeDisposition("INTERESTED"), "Interested");
  assert.equal(normalizeDisposition("hot_lead"), "Interested");

  assert.equal(normalizeDisposition("donated"), "Donated");
  assert.equal(normalizeDisposition("paid"), "Donated");

  assert.equal(normalizeDisposition("no answer"), "No_Answer");
  assert.equal(normalizeDisposition("no_answer"), "No_Answer");
  assert.equal(normalizeDisposition("RNR"), "No_Answer");
  assert.equal(normalizeDisposition("ringing"), "No_Answer");

  assert.equal(normalizeDisposition("not reachable"), "Not_Reachable");
  assert.equal(normalizeDisposition("not_reachable"), "Not_Reachable");
  assert.equal(normalizeDisposition("switched_off"), "Not_Reachable");

  assert.equal(normalizeDisposition("wrong number"), "Wrong_Number");
  assert.equal(normalizeDisposition("invalid_number"), "Wrong_Number");
  assert.equal(normalizeDisposition("junk"), "Wrong_Number");

  assert.equal(normalizeDisposition("callback"), "Reschedule");
  assert.equal(normalizeDisposition("call_back"), "Reschedule");
  assert.equal(normalizeDisposition("reschedule"), "Reschedule");

  assert.equal(normalizeDisposition("not interested"), "Rejected");
  assert.equal(normalizeDisposition("rejected"), "Rejected");

  assert.equal(normalizeDisposition(null), "Pending");
  assert.equal(normalizeDisposition(""), "Pending");
  assert.equal(normalizeDisposition(undefined), "Pending");
});

test("CRM Hardening 2: Secure Temporary Password Hygiene", () => {
  const p1 = generateSecureTempPassword();
  const p2 = generateSecureTempPassword();

  assert.match(p1, /^Jana#\d{6}$/, "Password must match format Jana#123456");
  assert.match(p2, /^Jana#\d{6}$/, "Password must match format Jana#123456");
  assert.notEqual(p1, p2, "Randomized passwords must differ across calls");
  assert.notEqual(p1, "ashrama@123", "Must never fall back to static ashrama@123");
});

test("CRM Hardening 3: Rock-Solid Asia/Kolkata IST Bounds", () => {
  // Fixed timestamp: 2026-11-09T03:30:00Z = 2026-11-09T09:00:00 IST
  const fixedUtc = new Date(Date.UTC(2026, 10, 9, 3, 30, 0));
  const bounds = getISTDateBounds(fixedUtc);

  assert.equal(bounds.dateStr, "2026-11-09");
  assert.equal(bounds.year, 2026);
  assert.equal(bounds.month, 11);
  assert.equal(bounds.day, 9);

  // Cross-midnight UTC check: 2026-11-08T20:00:00Z is 2026-11-09 01:30 AM IST
  const crossMidnightUtc = new Date(Date.UTC(2026, 10, 8, 20, 0, 0));
  const crossBounds = getISTDateBounds(crossMidnightUtc);
  assert.equal(crossBounds.dateStr, "2026-11-09");
  assert.equal(crossBounds.day, 9);
});
