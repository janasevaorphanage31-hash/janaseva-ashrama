import crypto from "node:crypto";

/**
 * Meta WhatsApp Cloud API Service & Helper Utilities
 * Official Graph API v21.0 direct integration for Janaseva Ashrama
 */

export interface MetaConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  apiVersion: string;
}

export function getMetaConfig(): MetaConfig {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "janaseva_waba_webhook_verify_secure_token_2026",
    apiVersion: process.env.META_GRAPH_API_VERSION || "v21.0",
  };
}

/**
 * Normalizes phone numbers to standard E.164 and Meta-compatible formats.
 * Primarily handles Indian mobile numbers (+91), ensuring 10-digit formats are properly prefixed.
 */
export function normalizePhoneNumber(rawPhone: string): {
  e164: string;
  metaTo: string;
  isValid: boolean;
} {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { e164: "", metaTo: "", isValid: false };
  }

  // Strip non-digits
  let digits = rawPhone.replace(/\D/g, "");

  // If starts with 0 (e.g. 09980359595), strip leading zero
  if (digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // Standard Indian 10-digit number (e.g. 9980359595)
  if (digits.length === 10) {
    digits = "91" + digits;
  }

  // Standard Indian 12-digit number (e.g. 919980359595)
  const isValid = digits.length >= 10 && digits.length <= 15;

  return {
    e164: "+" + digits,
    metaTo: digits,
    isValid,
  };
}

/**
 * Cryptographically verifies Meta's X-Hub-Signature-256 header.
 */
export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  appSecret?: string
): boolean {
  const secret = appSecret || process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signatureHeader) return false;

  const expectedPrefix = "sha256=";
  if (!signatureHeader.startsWith(expectedPrefix)) return false;

  const providedHash = signatureHeader.slice(expectedPrefix.length);
  const calculatedHash = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  try {
    const providedBuf = Buffer.from(providedHash, "hex");
    const calculatedBuf = Buffer.from(calculatedHash, "hex");
    if (providedBuf.length !== calculatedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, calculatedBuf);
  } catch {
    return false;
  }
}

/**
 * Opt-out / Opt-in Regulatory Keywords (TRAI & Meta Compliance)
 */
const OPT_OUT_KEYWORDS = new Set([
  "stop",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
  "stop promo",
  "optout",
  "opt out",
]);

const OPT_IN_KEYWORDS = new Set(["start", "unstop", "subscribe", "optin", "opt in"]);

export function isOptOutKeyword(text?: string | null): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.has(clean);
}

export function isOptInKeyword(text?: string | null): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  return OPT_IN_KEYWORDS.has(clean);
}

/**
 * Base Meta Graph API Request
 */
async function callMetaGraphApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const config = getMetaConfig();
  if (!config.accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is not configured.");
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${endpoint}`;
  const headers = {
    Authorization: `Bearer ${config.accessToken}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Meta API request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    (err as any).status = response.status;
    (err as any).metaError = data?.error;
    throw err;
  }

  return data;
}

/**
 * Send Direct Text Message (Within 24-hour service window)
 */
export async function sendWhatsAppTextMessage(params: {
  to: string;
  text: string;
  previewUrl?: boolean;
}): Promise<{ wamId: string; recipientId: string }> {
  const config = getMetaConfig();
  const normalized = normalizePhoneNumber(params.to);

  if (!normalized.isValid) {
    throw new Error(`Invalid phone number for WhatsApp message: ${params.to}`);
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalized.metaTo,
    type: "text",
    text: {
      preview_url: params.previewUrl ?? true,
      body: params.text,
    },
  };

  const res = await callMetaGraphApi(`${config.phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const wamId = res?.messages?.[0]?.id || "";
  const recipientId = res?.contacts?.[0]?.wa_id || normalized.metaTo;

  return { wamId, recipientId };
}

/**
 * Send Pre-Approved Template Message (Utility / Marketing)
 */
export async function sendWhatsAppTemplateMessage(params: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}): Promise<{ wamId: string; recipientId: string }> {
  const config = getMetaConfig();
  const normalized = normalizePhoneNumber(params.to);

  if (!normalized.isValid) {
    throw new Error(`Invalid phone number for WhatsApp template: ${params.to}`);
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalized.metaTo,
    type: "template",
    template: {
      name: params.templateName,
      language: {
        code: params.languageCode || "en",
      },
      components: params.components || [],
    },
  };

  const res = await callMetaGraphApi(`${config.phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const wamId = res?.messages?.[0]?.id || "";
  const recipientId = res?.contacts?.[0]?.wa_id || normalized.metaTo;

  return { wamId, recipientId };
}

/**
 * Send Media Message (Image, Video, or Document/Receipt PDF)
 */
export async function sendWhatsAppMediaMessage(params: {
  to: string;
  type: "image" | "video" | "document";
  mediaUrl: string;
  caption?: string;
  filename?: string;
}): Promise<{ wamId: string; recipientId: string }> {
  const config = getMetaConfig();
  const normalized = normalizePhoneNumber(params.to);

  if (!normalized.isValid) {
    throw new Error(`Invalid phone number for WhatsApp media: ${params.to}`);
  }

  const mediaObj: Record<string, any> = { link: params.mediaUrl };
  if (params.caption) mediaObj.caption = params.caption;
  if (params.filename && params.type === "document") mediaObj.filename = params.filename;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalized.metaTo,
    type: params.type,
    [params.type]: mediaObj,
  };

  const res = await callMetaGraphApi(`${config.phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const wamId = res?.messages?.[0]?.id || "";
  const recipientId = res?.contacts?.[0]?.wa_id || normalized.metaTo;

  return { wamId, recipientId };
}

/**
 * Fetch Official Meta Approved Templates from WABA
 */
export async function fetchMetaTemplates(): Promise<any[]> {
  const config = getMetaConfig();
  if (!config.businessAccountId) {
    return [];
  }

  const data = await callMetaGraphApi(`${config.businessAccountId}/message_templates?limit=100`, {
    method: "GET",
  });

  return data?.data || [];
}

/**
 * WhatsApp Integration Health Check
 */
export async function getWhatsAppHealth(): Promise<{
  configured: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  status: "OK" | "MISCONFIGURED" | "API_ERROR";
  phoneDetails?: any;
  error?: string;
}> {
  const config = getMetaConfig();

  if (!config.phoneNumberId || !config.accessToken) {
    return {
      configured: false,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      status: "MISCONFIGURED",
      error: "Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN",
    };
  }

  try {
    const details = await callMetaGraphApi(config.phoneNumberId, { method: "GET" });
    return {
      configured: true,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      status: "OK",
      phoneDetails: details,
    };
  } catch (err: any) {
    return {
      configured: true,
      phoneNumberId: config.phoneNumberId,
      businessAccountId: config.businessAccountId,
      status: "API_ERROR",
      error: err?.message || "Failed to contact Meta Graph API",
    };
  }
}

/**
 * Webhook Inbound Message Structure
 */
export interface InboundWhatsAppMessage {
  wamId: string;
  from: string;
  normalizedFrom: string;
  name?: string;
  type: "text" | "interactive" | "button" | "image" | "video" | "document" | "unknown";
  text?: string;
  buttonPayload?: string;
  mediaId?: string;
  mimeType?: string;
  timestamp: Date;
}

export interface InboundWhatsAppStatus {
  wamId: string;
  recipientId: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
  errorCode?: string;
  errorTitle?: string;
}

/**
 * Parses raw Meta Webhook body into strongly-typed messages and statuses
 */
export function parseMetaWebhookPayload(body: any): {
  messages: InboundWhatsAppMessage[];
  statuses: InboundWhatsAppStatus[];
} {
  const messages: InboundWhatsAppMessage[] = [];
  const statuses: InboundWhatsAppStatus[] = [];

  if (!body || body.object !== "whatsapp_business_account") {
    return { messages, statuses };
  }

  const entries = body.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      if (change.field !== "messages") continue;
      const value = change.value;
      if (!value) continue;

      // Inbound Messages
      if (Array.isArray(value.messages)) {
        const profileMap = new Map<string, string>();
        if (Array.isArray(value.contacts)) {
          for (const c of value.contacts) {
            if (c.wa_id && c.profile?.name) {
              profileMap.set(c.wa_id, c.profile.name);
            }
          }
        }

        for (const msg of value.messages) {
          const from = msg.from || "";
          const normalized = normalizePhoneNumber(from);
          const name = profileMap.get(from) || "";
          const msgType = msg.type;
          let text: string | undefined;
          let buttonPayload: string | undefined;
          let mediaId: string | undefined;
          let mimeType: string | undefined;

          if (msgType === "text") {
            text = msg.text?.body;
          } else if (msgType === "interactive") {
            if (msg.interactive?.type === "button_reply") {
              buttonPayload = msg.interactive.button_reply.id;
              text = msg.interactive.button_reply.title;
            } else if (msg.interactive?.type === "list_reply") {
              buttonPayload = msg.interactive.list_reply.id;
              text = msg.interactive.list_reply.title;
            }
          } else if (msgType === "button") {
            buttonPayload = msg.button?.payload;
            text = msg.button?.text;
          } else if (msgType === "image" || msgType === "video" || msgType === "document") {
            mediaId = msg[msgType]?.id;
            mimeType = msg[msgType]?.mime_type;
            text = msg[msgType]?.caption;
          }

          const unixTs = parseInt(msg.timestamp, 10);
          const timestamp = !isNaN(unixTs) ? new Date(unixTs * 1000) : new Date();

          messages.push({
            wamId: msg.id,
            from,
            normalizedFrom: normalized.e164,
            name,
            type: (msgType as any) || "unknown",
            text,
            buttonPayload,
            mediaId,
            mimeType,
            timestamp,
          });
        }
      }

      // Outbound Message Delivery Status Updates
      if (Array.isArray(value.statuses)) {
        for (const st of value.statuses) {
          const unixTs = parseInt(st.timestamp, 10);
          const timestamp = !isNaN(unixTs) ? new Date(unixTs * 1000) : new Date();

          let errorCode: string | undefined;
          let errorTitle: string | undefined;

          if (Array.isArray(st.errors) && st.errors.length > 0) {
            errorCode = String(st.errors[0].code);
            errorTitle = st.errors[0].title || st.errors[0].message;
          }

          statuses.push({
            wamId: st.id,
            recipientId: st.recipient_id,
            status: st.status as any,
            timestamp,
            errorCode,
            errorTitle,
          });
        }
      }
    }
  }

  return { messages, statuses };
}
