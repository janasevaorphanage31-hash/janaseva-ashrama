# JANASEVA ASHRAMA — IMPLEMENTATION CHANGELOG

This document details the complete technical changelog of modifications, refactors, and feature implementations across the Janaseva Ashrama codebase.

---

## [2026-10-17] — Hero Redesign & Mobile Ergonomics Perfection

### 1. Hero Section: Quick Impact Presets Card Integration
- **File Modified:** [`src/components/CinematicHero.tsx`](file:///d:/jana_build/src/components/CinematicHero.tsx)
- **Problem:** User requested integrating the clean white 1-tap presets card from Image 1 into the rich visual theme of Image 2 without breaking layout or visual hierarchy.
- **Implementation:**
  - Embedded a high-conversion, frosted-white donor card inside the hero grid alongside the hero headline.
  - Implemented 8 quick-impact preset chips: ₹11, ₹51, ₹101, ₹251, ₹501, ₹1,100, ₹2,500, and ₹5,001 (traditional *shagun* and impactful amounts).
  - Added a dedicated Custom Amount input with currency prefix (`₹`).
  - Integrated 1-tap "Donate Now" CTA triggering instant checkout navigation with pre-filled state.
  - Added clear trust badges below the CTA: 100% Tax Exemption under 80G (`AABTJ7431MF20231`), instant digital receipt, and direct child benefit guarantee.

### 2. Mobile Floating Controls Overlap Fix
- **File Modified:** [`src/components/FloatingSocials.tsx`](file:///d:/jana_build/src/components/FloatingSocials.tsx)
- **Problem:** Floating WhatsApp and social action buttons overlapped with the bottom checkout bar and mobile bottom navigation drawer.
- **Implementation:**
  - Shifted vertical positioning to `bottom-20 md:bottom-6` to ensure at least 80px clearance on mobile devices.
  - Added responsive z-index layering (`z-30`) so checkout action drawers (`z-50`) and modals cleanly take precedence without visual collision.

---

## [2026-10-16] — Technical SEO, VideoObject Schema & Canonical Locking

### 1. Canonical Domain Standardization
- **Files Modified:**
  - [`src/app/sitemap.ts`](file:///d:/jana_build/src/app/sitemap.ts)
  - [`src/app/robots.ts`](file:///d:/jana_build/src/app/robots.ts)
  - [`src/app/impact/[slug]/page.tsx`](file:///d:/jana_build/src/app/impact/[slug]/page.tsx)
  - [`src/app/layout.tsx`](file:///d:/jana_build/src/app/layout.tsx)
- **Problem:** Mixed protocol or staging domains could lead to duplicate content penalties and dilution of domain authority.
- **Implementation:**
  - Standardized all canonical URLs to the authoritative domain: `https://www.janasevaashrama.org`.
  - Added dynamic canonical meta tag generators for individual impact campaign slugs (`https://www.janasevaashrama.org/impact/${slug}`).
  - Locked XML sitemap priority levels: Homepage (1.0), Donate/Checkout (0.9), Impact Campaigns (0.8), Stories & Transparency (0.7).

### 2. Schema.org VideoObject Structured Data
- **File Modified:** [`src/app/layout.tsx`](file:///d:/jana_build/src/app/layout.tsx)
- **Problem:** Video documentary assets lacked structured metadata for Google Rich Results in video search.
- **Implementation:**
  - Injected Schema.org `VideoObject` JSON-LD representing the Janaseva Ashrama documentary:
    - `name`: "Janaseva Ashrama — 25 Boys Care & Education Documentary"
    - `description`: "Inside Janaseva Ashrama Bengaluru: daily nutritional meals, education, and shelter for 25 boys."
    - `thumbnailUrl`: "https://www.janasevaashrama.org/images/authentic/boys-study.jpg"
    - `uploadDate`: "2026-01-01T00:00:00+05:30"
    - `contentUrl`: "https://www.janasevaashrama.org/videos/ashrama-intro.mp4"

---

## [2026-10-16] — Admin Panel Comprehensive Overhaul & Navigation Sync

### 1. URL Tab Synchronization (`?tab=...`)
- **File Modified:** [`src/app/admin/AdminDashboardClient.tsx`](file:///d:/jana_build/src/app/admin/AdminDashboardClient.tsx)
- **Problem:** Admin panel tab navigation was stored solely in React state; reloading the page or sharing links reset the view back to "overview".
- **Implementation:**
  - Synced active tab state with URL search params (`?tab=whatsapp`, `?tab=donations`, `?tab=telecallers`, etc.).
  - Added push-state handling with fallback to state, preserving navigation history across browser back/forward buttons.

### 2. Grouped 4-Category Operational Navigation Bar
- **File Modified:** [`src/app/admin/AdminDashboardClient.tsx`](file:///d:/jana_build/src/app/admin/AdminDashboardClient.tsx)
- **Problem:** A cluttered single row of 15+ tabs caused horizontal overflow and cognitive fatigue for staff.
- **Implementation:**
  - Reorganized tabs into 4 distinct functional category pills:
    1. **Donations & Finance** (Overview, Donations, Subscriptions, Receipts, Reconciliation)
    2. **WhatsApp CRM** (Inbox, Contacts, Campaigns, Automation, Templates)
    3. **Telecaller CRM** (Calling Desk, Assigned Leads, Activity Logs)
    4. **Content & Settings** (CMS Story Editor, Verification Badges, Daily Meals Tracker)

### 3. Server-Side Pagination & Quick Actions
- **Implementation:**
  - Added server-side page navigation for heavy tables (Donations, WhatsApp Contacts).
  - Added 1-click clipboard copy for donor transaction IDs, phone numbers, and receipts.
  - Added direct WhatsApp launch buttons (`https://wa.me/91...`) next to each donor phone number for fast customer support.

---

## [2026-10-15] — Meta WhatsApp Cloud API & AI Chatbot Suite

### 1. Direct Meta WhatsApp Cloud API Integration
- **Files Created/Modified:**
  - [`src/lib/whatsapp.ts`](file:///d:/jana_build/src/lib/whatsapp.ts)
  - [`src/app/api/whatsapp/webhook/route.ts`](file:///d:/jana_build/src/app/api/whatsapp/webhook/route.ts)
- **Implementation:**
  - Native integration with Meta Graph API v21.0.
  - Webhook listener verifying `x-hub-signature-256` HMAC-SHA256 signatures against `WHATSAPP_APP_SECRET`.
  - GET endpoint handling Meta challenge verification using `WHATSAPP_VERIFY_TOKEN`.
  - POST endpoint handling inbound messages, status callbacks (`sent`, `delivered`, `read`), and media payloads.

### 2. Grounded AI Chatbot with Google Gemini
- **File Created:** [`src/lib/whatsapp-ai.ts`](file:///d:/jana_build/src/lib/whatsapp-ai.ts)
- **Implementation:**
  - Integrates Google Gemini API (`gemini-1.5-flash`) for multi-lingual inbound message responses.
  - Grounded strictly in verified Janaseva Ashrama organizational data (25 resident boys, ₹4,500 Daily Meals, ₹6,000 Monthly Ration, Form 28 JJ Act `KA18CH0242`, Section 80G tax exemption).
  - Detects Kannada, Hindi, and English natively.
  - Automatically identifies escalation requests and hands off to human staff in the Team Inbox.

### 3. Bulk Broadcast Campaigns & Opt-Out Compliance
- **Files Created:**
  - [`src/lib/whatsapp-campaigns.ts`](file:///d:/jana_build/src/lib/whatsapp-campaigns.ts)
  - [`src/lib/whatsapp-contacts.ts`](file:///d:/jana_build/src/lib/whatsapp-contacts.ts)
- **Implementation:**
  - Automated keyword detection for TRAI/Meta opt-outs: `STOP`, `UNSUBSCRIBE`, `CANCEL`, `QUIT`.
  - Instant suppression of non-consenting numbers.
  - Campaign broadcast throttle (15 messages/second) to remain well within Meta rate limits.

---

## [2026-10-14] — Payment Gateway Hardening, Webhook Idempotency & 80G Receipts

### 1. Razorpay Order Creation & Verification
- **Files Modified:**
  - [`src/app/api/v1/checkout/create/route.ts`](file:///d:/jana_build/src/app/api/v1/checkout/create/route.ts)
  - [`src/app/api/donations/verify/route.ts`](file:///d:/jana_build/src/app/api/donations/verify/route.ts)
  - [`src/app/api/razorpay/webhook/route.ts`](file:///d:/jana_build/src/app/api/razorpay/webhook/route.ts)
- **Implementation:**
  - Cryptographic validation using `crypto.createHmac('sha256', secret)`.
  - Webhook processing with database transaction locking to guarantee idempotent execution: duplicate webhook events do not create duplicate donation records or alter amounts.
  - Added strict isolation for `/api/donations/demo-complete`: demo transactions are explicitly flagged `isSample: true` and cannot generate tax receipts.

### 2. Section 80G Sequential Receipt Generator
- **Files Created/Modified:**
  - [`src/lib/number-words.ts`](file:///d:/jana_build/src/lib/number-words.ts)
  - [`src/app/receipt/[id]/page.tsx`](file:///d:/jana_build/src/app/receipt/[id]/page.tsx)
- **Implementation:**
  - Serial receipt formatting: `JS/YYYY-YY/XXXX`.
  - Converts integer donation amounts to formal Indian English currency words (e.g., "Rupees Four Thousand Five Hundred Only").
  - Formatted compliant PDF printable layout displaying Form 28 JJ Act `KA18CH0242`, 80G URN `AABTJ7431MF20231`, and PAN `AABTJ7431M`.

---

## [2026-10-13] — Telecaller CRM & Attribution Module

### 1. Telecaller Token Cryptographic Authentication
- **File Modified:** [`src/lib/caller-auth.ts`](file:///d:/jana_build/src/lib/caller-auth.ts)
- **Implementation:**
  - Created signed telecaller session tokens: `${callerId}.${timestamp}.${hmac}`.
  - Enforced verification on all telecaller logging endpoints; unsigned or forged caller IDs return 401 Unauthorized.

### 2. Donor Lead Privacy Masking
- **Implementation:**
  - Telecallers only see assigned donor leads.
  - Phone numbers are masked in non-active views (`+91 99803 XXXXX`) to prevent lead leakage while allowing click-to-call during scheduled shifts.

---

## [2026-10-12] — Unified Conversion Tracking & Consent Mode v2

### 1. Unified Analytics Dispatcher
- **Files Created/Modified:**
  - [`src/lib/tracking.ts`](file:///d:/jana_build/src/lib/tracking.ts)
  - [`src/components/TrackingScripts.tsx`](file:///d:/jana_build/src/components/TrackingScripts.tsx)
- **Implementation:**
  - Dispatches events to Meta Pixel (`fbq`), Google Analytics 4 (`gtag`), and Google Ads (`gtag_report_conversion`).
  - Implemented session-level duplicate suppression using `sessionStorage.getItem('tracked_donations')`.
  - Configured Google Consent Mode v2 with default denial for `ad_storage` and `analytics_storage`.
  - Strict privacy filter: zero donor PII (PAN, phone, email) is ever sent to marketing platforms.

---

## Summary of Verification
- **Total Tests:** 75 passing automated tests across all suites.
- **TypeScript Errors:** 0 errors.
- **Git State:** Clean, all features committed and pushed to `origin/main`.
