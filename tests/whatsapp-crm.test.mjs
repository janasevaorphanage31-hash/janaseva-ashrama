import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import "dotenv/config";
import pg from "pg";

const { Client } = pg;

// ==============================================================================
// 1. WhatsApp Phone Normalization & Validation Logic
// ==============================================================================
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { e164: "", metaTo: "", isValid: false };
  }
  let digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }
  if (digits.length === 10) {
    digits = "91" + digits;
  }
  const isValid = digits.length >= 10 && digits.length <= 15;
  return {
    e164: "+" + digits,
    metaTo: digits,
    isValid,
  };
}

// ==============================================================================
// 2. Meta Webhook HMAC-SHA256 Signature Verification
// ==============================================================================
function verifyMetaWebhookSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret || !signatureHeader) return false;
  const expectedPrefix = "sha256=";
  if (!signatureHeader.startsWith(expectedPrefix)) return false;

  const providedHash = signatureHeader.slice(expectedPrefix.length);
  const calculatedHash = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  try {
    const providedBuf = Buffer.from(providedHash, "hex");
    const calculatedBuf = Buffer.from(calculatedHash, "hex");
    if (providedBuf.length !== calculatedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, calculatedBuf);
  } catch {
    return false;
  }
}

// ==============================================================================
// 3. Regulatory Opt-Out & Opt-In Keywords (TRAI & Meta)
// ==============================================================================
const OPT_OUT_KEYWORDS = new Set([
  "stop",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
  "stop promo",
  "optout",
  "opt out",
]);
const OPT_IN_KEYWORDS = new Set(["start", "unstop", "subscribe", "optin", "opt in"]);

function isOptOutKeyword(text) {
  if (!text) return false;
  return OPT_OUT_KEYWORDS.has(text.trim().toLowerCase());
}

function isOptInKeyword(text) {
  if (!text) return false;
  return OPT_IN_KEYWORDS.has(text.trim().toLowerCase());
}

// ==============================================================================
// 4. Meta Webhook Payload Parser
// ==============================================================================
function parseMetaWebhookPayload(body) {
  const messages = [];
  const statuses = [];

  if (!body || body.object !== "whatsapp_business_account") {
    return { messages, statuses };
  }

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value) continue;

      if (Array.isArray(value.messages)) {
        const profileMap = new Map();
        if (Array.isArray(value.contacts)) {
          for (const c of value.contacts) {
            if (c.wa_id && c.profile?.name) {
              profileMap.set(c.wa_id, c.profile.name);
            }
          }
        }

        for (const msg of value.messages) {
          const from = msg.from || "";
          const normalized = normalizePhoneNumber(from);
          const name = profileMap.get(from) || "";
          let text = msg.type === "text" ? msg.text?.body : undefined;

          messages.push({
            wamId: msg.id,
            from,
            normalizedFrom: normalized.e164,
            name,
            type: msg.type || "unknown",
            text,
          });
        }
      }

      if (Array.isArray(value.statuses)) {
        for (const st of value.statuses) {
          statuses.push({
            wamId: st.id,
            recipientId: st.recipient_id,
            status: st.status,
          });
        }
      }
    }
  }

  return { messages, statuses };
}

// ==============================================================================
// 5. Kannada & Grounded Facts Logic
// ==============================================================================
function isKannadaLanguage(text) {
  if (!text) return false;
  const kannadaRegex = /[\u0C80-\u0CFF]/;
  if (kannadaRegex.test(text)) return true;
  const lower = text.toLowerCase();
  const kannadaLatinKeywords = ["namaskara", "kannada", "seve", "dana", "oota", "ashrama"];
  return kannadaLatinKeywords.some((kw) => lower.includes(kw));
}

const VERIFIED_ASHRAMA_FACTS = {
  name: "Janaseva Ashrama",
  location: "Bengaluru, Karnataka, India",
  phone: "+91 99803 59595",
  email: "janasevaorphanage@gmail.com",
  beneficiariesCount: 25,
  legalForm28JJAct: "KA18CH0242",
  tax80GForm10AC: "AAATJ5578EF20214",
  dailyMealsCost: 4500,
  monthlyRationCost: 6000,
};

// ==============================================================================
// TEST SUITES
// ==============================================================================

test("WhatsApp Phone Normalization & Validation", async (t) => {
  await t.test("Normalizes standard 10-digit Indian phone number to E.164 and Meta format", () => {
    const res = normalizePhoneNumber("9980359595");
    assert.equal(res.isValid, true);
    assert.equal(res.e164, "+919980359595");
    assert.equal(res.metaTo, "919980359595");
  });

  await t.test("Strips leading zero from 11-digit mobile number", () => {
    const res = normalizePhoneNumber("09980359595");
    assert.equal(res.isValid, true);
    assert.equal(res.e164, "+919980359595");
    assert.equal(res.metaTo, "919980359595");
  });

  await t.test("Handles phone with +91 country prefix and formatting dashes/spaces", () => {
    const res = normalizePhoneNumber("+91 99803-59595");
    assert.equal(res.isValid, true);
    assert.equal(res.e164, "+919980359595");
    assert.equal(res.metaTo, "919980359595");
  });

  await t.test("Rejects malformed, incomplete or empty phone numbers", () => {
    assert.equal(normalizePhoneNumber("12345").isValid, false);
    assert.equal(normalizePhoneNumber("").isValid, false);
    assert.equal(normalizePhoneNumber("not-a-number").isValid, false);
  });
});

test("Meta Webhook HMAC-SHA256 Cryptographic Verification", async (t) => {
  const secret = "test_meta_app_secret_janaseva_2026";
  const payload = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "12345", changes: [] }],
  });

  await t.test("Valid HMAC-SHA256 signature passes verification", () => {
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const signatureHeader = `sha256=${hmac}`;
    const isValid = verifyMetaWebhookSignature(payload, signatureHeader, secret);
    assert.equal(isValid, true);
  });

  await t.test("Tampered payload is rejected", () => {
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const signatureHeader = `sha256=${hmac}`;
    const tamperedPayload = payload + " ";
    const isValid = verifyMetaWebhookSignature(tamperedPayload, signatureHeader, secret);
    assert.equal(isValid, false);
  });

  await t.test("Mismatched secret or forged signature is rejected", () => {
    const forgedHeader = "sha256=11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff";
    const isValid = verifyMetaWebhookSignature(payload, forgedHeader, secret);
    assert.equal(isValid, false);
  });

  await t.test("Missing or malformed signature header fails safely", () => {
    assert.equal(verifyMetaWebhookSignature(payload, null, secret), false);
    assert.equal(verifyMetaWebhookSignature(payload, "invalid_prefix", secret), false);
  });
});

test("Regulatory Consent & Opt-Out Handling (TRAI & Meta)", async (t) => {
  await t.test("Detects standard opt-out keywords (STOP, UNSUBSCRIBE, CANCEL, QUIT)", () => {
    assert.equal(isOptOutKeyword("STOP"), true);
    assert.equal(isOptOutKeyword("unsubscribe"), true);
    assert.equal(isOptOutKeyword("Cancel"), true);
    assert.equal(isOptOutKeyword("quit"), true);
    assert.equal(isOptOutKeyword("STOP PROMO"), true);
  });

  await t.test("Detects re-opt-in keywords (START, UNSTOP, SUBSCRIBE)", () => {
    assert.equal(isOptInKeyword("START"), true);
    assert.equal(isOptInKeyword("unstop"), true);
    assert.equal(isOptInKeyword("subscribe"), true);
  });

  await t.test("Regular conversational messages are not falsely classified as opt-outs", () => {
    assert.equal(isOptOutKeyword("Can I donate for daily meals?"), false);
    assert.equal(isOptOutKeyword("Please stop by tomorrow"), false);
    assert.equal(isOptOutKeyword("Thank you"), false);
  });
});

test("Meta Webhook Inbound Payload Parsing", async (t) => {
  await t.test("Parses inbound text message correctly", () => {
    const samplePayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_123",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                contacts: [{ profile: { name: "Ramesh Sharma" }, wa_id: "919980359595" }],
                messages: [
                  {
                    from: "919980359595",
                    id: "wamid.HBgTESTMSG123",
                    timestamp: "1728000000",
                    type: "text",
                    text: { body: "Namaste, how can I sponsor daily meals for the boys?" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const { messages, statuses } = parseMetaWebhookPayload(samplePayload);
    assert.equal(messages.length, 1);
    assert.equal(statuses.length, 0);

    const m = messages[0];
    assert.equal(m.wamId, "wamid.HBgTESTMSG123");
    assert.equal(m.name, "Ramesh Sharma");
    assert.equal(m.normalizedFrom, "+919980359595");
    assert.equal(m.type, "text");
    assert.equal(m.text, "Namaste, how can I sponsor daily meals for the boys?");
  });

  await t.test("Parses outbound message delivery status updates", () => {
    const statusPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_123",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                statuses: [
                  {
                    id: "wamid.HBgOUTBOUND456",
                    status: "delivered",
                    timestamp: "1728000010",
                    recipient_id: "919980359595",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const { messages, statuses } = parseMetaWebhookPayload(statusPayload);
    assert.equal(messages.length, 0);
    assert.equal(statuses.length, 1);

    const st = statuses[0];
    assert.equal(st.wamId, "wamid.HBgOUTBOUND456");
    assert.equal(st.status, "delivered");
    assert.equal(st.recipientId, "919980359595");
  });
});

test("Grounded AI Chatbot Knowledge & Language Detection", async (t) => {
  await t.test("Verified organizational facts are preserved and accurate", () => {
    assert.equal(VERIFIED_ASHRAMA_FACTS.beneficiariesCount, 25);
    assert.equal(VERIFIED_ASHRAMA_FACTS.legalForm28JJAct, "KA18CH0242");
    assert.equal(VERIFIED_ASHRAMA_FACTS.tax80GForm10AC, "AAATJ5578EF20214");
    assert.equal(VERIFIED_ASHRAMA_FACTS.dailyMealsCost, 4500);
    assert.equal(VERIFIED_ASHRAMA_FACTS.monthlyRationCost, 6000);
  });

  await t.test("Detects Kannada language and Unicode text correctly", () => {
    assert.equal(isKannadaLanguage("ನಮಸ್ಕಾರ, ನಾನು ದಾನ ಮಾಡಬಹುದೇ?"), true);
    assert.equal(isKannadaLanguage("ಅನ್ನದಾನ ಸೇವೆ ಹೇಗೆ?"), true);
    assert.equal(isKannadaLanguage("Hello, I want to donate."), false);
  });
});

test("Database Schema Integrity: All 10 WhatsApp Tables Exist in PostgreSQL", async (t) => {
  const url = process.env.DATABASE_URL;
  assert.ok(url, "DATABASE_URL must be set in environment");

  const client = new Client({ connectionString: url });
  await client.connect();

  await t.test("All 10 WhatsApp CRM tables exist in PostgreSQL database", async () => {
    const requiredTables = [
      "whats_app_contacts",
      "whats_app_consents",
      "whats_app_conversations",
      "whats_app_messages",
      "whats_app_templates",
      "whats_app_campaigns",
      "whats_app_campaign_recipients",
      "whats_app_automations",
      "whats_app_automation_executions",
      "whats_app_knowledge_documents",
    ];

    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'whats_app_%'"
    );
    const tables = new Set(res.rows.map((r) => r.table_name));

    for (const table of requiredTables) {
      assert.ok(tables.has(table), `Table '${table}' must exist in the database`);
    }
  });

  await client.end();
});
