import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(a, b) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

function checkoutSignatureValid(orderId, paymentId, signature, secret) {
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

function webhookSignatureValid(rawBody, signature, whSecret) {
  if (!whSecret || !signature) return false;
  const expected = createHmac("sha256", whSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

test("Payment Cryptographic Verification Security", async (t) => {
  const secret = "test_key_secret_1234567890";
  const webhookSecret = "whsec_test_webhook_secret_999";

  await t.test("Valid checkout signature is confirmed", () => {
    const orderId = "order_O12345";
    const paymentId = "pay_P67890";
    const validSignature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

    assert.equal(checkoutSignatureValid(orderId, paymentId, validSignature, secret), true);
  });

  await t.test("Tampered orderId or paymentId invalidates checkout signature", () => {
    const orderId = "order_O12345";
    const paymentId = "pay_P67890";
    const validSignature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

    // Tampered order
    assert.equal(checkoutSignatureValid("order_O99999", paymentId, validSignature, secret), false);
    // Tampered payment
    assert.equal(checkoutSignatureValid(orderId, "pay_P99999", validSignature, secret), false);
  });

  await t.test("Valid webhook signature passes verification", () => {
    const payload = JSON.stringify({ event: "payment.captured", id: "evt_123" });
    const validSig = createHmac("sha256", webhookSecret).update(payload).digest("hex");

    assert.equal(webhookSignatureValid(payload, validSig, webhookSecret), true);
  });

  await t.test("Webhook with modified payload fails signature check", () => {
    const payload = JSON.stringify({ event: "payment.captured", amount: 10000 });
    const validSig = createHmac("sha256", webhookSecret).update(payload).digest("hex");

    const tamperedPayload = JSON.stringify({ event: "payment.captured", amount: 50000 });
    assert.equal(webhookSignatureValid(tamperedPayload, validSig, webhookSecret), false);
  });
});
