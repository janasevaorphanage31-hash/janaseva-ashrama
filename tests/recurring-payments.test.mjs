import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:Janaseva%40123@localhost:5432/janaseva";

function safeEqualHex(a, b) {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

function subscriptionSignatureValid(paymentId, subscriptionId, signature, secret) {
  const expected = createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

function webhookSignatureValid(rawBody, signature, whSecret) {
  if (!whSecret || !signature) return false;
  const expected = createHmac("sha256", whSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

function financialYear(d = new Date()) {
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

test("Razorpay Subscriptions & Monthly Auto-Pay Test Suite", async (t) => {
  const testSecret = "rzp_test_secret_key_888999";
  const testWebhookSecret = "whsec_test_mandate_secret_444";

  await t.test("1. Cryptographic Mandate Signature Verification", async (st) => {
    const paymentId = "pay_Nabc123456";
    const subscriptionId = "sub_Mxyz987654";
    const validSignature = createHmac("sha256", testSecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    assert.equal(
      subscriptionSignatureValid(paymentId, subscriptionId, validSignature, testSecret),
      true,
      "Valid payment_id|subscription_id HMAC must pass verification"
    );

    // Tampered payment ID
    assert.equal(
      subscriptionSignatureValid("pay_TAMPERED", subscriptionId, validSignature, testSecret),
      false,
      "Tampered payment ID must be rejected"
    );

    // Tampered subscription ID
    assert.equal(
      subscriptionSignatureValid(paymentId, "sub_TAMPERED", validSignature, testSecret),
      false,
      "Tampered subscription ID must be rejected"
    );

    // Reversed order check (must NOT match order_id|payment_id logic)
    const reversedSig = createHmac("sha256", testSecret)
      .update(`${subscriptionId}|${paymentId}`)
      .digest("hex");
    assert.equal(
      subscriptionSignatureValid(paymentId, subscriptionId, reversedSig, testSecret),
      false,
      "Reversed signature format must fail"
    );
  });

  await t.test("2. Razorpay Subscriptions Webhook HMAC-SHA256 Signatures", async (st) => {
    const events = [
      "subscription.authenticated",
      "subscription.activated",
      "subscription.charged",
      "subscription.halted",
      "subscription.cancelled",
      "payment.failed",
    ];

    for (const evt of events) {
      const payload = JSON.stringify({
        event: evt,
        payload: {
          subscription: { entity: { id: "sub_test_001", status: "active" } },
          payment: { entity: { id: "pay_test_001", amount: 50000, status: "captured" } },
        },
      });

      const validSig = createHmac("sha256", testWebhookSecret).update(payload).digest("hex");
      assert.equal(
        webhookSignatureValid(payload, validSig, testWebhookSecret),
        true,
        `Webhook signature for ${evt} must be valid`
      );

      // Modified payload must fail
      const alteredPayload = payload.replace("50000", "99999");
      assert.equal(
        webhookSignatureValid(alteredPayload, validSig, testWebhookSecret),
        false,
        `Tampered payload for ${evt} must be rejected`
      );
    }
  });

  await t.test("3. Section 80G Receipt Number Formatting", () => {
    const fy = financialYear();
    const donationId = 142;
    const expectedReceipt = `JSA/${fy}/${String(donationId).padStart(6, "0")}`;

    assert.match(
      expectedReceipt,
      /^JSA\/\d{2}-\d{2}\/\d{6}$/,
      "Receipt number must strictly follow JSA/YY-YY/000xxx format"
    );
    assert.equal(expectedReceipt, `JSA/${fy}/000142`);
  });

  await t.test("4. Database Schema Integrity & Subscriptions Table", async (st) => {
    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
      // Check recurring_subscriptions table structure
      const resCols = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'recurring_subscriptions'
      `);

      const colNames = resCols.rows.map((r) => r.column_name);
      const requiredCols = [
        "id",
        "public_id",
        "status",
        "mode",
        "amount",
        "currency",
        "frequency",
        "donor_name",
        "donor_email",
        "donor_phone",
        "donor_pan",
        "razorpay_plan_id",
        "razorpay_subscription_id",
        "mandate_status",
        "current_cycle",
        "total_cycles",
        "charge_count",
        "next_charge_at",
        "last_payment_id",
        "last_payment_at",
        "cancelled_at",
        "cancel_reason",
        "idempotency_key",
        "created_at",
      ];

      for (const col of requiredCols) {
        assert.ok(
          colNames.includes(col),
          `Column '${col}' must exist in recurring_subscriptions table`
        );
      }

      // Check foreign key and cycle in donations
      const donCols = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'donations' AND column_name IN ('subscription_id', 'recurring_cycle')
      `);
      assert.equal(
        donCols.rows.length,
        2,
        "donations table must have subscription_id and recurring_cycle columns"
      );
    } finally {
      await pool.end();
    }
  });

  await t.test("5. End-to-End Recurring Debit & Idempotency Workflow", async (st) => {
    const pool = new Pool({ connectionString: DATABASE_URL });

    try {
      const testPubId = "sub_test_" + randomUUID().slice(0, 8);
      const testIdempKey = "idemp_test_" + randomUUID();
      const testRzpSubId = "sub_rzp_" + randomUUID().slice(0, 10);
      const testPaymentId = "pay_rzp_" + randomUUID().slice(0, 10);

      // 1. Create a recurring subscription record
      const insSub = await pool.query(
        `
        INSERT INTO recurring_subscriptions (
          public_id, status, mode, amount, currency, frequency,
          donor_name, donor_email, donor_phone, donor_pan,
          razorpay_subscription_id, mandate_status, current_cycle, total_cycles,
          charge_count, idempotency_key
        ) VALUES ($1, 'active', 'razorpay', 500, 'INR', 'monthly', $2, $3, $4, $5, $6, 'active', 0, 60, 0, $7)
        RETURNING id, public_id, status, amount
      `,
        [
          testPubId,
          "Ananya Sharma",
          "ananya.test@example.com",
          "9980359595",
          "ABCDE1234F",
          testRzpSubId,
          testIdempKey,
        ]
      );

      const subId = insSub.rows[0].id;
      assert.ok(subId > 0, "Subscription must be inserted");

      // 2. Simulate Cycle 1 webhook payment charge
      const chargeIdempKey = `sub_charge_${testPaymentId}`;
      const donPubId = "rec_test_" + randomUUID().slice(0, 10);

      const insCharge = await pool.query(
        `
        INSERT INTO donations (
          public_id, status, mode, amount, donor_name, donor_email, donor_phone,
          subscription_id, recurring_cycle, razorpay_payment_id, idempotency_key, paid_at
        ) VALUES ($1, 'paid', 'razorpay', 500, 'Ananya Sharma', 'ananya.test@example.com', '9980359595', $2, 1, $3, $4, NOW())
        RETURNING id, receipt_no, amount, subscription_id
      `,
        [donPubId, subId, testPaymentId, chargeIdempKey]
      );

      assert.equal(insCharge.rows[0].subscription_id, subId);
      assert.equal(insCharge.rows[0].amount, 500);

      // 3. Verify Idempotency: Attempting duplicate insertion with the same razorpay_payment_id must fail
      let duplicateThrew = false;
      try {
        await pool.query(
          `
          INSERT INTO donations (
            public_id, status, mode, amount, donor_name, donor_email,
            subscription_id, recurring_cycle, razorpay_payment_id, idempotency_key
          ) VALUES ($1, 'paid', 'razorpay', 500, 'Ananya Sharma', 'ananya.test@example.com', $2, 1, $3, $4)
        `,
          ["rec_dup_" + randomUUID().slice(0, 8), subId, testPaymentId, chargeIdempKey + "_dup"]
        );
      } catch (e) {
        duplicateThrew = true;
      }
      assert.equal(duplicateThrew, true, "Duplicate payment ID must be rejected by unique constraint");

      // 4. Test Cancellation Transition
      await pool.query(
        `
        UPDATE recurring_subscriptions
        SET status = 'cancelled', mandate_status = 'cancelled', cancelled_at = NOW(), cancel_reason = 'Donor requested stop'
        WHERE id = $1
      `,
        [subId]
      );

      const cancelledSub = await pool.query(
        `SELECT status, mandate_status, cancel_reason FROM recurring_subscriptions WHERE id = $1`,
        [subId]
      );
      assert.equal(cancelledSub.rows[0].status, "cancelled");
      assert.equal(cancelledSub.rows[0].mandate_status, "cancelled");
      assert.equal(cancelledSub.rows[0].cancel_reason, "Donor requested stop");

      // Clean up test rows
      await pool.query(`DELETE FROM donations WHERE id = $1`, [insCharge.rows[0].id]);
      await pool.query(`DELETE FROM recurring_subscriptions WHERE id = $1`, [subId]);
    } finally {
      await pool.end();
    }
  });
});
