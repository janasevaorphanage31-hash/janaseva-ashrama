/**
 * Unified Marketing & Conversion Tracking Library
 * Supports Meta Pixel (Facebook Pixel), Google Ads Tag (gtag.js), Google Analytics 4 (GA4),
 * and Google Tag Manager (GTM).
 *
 * Implements defensive checks to prevent runtime errors with ad blockers or unconfigured IDs.
 */

// Global type declarations for window tracking APIs
declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      loaded?: boolean;
      version?: string;
    };
    _fbq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface DonationTrackingPayload {
  amount: number;
  paymentId?: string;
  orderId?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  callerRef?: string;
  receiptId?: string;
  mode?: "live" | "demo" | "recurring";
}

/**
 * Get active tracking configuration from public env vars or runtime fallback.
 */
export function getClientTrackingConfig() {
  const metaPixelId =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_META_PIXEL_ID || "2627567804376774"
      : "2627567804376774";
  const googleAdsId =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ||
        process.env.NEXT_PUBLIC_GTAG_ID ||
        ""
      : "";
  const googleAdsConversionLabel =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || ""
      : "";

  return {
    metaPixelId,
    googleAdsId,
    googleAdsConversionLabel,
  };
}

/**
 * Safely dispatch an event to Meta Pixel (fbq).
 */
export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.fbq === "function") {
      if (params) {
        window.fbq("track", eventName, params);
      } else {
        window.fbq("track", eventName);
      }
      if (process.env.NODE_ENV === "development") {
        console.log(`[Tracking] Meta Pixel fbq('track', '${eventName}')`, params);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Tracking] window.fbq is not defined or blocked by ad-blocker.`);
      }
    }
  } catch (err) {
    console.error("[Tracking] Error calling fbq:", err);
  }
}

/**
 * Safely dispatch an event to Google Ads / GA4 (gtag).
 */
export function trackGoogleEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
      if (process.env.NODE_ENV === "development") {
        console.log(`[Tracking] Google Tag gtag('event', '${eventName}')`, params);
      }
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...params });
      if (process.env.NODE_ENV === "development") {
        console.log(`[Tracking] Pushed to window.dataLayer: ${eventName}`, params);
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Tracking] window.gtag and dataLayer are not available.`);
      }
    }
  } catch (err) {
    console.error("[Tracking] Error calling gtag:", err);
  }
}

const inMemoryTrackedKeys = new Set<string>();

/**
 * Deduplication helper to prevent duplicate purchase/donation event firings in the same browser session.
 */
export function isDonationTracked(dedupKey: string): boolean {
  if (!dedupKey) return false;
  if (inMemoryTrackedKeys.has(dedupKey)) return true;
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage?.getItem(`tracked_donation_${dedupKey}`) === "true") return true;
    if (window.localStorage?.getItem(`tracked_donation_${dedupKey}`) === "true") return true;
  } catch {
    // Storage access may be blocked in strict/private mode
  }
  return false;
}

export function markDonationTracked(dedupKey: string): void {
  if (!dedupKey) return;
  inMemoryTrackedKeys.add(dedupKey);
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.setItem(`tracked_donation_${dedupKey}`, "true");
    window.localStorage?.setItem(`tracked_donation_${dedupKey}`, "true");
  } catch {
    // Ignore storage quota or permission errors
  }
}

/**
 * Funnel Step 1: ViewContent / view_item
 * Fired when a donor views an impact tier, campaign, or donation landing page.
 */
export function trackViewContent(params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}) {
  const currency = params?.currency || "INR";
  trackMetaEvent("ViewContent", {
    content_name: params?.content_name || "Janaseva Ashrama Cause",
    content_category: params?.content_category || "Donation",
    value: params?.value || undefined,
    currency,
  });

  trackGoogleEvent("view_item", {
    currency,
    value: params?.value || undefined,
    items: [
      {
        item_name: params?.content_name || "Janaseva Ashrama Cause",
        item_category: params?.content_category || "Donation",
        price: params?.value || undefined,
      },
    ],
  });
}

/**
 * Funnel Step 2: InitiateCheckout / begin_checkout
 * Fired when a donor opens the donation form or begins payment gateway checkout.
 */
export function trackInitiateCheckout(params?: {
  content_name?: string;
  value?: number;
  currency?: string;
  num_items?: number;
}) {
  const currency = params?.currency || "INR";
  trackMetaEvent("InitiateCheckout", {
    content_name: params?.content_name || "Janaseva Ashrama Donation",
    value: params?.value || undefined,
    currency,
    num_items: params?.num_items || 1,
  });

  trackGoogleEvent("begin_checkout", {
    currency,
    value: params?.value || undefined,
    items: [
      {
        item_name: params?.content_name || "Janaseva Ashrama Donation",
        price: params?.value || undefined,
        quantity: params?.num_items || 1,
      },
    ],
  });
}

/**
 * Volunteer, Enquiry, or Donor Lead Tracking: Lead / generate_lead
 */
export function trackLead(params?: {
  content_name?: string;
  lead_type?: string;
  value?: number;
}) {
  trackMetaEvent("Lead", {
    content_name: params?.content_name || "Janaseva Ashrama Enquiry",
    content_category: params?.lead_type || "Donor Lead",
    value: params?.value || undefined,
    currency: "INR",
  });

  trackGoogleEvent("generate_lead", {
    currency: "INR",
    value: params?.value || undefined,
    lead_type: params?.lead_type || "Donor Lead",
  });
}

/**
 * Core Donation Tracking Trigger:
 * Executes the exact user-specified Razorpay success tracking logic:
 * 1. fbq('track', 'Donate', { value: donationAmount, currency: 'INR' })
 * 2. fbq('track', 'Purchase', { value: donationAmount, currency: 'INR' })
 * 3. Google Ads Purchase & Conversion Events
 */
export function trackDonationSuccess(data: DonationTrackingPayload): {
  success: boolean;
  deduplicated: boolean;
} {
  const donationAmount = Number(data.amount) || 0;
  if (donationAmount <= 0) {
    return { success: false, deduplicated: false };
  }

  const dedupKey =
    data.paymentId ||
    data.orderId ||
    data.receiptId ||
    `amt_${donationAmount}_${Date.now()}`;

  // Check if this transaction was already tracked in this session
  if (data.paymentId && isDonationTracked(dedupKey)) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Tracking] Donation ${dedupKey} already tracked; skipping duplicate.`);
    }
    return { success: true, deduplicated: true };
  }

  // 1. Meta Pixel: Fire 'Donate'
  trackMetaEvent("Donate", {
    value: donationAmount,
    currency: "INR",
    content_name: "Janaseva Ashrama Donation",
    order_id: data.orderId || undefined,
    transaction_id: data.paymentId || undefined,
    caller_ref: data.callerRef || undefined,
  });

  // 2. Meta Pixel: Fire 'Purchase' for Value Optimization & ROAS
  trackMetaEvent("Purchase", {
    value: donationAmount,
    currency: "INR",
    content_type: "donation",
    content_name: "Janaseva Ashrama Resident Boys Welfare",
    order_id: data.orderId || undefined,
    transaction_id: data.paymentId || undefined,
  });

  // 3. Google Ads / GA4: Fire 'purchase'
  const transactionId = data.paymentId || data.orderId || `txn_${Date.now()}`;
  trackGoogleEvent("purchase", {
    transaction_id: transactionId,
    value: donationAmount,
    currency: "INR",
    items: [
      {
        item_id: "donation_general",
        item_name: "Janaseva Ashrama Child Welfare Donation",
        price: donationAmount,
        quantity: 1,
      },
    ],
  });

  // 4. Google Ads: Fire 'conversion' if tag ID / conversion label is available
  const { googleAdsId, googleAdsConversionLabel } = getClientTrackingConfig();
  if (googleAdsId) {
    const sendTo = googleAdsConversionLabel
      ? `${googleAdsId}/${googleAdsConversionLabel}`
      : googleAdsId;

    trackGoogleEvent("conversion", {
      send_to: sendTo,
      value: donationAmount,
      currency: "INR",
      transaction_id: transactionId,
    });
  }

  // Mark as tracked
  markDonationTracked(dedupKey);

  return { success: true, deduplicated: false };
}
