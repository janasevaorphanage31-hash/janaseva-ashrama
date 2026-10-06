import test from "node:test";
import assert from "node:assert/strict";
import {
  NAME_REGEX,
  PAN_REGEX,
  EMAIL_REGEX,
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  validateAmount,
  validateFutureDate,
  sanitizeNumeric,
  sanitizePan,
  sanitizeName,
} from "../src/lib/validation.ts";

test("Field Input Validation Engine Suite", async (t) => {
  await t.test("Name validation — letters only, reject numbers and special symbols", () => {
    // Valid names
    assert.strictEqual(validateName("Ramesh Kumar").valid, true);
    assert.strictEqual(validateName("Dr. K. Sharma").valid, true);
    assert.strictEqual(validateName("Mary-Jane Watson").valid, true);
    assert.strictEqual(validateName("O'Connor").valid, true);

    // Invalid names
    assert.strictEqual(validateName("Ramesh123").valid, false);
    assert.strictEqual(validateName("John_Doe").valid, false);
    assert.strictEqual(validateName("Admin@Janaseva").valid, false);
    assert.strictEqual(validateName("   ").valid, false);
    assert.strictEqual(validateName("A").valid, false); // too short

    // Sanitization
    assert.strictEqual(sanitizeName("Ramesh123@# Kumar"), "Ramesh Kumar");
  });

  await t.test("Phone validation — numbers only, 10-15 digits, reject alphabets/symbols", () => {
    // Valid phone numbers
    assert.strictEqual(validatePhone("9876543210").valid, true);
    assert.strictEqual(validatePhone("+91 9876543210").valid, true);
    assert.strictEqual(validatePhone("08012345678").valid, true);

    // Invalid phone numbers
    assert.strictEqual(validatePhone("98765").valid, false); // too short (< 10 digits)
    assert.strictEqual(validatePhone("98765432109876543").valid, false); // too long (> 15 digits)
    assert.strictEqual(validatePhone("98765ABCD0").valid, false); // letters
    assert.strictEqual(validatePhone("", true).valid, false); // required empty
    assert.strictEqual(validatePhone("", false).valid, true); // optional empty

    // Sanitization
    assert.strictEqual(sanitizeNumeric("+91 (987) 654-3210"), "919876543210");
    assert.strictEqual(sanitizeNumeric("abc123xyz456"), "123456");
  });

  await t.test("Email validation — RFC format, reject malformed", () => {
    assert.strictEqual(validateEmail("donor@example.com").valid, true);
    assert.strictEqual(validateEmail("user.name+tag@sub.domain.org").valid, true);

    assert.strictEqual(validateEmail("not-an-email").valid, false);
    assert.strictEqual(validateEmail("@example.com").valid, false);
    assert.strictEqual(validateEmail("donor@").valid, false);
    assert.strictEqual(validateEmail("donor@.com").valid, false);
    assert.strictEqual(validateEmail("", true).valid, false); // required empty
    assert.strictEqual(validateEmail("", false).valid, true); // optional empty
  });

  await t.test("PAN Card validation — 5 letters + 4 digits + 1 letter, auto-uppercase", () => {
    // Valid PAN
    assert.strictEqual(validatePan("ABCDE1234F").valid, true);
    assert.strictEqual(validatePan("abcde1234f").valid, true); // auto uppercased in validator
    assert.strictEqual(validatePan("BNZPK1234A").valid, true);

    // Invalid PAN
    assert.strictEqual(validatePan("ABC1234F").valid, false); // too short
    assert.strictEqual(validatePan("ABCDEF1234").valid, false); // wrong letter/digit pattern
    assert.strictEqual(validatePan("12345ABCDE").valid, false); // digits first
    assert.strictEqual(validatePan("ABCDE12345").valid, false); // ends in digit instead of letter
    assert.strictEqual(validatePan("", true).valid, false); // required empty
    assert.strictEqual(validatePan("", false).valid, true); // optional empty

    // Sanitization
    assert.strictEqual(sanitizePan("abc-de 1234 f!"), "ABCDE1234F");
  });

  await t.test("Amount validation — positive numbers, minimum thresholds", () => {
    assert.strictEqual(validateAmount(500, 10).valid, true);
    assert.strictEqual(validateAmount("1000", 10).valid, true);

    assert.strictEqual(validateAmount(0, 10).valid, false);
    assert.strictEqual(validateAmount(-100, 10).valid, false);
    assert.strictEqual(validateAmount("abc", 10).valid, false);
    assert.strictEqual(validateAmount(5, 10).valid, false); // below minimum
  });

  await t.test("Future date validation — reject past dates, allow today and future", () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    assert.strictEqual(validateFutureDate(today).valid, true);
    assert.strictEqual(validateFutureDate(tomorrow).valid, true);
    assert.strictEqual(validateFutureDate(yesterday).valid, false);
    assert.strictEqual(validateFutureDate("invalid-date").valid, false);
  });
});
