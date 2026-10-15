# JANASEVA ASHRAMA — WHATSAPP CRM TEST PLAN

**Test Strategy:** Automated Native Unit & Integration Tests + Manual Verification Protocols  
**Test Framework:** Node.js Native Test Runner (`node --test tests/**/*.test.mjs`)  

---

## 1. Automated Test Cases (`tests/whatsapp-crm.test.mjs`)

| Test ID | Category | Objective | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **TC-W01** | Phone Normalization | Verify E.164 conversion for diverse Indian phone formats. | Strips non-digits, normalizes 10-digit numbers to `+91XXXXXXXXXX`, handles existing `+91` or `91` prefixes correctly, rejects invalid length. |
| **TC-W02** | Webhook Verification | Verify Meta GET hub challenge handshake. | Returns HTTP 200 with `hub.challenge` when `hub.verify_token` matches; rejects with 403 on mismatch. |
| **TC-W03** | Webhook HMAC Security | Verify `X-Hub-Signature-256` cryptographic signature. | Passes on valid HMAC-SHA256 signature; rejects on altered payload or tampered secret. |
| **TC-W04** | Opt-Out & Opt-In Rules | Verify regulatory `STOP` / `UNSUBSCRIBE` and `START` handling. | Sets `optInStatus = false` on `STOP`/`UNSUBSCRIBE`, logs consent withdrawal; re-enables on `START`. |
| **TC-W05** | Delivery Status Tracking | Verify idempotency and message status state machine. | Updates message status (`sent` -> `delivered` -> `read` -> `failed`) based on Meta webhook status packets. |
| **TC-W06** | Audience Segmentation | Verify campaign segment filter logic. | Accurately subsets contacts by tags, donation amount, and seva type while strictly filtering out opt-outs. |
| **TC-W07** | AI Grounding & Guardrails | Verify AI RAG response formatting & factual constraints. | System prompt includes verified Form 28 JJ Act `KA18CH0242` and Form 10AC `AAATJ5578EF20214`; flags high-value queries for human takeover. |
| **TC-W08** | Template Parameter Mapper | Verify dynamic parameter substitution. | Correctly maps donor name, amount, receipt link, and seva title into Meta template components. |

---

## 2. Integration & Manual Verification Protocols

1. **Meta Graph API Health Check**:
   - Verification endpoint `/api/admin/whatsapp/health` checks Meta Cloud API access token validity and business phone number status.
2. **End-to-End Razorpay Payment Hook**:
   - Simulation of verified `payment.captured` event checks that WhatsApp automation is dispatched with the generated 80G receipt link.
3. **Team Inbox Realtime Verification**:
   - Verify that sending a message via the composer updates the thread and persists the outbound message.
