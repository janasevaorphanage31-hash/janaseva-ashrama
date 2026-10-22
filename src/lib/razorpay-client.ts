/**
 * Centralized Razorpay Checkout Client Helper
 * Janaseva Ashrama Public Giving Platform
 * 
 * Provides robust, cross-browser, cross-device loading and opening
 * of the Razorpay Checkout modal with timeout safety, retry polling,
 * DOM readiness guarantee, and comprehensive error recovery.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Strips 4-byte UTF-8 emojis, surrogates, and unprintable characters
 * from strings passed into Razorpay frontend config.
 */
function cleanClientString(val: string | undefined | null, max = 250): string {
  if (!val) return "";
  return val
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "") // surrogate pairs (emojis)
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width spaces
    .replace(/[^\x20-\x7E\u0900-\u097F\u0C80-\u0CFF]/g, " ") // printable ASCII, Devanagari & Kannada
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * Ensures document.body is fully parsed and available before any
 * iframe or payment container initialization is performed.
 */
async function ensureDocumentBodyReady(): Promise<HTMLElement> {
  if (typeof document === "undefined") {
    throw new Error("Document is not available in non-browser environment");
  }
  if (document.body) return document.body;

  return new Promise<HTMLElement>((resolve) => {
    const check = () => {
      if (document.body) {
        resolve(document.body);
        return true;
      }
      return false;
    };

    if (check()) return;

    const onReady = () => {
      if (check()) {
        document.removeEventListener("DOMContentLoaded", onReady);
        window.removeEventListener("load", onReady);
      }
    };

    document.addEventListener("DOMContentLoaded", onReady);
    window.addEventListener("load", onReady);

    const interval = setInterval(() => {
      if (check()) clearInterval(interval);
    }, 20);
  });
}

/**
 * Ensures Razorpay container and backdrop DOM elements have top-level z-index
 * and visibility without destructively re-parenting iframes.
 */
export function ensureRazorpayContainerAttached(): void {
  if (typeof document === "undefined") return;
  try {
    const container = document.querySelector<HTMLElement>(".razorpay-container");
    if (container) {
      container.style.zIndex = "2147483647";
    }
    const backdrop = document.querySelector<HTMLElement>(".razorpay-backdrop");
    if (backdrop) {
      backdrop.style.zIndex = "2147483646";
    }
  } catch (err) {
    console.warn("[Razorpay DOM] Style check warning:", err);
  }
}

/**
 * Ensures checkout.js is loaded from checkout.razorpay.com into document.
 * Uses aggressive polling and a strict 8-second watchdog timeout so it NEVER hangs indefinitely.
 */
export async function loadRazorpayScript(timeoutMs = 8000): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const body = await ensureDocumentBodyReady();

  if (Boolean(window.Razorpay)) {
    ensureRazorpayContainerAttached();
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let resolved = false;

    // Hard safety timer: never block the UI for more than timeoutMs
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ensureRazorpayContainerAttached();
        resolve(Boolean(window.Razorpay));
      }
    }, timeoutMs);

    const checkAvailable = () => {
      if (Boolean(window.Razorpay)) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          ensureRazorpayContainerAttached();
          resolve(true);
        }
        return true;
      }
      return false;
    };

    // 1. If script tag is already in DOM, poll for window.Razorpay
    const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
    if (existing) {
      const pollInterval = setInterval(() => {
        if (checkAvailable() || resolved) {
          clearInterval(pollInterval);
        }
      }, 40);
      return;
    }

    // 2. Dynamically inject script into document.head or body
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;

      script.onload = () => {
        const pollInterval = setInterval(() => {
          if (checkAvailable() || resolved) {
            clearInterval(pollInterval);
          }
        }, 40);
      };

      script.onerror = (e) => {
        console.error("[Razorpay SDK] Failed to load checkout script:", e);
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(false);
        }
      };

      (document.head || body).appendChild(script);
    } catch (err) {
      console.error("[Razorpay SDK] Script injection error:", err);
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(false);
      }
    }
  });
}

export interface OpenRazorpayOptions {
  keyId: string;
  orderId?: string;
  subscriptionId?: string;
  amountPaise?: number;
  currency?: string;
  name?: string;
  description?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  notes?: Record<string, string>;
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    razorpay_subscription_id?: string;
  }) => void;
  onDismiss?: () => void;
  onError?: (err: any) => void;
}

/**
 * Opens the Razorpay payment gateway modal.
 * Throws a descriptive error if gateway fails to initialize or load.
 */
export async function openRazorpayCheckout(opts: OpenRazorpayOptions): Promise<void> {
  const loaded = await loadRazorpayScript(8000);
  if (!loaded || !window.Razorpay) {
    throw new Error(
      "Unable to connect to Razorpay payment gateway. Please disable ad-blockers or try direct UPI/bank transfer."
    );
  }

  ensureRazorpayContainerAttached();

  const cleanPhone = (opts.donorPhone || "").replace(/\D/g, "").slice(-10);

  // Sanitize all notes to remove emojis and length overflows
  const cleanNotes: Record<string, string> = {};
  if (opts.notes) {
    for (const [k, v] of Object.entries(opts.notes)) {
      if (v) cleanNotes[k] = cleanClientString(String(v), 200);
    }
  }

  const rzpConfig: Record<string, any> = {
    key: opts.keyId,
    currency: opts.currency || "INR",
    name: cleanClientString(opts.name || "Janaseva Ashrama Bangalore", 80),
    description: cleanClientString(opts.description || "Donation for 25 Resident Children", 120),
    prefill: {
      name: cleanClientString(opts.donorName?.trim() || "", 60),
      contact: cleanPhone,
      email: opts.donorEmail?.trim() || "donor@janasevaashrama.org",
    },
    notes: cleanNotes,
    theme: { color: "#06312f" },
    modal: {
      ondismiss: () => {
        if (opts.onDismiss) opts.onDismiss();
      },
      backdropclose: false,
      escape: true,
      handleback: true,
    },
    handler: (response: any) => {
      opts.onSuccess(response);
    },
  };

  if (opts.orderId) {
    rzpConfig.order_id = opts.orderId;
  }
  if (opts.subscriptionId) {
    rzpConfig.subscription_id = opts.subscriptionId;
  }
  if (typeof opts.amountPaise === "number" && opts.amountPaise > 0) {
    rzpConfig.amount = opts.amountPaise;
  }

  try {
    ensureRazorpayContainerAttached();
    const rzp = new window.Razorpay(rzpConfig);

    rzp.on("payment.failed", (response: any) => {
      console.error("[Razorpay Checkout] payment.failed event:", response);
      if (opts.onError) {
        opts.onError(response?.error || response);
      }
    });

    rzp.open();

    // Secondary watchdog: guarantee container and backdrop visibility
    setTimeout(() => {
      ensureRazorpayContainerAttached();
    }, 150);
  } catch (err: any) {
    console.error("[Razorpay Checkout] Failed to open gateway modal:", err);
    throw new Error(err?.message || "Failed to launch payment window. Please check your browser popup settings.");
  }
}
