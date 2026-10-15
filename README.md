# Janaseva Ashrama — Website & AI WhatsApp CRM Suite

Official web application, donor management portal, and AI-powered WhatsApp CRM suite for **Janaseva Ashrama** (Bengaluru, Karnataka, India).

## 🌟 Overview & Mission

Janaseva Ashrama is a registered non-governmental organization dedicated to caring for, feeding, educating, and sheltering children in need (currently supporting 25 resident boys under the Juvenile Justice Act registration `KA18CH0242`). Donors in India are eligible for 50% tax deduction under Section 80G of the Income Tax Act (URN: `AAATJ5578EF20214`).

This repository contains the complete Next.js 16 App Router application featuring:
- **Donation Flow**: Fast, transparent Giving Basket, Birthday Seva Feast, Daily Meals (₹4,500), Monthly Ration (₹6,000), and custom contributions via Razorpay UPI/Netbanking/Cards.
- **Form 10BE & 80G Receipts**: Automated 80G receipt generation with donor PAN, registration numbers, and immediate delivery.
- **Admin Management Suite**: Real-time donor CRM, donation ledger, seva media gallery, and telecaller team tools.
- **AI WhatsApp CRM (Meta Cloud API)**: Native Meta WhatsApp Cloud API integration with AI chatbot (Gemini), bulk broadcasts, segment builder, automated receipt delivery, seva proofs, 3-panel Team Inbox, and consent compliance.

---

## 🚀 WhatsApp CRM Architecture & Capabilities

1. **Direct Meta Cloud API Integration (Graph API v21.0)**:
   - Zero third-party web scrapers; uses official Meta Graph API v21.0 directly.
   - HMAC-SHA256 signature verification on incoming webhooks (`X-Hub-Signature-256`).
   - Webhook callback endpoint: `/api/webhook/whatsapp`.

2. **Bilingual AI Chatbot & Copilot (English & Kannada)**:
   - Grounded RAG with official organization details: Form 28 JJ Act `KA18CH0242`, Form 10AC Section 80G `AAATJ5578EF20214`, 25 resident boys, ₹4,500 Daily Meals, ₹6,000 Monthly Ration.
   - Dual-language support with automatic language detection (`en` or `kn`).
   - Strict safety guardrails preventing hallucinations or fabricated legal/financial claims.
   - Human takeover trigger for complex queries or donor dispute requests.

3. **Multi-Agent 3-Panel Team Inbox**:
   - Left panel: Searchable conversations list, filterable by state (`ALL`, `OPEN`, `AI_HANDLED`, `WAITING_AGENT`, `RESOLVED`).
   - Center panel: Real-time chat timeline with inbound/outbound bubbles, status ticks (sent, delivered, read), canned responses, and manual message composer.
   - Right panel: Comprehensive Donor 360 profile, lifetime donations total, recent 80G receipts with quick WhatsApp resend, tags, and consent status.

4. **Audience Segments & Durable Broadcast Engine**:
   - Filterable audience segments: `ALL`, `DONORS_ALL`, `DONORS_RECENT_30D`, `DONORS_LAPSED`, `DONORS_HIGH_VALUE_5K`, `NON_DONORS`.
   - Durable queue in PostgreSQL with per-second rate limiting to comply with Meta tier limits.
   - Consent checks: Excludes any contact who sent `STOP`/`UNSUBSCRIBE` or opted out.

5. **Automated WhatsApp Triggers**:
   - **80G Donation Receipt**: Sent instantly upon successful Razorpay payment with receipt number, amount, PAN, and download link.
   - **Seva Proofs**: Video and photo updates sent to donors showing children enjoying their sponsored Annadana feast.

6. **TRAI & Meta Compliance**:
   - Automatic opt-out detection on `STOP`, `UNSUBSCRIBE`, `QUIT`, `CANCEL`.
   - Automatic re-opt-in on `START`, `YES`, `SUBSCRIBE`.
   - Explicit opt-in checkbox on donation checkout form.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.2.6](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19.2.6](https://react.dev/) & [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Safe Migrations**: Custom non-destructive synchronization (`scripts/db-safe-sync.mjs`)
- **Authentication**: Secure Node.js `scrypt` hashing & HMAC-SHA256 session tokens
- **Payment Gateway**: [Razorpay](https://razorpay.com/)
- **AI Engine**: [Google Gemini API](https://ai.google.dev/) via `@google/genai`
- **Messaging**: Meta WhatsApp Cloud API (Graph API v21.0)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# Razorpay
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Admin Auth
ADMIN_EMAIL=admin@janasevaashrama.org
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SESSION_SECRET=your-random-32-char-session-secret
ALLOW_DEMO_SEED=false

# Meta WhatsApp Cloud API
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=janaseva_waba_webhook_verify_secure_token_2026
WHATSAPP_APP_SECRET=...
META_GRAPH_API_VERSION=v21.0

# Google Gemini AI
GEMINI_API_KEY=...
```

---

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Synchronize Database
Run the safe non-destructive migration script to create all required tables without dropping any production data:
```bash
node scripts/db-safe-sync.mjs
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the public website or [http://localhost:3000/admin](http://localhost:3000/admin) for the Admin Dashboard.

---

## 🧪 Testing & Validation

Run the test suite:
```bash
npm test
```
Run TypeScript strict type checking:
```bash
npm run typecheck
```

---

## 📲 Meta WhatsApp Cloud API Webhook Setup

1. In the [Meta for Developers App Dashboard](https://developers.facebook.com/), navigate to **WhatsApp** > **Configuration**.
2. Set **Callback URL** to:
   ```
   https://www.janasevaashrama.org/api/webhook/whatsapp
   ```
3. Set **Verify Token** to the value of `WHATSAPP_VERIFY_TOKEN` in your `.env`.
4. Subscribe to the webhook fields:
   - `messages`
   - `message_template_status_update`
5. Test the connection in the Admin Panel under **WhatsApp CRM** > **Settings & Health**.

---

## 📂 Documentation

Full architectural and operational guides are available in the `docs/` directory:
- [Audit & Discovery](docs/WHATSAPP_CRM_AUDIT.md)
- [System Architecture](docs/WHATSAPP_CRM_ARCHITECTURE.md)
- [Implementation Plan](docs/WHATSAPP_CRM_IMPLEMENTATION_PLAN.md)
- [Test Plan & Verification](docs/WHATSAPP_CRM_TEST_PLAN.md)
- [Security & Compliance](docs/WHATSAPP_CRM_SECURITY.md)
- [Production Deployment Guide](docs/WHATSAPP_CRM_DEPLOYMENT.md)
