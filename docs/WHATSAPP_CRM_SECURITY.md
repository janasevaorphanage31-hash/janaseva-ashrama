# JANASEVA ASHRAMA — WHATSAPP CRM SECURITY & PRIVACY SPECIFICATION

**Security Standard:** Enterprise NGO Grade & TRAI/Meta Business Compliance  
**Audience:** Janaseva Ashrama Developers & Sysadmins  

---

## 1. Secrets & Credentials Management

1. **Server-Side Isolation**:
   - `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, and `WHATSAPP_VERIFY_TOKEN` are loaded solely in Node.js server environments.
   - None of these environment variables are prefixed with `NEXT_PUBLIC_`.
   - Never logged in plaintext in console output or database records.
2. **Access Token Rotation**:
   - Production systems must use a Meta System User permanent access token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
   - In case of credential breach, regenerate token in Meta Business Manager and update server environment variables immediately.

---

## 2. Inbound Webhook Defense

1. **HMAC-SHA256 Signature Verification**:
   - All requests to `/api/webhook/whatsapp` are checked for the `x-hub-signature-256` header.
   - The signature is calculated as `sha256=${crypto.createHmac('sha256', WHATSAPP_APP_SECRET).update(rawBody).digest('hex')}`.
   - Timing-safe comparison (`crypto.timingSafeEqual`) is used to prevent timing attacks.
2. **Replay & Ingestion Deduplication**:
   - Each inbound message is checked against existing `wamId` (WhatsApp Message ID) records. Duplicate deliveries from Meta retry queues are discarded immediately with HTTP 200.

---

## 3. Donor Privacy & Regulatory Compliance (TRAI & Meta)

1. **Explicit Opt-In & Consent Capture**:
   - When donors enter their phone number on the donation form, clear consent language is displayed:
     *"I agree to receive transaction receipts and seva updates on WhatsApp from Janaseva Ashrama."*
   - Consent timestamp, source, and policy version are logged in `whats_app_consents`.
2. **Instant Opt-Out (STOP / UNSUBSCRIBE)**:
   - When a recipient replies with any of: `STOP`, `UNSUBSCRIBE`, `CANCEL`, or `QUIT`:
     - System immediately switches `optInStatus = false`.
     - Timestamp recorded in `optOutAt`.
     - Automatically excluded from all subsequent broadcast campaigns.
     - Confirmation message sent to acknowledge unsubscribe.
3. **Child Safeguarding & Media Protection (Form 28 JJ Act)**:
   - Only pre-authorized, approved seva photos and celebration video links from `media_assets` with valid consent flags are shared.
   - PII of minor resident boys is strictly protected according to Juvenile Justice Act norms.
