# Janaseva Ashrama Platform — Secrets & Key Management Audit

**Document Status:** Final Audit Assessment  
**Application:** Janaseva Ashrama Platform  
**Target Scope:** Environment variables, credentials, API keys, tokens, session keys, storage files, client bundles  
**Audit Principle:** Zero secret value disclosure (type, location, pattern, and risk only)  
**Audit Date:** October 2026  

---

## 1. Secrets Inventory & Specification

The table below catalogs all secrets and sensitive configuration values expected or utilized by the platform, their functional roles, expected entropy, and consuming modules:

| Variable / Secret Identifier | Expected Secret Type | Storage Location | Consuming Files | Exposure Risk Profile |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection URI with credentials (`postgresql://user:pass@host:5432/db`) | Server `.env` | `src/db/index.ts`, `scripts/db-safe-sync.mjs`, `drizzle.config.ts` | **Critical**: Database compromise, loss of all donor PII and transaction records |
| `ADMIN_SESSION_SECRET` | HMAC-SHA256 signing key (minimum 32 random characters) | Server `.env` | `src/lib/admin-auth.ts` | **Critical**: Forgery of admin authentication cookie tokens (`janaseva_admin_session`) |
| `ADMIN_EMAIL` | Administrative login username (email format) | Server `.env` | `src/lib/admin-auth.ts` | **High**: Admin account target identification; fallback auth bypass if unset |
| `ADMIN_PASSWORD` | Administrative cleartext comparison credential | Server `.env` | `src/lib/admin-auth.ts` | **Critical**: Direct login access to administrative suite |
| `RAZORPAY_KEY_ID` | Razorpay public key ID (`rzp_test_...` or `rzp_live_...`) | Server `.env` | `src/lib/payments.ts`, `src/app/api/donations/route.ts` | **Low/Public**: Intended for public checkout initialization; must match secret environment |
| `RAZORPAY_KEY_SECRET` | Razorpay API private secret key | Server `.env` | `src/lib/payments.ts` | **Critical**: Unauthorized API payment capture, refunds, merchant account operations |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature HMAC secret | Server `.env` | `src/lib/payments.ts`, `src/app/api/razorpay/webhook/route.ts` | **High**: Inability to verify incoming payment notifications; forgery of paid webhook events |
| `ALLOW_DEMO_SEED` | Operational switch (`"true"` / `"false"`) | Server `.env` | `src/app/api/donations/route.ts`, `src/lib/content.ts` | **Medium**: If enabled in production, allows unapproved items to be purchased |
| `DB_POOL_MAX` | Integer (optional pool size) | Server `.env` | `src/db/index.ts` | **Low**: Connection saturation if misconfigured |
| `cookies.txt` (Artifact file) | HTTP Cookie store (contains active session) | Workspace Root | Local filesystem | **High**: Administrative session hijacking if exposed |

---

## 2. Environment & Configuration Handling Analysis

### 2.1 Server-Only Enforcement
- **Implementation:** `src/lib/admin-auth.ts` explicitly declares `import "server-only";` on line 1. Similarly, `src/lib/audit.ts` declares `import "server-only";`.
- **Finding:** This correctly prevents accidental bundling of server-side authentication and audit code into client-side browser JavaScript bundles. Next.js compiler will throw a build error if any client component attempts to import these modules.
- **Client Bundles:** None of the sensitive backend secrets use the `NEXT_PUBLIC_` prefix. `RAZORPAY_KEY_ID` is safely exposed to the client only during active checkout responses via API endpoints (`src/app/api/donations/route.ts` line 45).

### 2.2 Secret Retrieval Architecture
In `src/lib/admin-auth.ts`:
```typescript
function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be configured with at least 32 characters.");
  return value;
}
```
- **Finding:** `ADMIN_SESSION_SECRET` includes an explicit runtime fail-fast check requiring at least 32 characters.
- **Deficiency:** `ADMIN_PASSWORD` and `ADMIN_EMAIL` do **not** have a similar fail-fast check. In `loginAdmin`:
```typescript
const configuredEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const configuredPassword = process.env.ADMIN_PASSWORD || "";
```
If unset, both default to empty string `""`, leading to an authentication bypass condition.

---

## 3. Findings by Risk Category

### 3.1 Confirmed Vulnerabilities

#### Finding SEC-01: Admin Login Allows Authentication Bypass when `ADMIN_PASSWORD` is Unset
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
- **Risk:** Complete administrative takeover without credentials.
- **Affected Location:** `src/lib/admin-auth.ts#L62-L73` and `src/app/api/admin/login/route.ts`
- **Why It Matters:** If an administrator deploys the platform into an environment (e.g., container, staging, preview branch) where `ADMIN_PASSWORD` or `ADMIN_EMAIL` are not yet populated in the environment variables, both variables resolve to `""`. When an attacker sends a POST request with `{ "email": "", "password": "" }`, HMAC-SHA256 of `""` equals HMAC-SHA256 of `""`. Both `emailMatch` and `passMatch` evaluate to `true`. The function then provisions a new `adminUsers` record with `SUPER_ADMIN` privileges and issues a signed session cookie.
- **Recommended Fix:** Enforce a strict non-empty check at the start of `loginAdmin()` or application startup:
  ```typescript
  if (!configuredEmail || !configuredPassword || configuredPassword.length < 12) {
    throw new Error("Admin credentials are not properly configured on server.");
  }
  ```

---

### 3.2 Security Weaknesses

#### Finding SEC-02: Missing `.gitignore` Exposes `.env` and `cookies.txt` to Version Control Leakage
- **Severity:** **HIGH**
- **Evidence:** Directory inspection confirms `.gitignore` is completely absent from `D:\jana_build`. Meanwhile, `.env` (size 310 bytes) and `cookies.txt` (size 135 bytes) exist directly in the project root directory.
- **Risk:** Catastrophic credential leakage to GitHub, GitLab, or git commit history.
- **Affected Location:** Project root directory (`D:\jana_build`)
- **Why It Matters:** Any standard git command (such as `git add .` or `git commit -a`) will automatically stage the actual `.env` file containing the production database connection string, Razorpay API secrets, session signing secret, and admin password, as well as `cookies.txt` containing raw admin session tokens. Once committed to a repository, secrets remain in git reflog and commit history even if subsequent commits delete them.
- **Recommended Fix:** Immediately create `.gitignore` in the project root containing:
  ```gitignore
  .env
  .env*.local
  *.txt
  cookies.txt
  node_modules/
  .next/
  dist/
  ```

#### Finding SEC-03: Plaintext Admin Password in Environment Variables
- **Severity:** **MEDIUM**
- **Evidence:** `src/lib/admin-auth.ts` lines 64 & 67–68 compares raw input directly with `process.env.ADMIN_PASSWORD` using HMAC equality.
- **Risk:** Shoulder surfing, environment variable leakage via process dumps, APM telemetry, or hosting provider dashboard logs.
- **Affected Location:** `src/lib/admin-auth.ts#L64`
- **Why It Matters:** Industry standards (NIST SP 800-63B, OWASP ASVS) require administrative passwords to be stored as salted one-way hashes (e.g. Argon2id or bcrypt) in the database rather than cleartext strings in environment variables. Storing cleartext passwords in environment variables exposes them to any tool or sub-process that reads `process.env`.
- **Recommended Fix:** Migrate admin authentication to salted password hashes (Argon2id or bcrypt) stored in the `admin_users.password_hash` database column.

---

### 3.3 Missing Controls

#### Finding SEC-04: Lack of Automated Secret Rotation and Revocation Architecture
- **Severity:** **MEDIUM**
- **Evidence:** `src/lib/admin-auth.ts` line 18 uses a single static `ADMIN_SESSION_SECRET`. Session verification immediately rejects tokens signed with any other key (`src/lib/admin-auth.ts#L22-L30`).
- **Risk:** Service interruption during secret rotation; inability to rotate compromised session signing keys gracefully.
- **Affected Location:** `src/lib/admin-auth.ts#L18-L30`
- **Why It Matters:** If `ADMIN_SESSION_SECRET` is compromised or rotated, every active staff member is abruptly terminated, and dual-key rotation (key rollover with previous + next keys) is unsupported.
- **Recommended Fix:** Implement key versioning in session tokens (e.g. `v1.<id>.<sig>`) and support an array of valid signing keys (`[currentKey, previousKey]`) during rollover periods.

#### Finding SEC-05: Missing Sanitization of Secrets in Application Error Logging
- **Severity:** **LOW**
- **Evidence:** `src/lib/payments.ts` line 38:
  ```typescript
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status} ${await res.text()}`);
  ```
  And `src/db/index.ts` lines 6–8:
  ```typescript
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  ```
- **Risk:** Sensitive parameters or payment metadata leaking into console output or APM log collectors.
- **Affected Location:** `src/lib/payments.ts#L38`, `src/app/api/donations/verify/route.ts#L46`
- **Why It Matters:** Upstream error responses from external APIs (like Razorpay) or database connection errors may include account numbers, merchant keys, or connection parameters in their raw text responses. If unhandled or logged directly to stdout, these strings enter server log archives.
- **Recommended Fix:** Intercept error responses and sanitize any occurrence of API keys, URLs with embedded passwords, or authorization headers prior to logging.

---

### 3.4 Potential Risks Requiring Verification

#### Finding SEC-06: Verification of Razorpay Key Environment Segregation
- **Severity:** **MEDIUM**
- **Evidence:** `src/lib/payments.ts` lines 8–10 initializes Razorpay based solely on the existence of `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- **Risk:** Unintentional mixing of Razorpay Test Mode keys (`rzp_test_...`) and Live Mode keys (`rzp_live_...`) with production database records.
- **Affected Location:** `src/lib/payments.ts#L8-L10`, `.env`
- **Why It Matters:** If test keys are configured in production, real donors cannot make donations, but demo/test orders could be validated as genuine transactions. If live keys are used in development, developers testing the platform will generate real bank debits and tax-registered receipts.
- **Recommended Fix:** Verify that in `production` environments (`NODE_ENV === "production"`), `RAZORPAY_KEY_ID` begins strictly with `rzp_live_`, and in staging/development it begins with `rzp_test_`.

---

## 4. Secret Rotation Requirements & Lifecycle Guide

| Secret | Rotation Frequency | Invalidation Impact | Zero-Downtime Rotation Procedure |
| :--- | :--- | :--- | :--- |
| `ADMIN_SESSION_SECRET` | Every 90 days or on suspected breach | All active administrative sessions are invalidated | 1. Update secret in deployment environment variables.<br/>2. Restart Node instances.<br/>3. Staff re-authenticate with credentials. |
| `ADMIN_PASSWORD` | Every 60 days or on staff departure | Current admin password stops working; existing sessions persist until TTL (8 hours) | 1. Generate high-entropy password (24+ characters).<br/>2. Update `ADMIN_PASSWORD` in production environment.<br/>3. Invalidate active sessions in `admin_sessions` table (`DELETE FROM admin_sessions;`). |
| `RAZORPAY_KEY_SECRET` | Every 180 days or on key leakage | Live payment creation fails if keys do not match Razorpay dashboard | 1. Generate new Key Secret in Razorpay Dashboard (Razorpay provides a grace window where old and new keys remain valid).<br/>2. Update `RAZORPAY_KEY_SECRET` in environment variables.<br/>3. Deploy application.<br/>4. Revoke old key in Razorpay dashboard. |
| `RAZORPAY_WEBHOOK_SECRET` | Every 180 days | Webhook verification fails (`401 Invalid signature`) | 1. Update secret in Razorpay Webhooks dashboard.<br/>2. Simultaneously update `RAZORPAY_WEBHOOK_SECRET` in environment variables. |
| `DATABASE_URL` | On infrastructure changes or DB compromise | Application fails to connect to database | 1. Create new database user credentials with identical grants in PostgreSQL.<br/>2. Update `DATABASE_URL` in environment.<br/>3. Restart application.<br/>4. Revoke old user credentials in PostgreSQL. |
