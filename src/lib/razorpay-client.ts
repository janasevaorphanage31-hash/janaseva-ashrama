/**
 * Centralized Razorpay Checkout Client Helper
 * Janaseva Ashrama Public Giving Platform
 * 
 * Provides robust, cross-browser, cross-device loading and opening
 * of the Razorpay Checkout modal with retry polling, popup safety,
 * and error recovery.
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

/**
 * Ensures checkout.js is loaded from checkout.razorpay.com.
 * Uses aggressive polling and script tag reuse to avoid duplicate injection.
 */
export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (Boolean(window.Razorpay)) return true;

  // 1. If script tag is already in DOM, poll for window.Razorpay
  const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
  if (existing) {
    for (let i = 0; i < 50; i++) {
      if (Boolean(window.Razorpay)) return true;
      await new Promise((r) => setTimeout(r, 60));
    }
    if (Boolean(window.Razorpay)) return true;
  }

  // 2. Dynamically inject script into head
  return new Promise<boolean>((resolve) => {
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.crossOrigin = "anonymous";

      script.onload = async () => {
        // Allow constructor initialization
        for (let i = 0; i < 30; i++) {
          if (Boolean(window.Razorpay)) {
            resolve(true);
            return;
          }
          await new Promise((r) => setTimeout(r, 50));
        }
        resolve(Boolean(window.Razorpay));
      };

      script.onerror = (e) => {
        console.error("[Razorpay SDK] Failed to load checkout script:", e);
        resolve(false);
      };

      (document.head || document.body).appendChild(script);
    } catch (err) {
      console.error("[Razorpay SDK] Injection error:", err);
      resolve(false);
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
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error(
      "Unable to open secure payment gateway. Please check your internet connection or disable ad-blockers and try again."
    );
  }

  const cleanPhone = (opts.donorPhone || "").replace(/\D/g, "").slice(-10);

  const rzpConfig: Record<string, any> = {
    key: opts.keyId,
    currency: opts.currency || "INR",
    name: opts.name || "Janaseva Ashrama Bangalore",
    description: opts.description || "Donation for 25 Resident Children",
    prefill: {
      name: opts.donorName?.trim() || "",
      contact: cleanPhone,
      email: opts.donorEmail?.trim() || "donor@janasevaashrama.org",
    },
    notes: opts.notes || {},
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

  const rzp = new window.Razorpay(rzpConfig);

  rzp.on("payment.failed", (response: any) => {
    console.error("[Razorpay Checkout] payment.failed event:", response);
    if (opts.onError) {
      opts.onError(response?.error || response);
    }
  });

  rzp.open();
}
