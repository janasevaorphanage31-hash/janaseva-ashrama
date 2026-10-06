# Janaseva Ashrama Platform — Attack Surface Analysis

**Document Status:** Final Audit Assessment  
**Application:** Janaseva Ashrama Platform  
**Target Scope:** Public/Internal Endpoints, Authentication Vectors, Inputs, Storage, Database, Third-Party Interfaces, Network Perimeter  
**Audit Date:** October 2026  

---

## 1. Attack Surface Overview

The Janaseva Ashrama platform operates as a unified Next.js 16 full-stack server application. The total attack surface consists of:
- **16 Public API Endpoints** (unauthenticated donor, volunteer, celebration, and analytics ingestion routes)
- **13 Administrative API Endpoints** (guarded by HMAC cookie session verification)
- **1 Static / Dynamic Asset Serving Route** (`/uploads/[...path]`)
- **1 External Asynchronous Ingress Vector** (`/api/razorpay/webhook`)
- **4 Admin Management Dashboard Pages** (`/admin`, `/admin/analytics`, `/admin/community`, `/admin/content`)
- **Next.js Internal Framework Handlers** (Server Actions, `_next/image` proxy, Turbopack SSR engine)
- **1 Relational Database Engine** (PostgreSQL via node-postgres `pg.Pool`)
- **Local Filesystem Media Storage** (`public/uploads/{category}/*`)

---

## 2. Comprehensive Endpoint Matrix

### 2.1 Public Ingress Endpoints (Unauthenticated)

| Route Path | HTTP Method | Expected Input Payload | Primary Vulnerability / Risk Vector | Existing Controls |
| :--- | :--- | :--- | :--- | :--- |
| `/api/donations` | `POST` | JSON: `donor`, `items`, `customAmount`, `idempotencyKey`, `campaignSlug`, `giftReference`, `deliveryPreference`, `updateConsent` | Financial parameter tampering, negative amounts, cart manipulation, DoS | Sliding window rate limit (15 req / 10 min), server recalculates prices from DB catalog, min ₹10 max ₹5,00,000 enforcement |
| `/api/donations/verify` | `POST` | JSON: `publicId`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` | Forged signatures, payment replay, status tampering | Rate limit (30 req / 10 min), cryptographic HMAC verification (`checkoutSignatureValid`), Razorpay API verification (`status === "captured"`, amount & currency match), atomic DB transition |
| `/api/donations/demo-complete` | `POST` | JSON: `publicId` | Bypassing payment gateway in production | Returns 404 if `razorpayConfigured()` is true; rate limited (20 req / 10 min); sets status to `demo` (never counted in financial analytics) |
| `/api/celebrations` | `POST` | JSON: `celebrantName`, `occasion`, `celebrationDate`, `packageId`, `packageName`, `amount`, `visitMode`, `timeSlot`, `guestCount`, `blessingMessage`, `donorName`, `donorPhone`, `donorEmail`, `donorPan`, `paymentStatus` | **Unverified payment status injection**, spam bookings, stored XSS in blessing | Input trimming via `clean()`, phone normalization via `normalizePhone()`. **Gaps: Blindly accepts `paymentStatus` and sets `celebrationStatus: "CONFIRMED"`** |
| `/api/celebrations` | `GET` | None | Scraping celebration photos / resident media proof | Limits query to last 30 days and 20 items. Restricts returned fields to public display |
| `/api/certificates` | `POST` | JSON: `donationPublicId`, `displayName` | Unauthorized certificate generation | Rate limit (15 req / 10 min), verifies `donations.status === "paid"` in DB before issuing |
| `/api/gifts` | `POST` | JSON: `donationPublicId`, `occasion`, `recipientName`, `senderName`, `message`, `allowSenderName` | Unauthorized gift card generation | Rate limit (15 req / 10 min), verifies `donations.status === "paid"` before issuing |
| `/api/gifts/intent` | `POST` | JSON: `occasion`, `recipientName`, `senderName`, `message`, `allowSenderName` | Spam creation of intent tokens | Rate limit (20 req / 10 min), creates unverified record with `status: "pending"` |
| `/api/campaigns` | `POST` | JSON: `title`, `occasion`, `campaignType`, `story`, `organizerName`, `organizerEmail`, `organizerPhone`, `goalAmount`, `coverImage` | Spam campaign creation, fake fundraising | Rate limit (5 req / 10 min), status forced to `pending`, requires admin approval before public listing |
| `/api/volunteers` | `POST` | JSON: `name`, `email`, `phone`, `interestArea`, `skills`, `availability`, `message`, `consent` | Form spam, automated mail flooding | Rate limit (5 req / 10 min), status forced to `NEW`, validated against interest whitelist |
| `/api/corporate` | `POST` | FormData: `companyName`, `contactName`, `email`, `phone`, `interest`, `message` | CSR inquiry spam | Rate limit (5 req / 10 min), input sanitization, 303 redirect |
| `/api/companies` | `POST` | JSON: `name`, `contactPerson`, `email`, `phone`, `website`, `industry`, `csrInterest`, `employeeCount` | Database spam | Rate limit (6 req / 10 min) |
| `/api/creators` | `POST` | JSON: `displayName`, `email`, `bio`, `instagram`, `youtube` | Profile spam | Rate limit (8 req / 10 min), status forced to `PENDING` |
| `/api/partners` | `POST` | JSON: `name`, `contactName`, `contactEmail`, `location`, `focusAreas`, `registrationInfo`, `message`, `website` | Partner inquiry spam | Rate limit (6 req / 10 min), status forced to `PENDING` |
| `/api/recurring-giving` | `POST` | FormData: `name`, `email`, `amount` | Spam subscriptions | Rate limit (5 req / 10 min), restricts amounts to `[250, 500, 1000]` |
| `/api/events` | `POST` | JSON: `event`, `sessionId`, `meta` | Analytics database flooding, log injection | Whitelisted event names (Set of 36 strings), metadata JSON clamped to 500 characters, rate limit (120 req / 1 min) |
| `/api/health` | `GET` | None | Health check probing | Dynamic force-dynamic; executes `SELECT 1` |
| `/uploads/[...path]` | `GET` | Path params: `path[]` | **Directory traversal, unauthorized access to sensitive proofs** | Canonical path verification (`resolve(join(uploadsBaseDir, ...path)).startsWith(uploadsBaseDir)`), `nosniff`, CSP sandbox |
| `/receipt/[publicId]` | `GET` (SSR) | Path param: `publicId` | **Harvesting unmasked Donor PAN numbers** | Email masked; `noindex` robots tag. **Gap: Full PAN displayed in cleartext** |
| `/certificate/[reference]` | `GET` (SSR) | Path param: `reference` | Pivoting to donation receipt | `noindex` robots tag. **Gap: Exposes direct link to donor receipt** |

---

### 2.2 Administrative Endpoints & Surfaces

All endpoints below reside under `/api/admin/*` and require authentication via `getAdminSession()` / `requireAdminApi()`:

| Route Path | Method | Minimum Required Role in Code | Vulnerability / Exposure Surface |
| :--- | :--- | :--- | :--- |
| `/api/admin/login` | `POST` | *Public / None* | **Auth bypass if `ADMIN_PASSWORD` is blank**; brute force if IP header spoofed |
| `/api/admin/logout` | `POST` | Active Session | Session invalidation in DB and cookie removal |
| `/api/admin/crm/donations` | `GET` | **None specified** (`requireAdminApi()` without roles) | **BFLA:** Any admin role can read complete donor PII, emails, phones, and PANs |
| `/api/admin/crm/export` | `GET` | **None specified** (`requireAdminApi()` without roles) | **BFLA / Data Exfiltration:** Any admin role can download full CSV of all donor PII & PANs; **no audit log written** |
| `/api/admin/celebrations` | `GET`, `POST`, `PATCH`, `DELETE` | **None specified** (`requireAdminApi()` without roles) | **BFLA:** Any admin can view PANs, modify booking states, or permanently DELETE celebration bookings without audit log |
| `/api/admin/site-content` | `GET`, `POST`, `PATCH` | **None specified** (`requireAdminApi()` without roles) | **BFLA / Defacement:** Any admin can overwrite landing page and hero content without audit log |
| `/api/admin/analytics` | `GET` | **None specified** (`requireAdminApi()` without roles) | Any admin can view financial totals and transaction histories |
| `/api/admin/upload` | `POST` | Any active admin session | Local disk writes up to 50MB per file; potential storage exhaustion |
| `/api/admin/campaigns` | `GET`, `PATCH` | `SUPER_ADMIN`, `STAFF_ADMIN`, `CAMPAIGN_ADMIN` | RBAC enforced; audit log recorded on moderation |
| `/api/admin/documents` | `GET`, `POST`, `PATCH`, `DELETE` | `SUPER_ADMIN`, `STAFF_ADMIN`, `CONTENT_ADMIN`, `FINANCE` | RBAC enforced; audit log recorded on mutations |
| `/api/admin/impact-items` | `GET`, `POST`, `PATCH` | `SUPER_ADMIN`, `STAFF_ADMIN`, `CONTENT_ADMIN`, `DONATION_ADMIN`, `FINANCE` | RBAC enforced; finance approval restricted to `FINANCE`/`SUPER_ADMIN`; audit log recorded |
| `/api/admin/media` | `GET`, `POST`, `PATCH`, `DELETE` | `SUPER_ADMIN`, `STAFF_ADMIN`, `CONTENT_ADMIN`, `MEDIA_REVIEWER` | RBAC enforced; consent tracking enforced; audit log recorded |
| `/api/admin/metrics` | `GET`, `POST`, `PATCH`, `DELETE` | `SUPER_ADMIN`, `STAFF_ADMIN`, `CONTENT_ADMIN`, `FINANCE` | RBAC enforced; audit log recorded |
| `/api/admin/today-updates` | `GET`, `POST`, `PATCH` | `SUPER_ADMIN`, `STAFF_ADMIN`, `CONTENT_ADMIN` | RBAC enforced; audit log recorded |
| `/api/admin/volunteers` | `GET`, `PATCH` | `SUPER_ADMIN`, `STAFF_ADMIN`, `VOLUNTEER_ADMIN` | RBAC enforced; audit log recorded |

---

### 2.3 External Webhook Vector

| Route Path | HTTP Method | Origin / Caller | Signature / Auth Mechanism | Behavior & Risk |
| :--- | :--- | :--- | :--- | :--- |
| `/api/razorpay/webhook` | `POST` | Razorpay Edge Servers | `x-razorpay-signature` verified against `RAZORPAY_WEBHOOK_SECRET` | Handles `payment.captured` (transitions donation to `paid`) and `refund.processed` (transitions donation to `refunded`). Uses constant-time HMAC-SHA256 comparison. Validates `p.amount === d.amount * 100` and `p.currency === "INR"`. |

---

## 3. Findings by Risk Category

### 3.1 Confirmed Vulnerabilities

#### Finding ATK-01: Public Booking API Blindly Accepts Unverified Payment Status
- **Severity:** **HIGH**
- **Evidence:** `src/app/api/celebrations/route.ts` lines 31 & 72:
  ```typescript
  const paymentStatus = clean(b.paymentStatus, 30) || "pending";
  ...
  const [booking] = await db
    .insert(celebrationBookings)
    .values({
      reference,
      celebrantName,
      occasion,
      celebrationDate,
      packageId,
      packageName,
      amount,
      visitMode,
      timeSlot,
      guestCount,
      blessingMessage,
      donorName,
      donorPhone,
      donorEmail: donorEmail || null,
      donorPan: donorPan || null,
      paymentStatus,
      celebrationStatus: "CONFIRMED",
    })
    .returning();
  ```
- **Risk:** Unauthenticated users can book Special Day meal sponsorships marked as `"paid"` and `"CONFIRMED"` without ever going through a payment gateway or transferring funds.
- **Affected Location:** `src/app/api/celebrations/route.ts#L31-L75`
- **Why It Matters:** The Ashrama uses this system to plan meals and prepare food for residents. An attacker or malicious user can forge requests that inject `paymentStatus: "paid"`. In the admin dashboard, staff will see confirmed bookings, resulting in uncompensated meal preparations and financial losses.
- **Recommended Fix:** Always force `paymentStatus: "pending"` on public creation, and set `celebrationStatus: "PENDING"`. Allow status to become `"CONFIRMED"` or `"paid"` only after Razorpay payment verification or explicit staff confirmation.

#### Finding ATK-02: Broken Function-Level Authorization (BFLA) on Sensitive CRM and Export Endpoints
- **Severity:** **HIGH**
- **Evidence:** `src/app/api/admin/crm/donations/route.ts` line 8, `src/app/api/admin/crm/export/route.ts` line 18, `src/app/api/admin/celebrations/route.ts` lines 9, 72, 132, 160:
  ```typescript
  export async function GET(req: Request) {
    const session = await requireAdminApi();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```
- **Risk:** Privilege escalation allowing low-privileged administrative roles to view, modify, or export sensitive donor financial records and tax PANs.
- **Affected Location:** `src/app/api/admin/crm/donations/route.ts`, `src/app/api/admin/crm/export/route.ts`, `src/app/api/admin/celebrations/route.ts`
- **Why It Matters:** The application defines granular roles (`SUPER_ADMIN`, `STAFF_ADMIN`, `FINANCE`, `CONTENT_ADMIN`, `MEDIA_REVIEWER`, `VOLUNTEER_ADMIN`, `CSR_ADMIN`, `PARTNER_ADMIN`). When `requireAdminApi()` is invoked without arguments, ANY authenticated user (such as a temporary media reviewer or volunteer coordinator) can download the entire donor database and export all donor PANs to CSV.
- **Recommended Fix:** Restrict sensitive financial and CRM endpoints to specific roles:
  ```typescript
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```

---

### 3.2 Security Weaknesses

#### Finding ATK-03: Rate Limiting Bypass via `X-Forwarded-For` Client Header Spoofing
- **Severity:** **HIGH**
- **Evidence:** `src/lib/server-utils.ts` lines 20–22:
  ```typescript
  export function clientIp(req: Request): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  }
  ```
- **Risk:** Complete bypass of rate limiting across login, donation checkout, celebration booking, and volunteer forms.
- **Affected Location:** `src/lib/server-utils.ts#L20-L22`
- **Why It Matters:** In standard deployments without a strict upstream reverse proxy that overwrites incoming client headers, any client can send a custom `X-Forwarded-For: 198.51.100.<random>` header on every request. Because `clientIp()` reads the first entry of the header directly, each request is treated as a distinct IP bucket, evading all rate limits.
- **Recommended Fix:** Ensure the hosting environment (Cloudflare, Nginx, Vercel) strips client-supplied `X-Forwarded-For` headers, or configure the application to read from a trusted platform-specific header (e.g. `cf-connecting-ip`, `x-vercel-ip`) or the true socket remote address.

#### Finding ATK-04: Public Exposure of Statutory PAN Identifiers on Web Receipt and Certificate Pages
- **Severity:** **HIGH**
- **Evidence:** `src/app/receipt/[publicId]/page.tsx` lines 73–77:
  ```typescript
  {Boolean((d.meta as Record<string, unknown>)?.donorPan) && (
    <p className="text-xs font-mono font-bold text-teal-900 mt-1">
      Donor PAN: {String((d.meta as Record<string, unknown>).donorPan)}
    </p>
  )}
  ```
  Combined with `src/app/certificate/[reference]/page.tsx` line 37:
  ```typescript
  <Link href={`/receipt/${d.publicId}`} className="...">Back to receipt</Link>
  ```
- **Risk:** Exposure of donor Permanent Account Numbers to unauthorized third parties and internet scrapers.
- **Affected Location:** `src/app/receipt/[publicId]/page.tsx#L73-L77`, `src/app/certificate/[reference]/page.tsx#L37`
- **Why It Matters:** In India, PAN is confidential tax identification data protected under privacy jurisprudence and the DPDP Act 2023. When donors share their public impact certificate on social media or WhatsApp, any viewer can click "Back to receipt" and view the donor's full, unmasked PAN and full name.
- **Recommended Fix:** Mask PAN on all public-facing pages (e.g. `XXXXXX1234`), remove the direct public navigation link from certificates to receipts, or require a phone/email OTP challenge before displaying the full tax receipt.

---

### 3.3 Missing Controls

#### Finding ATK-05: Wildcard Hostname in Next.js Image Optimization Engine
- **Severity:** **MEDIUM**
- **Evidence:** `next.config.ts` lines 31–35:
  ```typescript
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  ```
- **Risk:** Server-Side Request Forgery (SSRF) and image optimization denial of service.
- **Affected Location:** `next.config.ts#L31-L35`
- **Why It Matters:** Next.js uses an internal image optimizer route (`/_next/image`) that fetches images from remote hosts on behalf of the client. Permitting `**` as the hostname allows attackers to supply arbitrary URLs, turning the server into an open web proxy, forcing it to fetch malicious endpoints or large binary files.
- **Recommended Fix:** Restrict `remotePatterns` to trusted domains only (e.g., the Ashrama's production CDN, official storage buckets, or local `/uploads` path).

#### Finding ATK-06: Local Disk File Storage in Ephemeral Container Environments
- **Severity:** **MEDIUM**
- **Evidence:** `src/app/api/admin/upload/route.ts` lines 76–94 writes files directly to `process.cwd()/public/uploads/{safeCategory}` using Node.js `writeFile`.
- **Risk:** Loss of uploaded proof photos and child celebration videos upon container restart; public bypass of access controls.
- **Affected Location:** `src/app/api/admin/upload/route.ts#L76-L94`
- **Why It Matters:** Modern cloud platforms (AWS ECS/Fargate, Google Cloud Run, Vercel, Render) use ephemeral container filesystems. When containers restart or deploy, all uploaded photos and celebration proof documents are erased unless mounted to persistent storage or stored in object storage (S3 / GCS). Additionally, files stored in `public/` can be served directly by web servers without route-level authorization.
- **Recommended Fix:** Migrate file uploads to dedicated cloud object storage (e.g., AWS S3, Cloudflare R2, or Google Cloud Storage) with signed URLs for private assets.

---

### 3.4 Potential Risks Requiring Verification

#### Finding ATK-07: SVG Upload Cross-Site Scripting (XSS) Surface
- **Severity:** **MEDIUM**
- **Evidence:** `src/app/api/admin/upload/route.ts` line 12 lists `"image/svg+xml"` in `ALLOWED_MIME_TYPES`, but line 57 does not include `"svg"` in `SAFE_IMAGE_EXTS`.
- **Risk:** Potential Stored XSS if extension checks are ever bypassed or relaxed.
- **Affected Location:** `src/app/api/admin/upload/route.ts#L12`
- **Why It Matters:** SVGs can embed `<script>` tags and XML event handlers. If served with `image/svg+xml` without proper CSP sandbox headers or inline script sanitization, opening an SVG directly in a browser executes JavaScript in the application origin. In the current implementation, `SAFE_IMAGE_EXTS` rejects `.svg` extensions at line 66, but having it present in `ALLOWED_MIME_TYPES` creates confusion and regression risk.
- **Recommended Fix:** Remove `"image/svg+xml"` from `ALLOWED_MIME_TYPES` or ensure SVGs are sanitized using DOMPurify before saving.

---

## 4. Dependencies & Externally Reachable Surfaces

| Component / Library | Version | Reachable Surface | Known Risks & Assessment |
| :--- | :--- | :--- | :--- |
| `next` | `16.2.6` | App Router, SSR engine, image optimizer, API routes | Framework layer; must be kept up to date for Turbopack & React 19 security patches |
| `react` / `react-dom` | `19.2.6` | Frontend client/server components, HTML rendering | React 19 Server Components; sanitizes standard JSX interpolation against XSS |
| `pg` | `8.20.0` | PostgreSQL client and connection pooling | High stability; connections must utilize TLS in production (`ssl: { rejectUnauthorized: true }`) |
| `drizzle-orm` | `0.45.2` | Object-Relational Mapping & query builder | Enforces SQL parameterization across all queries |
| `qrcode` | `1.5.4` | Offline UPI QR code generation | Offline SVG/Canvas generator; does not make network calls |
| `dotenv` | `17.3.1` | Local environment variable parser | Used in CLI scripts; harmless in server runtime |
