import test from "node:test";
import assert from "node:assert/strict";

function clean(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function normalizePhone(v) {
  const t = v.replace(/[^\d+]/g, "");
  const plus = t.startsWith("+") ? "+" : "";
  const digits = t.replace(/\D/g, "").slice(0, 15);
  return plus + digits;
}

function isPhone(v) {
  return /^\+?\d{10,15}$/.test(v);
}

function slugify(s) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "campaign"
  );
}

test("Server Utils Validation & Sanitization", async (t) => {
  await t.test("Email validation adheres to RFC standards", () => {
    assert.equal(isEmail("donor@example.com"), true);
    assert.equal(isEmail("invalid-email"), false);
    assert.equal(isEmail("user@domain"), false);
    assert.equal(isEmail("   "), false);
  });

  await t.test("Phone normalization and validation", () => {
    assert.equal(normalizePhone("+91 99803 59595"), "+919980359595");
    assert.equal(isPhone("+919980359595"), true);
    assert.equal(isPhone("9980359595"), true);
    assert.equal(isPhone("123"), false);
    assert.equal(isPhone("abc1234567890"), false);
  });

  await t.test("Slugify generates safe URL strings", () => {
    assert.equal(slugify("Janaseva Education & Health Mission 2026!"), "janaseva-education-health-mission-2026");
    assert.equal(slugify("---Messy--Title---"), "messy-title");
    assert.equal(slugify(""), "campaign");
  });

  await t.test("Clean function trims and truncates bounds", () => {
    assert.equal(clean("  Hello World  ", 5), "Hello");
    assert.equal(clean(null, 10), "");
    assert.equal(clean(123, 10), "");
  });
});
