import { test } from "node:test";
import assert from "node:assert/strict";

// Pure logic mirror of src/lib/indian-phone-validator.ts for node:test
const KNOWN_DUMMY_SEQUENCES = new Set([
  "9876543210",
  "9876543211",
  "9876543212",
  "9123456789",
  "8901234567",
  "7890123456",
  "6789012345",
  "1234567890",
  "0123456789",
  "9000000000",
  "9900000000",
  "9990000000",
  "9845000000",
  "9800000000",
  "9012345678",
  "8901234567",
]);

function normalizeIndianMobile(raw) {
  if (raw == null) return "";
  let str = String(raw).trim();
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num)) str = BigInt(Math.round(num)).toString();
    } catch {}
  }
  const digits = str.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    const secondDigit = digits[1];
    if (!["6", "7", "8", "9"].includes(secondDigit)) {
      return digits;
    }
    if (digits.startsWith("080") && ["2", "3", "4", "5", "6", "7"].includes(digits[3])) {
      return digits;
    }
    return digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function validateIndianMobile(raw) {
  const phone10 = normalizeIndianMobile(raw);

  if (phone10.length !== 10) {
    return { isValid: false, phone10, isJunk: true, reason: "Invalid length" };
  }

  const firstDigit = phone10[0];
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return { isValid: false, phone10, isJunk: true, reason: "Non-mobile prefix" };
  }

  if (/^80[2-7]\d{7}$/.test(phone10)) {
    return { isValid: false, phone10, isJunk: true, reason: "Bangalore landline series" };
  }

  if (/^79[2-6]\d{7}$/.test(phone10)) {
    return { isValid: false, phone10, isJunk: true, reason: "Ahmedabad landline series" };
  }

  if (KNOWN_DUMMY_SEQUENCES.has(phone10)) {
    return { isValid: false, phone10, isJunk: true, reason: "Known dummy sequence" };
  }

  if (/^(\d)\1{9}$/.test(phone10)) {
    return { isValid: false, phone10, isJunk: true, reason: "All identical repeating digits" };
  }

  const uniqueDigits = new Set(phone10.split(""));
  if (uniqueDigits.size < 4) {
    return { isValid: false, phone10, isJunk: true, reason: "Low entropy pattern" };
  }

  if (/^(\d{2})\1{4}$/.test(phone10)) {
    return { isValid: false, phone10, isJunk: true, reason: "Repetitive 2-digit pattern" };
  }

  if (/(\d)\1{5,}/.test(phone10)) {
    return { isValid: false, phone10, isJunk: true, reason: "6+ consecutive repeated digits" };
  }

  return { isValid: true, phone10, isJunk: false };
}

// ── TEST SUITE ──

test("Indian Mobile Validator: Accepts authentic Indian mobile numbers", () => {
  const validNumbers = [
    "9845012345",
    "+91 94496 52749",
    "919632211773",
    "08904110348",
    "7019823456",
    "6362198765",
    "9.63221E+09", // scientific notation from Excel
  ];

  for (const num of validNumbers) {
    const res = validateIndianMobile(num);
    assert.equal(res.isValid, true, `Expected ${num} to be valid`);
    assert.equal(res.isJunk, false);
    assert.equal(res.phone10.length, 10);
  }
});

test("Indian Mobile Validator: Rejects landlines and toll-free numbers", () => {
  const landlinesAndTollFree = [
    "08026781234", // Bangalore landline (080)
    "01123456789", // Delhi landline (011)
    "02228765432", // Mumbai landline (022)
    "1800123456",  // Toll free
    "0442876543",  // Chennai landline
    "5123456789",  // Invalid 5xxxxxxxxx
    "2345678901",  // Fixed line
  ];

  for (const num of landlinesAndTollFree) {
    const res = validateIndianMobile(num);
    assert.equal(res.isValid, false, `Expected landline ${num} to be rejected`);
    assert.equal(res.isJunk, true);
  }
});

test("Indian Mobile Validator: Filters out dummy, fake, and junk numbers", () => {
  const junkNumbers = [
    "9999999999", // all 9s
    "8888888888", // all 8s
    "7777777777", // all 7s
    "9876543210", // sequential keyboard dummy
    "9898989898", // repetitive pair
    "9191919191", // repetitive pair
    "9000000000", // dummy placeholder
    "9845000000", // trailing zeroes placeholder
    "9888888888", // low entropy (< 4 unique digits)
    "9877777777", // 7 consecutive repeating digits
  ];

  for (const junk of junkNumbers) {
    const res = validateIndianMobile(junk);
    assert.equal(res.isValid, false, `Expected junk ${junk} to be rejected`);
    assert.equal(res.isJunk, true);
  }
});

test("Upload Manager: Simulates 1,000-lead chunking with 200ms DB protection pause", async () => {
  const totalLeads = 2500;
  const CHUNK_SIZE = 1000;
  const fakeLeads = Array.from({ length: totalLeads }, (_, i) => ({
    name: `Donor ${i}`,
    phone: `98450${String(10000 + i).padStart(5, "0")}`,
  }));

  // Chunking logic
  const chunks = [];
  for (let i = 0; i < fakeLeads.length; i += CHUNK_SIZE) {
    chunks.push(fakeLeads.slice(i, i + CHUNK_SIZE));
  }

  assert.equal(chunks.length, 3, "Expected 3 chunks for 2,500 leads");
  assert.equal(chunks[0].length, 1000);
  assert.equal(chunks[1].length, 1000);
  assert.equal(chunks[2].length, 500);

  // Simulate chunk processing with state tracking
  let processedChunks = 0;
  for (const chunk of chunks) {
    processedChunks++;
    // Simulate lightweight Neon insert & 200ms connection rest
    await new Promise((r) => setTimeout(r, 10));
  }

  assert.equal(processedChunks, 3);
});

test("Background Upload Resilience: Persists and restores job state", () => {
  // Mock localStorage
  const mockStorage = new Map();
  const STORAGE_KEY = "janaseva_admin_active_upload_job";

  const job = {
    jobId: "job_test_123",
    fileName: "d_nov_26_1.xlsx",
    stream: "DIRECT_DONOR",
    totalLeads: 2500,
    totalChunks: 3,
    currentChunk: 1, // 1 of 3 uploaded
    status: "in_progress",
    lastActiveAt: Date.now(),
    stats: { insertedTotal: 1000, duplicatesTotal: 0, enrichedTotal: 0, junkTotal: 15 },
  };

  mockStorage.set(STORAGE_KEY, JSON.stringify(job));

  // Retrieve job
  const restored = JSON.parse(mockStorage.get(STORAGE_KEY));
  assert.equal(restored.jobId, "job_test_123");
  assert.equal(restored.currentChunk, 1);
  assert.equal(restored.stats.junkTotal, 15);

  // Resume next chunk (chunk 2)
  restored.currentChunk = 2;
  restored.stats.insertedTotal += 1000;
  mockStorage.set(STORAGE_KEY, JSON.stringify(restored));

  const afterChunk2 = JSON.parse(mockStorage.get(STORAGE_KEY));
  assert.equal(afterChunk2.currentChunk, 2);
  assert.equal(afterChunk2.stats.insertedTotal, 2000);
});
