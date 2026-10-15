# JANASEVA ASHRAMA — WHATSAPP CRM REPOSITORY & SYSTEM AUDIT

**Audit Date:** October 2026  
**System:** Janaseva Ashrama (Bengaluru, Karnataka)  
**Scope:** AI-Powered WhatsApp CRM, Direct Meta Cloud API, Team Inbox, Donor Engagement & Automated Receipt Delivery.

---

## 1. Executive Summary & Repository Context

Janaseva Ashrama operates an active children's shelter home in Bengaluru, Karnataka, providing shelter, nutrition (Annadana), education (Vidya), healthcare (Arogya), and emotional mentorship for ~25 resident boys. The existing web application is a production-grade full-stack Next.js application with PostgreSQL database (managed via Drizzle ORM), Razorpay payment gateway integration, telecaller management CRM, 80G tax receipt generation, and extensive administrative dashboards.

The WhatsApp CRM architecture extends the existing system with direct Meta WhatsApp Cloud API integration, an authenticated 3-panel Team Inbox, automated donor workflows (donation receipts, birthday seva greetings, seva video/photo updates), consent & opt-out tracking (STOP/UNSUBSCRIBE), audience segmentation, broadcast campaign dispatcher, and a grounded bilingual AI chatbot (English & Kannada).

---

## 2. Technical Stack Audit

| Dimension | Existing Implementation | Integration Strategy for WhatsApp CRM |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.2.6 (App Router) + React 19.2.6 | Retain Next.js App Router for all API routes (`/api/webhook/whatsapp`, `/api/admin/whatsapp/*`) and React client/server components. |
| **Database** | PostgreSQL with Drizzle ORM (`0.45.2`) + `pg` client | Add 10 WhatsApp CRM tables to `src/db/schema.ts` with safe migration via `scripts/db-safe-sync.mjs`. |
| **Authentication** | Custom HMAC-SHA256 signed session cookie (`janaseva_admin_session`) + scrypt password hashing | Reuse `requireAdminPage()` and `requireAdminApi()` with strict role-based access control (RBAC). |
| **Payment Gateway** | Razorpay (Orders, Webhook signature verification via HMAC-SHA256) | Hook into verified `payment.captured` event to auto-dispatch transactional WhatsApp receipt messages with 80G links. |
| **Receipt System** | PDF generator / HTML view at `/receipts/[id]` with 80G Form 10AC reference | Deliver direct verifiable receipt URL and PDF document payload via WhatsApp template message. |
| **Media Assets** | `media_assets` table with Supabase/S3/local storage key mapping | Link authenticated celebration wish videos, photos, and Annadana proofs directly to donor WhatsApp threads. |
| **Testing** | Node.js native test runner (`node --test tests/**/*.test.mjs`) | Add dedicated test suite `tests/whatsapp-crm.test.mjs` verifying normalization, webhook security, opt-outs, and RAG. |

---

## 3. Data Integrity & Non-Destructive Principles

1. **Zero Impact on Existing Tables**: Existing tables (`donations`, `donation_lines`, `admin_users`, `admin_sessions`, `celebration_bookings`, `ag_telecallers`, `impact_items`) remain untouched in structure and operations.
2. **Contact Reconciliation**: Donors in `donations` are linked to `whats_app_contacts` by phone number normalization (E.164 standard +91XXXXXXXXXX) without breaking unlinked records.
3. **No Direct Web Automation**: Personal WhatsApp Web session scraping or unofficial libraries (e.g. puppeteer/wppconnect/baileys) are strictly prohibited. All communication uses the official Meta WhatsApp Cloud API (`https://graph.facebook.com/v21.0/`).
4. **Environment Isolation**: Secrets (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`) are server-side only and never exposed to client-side bundles or public endpoints.

---

## 4. Key Architectural Findings

- **Existing Admin Auth**: `src/lib/admin-auth.ts` provides robust session verification, checking cookie signature and admin role (`SUPER_ADMIN`, `STAFF_ADMIN`, `DONATION_ADMIN`, etc.).
- **Client/Server Boundary**: Client components (`"use client"`) must never import files importing `pg` or `@/db`. All DB operations must be routed through API handlers or server components.
- **Webhook Endpoint**: Meta requires a GET endpoint returning `hub.challenge` on verify token match, and a POST endpoint validating `X-Hub-Signature-256` HMAC-SHA256.
- **Idempotency**: Webhook events must be processed idempotently using Meta's unique `wamId` and `mid` to prevent duplicate messaging or duplicate records.
