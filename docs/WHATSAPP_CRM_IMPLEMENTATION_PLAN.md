# JANASEVA ASHRAMA — WHATSAPP CRM IMPLEMENTATION PLAN

**Implementation Model:** Phased Milestone Execution  
**Target:** 100% Production Grade, Zero-Downtime, Non-Destructive  

---

## Phase Breakdown & Workflows

### Phase 1: Database Foundation & Core WhatsApp Cloud API Client
1. **Drizzle ORM Schema Extensions**:
   - Add the 10 models in `src/db/schema.ts`.
   - Update `scripts/db-safe-sync.mjs` with safe `CREATE TABLE IF NOT EXISTS` and index statements.
   - Run safe sync script.
2. **Meta Cloud API Client (`src/lib/whatsapp.ts`)**:
   - Phone normalization (E.164, India mobile validation).
   - Text message dispatch (`messages` API).
   - Template message dispatch with dynamic component parameters.
   - Media message dispatch (image, video, PDF receipt document).
   - Webhook signature validator (`x-hub-signature-256`).
   - Template synchronization with Meta Management API.
3. **Webhook Router (`src/app/api/webhook/whatsapp/route.ts`)**:
   - GET: Hub challenge responder for Meta webhook registration.
   - POST: HMAC-SHA256 signature verification, inbound message ingestion, delivery receipt updates (`sent`, `delivered`, `read`, `failed`), opt-out processing.

### Phase 2: Contact CRM, Consent Management & 3-Panel Team Inbox
1. **Contact & Consent Operations (`src/lib/whatsapp-contacts.ts`)**:
   - Upsert contact from incoming message or verified donation.
   - Handle opt-in / opt-out states (`STOP`, `UNSUBSCRIBE`, `START`).
   - Tagging, segment calculation, and language preferences (`en` / `kn`).
2. **Team Inbox API & Backend (`src/app/api/admin/whatsapp/*`)**:
   - Endpoints for conversations, message history, manual sends, assignment, AI toggle, and contact notes.
3. **Interactive 3-Panel Team Inbox UI (`src/components/admin/whatsapp/TeamInbox.tsx`)**:
   - Left Panel: Search, filters (All, Unassigned, Mine, Closed), unread badge, latest message snippet.
   - Middle Panel: Chat bubble timeline, media viewer, canned quick replies, message composer, AI status toggle.
   - Right Panel: Donor profile, cumulative donations, last seva type, 80G tax receipt history, tags, notes, opt-in toggle.

### Phase 3: Bulk Broadcast Campaigns & Durable Queue Engine
1. **Audience Filtering & Segmentation**:
   - Segment rules: All Donors, Annadana Donors, Sponsor 25 Boys, High-Value (>= ₹5,000), Monthly Subscribers, Inactive (>= 60 days).
   - Strict opt-out exclusion filter.
2. **Campaign Builder & Dispatcher (`src/lib/whatsapp-campaigns.ts`)**:
   - Pre-validation of Meta-approved templates.
   - Batching dispatcher with rate limiting (10-20 msgs/second) and exponential backoff on Meta Graph API 429 errors.
   - Real-time campaign stats calculation: Queued, Sent, Delivered, Read, Failed.

### Phase 4: Grounded Bilingual AI Chatbot & Knowledge Base
1. **Grounded RAG Engine (`src/lib/whatsapp-ai.ts`)**:
   - Verified Ashrama facts: Form 28 JJ Act `KA18CH0242`, 80G Form 10AC `AAATJ5578EF20214`, 25 boys, ₹4500 daily meals, ₹6000 monthly ration.
   - Kannada & English language detection and natural responses.
   - Safety guardrail: Never hallucinate unverified bank accounts or unauthorized claims.
   - Automatic handoff to human admin when complex issues or requests arise.
2. **Knowledge Base Admin UI (`src/components/admin/whatsapp/KnowledgeBaseManager.tsx`)**:
   - Manage documents, FAQ entries, seva descriptions, and policies.

### Phase 5: Automated Donation & Seva Media Workflows
1. **Razorpay Webhook Hook (`src/lib/whatsapp-automation.ts`)**:
   - On verified `payment.captured`, automatically dispatch:
     1. Instant personalized thank-you WhatsApp message.
     2. Verifiable 80G Tax Receipt link (`/receipts/[id]`).
     3. Dedicated seva proof video/photo when available.
2. **Birthday Seva Greeting & Recurring Reminder Workflows**:
   - Automated wishes for celebration bookings.
   - Monthly Annadana renewal nudge for regular supporters.

### Phase 6: Admin Panel Suite & AI Campaign Copilot
1. **Full WhatsApp Section Navigation**:
   - Main Dashboard (`/admin/whatsapp`), Team Inbox, Contacts, Templates, Campaigns, Automations, AI Chatbot, Knowledge Base, Settings.
2. **AI Campaign Copilot**:
   - AI assistant to generate compliant Meta WhatsApp templates, engaging seva appeal copy, and festival broadcast drafts.

### Phase 7: Automated Testing, Security Hardening & Documentation
1. **Comprehensive Test Suite (`tests/whatsapp-crm.test.mjs`)**:
   - Unit and integration tests for phone normalization, webhook signatures, opt-out handling, segment filtering, and AI guardrails.
2. **Full Regression Validation**:
   - Run complete test suite and TypeScript compiler checks.
