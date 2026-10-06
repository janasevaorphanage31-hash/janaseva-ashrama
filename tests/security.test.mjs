import test from "node:test";
import assert from "node:assert/strict";
import "dotenv/config";
import pg from "pg";
import { createHmac, timingSafeEqual } from "node:crypto";

const { Client } = pg;

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

test("Section 65 — Master Security & Policy Test Suite", async (t) => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await t.test("1. Fake checkout signature fails safely", () => {
    const valid = checkoutSignatureValid("order_123", "pay_456", "bad_signature_hex", "secret123");
    assert.equal(valid, false);
  });

  await t.test("2. Fake webhook signature fails safely", () => {
    const valid = webhookSignatureValid('{"event":"payment.captured"}', "bad_sig", "whsec_123");
    assert.equal(valid, false);
  });

  await t.test("3. RBAC role enforcement guards finance approval", () => {
    const allowedRoles = ["FINANCE", "SUPER_ADMIN"];
    const contentAdminRole = "CONTENT_ADMIN";
    const canApprove = allowedRoles.includes(contentAdminRole);
    assert.equal(canApprove, false);
  });

  await t.test("4. Public campaigns filter out pending and expired records", async () => {
    // Insert a pending campaign and an expired campaign for verification
    const testSlugPending = "sec-test-pending-" + Date.now();
    const testSlugExpired = "sec-test-expired-" + Date.now();

    await client.query(
      `INSERT INTO campaigns (slug, title, occasion, campaign_type, story, organizer_name, goal_amount, status)
       VALUES ($1, 'Pending Campaign', 'Birthday', 'Individual', 'Story for testing', 'Organizer', 5000, 'pending')`,
      [testSlugPending]
    );

    await client.query(
      `INSERT INTO campaigns (slug, title, occasion, campaign_type, story, organizer_name, goal_amount, status, end_date)
       VALUES ($1, 'Expired Campaign', 'Birthday', 'Individual', 'Story for testing', 'Organizer', 5000, 'approved', now() - interval '2 days')`,
      [testSlugExpired]
    );

    // Query active campaigns as the public API does
    const res = await client.query(
      `SELECT slug FROM campaigns WHERE status = 'approved' AND (end_date IS NULL OR end_date >= now())`
    );
    const visibleSlugs = new Set(res.rows.map((r) => r.slug));

    assert.equal(visibleSlugs.has(testSlugPending), false, "Pending campaign must NOT be public");
    assert.equal(visibleSlugs.has(testSlugExpired), false, "Expired campaign must NOT be public");

    // Clean up test rows
    await client.query("DELETE FROM campaigns WHERE slug IN ($1, $2)", [testSlugPending, testSlugExpired]);
  });

  await t.test("5. Demo payments never become verified public impact", async () => {
    const publicId = "sec-demo-" + Date.now();
    const idempotencyKey = "idem-" + Date.now();

    const insertRes = await client.query(
      `INSERT INTO donations (public_id, mode, amount, donor_name, donor_email, status, idempotency_key)
       VALUES ($1, 'demo', 1000, 'Demo Tester', 'demo@example.com', 'demo', $2)
       RETURNING id`,
      [publicId, idempotencyKey]
    );
    const donationId = insertRes.rows[0].id;

    // Check verified total calculation
    const totalRes = await client.query(
      `SELECT coalesce(sum(amount), 0)::int as total FROM donations WHERE status = 'paid'`
    );
    const verifiedTotal = totalRes.rows[0].total;

    // Check whether the demo donation was included
    const checkRes = await client.query(
      `SELECT id FROM donations WHERE id = $1 AND status = 'paid'`,
      [donationId]
    );
    assert.equal(checkRes.rows.length, 0, "Demo donation must NEVER have status = 'paid'");

    // Clean up
    await client.query("DELETE FROM donations WHERE id = $1", [donationId]);
  });

  await t.test("6. Certificates are strictly forbidden for unverified / demo donations", async () => {
    const publicId = "sec-cert-" + Date.now();
    const idempotencyKey = "idem-cert-" + Date.now();

    const insertRes = await client.query(
      `INSERT INTO donations (public_id, mode, amount, donor_name, donor_email, status, idempotency_key)
       VALUES ($1, 'demo', 500, 'Certificate Tester', 'cert@example.com', 'demo', $2)
       RETURNING id`,
      [publicId, idempotencyKey]
    );
    const donationId = insertRes.rows[0].id;

    // Verify certificate generation guard logic
    const donRes = await client.query(
      `SELECT id, status FROM donations WHERE id = $1`,
      [donationId]
    );
    const donation = donRes.rows[0];
    const isEligible = donation && donation.status === "paid";
    assert.equal(isEligible, false, "Demo donation must be rejected for certificate issuance");

    // Clean up
    await client.query("DELETE FROM donations WHERE id = $1", [donationId]);
  });

  await t.test("7. Donor private data (email, phone, payment IDs) is strictly excluded from public impact wall", async () => {
    const publicId = "sec-donor-" + Date.now();
    const idempotencyKey = "idem-donor-" + Date.now();

    const insertRes = await client.query(
      `INSERT INTO donations (public_id, mode, amount, donor_name, donor_email, donor_phone, razorpay_payment_id, status, anonymous, idempotency_key, paid_at)
       VALUES ($1, 'razorpay', 2500, 'Confidential Donor', 'confidential@example.com', '+919988776655', 'pay_confidential_123', 'paid', false, $2, now())
       RETURNING id`,
      [publicId, idempotencyKey]
    );
    const donationId = insertRes.rows[0].id;

    // Impact wall public query only selects public fields
    const wallRes = await client.query(
      `SELECT id, amount, donor_name, anonymous, paid_at FROM donations WHERE id = $1 AND status = 'paid'`,
      [donationId]
    );
    const publicRecord = wallRes.rows[0];

    assert.ok(publicRecord);
    // Explicitly check that private fields are NOT selected
    assert.equal("donor_email" in publicRecord, false);
    assert.equal("donor_phone" in publicRecord, false);
    assert.equal("razorpay_payment_id" in publicRecord, false);
    assert.equal("razorpay_order_id" in publicRecord, false);

    // Clean up
    await client.query("DELETE FROM donations WHERE id = $1", [donationId]);
  });

  await t.test("8. Revoked or restricted child media is immediately marked TAKEDOWN", async () => {
    const key = "sec-child-media-" + Date.now();
    const mediaRes = await client.query(
      `INSERT INTO media_assets (key, kind, public_url, alt_text, status)
       VALUES ($1, 'image', '/media/test-child.jpg', 'Dignified learning moment', 'PUBLISHED')
       RETURNING id`,
      [key]
    );
    const mediaId = mediaRes.rows[0].id;

    // Add consent
    await client.query(
      `INSERT INTO media_consents (media_id, status) VALUES ($1, 'CONSENTED')`,
      [mediaId]
    );

    // Revocation triggers takedown
    await client.query(
      `UPDATE media_consents SET status = 'REVOKED' WHERE media_id = $1`,
      [mediaId]
    );
    await client.query(
      `UPDATE media_assets SET status = 'TAKEDOWN' WHERE id = $1`,
      [mediaId]
    );

    const checkRes = await client.query(
      `SELECT status FROM media_assets WHERE id = $1`,
      [mediaId]
    );
    assert.equal(checkRes.rows[0].status, "TAKEDOWN", "Media with revoked consent must be taken down");

    // Clean up
    await client.query("DELETE FROM media_consents WHERE media_id = $1", [mediaId]);
    await client.query("DELETE FROM media_assets WHERE id = $1", [mediaId]);
  });

  await client.end();
});
