# JANASEVA ASHRAMA — WHATSAPP CRM ARCHITECTURE SPECIFICATION

**System:** Janaseva AI Donor CRM & Multi-Agent Omnichannel Engine  
**Version:** 2.0 (Direct Meta Cloud API)  
**Date:** October 2026  

---

## 1. High-Level Architectural Diagram

```
                 +--------------------------------------------+
                 |            Meta WhatsApp Cloud API         |
                 |      graph.facebook.com/v21.0/{phone_id}   |
                 +---------------------+----------------------+
                                       ^
                        Outbound Send  |  Inbound Webhook
                        (REST HTTPS)   |  (HMAC-SHA256 Signed)
                                       v
+--------------------------------------------------------------------------+
|                         Janaseva Full-Stack Core                         |
|                                                                          |
|  +---------------------------+       +--------------------------------+  |
|  | Webhook Ingestion Router  |       | Background Automation Dispatch |  |
|  | /api/webhook/whatsapp     |       | (Razorpay Webhook Hook / Queue)|  |
|  +-------------+-------------+       +----------------+---------------+  |
|                |                                      |                  |
|                v                                      v                  |
|  +---------------------------+       +--------------------------------+  |
|  | WhatsApp Service Layer    |<------+ WhatsApp Queue & Rate-Limiter  |  |
|  | (src/lib/whatsapp.ts)     |       | (Batching, Exponential Backoff)|  |
|  +-------------+-------------+       +--------------------------------+  |
|                |                                                         |
|                +-----------------------+                                 |
|                                        v                                 |
|  +---------------------------+       +--------------------------------+  |
|  | Bilingual AI Chatbot RAG  |       | PostgreSQL Database            |  |
|  | (Gemini Flash + Knowledge)|       | (10 WhatsApp CRM Tables via    |  |
|  | (English & Kannada Ground)|       |  Drizzle ORM Engine)           |  |
|  +---------------------------+       +----------------+---------------+  |
|                                                       ^                  |
|                                                       |                  |
|  +----------------------------------------------------+---------------+  |
|  |                Admin Panel & 3-Panel Team Inbox                    |  |
|  |  Conversations List | Interactive Composer | Donor 360 & History   |  |
|  +--------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
```

---

## 2. Database Schema Architecture

The WhatsApp CRM introduces 10 dedicated models into `src/db/schema.ts`:

1. **`whatsAppContacts` (`whats_app_contacts`)**:
   - `id`: Primary key (Serial).
   - `donorId`: Optional foreign key to `donations.id`.
   - `normalizedPhone`: E.164 formatted phone number (`+9198XXXXXXXX`), unique index.
   - `whatsappId`: WhatsApp customer ID (`wa_id`).
   - `displayName`: Donor name or WhatsApp contact profile name.
   - `email`: Contact email address.
   - `tags`: JSONB array of strings (`["VIP_DONOR", "MONTHLY_ANNADANA", "BIRTHDAY_SEVA"]`).
   - `customFields`: JSONB for key-value CRM attributes.
   - `preferredLanguage`: `"en"` or `"kn"`.
   - `lastSevaType`: Last seva sponsored (e.g. `"SPONSOR_25_BOYS"`, `"ANNADANA_LUNCH"`).
   - `lastDonationAmount`: Total INR of last contribution.
   - `lastDonationAt`: Timestamp of last verified donation.
   - `optInStatus`: Boolean (defaults to `true` upon voluntary contact or transaction).
   - `consentSource`: Origin of consent (`"RAZORPAY_CHECKOUT"`, `"INBOUND_WHATSAPP"`, `"WEBSITE_FORM"`).
   - `consentTimestamp`: When consent was captured.
   - `optOutAt`: Timestamp if user replied `STOP` or `UNSUBSCRIBE`.
   - Timestamps: `createdAt`, `updatedAt`.

2. **`whatsAppConsents` (`whats_app_consents`)**:
   - Detailed regulatory audit trail of service vs. marketing consent.

3. **`whatsAppConversations` (`whats_app_conversations`)**:
   - `id`: Serial primary key.
   - `contactId`: FK to `whats_app_contacts`.
   - `assignedUserId`: FK to `admin_users` for human takeover.
   - `status`: `"OPEN"`, `"WAITING"`, `"RESOLVED"`, `"CLOSED"`.
   - `unreadCount`: Integer count of unread inbound messages.
   - `aiEnabled`: Boolean flag controlling automated AI bot replies vs. human lock.
   - `lastInboundAt`, `lastMessageAt`, timestamps.

4. **`whatsAppMessages` (`whats_app_messages`)**:
   - `id`: Serial primary key.
   - `contactId`: FK to `whats_app_contacts`.
   - `conversationId`: FK to `whats_app_conversations`.
   - `wamId`: Meta WhatsApp Message ID (`wamid.HBg...`). Unique constraint.
   - `direction`: `"INBOUND"` or `"OUTBOUND"`.
   - `messageType`: `"TEXT"`, `"TEMPLATE"`, `"IMAGE"`, `"VIDEO"`, `"DOCUMENT"`, `"INTERACTIVE"`.
   - `content`: Message text body or payload summary.
   - `mediaUrl`: Attached media or document download URL.
   - `templateName`: Meta template identifier if outbound template.
   - `campaignId`: Optional FK to `whats_app_campaigns`.
   - `status`: `"PENDING"`, `"SENT"`, `"DELIVERED"`, `"READ"`, `"FAILED"`.
   - `failureCode`, `failureReason`: Meta error details on bounce or block.
   - `sentAt`, `deliveredAt`, `readAt`, `createdAt`.

5. **`whatsAppTemplates` (`whats_app_templates`)**:
   - Meta-approved template cache with synced approval statuses, languages, and components.

6. **`whatsAppCampaigns` (`whats_app_campaigns`)**:
   - Broadcast campaigns with targeting criteria, progress counters, schedules, and approval metadata.

7. **`whatsAppCampaignRecipients` (`whats_app_campaign_recipients`)**:
   - Recipient queue tracking with unique `(campaignId, contactId)` index to guarantee zero duplicate sends.

8. **`whatsAppAutomations` (`whats_app_automations`)**:
   - Workflow rules (`DONATION_CAPTURED`, `RECEIPT_READY`, `SEVA_PROOF_UPLOADED`, `INBOUND_GREETING`).

9. **`whatsAppAutomationExecutions` (`whats_app_automation_executions`)**:
   - Idempotent execution log with unique event ID lock.

10. **`whatsAppKnowledgeDocuments` (`whats_app_knowledge_documents`)**:
    - Grounded Ashrama facts (verified legal data, seva costs, visiting hours, Karnataka location) for AI RAG.

---

## 3. Communication & Security Flow

1. **Inbound Webhook Security**:
   - Header `X-Hub-Signature-256` validated against `crypto.createHmac('sha256', process.env.WHATSAPP_APP_SECRET)`.
   - Rejected if signature is invalid or timestamp exceeds tolerance window.
2. **Opt-Out Compliance**:
   - If user sends `STOP`, `UNSUBSCRIBE`, `CANCEL`, or `STOP PROMO`:
     - System immediately sets `optInStatus = false`, records `optOutAt`, logs consent withdrawal, disables marketing outbound, and sends an immediate polite acknowledgment.
   - If user sends `START` or `UNSTOP`:
     - System re-activates `optInStatus = true`.
3. **AI Chatbot Guardrails**:
   - Grounded RAG with strict organization knowledge:
     - Form 28 JJ Act: `KA18CH0242`
     - Form 10AC Section 80G: `AAATJ5578EF20214`
     - Daily Meals: ₹4,500
     - Monthly Ration: ₹6,000
     - Sponsoring 25 boys core focus
   - Never outputs arbitrary UPI handles or bank accounts not pre-configured.
   - Automatic handoff to human staff when high-value donation or complex grievance is detected.
