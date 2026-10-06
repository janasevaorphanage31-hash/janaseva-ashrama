# Janaseva Ashrama Platform — Comprehensive Security Checklist & Audit

**Document Status:** Final Audit Assessment  
**Application:** Janaseva Ashrama Platform  
**Architecture:** Next.js 16.2.6, PostgreSQL, Drizzle ORM, Razorpay Gateway, Node.js Local Filesystem  
**Target Coverage:** 20 Core Security Domains  
**Audit Date:** October 2026  

---

## 1. 20-Domain Security Checklist Matrix

| # | Domain | Status | Key Mechanism in Code | Critical Finding / Gap Reference |
| :---: | :--- | :---: | :--- | :--- |
| **01** | **Authentication** | ⚠️ Partial | `loginAdmin()` via HMAC comparison against `ADMIN_EMAIL` & `ADMIN_PASSWORD` | **CHK-01:** Empty-credential authentication bypass if environment variables are unset |
| **02** | **Authorization & RBAC** | ⚠️ Partial | `requireAdminApi(allowedRoles)` on select endpoints | **CHK-02:** Missing role restrictions on CRM, exports, celebrations, and site-content |
| **03** | **Session & Token Security** | ✅ Strong | HMAC-SHA256 token signing with DB session storage, 8h TTL, `httpOnly`, `sameSite: "lax"` | Cookie lacks `secure: true` in local development; no session rotation on privilege change |
| **04** | **Input Validation** | ⚠️ Partial | `clean()`, `normalizePhone()`, `isEmail()`, numeric bounds | **CHK-03:** Unverified client-provided `paymentStatus` on public celebration endpoint |
| **05** | **Injection Defense** | ✅ Verified | Drizzle ORM parameterized SQL queries (`$1, $2, ...`), CSV formula prefix escaping | Completely protected against SQLi and CSV formula injection |
| **06** | **XSS & CSRF Defense** | ⚠️ Partial | React 19 automatic JSX escaping, `sameSite: "lax"` cookies, sandbox CSP on uploads | **CHK-04:** Missing global Content-Security-Policy (CSP) header in `next.config.ts` |
| **07** | **API Security** | ✅ Strong | Cryptographic Razorpay checkout and webhook HMAC verification, server-side pricing | Robust financial integrity on core donation flow |
| **08** | **Rate Limiting & Abuse** | ⚠️ Partial | In-memory sliding window bucket limiter across public routes | **CHK-05:** Rate limiter bypassable via client-controlled `X-Forwarded-For` header |
| **09** | **File Uploads** | ⚠️ Partial | Whitelisted extensions, MIME inspection, 50MB limit, canonical path resolution | **CHK-06:** Uploads stored on local ephemeral disk; public bypass via `/public/uploads` |
| **10** | **Database Security** | ✅ Strong | Drizzle ORM schema with foreign key constraints, connection pool with 5s timeout | No TLS connection requirement enforced in `src/db/index.ts` connection string |
| **11** | **Secrets Management** | ❌ Deficient | `server-only` imports, runtime 32-char check on `ADMIN_SESSION_SECRET` | **CHK-07:** Missing `.gitignore` allows accidental git commit of `.env` and `cookies.txt` |
| **12** | **Encryption & Transport** | ✅ Strong | HSTS header (2-year preload), timingSafeEqual on cryptographic compares | Full transit encryption required; DB column-level encryption for PAN missing |
| **13** | **CORS Configuration** | ⚠️ Partial | Next.js default same-origin protection for credentialed browser fetch | No explicit CORS policy configured; open to simple cross-origin POST requests |
| **14** | **Dependency Security** | ✅ Strong | Minimal dependency tree (`next`, `react`, `pg`, `drizzle-orm`, `qrcode`) | Wildcard image proxy pattern (`hostname: "**"`) in `next.config.ts` creates SSRF surface |
| **15** | **Logging & Monitoring** | ⚠️ Partial | Database table `audit_logs` tracking changes via `writeAudit()` | **CHK-08:** Missing audit logging on CRM PII access, CSV exports, and celebration deletes |
| **16** | **Admin Security** | ⚠️ Partial | Guarded admin routes, timed session invalidation | No Multi-Factor Authentication (MFA/2FA); no brute-force account lockout |
| **17** | **Deployment & Infrastructure** | ⚠️ Partial | Turbopack SSR build, production environment separation | Lack of `src/middleware.ts` global edge perimeter; ephemeral file loss risk |
| **18** | **Data Privacy (DPDP / IT Act)** | ❌ Deficient | Email masking (`maskEmail`) on donation receipt | **CHK-09:** Full unmasked Indian PAN rendered on public receipt and linked from certificate |
| **19** | **Error Handling** | ✅ Strong | Try/catch blocks with sanitized generic user error messages | Raw upstream Razorpay/DB text may occasionally log sensitive data to stdout |
| **20** | **Backup & Recovery** | ⚠️ Partial | Idempotent migrations (`db-safe-sync.mjs`), non-destructive schema migrations | No automated database backup or object storage backup orchestration in codebase |

---

## 2. Detailed Findings by Classification

### 2.1 Confirmed Vulnerabilities

---

#### Finding CHK-01: Authentication Bypass on Admin Login via Empty Environment Fallback
- **Classification:** **Confirmed Vulnerability**
- **Severity:** **CRITICAL**
- **Evidence:** `src/lib/admin-auth.ts` lines 62–73:
  ```typescript
  export async function loginAdmin(email: string, password: string) {
    const configuredEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const configuredPassword = process.env.ADMIN_PASSWORD || "";
    const emailBuf = createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest();
    const confEmailBuf = createHmac("sha256", secret()).update(configuredEmail).digest();
    const passBuf = createHmac("sha256", secret()).update(password).digest();
    const confPassBuf = createHmac("sha256", secret()).update(configuredPassword).digest();

    const emailMatch = timingSafeEqual(emailBuf, confEmailBuf);
    const passMatch = timingSafeEqual(passBuf, confPassBuf);
    if (!emailMatch || !passMatch) return false;
  ```
- **Risk:** Complete administrative takeover without valid credentials.
- **Affected Location:** `src/lib/admin-auth.ts#L62-L73` & `src/app/api/admin/login/route.ts`
- **Why It Matters:** When `ADMIN_EMAIL` and `ADMIN_PASSWORD` are not explicitly defined in the execution environment, both fallback to empty strings (`""`). An attacker submitting `{ "email": "", "password": "" }` matches both HMAC comparisons (`timingSafeEqual` returns true). The system then creates a `SUPER_ADMIN` record with an empty email and issues a valid administrative session cookie.
- **Recommended Fix:** Refuse authentication and fail fast if environment credentials are not explicitly configured:
  ```typescript
  if (!configuredEmail || !configuredPassword || configuredPassword.length < 12) {
    throw new Error("Admin credentials are not configured in environment variables.");
  }
  ```

---

#### Finding CHK-03: Unverified Client-Provided Payment Status Injection on Celebration Bookings
- **Classification:** **Confirmed Vulnerability**
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
- **Risk:** Unauthorized creation of confirmed, unpaid Special Day meal sponsorship bookings.
- **Affected Location:** `src/app/api/celebrations/route.ts#L31-L75`
- **Why It Matters:** Public users can submit POST requests containing `{ "paymentStatus": "paid" }`. The server stores `paymentStatus: "paid"` and assigns `celebrationStatus: "CONFIRMED"` without communicating with the payment gateway or verifying funds transfer. Staff viewing the admin dashboard will treat these bookings as genuine and prepare meals at the Ashrama without receiving funds.
- **Recommended Fix:** Ignore client-supplied `paymentStatus` in `POST /api/celebrations`. Always initialize bookings with `paymentStatus: "pending"` and `celebrationStatus: "PENDING"`. Only update status upon verified payment webhook or authenticated staff override.

---

### 2.2 Security Weaknesses

---

#### Finding CHK-02: Broken Function-Level Authorization (BFLA) on CRM Donations, CSV Export, and Celebrations
- **Classification:** **Security Weakness**
- **Severity:** **HIGH**
- **Evidence:** 
  - `src/app/api/admin/crm/donations/route.ts` line 8: `const session = await requireAdminApi();`
  - `src/app/api/admin/crm/export/route.ts` line 18: `const session = await requireAdminApi();`
  - `src/app/api/admin/celebrations/route.ts` lines 9, 72, 132, 160: `const session = await requireAdminApi();`
  - `src/app/api/admin/site-content/route.ts` lines 6, 14: `const session = await requireAdminApi();`
- **Risk:** Low-privileged administrative staff (e.g., `MEDIA_REVIEWER`, `VOLUNTEER_ADMIN`, `CONTENT_ADMIN`) accessing full donor lists, tax PANs, transaction histories, and deleting celebration bookings.
- **Affected Location:** `src/app/api/admin/crm/donations/route.ts`, `src/app/api/admin/crm/export/route.ts`, `src/app/api/admin/celebrations/route.ts`, `src/app/api/admin/site-content/route.ts`
- **Why It Matters:** The platform defines specialized roles (`SUPER_ADMIN`, `STAFF_ADMIN`, `FINANCE`, `CONTENT_ADMIN`, `DONATION_ADMIN`, `CAMPAIGN_ADMIN`, `CSR_ADMIN`, `VOLUNTEER_ADMIN`, `MEDIA_REVIEWER`, `PARTNER_ADMIN`). When `requireAdminApi()` is called without arguments, any valid session cookie bypasses role checks. A volunteer coordinator or external media reviewer can download the full database of donors, including PAN numbers and phone numbers.
- **Recommended Fix:** Pass mandatory role arrays to all admin route handlers:
  ```typescript
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE"]);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```

---

#### Finding CHK-05: Rate Limiting Bypass via Spoofed `X-Forwarded-For` Client Headers
- **Classification:** **Security Weakness**
- **Severity:** **HIGH**
- **Evidence:** `src/lib/server-utils.ts` lines 20–22:
  ```typescript
  export function clientIp(req: Request): string {
    return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  }
  ```
- **Risk:** Evading brute-force protection on `/api/admin/login` and anti-spam protection on public forms.
- **Affected Location:** `src/lib/server-utils.ts#L20-L22`
- **Why It Matters:** If the server is deployed without a reverse proxy that actively strips incoming `X-Forwarded-For` headers from client requests, an attacker can append a unique `X-Forwarded-For` IP address on every request. This resets the rate limit bucket, allowing thousands of password attempts or form spam submissions.
- **Recommended Fix:** Do not trust the leftmost `x-forwarded-for` entry from untrusted clients. Rely on trusted edge headers provided by your cloud provider (e.g. `cf-connecting-ip` on Cloudflare, `x-vercel-ip` on Vercel) or configure your reverse proxy (Nginx) to strip untrusted client headers.

---

#### Finding CHK-07: Missing `.gitignore` Exposes Secrets and Session Cookies to Git Repositories
- **Classification:** **Security Weakness**
- **Severity:** **HIGH**
- **Evidence:** The file `.gitignore` is completely absent from `D:\jana_build`. Both `.env` (310 bytes) and `cookies.txt` (135 bytes) exist in the root directory.
- **Risk:** Unintentional leakage of production database credentials, Razorpay API secret keys, admin signing secrets, and live session cookies into git commit logs and remote repositories.
- **Affected Location:** Root workspace directory (`D:\jana_build`)
- **Why It Matters:** Executing `git add .` or running automated CI/CD staging tools will capture sensitive environment files. Once committed to git history, removing secrets requires history rewriting and immediate key revocation.
- **Recommended Fix:** Create a strict `.gitignore` file immediately and add `.env`, `*.env`, `cookies.txt`, `node_modules/`, and `.next/`.

---

#### Finding CHK-09: Unmasked Statutory PAN Disclosure on Web Receipt and Certificate Pages
- **Classification:** **Security Weakness**
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
- **Risk:** Unlawful disclosure of Indian Permanent Account Numbers (PAN), enabling identity theft and violating India's Digital Personal Data Protection (DPDP) Act 2023.
- **Affected Location:** `src/app/receipt/[publicId]/page.tsx#L73-L77` and `src/app/certificate/[reference]/page.tsx#L37`
- **Why It Matters:** Donors frequently share their impact certificate links with friends, family, and on social media. Because the certificate links directly to the receipt page, anyone clicking the link can read the donor's unmasked 10-character PAN and full name without authentication.
- **Recommended Fix:** Mask the PAN (display only the last 4 characters, e.g. `XXXXXX1234`), remove the unauthenticated "Back to receipt" link on the certificate page, and restrict full tax receipt access to donors who verify their phone or email via OTP.

---

### 2.3 Missing Controls

---

#### Finding CHK-04: Absence of Global Content-Security-Policy (CSP) Header
- **Classification:** **Missing Control**
- **Severity:** **MEDIUM**
- **Evidence:** `next.config.ts` lines 3–28 defines security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`). A `Content-Security-Policy` header is completely absent from the global headers array.
- **Risk:** Cross-Site Scripting (XSS) exploitation via malicious third-party script injection or inline script injection.
- **Affected Location:** `next.config.ts#L3-L28`
- **Why It Matters:** Content-Security-Policy is the primary browser-side defense against XSS and clickjacking. While Next.js App Router and React 19 mitigate many reflected XSS vectors, a missing CSP leaves the browser without defense if an XSS vulnerability is introduced in third-party scripts or unescaped HTML content.
- **Recommended Fix:** Add a strict CSP header in `next.config.ts` allowing scripts only from `'self'` and trusted payment domains (`https://checkout.razorpay.com`, `https://api.razorpay.com`).

---

#### Finding CHK-06: Local Disk File Storage in Ephemeral Container Environments
- **Classification:** **Missing Control**
- **Severity:** **MEDIUM**
- **Evidence:** `src/app/api/admin/upload/route.ts` line 80:
  ```typescript
  const uploadDir = join(process.cwd(), "public", "uploads", safeCategory);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);
  ```
- **Risk:** Total loss of uploaded meal celebration proofs and volunteer media upon container restart; bypass of route-level authorization via direct static file serving.
- **Affected Location:** `src/app/api/admin/upload/route.ts#L80-L94`
- **Why It Matters:** In cloud platforms (Vercel, AWS ECS, Google Cloud Run), container filesystems are read-only or ephemeral. Files written to local disk disappear when new containers deploy. Furthermore, storing files in `public/` means any web server or CDN caching layer may serve them directly, ignoring the access controls and sandbox CSP defined in `src/app/uploads/[...path]/route.ts`.
- **Recommended Fix:** Store media uploads in cloud object storage (AWS S3, Google Cloud Storage, or Cloudflare R2) and serve sensitive proofs via signed, time-limited URLs.

---

#### Finding CHK-08: Missing Audit Logging on Sensitive CRM Access and Record Deletion
- **Classification:** **Missing Control**
- **Severity:** **MEDIUM**
- **Evidence:** `src/app/api/admin/crm/donations/route.ts`, `src/app/api/admin/crm/export/route.ts`, and `src/app/api/admin/celebrations/route.ts` do not invoke `writeAudit()`.
- **Risk:** Complete inability to perform forensic analysis following an unauthorized donor data breach or malicious record deletion.
- **Affected Location:** `src/app/api/admin/crm/export/route.ts`, `src/app/api/admin/celebrations/route.ts`
- **Why It Matters:** When an administrative account downloads the entire donor database containing thousands of contact records and PAN numbers, or when a user deletes a celebration booking, zero audit records are inserted into `audit_logs`. There is no trail showing which staff account performed the action or from what IP address.
- **Recommended Fix:** Invoke `writeAudit()` on all data exports, bulk reads of PII, and record deletions:
  ```typescript
  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "export_crm_donations",
    entity: "donation",
    ipAddress: clientIp(req),
  });
  ```

---

### 2.4 Potential Risks Requiring Verification

---

#### Finding CHK-10: Wildcard Hostname Image Proxying via Next.js Optimizer
- **Classification:** **Potential Risk Requiring Verification**
- **Severity:** **MEDIUM**
- **Evidence:** `next.config.ts` line 33:
  ```typescript
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  ```
- **Risk:** Server-Side Request Forgery (SSRF) and server resource exhaustion.
- **Affected Location:** `next.config.ts#L33`
- **Why It Matters:** The Next.js image optimization endpoint (`/_next/image`) acts as a server-side proxy. Allowing `hostname: "**"` permits external users to request images from any HTTPS domain on the internet. Attackers can abuse this to probe internal networks, trigger outbound requests to malicious servers, or exhaust server CPU by processing massive remote images.
- **Recommended Fix:** Replace wildcard `**` with an explicit whitelist of trusted external image hostnames (e.g. AWS S3 bucket, Cloudinary, YouTube image CDN).

---

## 3. Prioritized Security Recommendations

1. **Immediate (Blocker for Production Launch):**
   - Implement fail-fast non-empty validation for `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `src/lib/admin-auth.ts`.
   - Add `.gitignore` to project root and ensure `.env` and `cookies.txt` are never committed to version control.
   - Enforce server-side payment verification on `/api/celebrations` so that public requests cannot inject `paymentStatus: "paid"`.
   - Mask Indian PAN on the public receipt page and remove the direct link from certificates to receipts.

2. **High Priority (Before Public Traffic Scaling):**
   - Enforce role-based access control (`requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE"])`) on `/api/admin/crm/*` and `/api/admin/celebrations`.
   - Introduce `src/middleware.ts` to provide a unified edge authentication guard for all routes under `/admin/*` and `/api/admin/*`.
   - Implement audit logging via `writeAudit()` for CSV exports and celebration booking deletions.
   - Restrict `next.config.ts` image `remotePatterns` to trusted domains rather than `**`.

3. **Medium Priority (Architecture Hardening):**
   - Transition file uploads from local disk `public/uploads/` to private cloud object storage (S3 / Cloudflare R2).
   - Configure global Content-Security-Policy (CSP) headers in `next.config.ts`.
   - Integrate Redis or edge-based rate limiting (e.g. Upstash) to support multi-instance horizontal scaling.
   - Migrate administrative credentials from environment variable comparisons to salted Argon2id password hashes in PostgreSQL.
