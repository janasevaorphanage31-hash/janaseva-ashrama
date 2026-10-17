# JANASEVA ASHRAMA — PRODUCTION DEPLOYMENT & OPERATIONS GUIDE

**Organization:** JANASEVA ASHRAMA  
**Production Domain:** [https://www.janasevaashrama.org](https://www.janasevaashrama.org)  
**Hosting Infrastructure:** Vercel (Production Edge Network)  
**Database Infrastructure:** Managed PostgreSQL (e.g., Neon, Supabase, AWS RDS, or Render)  
**Payment Gateway:** Razorpay  
**Communications API:** Meta WhatsApp Cloud API (Graph API v21.0)  
**AI Intelligence:** Google Gemini API  

---

## 1. Pre-Deployment Environment Variables Checklist

Configure all environment variables in your hosting provider's dashboard (e.g., Vercel Project Settings > Environment Variables):

### A. Database Connection
| Variable | Required | Description |
|:---|:---:|:---|
| `DATABASE_URL` | **Yes** | Full PostgreSQL connection URI with SSL (e.g., `postgresql://user:pass@host:5432/db?sslmode=require`) |

### B. Razorpay Payment Gateway
| Variable | Required | Description |
|:---|:---:|:---|
| `RAZORPAY_KEY_ID` | **Yes** | Live Razorpay Key ID (starts with `rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | **Yes** | Live Razorpay Secret for HMAC-SHA256 signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | Secret configured in the Razorpay Webhook Dashboard |

### C. Admin Authentication
| Variable | Required | Description |
|:---|:---:|:---|
| `ADMIN_EMAIL` | **Yes** | Primary super-administrator login email |
| `ADMIN_PASSWORD` | **Yes** | Strong initial administrative password |
| `ADMIN_SESSION_SECRET` | **Yes** | High-entropy random string (at least 32 characters) for signing session cookies |
| `ALLOW_DEMO_SEED` | **No** | **MUST BE FALSE OR OMITTED IN PRODUCTION**. Set `false` to prevent demo data from seeding into live databases. |

### D. Conversion Tracking & Marketing
| Variable | Required | Description |
|:---|:---:|:---|
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional | Meta (Facebook) Pixel ID for donation event tracking |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Optional | Google Ads Account ID (e.g., `AW-123456789`) |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | Optional | Google Ads Conversion Label for donation actions |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Optional | GTM container ID (e.g., `GTM-XXXXXXX`) |

### E. Meta WhatsApp Cloud API (Graph API v21.0)
| Variable | Required | Description |
|:---|:---:|:---|
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | Optional* | Meta WABA Account ID (*required for WhatsApp CRM) |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional* | Meta WhatsApp Phone Number ID (*required for WhatsApp CRM) |
| `WHATSAPP_ACCESS_TOKEN` | Optional* | System User Permanent Access Token with `whatsapp_business_messaging` |
| `WHATSAPP_VERIFY_TOKEN` | Optional* | High-entropy verification token entered in Meta Webhook config |
| `WHATSAPP_APP_SECRET` | Optional* | Meta App Secret for validating incoming webhook HMAC-SHA256 signatures |
| `META_GRAPH_API_VERSION` | Optional | Defaults to `v21.0` |

### F. AI Chatbot & Copilot
| Variable | Required | Description |
|:---|:---:|:---|
| `GEMINI_API_KEY` | Optional* | Google Gemini API Key for grounded donor chatbot assistance |

---

## 2. Database Setup & Migrations

The database layer utilizes Drizzle ORM configured with PostgreSQL.

### Step 1: Push Schema to Production Database
Run this command from your terminal or CI pipeline:
```bash
npm run db:push
```
This inspects `src/db/schema.ts` and synchronizes all tables, indices, and constraints in the PostgreSQL database without dropping existing tables.

### Step 2: Verify Schema Integrity
Execute the automated test suite to verify table availability:
```bash
node --test tests/db-schema.test.mjs
node --test tests/whatsapp-tables-exist.test.mjs
```

---

## 3. Build & Pre-Flight Verification

Before pushing to production, execute the 3-step verification suite:

```bash
# 1. Typecheck entire TypeScript codebase (strict mode)
npm run typecheck

# 2. Run all automated tests (75 suites)
npm test

# 3. Create production Next.js build
npm run build
```

Expected output:
- `tsc --noEmit` exits with **0 errors**.
- `node --test tests/**/*.test.mjs` exits with **75 passing tests**.
- Next.js build generates all static and dynamic routes successfully.

---

## 4. Vercel Deployment Instructions

1. **Link Repository:**
   - In the Vercel Dashboard, select **Add New Project**.
   - Select your GitHub repository (`jana_build` or `janaseva-production`).
   - Choose the `main` branch.
2. **Configure Framework & Root:**
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Node.js Version: **20.x**
3. **Inject Environment Variables:**
   - Paste all required environment variables into the Vercel Environment Variables section.
4. **Trigger Deployment:**
   - Click **Deploy**. Vercel will pull the `main` branch, build the static pages, compile serverless functions, and deploy to the global edge network.
5. **Assign Custom Domain:**
   - In Vercel Project Settings > Domains, add:
     - `www.janasevaashrama.org` (Primary Domain with SSL)
     - `janasevaashrama.org` (Redirects to `www.janasevaashrama.org`)

---

## 5. Meta WhatsApp Cloud API Webhook Configuration

To receive inbound donor messages and delivery statuses:

1. Open the [Meta Developer Dashboard](https://developers.facebook.com/).
2. Select your App > **WhatsApp** > **Configuration**.
3. Under **Webhook**, click **Edit**:
   - **Callback URL:** `https://www.janasevaashrama.org/api/whatsapp/webhook`
   - **Verify Token:** Enter the exact value configured in `WHATSAPP_VERIFY_TOKEN`.
4. Click **Verify and Save**.
5. Under **Webhook fields**, click **Manage** and subscribe to:
   - `messages` (Inbound messages and button clicks)
   - `message_deliveries` (Delivery status updates)
   - `message_reads` (Read receipts)

---

## 6. Razorpay Webhook Configuration

To ensure background payment capture and recurring subscription billing:

1. Open the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. Enter settings:
   - **Webhook URL:** `https://www.janasevaashrama.org/api/razorpay/webhook`
   - **Secret:** Enter the exact value configured in `RAZORPAY_WEBHOOK_SECRET`.
   - **Active Events:**
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `subscription.charged`
     - `subscription.cancelled`
4. Click **Create Webhook**.

---

## 7. Production Monitoring & Rollback Strategy

### Health Monitoring
- Verify homepage loading: `curl -I https://www.janasevaashrama.org` (should return `HTTP/2 200`).
- Verify robots.txt: `curl https://www.janasevaashrama.org/robots.txt`.
- Verify sitemap: `curl https://www.janasevaashrama.org/sitemap.xml`.

### Instant Rollback via Vercel
In the event of an unforeseen issue:
1. Open the Vercel Dashboard for your project.
2. Navigate to the **Deployments** tab.
3. Locate the previous stable deployment commit.
4. Click the three dots (`...`) menu and select **Instant Rollback**.
5. Traffic will immediately point to the previous build in <1 second without downtime.
