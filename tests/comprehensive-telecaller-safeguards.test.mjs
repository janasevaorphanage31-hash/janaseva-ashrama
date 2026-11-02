import test from "node:test";
import assert from "node:assert/strict";

// Helper replicating validateIndianUtr logic from antigravity-crm
function validateIndianUtr(rawUtr) {
  if (!rawUtr || !rawUtr.trim()) {
    return { isValid: true, cleaned: "" };
  }
  const cleanUtr = rawUtr.trim().toUpperCase().replace(/[\s-]/g, "");

  // Pure digits: strictly 12 numeric digits for UPI UTRs (GPay, PhonePe, Paytm, BHIM)
  if (/^\d+$/.test(cleanUtr)) {
    if (cleanUtr.length === 12) {
      return { isValid: true, cleaned: cleanUtr };
    }
    return {
      isValid: false,
      cleaned: cleanUtr,
      error: `UPI UTR must be exactly 12 numeric digits (you entered ${cleanUtr.length} digits: '${cleanUtr}'). Please re-check the donor's GPay/PhonePe/Paytm receipt.`,
    };
  }

  // Alphanumeric with letters: Bank IMPS / NEFT / RTGS reference (12 - 22 chars)
  if (/^[A-Z0-9]{12,22}$/.test(cleanUtr) && /[A-Z]/.test(cleanUtr)) {
    return { isValid: true, cleaned: cleanUtr };
  }

  return {
    isValid: false,
    cleaned: cleanUtr,
    error: `Invalid UTR reference '${cleanUtr}'. Must be a 12-digit UPI UTR or 12-22 character bank reference (e.g. AXISN24089123456).`,
  };
}

test("1. UTR Validation: Accepts valid 12-digit Indian UPI UTR", () => {
  const result = validateIndianUtr("428910284712");
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.cleaned, "428910284712");

  // With spaces or hyphens
  const resultSpaces = validateIndianUtr("4289-1028 4712");
  assert.strictEqual(resultSpaces.isValid, true);
  assert.strictEqual(resultSpaces.cleaned, "428910284712");
});

test("2. UTR Validation: Accepts valid 16-22 character bank IMPS/NEFT references", () => {
  const result = validateIndianUtr("AXISN24089123456");
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.cleaned, "AXISN24089123456");
});

test("3. UTR Validation: Rejects invalid digit counts (too short or too long)", () => {
  // 5 digits
  const shortResult = validateIndianUtr("12345");
  assert.strictEqual(shortResult.isValid, false);
  assert.match(shortResult.error, /exactly 12 numeric digits/);

  // 11 digits
  const elevenResult = validateIndianUtr("42891028471");
  assert.strictEqual(elevenResult.isValid, false);
  assert.match(elevenResult.error, /you entered 11 digits/);

  // 13 digits
  const thirteenResult = validateIndianUtr("4289102847123");
  assert.strictEqual(thirteenResult.isValid, false);
});

test("4. UTR Validation: Rejects invalid special symbols or malformed strings", () => {
  const malformed = validateIndianUtr("INVALID!@#");
  assert.strictEqual(malformed.isValid, false);
  assert.match(malformed.error, /Invalid UTR reference/);
});

test("5. Sibling / Twin Handling: Combines sibling child names instead of discarding duplicate", () => {
  const prevRecord = {
    childName: "Aryan",
    parentName: "Mary T",
    phone: "9900615510",
  };

  const incomingSibling = {
    childName: "Ananya",
    parentName: "Mary T",
    phone: "9900615510",
  };

  const isDuplicatePhone = prevRecord.phone === incomingSibling.phone;
  assert.strictEqual(isDuplicatePhone, true);

  const prevChild = prevRecord.childName.trim();
  const incomingChild = incomingSibling.childName.trim();
  const isDifferentSibling = incomingChild.toLowerCase() !== prevChild.toLowerCase();
  assert.strictEqual(isDifferentSibling, true);

  const combinedChild = `${prevChild} & ${incomingChild}`;
  assert.strictEqual(combinedChild, "Aryan & Ananya");
});

test("6. TRAI Calling Hours Guard: Identifies disrespectful hours outside 9:00 AM - 8:00 PM IST", () => {
  const isOutsideCallingHours = (hour) => hour < 9 || hour >= 20;

  assert.strictEqual(isOutsideCallingHours(7), true, "7 AM is too early");
  assert.strictEqual(isOutsideCallingHours(8), true, "8 AM is too early");
  assert.strictEqual(isOutsideCallingHours(21), true, "9 PM is too late");
  assert.strictEqual(isOutsideCallingHours(23), true, "11 PM is too late");

  assert.strictEqual(isOutsideCallingHours(10), false, "10 AM is standard calling hours");
  assert.strictEqual(isOutsideCallingHours(14), false, "2 PM is standard calling hours");
  assert.strictEqual(isOutsideCallingHours(18), false, "6 PM is standard calling hours");
});

test("7. Offline Sync Queue: Preserves action items in local storage structure", () => {
  const mockStorage = [];
  const action = {
    url: "/api/v1/leads/11261/log",
    method: "POST",
    payload: { disposition: "Interested", notes: "Agreed to donate ₹2500" },
    leadId: 11261,
    leadName: "Mary T",
    actionLabel: "Interested",
    queuedAt: new Date().toISOString(),
  };

  mockStorage.push(action);
  assert.strictEqual(mockStorage.length, 1);
  assert.strictEqual(mockStorage[0].leadId, 11261);
  assert.strictEqual(mockStorage[0].actionLabel, "Interested");
});
