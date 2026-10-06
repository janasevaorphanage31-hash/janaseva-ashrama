import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef";

function sign(id) {
  return createHmac("sha256", TEST_SECRET).update(id).digest("hex");
}

function verifyToken(token) {
  const [id, sig] = token.split(".");
  if (!id || !sig) return null;
  const expected = sign(id);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

test("Admin Token Signing and Verification", async (t) => {
  await t.test("Valid token verifies successfully", () => {
    const sessionId = randomBytes(24).toString("hex");
    const signature = sign(sessionId);
    const token = `${sessionId}.${signature}`;
    const verifiedId = verifyToken(token);
    assert.equal(verifiedId, sessionId);
  });

  await t.test("Tampered token signature is rejected", () => {
    const sessionId = randomBytes(24).toString("hex");
    const badSig = "0000000000000000000000000000000000000000000000000000000000000000";
    const token = `${sessionId}.${badSig}`;
    assert.equal(verifyToken(token), null);
  });

  await t.test("Malformed token structure is rejected", () => {
    assert.equal(verifyToken("invalid-token"), null);
    assert.equal(verifyToken(""), null);
    assert.equal(verifyToken("part1.part2.part3"), null);
  });
});

test("Employee Password Scrypt Hashing and Verification", async (t) => {
  const { scryptSync } = await import("node:crypto");

  function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `scrypt:${salt}:${derivedKey}`;
  }

  function verifyPassword(password, storedHash) {
    if (!password || !storedHash) return false;
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, expectedHex] = parts;
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(derivedKey, "hex");
    const b = Buffer.from(expectedHex, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }

  await t.test("Correct password verifies successfully", () => {
    const password = "SuperSecretPassword123!";
    const hash = hashPassword(password);
    assert.equal(verifyPassword(password, hash), true);
  });

  await t.test("Incorrect password fails verification", () => {
    const password = "CorrectPassword123!";
    const hash = hashPassword(password);
    assert.equal(verifyPassword("WrongPassword123!", hash), false);
  });

  await t.test("Two hashes of same password have different salts", () => {
    const password = "CommonPassword123!";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);
    assert.notEqual(hash1, hash2);
    assert.equal(verifyPassword(password, hash1), true);
    assert.equal(verifyPassword(password, hash2), true);
  });

  await t.test("Malformed or empty hashes fail safely", () => {
    assert.equal(verifyPassword("pass", ""), false);
    assert.equal(verifyPassword("pass", "invalid_format"), false);
    assert.equal(verifyPassword("pass", "scrypt:bad_salt:bad_key"), false);
    assert.equal(verifyPassword("", "scrypt:aa:bb"), false);
  });
});

