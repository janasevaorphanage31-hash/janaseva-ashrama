import test from "node:test";
import assert from "node:assert/strict";

function sanitizeDedication(dedication) {
  if (!dedication) return null;
  const occasion = typeof dedication.occasion === "string" ? dedication.occasion.trim().slice(0, 60) : "";
  const name = typeof dedication.name === "string" ? dedication.name.trim().slice(0, 120) : "";
  const message = typeof dedication.message === "string" ? dedication.message.trim().slice(0, 400) : "";
  if (!occasion && !name && !message) return null;
  return { occasion: occasion || null, name: name || null, message: message || null };
}

function validateDeliveryPref(pref) {
  return ["email", "whatsapp", "both"].includes(pref) ? pref : "email";
}

test("GiveA-Inspired Impact Giving Features", async (t) => {
  await t.test("Dedication payload sanitization preserves heartfelt intent safely", () => {
    const raw = {
      occasion: " Birthday  ",
      name: "  Arjun  ",
      message: "  May your year be filled with light and learning.  ",
    };
    const sanitized = sanitizeDedication(raw);
    assert.deepEqual(sanitized, {
      occasion: "Birthday",
      name: "Arjun",
      message: "May your year be filled with light and learning.",
    });
  });

  await t.test("Empty dedication payload returns null without polluting metadata", () => {
    assert.equal(sanitizeDedication(null), null);
    assert.equal(sanitizeDedication({ occasion: " ", name: "", message: "" }), null);
  });

  await t.test("Delivery preference validation defaults securely to email", () => {
    assert.equal(validateDeliveryPref("whatsapp"), "whatsapp");
    assert.equal(validateDeliveryPref("both"), "both");
    assert.equal(validateDeliveryPref("email"), "email");
    assert.equal(validateDeliveryPref("unsupported_sms"), "email");
    assert.equal(validateDeliveryPref(null), "email");
  });

  await t.test("Default impact catalog items have required operational accounting definitions", async () => {
    const { DEFAULT_ITEMS } = await import("../src/lib/seed-data.ts");
    assert.ok(DEFAULT_ITEMS.length >= 5, "Catalog should have at least 5 default items");
    for (const item of DEFAULT_ITEMS) {
      assert.ok(item.slug, "Item must have a slug");
      assert.ok(item.unitPrice > 0, "Item unitPrice must be positive");
      assert.ok(item.accountingMeaning, `Item ${item.slug} must have accounting definition`);
      assert.ok(item.operationalMeaning, `Item ${item.slug} must have operational definition`);
      assert.equal(item.financeApproval, "approved");
    }
  });
});
