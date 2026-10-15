# JANASEVA ASHRAMA — WHATSAPP CRM DEPLOYMENT & CONFIGURATION GUIDE

**System:** Janaseva WhatsApp CRM Production Deployment  
**Domain:** `https://www.janasevaashrama.org`  

---

## 1. Environment Variables Configuration

Add the following variables to `.env` (or cloud secret manager e.g. Vercel, Railway, AWS):

```env
# ==============================================================================
# META WHATSAPP CLOUD API CONFIGURATION
# ==============================================================================
WHATSAPP_BUSINESS_ACCOUNT_ID="your_meta_waba_id_here"
WHATSAPP_PHONE_NUMBER_ID="your_meta_phone_number_id_here"
WHATSAPP_ACCESS_TOKEN="your_permanent_system_user_token_here"
WHATSAPP_VERIFY_TOKEN="janaseva_waba_webhook_verify_secure_token_2026"
WHATSAPP_APP_SECRET="your_meta_app_secret_here"
META_GRAPH_API_VERSION="v21.0"

# Optional: Gemini API Key for Grounded AI Chatbot
GEMINI_API_KEY="your_gemini_api_key_here"
```

---

## 2. Meta Business Manager & Cloud API Setup Checklist

1. **Create Meta App**:
   - Go to [developers.facebook.com](https://developers.facebook.com/).
   - Create App -> Type: **Business**.
   - Add **WhatsApp** product.
2. **Configure WhatsApp Number**:
   - Link official Ashrama number (e.g. `+91 99803 59595`) or registered virtual phone ID.
   - Complete Two-Step Verification and Display Name approval ("Janaseva Ashrama").
3. **Configure Webhook**:
   - Webhook URL: `https://www.janasevaashrama.org/api/webhook/whatsapp`
   - Verify Token: Matches `WHATSAPP_VERIFY_TOKEN` in `.env`.
   - Subscribe to Webhook fields:
     - `messages` (inbound messages, interactive replies, button clicks)
     - `message_template_status_update` (template approvals/rejections)
4. **Permanent System User Access Token**:
   - In Meta Business Settings -> System Users -> Add System User (Admin role).
   - Generate Token for App with permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
   - Paste token into `WHATSAPP_ACCESS_TOKEN`.

---

## 3. Database Sync & Verification

1. Run non-destructive schema synchronization:
   ```bash
   node scripts/db-safe-sync.mjs
   ```
2. Verify table creation in PostgreSQL:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'whats_app%';
   ```
3. Run test suite:
   ```bash
   npm test
   ```
4. Access the authenticated WhatsApp CRM in Admin Dashboard:
   - Navigate to `/admin/whatsapp`
   - Open Team Inbox at `/admin/whatsapp/inbox`
