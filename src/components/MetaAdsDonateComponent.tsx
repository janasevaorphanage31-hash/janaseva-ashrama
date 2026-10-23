"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatINR, SITE, FORM_10AC, BANK_DETAILS, JJ_ACT_REGISTRATION } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import {
  trackDonationSuccess,
  trackViewContent,
  trackInitiateCheckout,
} from "@/lib/tracking";
import { numberToIndianWords } from "@/lib/number-words";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  sanitizePan,
} from "@/lib/validation";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { useCart } from "./CartProvider";
import QRCode from "qrcode";

export interface PresetTier {
  amt: number;
  label: string;
  name: string;
  impact: string;
  badge?: string;
  icon: string;
  featured?: boolean;
}

const PRESET_TIERS: PresetTier[] = [
  {
    amt: 11,
    label: "₹11",
    name: "Cow Milk",
    impact: "1 warm glass of pure cow milk for 1 boy",
    badge: "Shagun",
    icon: "🥛",
  },
  {
    amt: 51,
    label: "₹51",
    name: "Breakfast",
    impact: "Hot breakfast (steaming idlis & sambar) for a child",
    badge: "Shagun",
    icon: "🍲",
  },
  {
    amt: 101,
    label: "₹101",
    name: "Satvik Meal",
    impact: "Full hot satvik lunch or dinner for 1 boy",
    badge: "Daily Punya",
    icon: "🍛",
  },
  {
    amt: 251,
    label: "₹251",
    name: "Vidya Kit",
    impact: "Full school notebooks & stationery kit",
    badge: "Education",
    icon: "📚",
  },
  {
    amt: 501,
    label: "₹501",
    name: "3-Day Care",
    impact: "3 days nutritious meals & pediatric doctor care",
    badge: "Arogya",
    icon: "🩺",
  },
  {
    amt: 1000,
    label: "₹1,000",
    name: "Feeds 1 Week",
    impact: "Feeds an orphaned child for a whole week + tutoring",
    badge: "1 Week Food",
    icon: "🍲",
  },
  {
    amt: 2500,
    label: "₹2,500",
    name: "25 Boys Feast",
    impact: "Special festive hot lunch feast for all 25 boys",
    badge: "Most Popular ★",
    icon: "🍛",
    featured: true,
  },
  {
    amt: 4500,
    label: "₹4,500",
    name: "Full Day Seva",
    impact: "All 4 meals (Full Day Annadana) for all 25 boys",
    badge: "24-Hr Annadana",
    icon: "✨",
  },
];

const OCCASIONS = [
  { id: "general", label: "🌸 General Seva", sub: "Daily meal & child care" },
  { id: "birthday", label: "🎂 Birthday Blessing", sub: "Celebrant birthday prayer" },
  { id: "anniversary", label: "💍 Wedding Anniversary", sub: "Family welfare blessing" },
  { id: "memorial", label: "🕊️ In Loving Memory", sub: "Pious remembrance" },
];

const FAQS = [
  {
    q: "Will I get an 80G tax exemption receipt for ₹11 or any amount?",
    a: "Yes! Every single contribution, starting from ₹11 upwards, is legally tax-deductible under Section 80G Form 10AC (URN: AABTJ7431MF20231). Your official digital receipt is sent immediately to your WhatsApp and email.",
  },
  {
    q: "Can I visit Janaseva Ashrama in Bengaluru to meet the boys?",
    a: "Yes, visitors are warmly welcome 7 days a week between 9:00 AM and 7:00 PM. We are located in Turahalli, Bengaluru South 560061. You can celebrate your birthday or family anniversary directly with the 25 boys.",
  },
  {
    q: "What payment methods are supported?",
    a: "You can donate instantly via Google Pay, PhonePe, Paytm, BHIM, Cred, any UPI app, Debit Cards, Credit Cards, or Net Banking from all major Indian banks.",
  },
  {
    q: "How does my contribution reach the 25 resident boys?",
    a: "100% of your donation is allocated directly to fresh kitchen groceries (Sona Masoori rice, Toor dal, fresh vegetables, cow milk), school uniforms, textbooks, and routine doctor checkups under Karnataka Govt JJ Act registration KA18CH0242.",
  },
];

function getDynamicImpactText(amt: number): string {
  if (amt <= 0) return "Choose or enter any sacred amount to support 25 resident boys.";
  if (amt === 11) return "Provides 1 glass of warm, pure cow milk for a young boy before morning shlokas.";
  if (amt === 21) return "Provides fresh bananas & seasonal study fruits for a child.";
  if (amt === 51) return "Serves a steaming hot breakfast (idlis, sambar & chutney) fresh from the kitchen.";
  if (amt === 101) return "Provides a full hot satvik lunch with rice, sambar, and fresh vegetables for 1 boy.";
  if (amt === 251) return "Provides a full set of school notebooks, pencils, and geometry stationery.";
  if (amt === 501) return "Sponsors 3 full days of satvik meals, morning milk, and pediatric wellness care.";
  if (amt === 1000) return "Feeds an orphaned boy with all nutritious meals for an entire week + evening tutoring.";
  if (amt === 2500) return "Hosts a special festive hot lunch feast with sweet payasam for all 25 boys.";
  if (amt === 4500) return "Sponsors complete 24-hour 4-meal Annadana (breakfast, lunch, evening snacks & dinner) for all 25 boys.";
  if (amt < 50) return `Your gift of ${formatINR(amt)} provides warm cow milk and morning study fruit for resident boys.`;
  if (amt < 200) return `Your gift of ${formatINR(amt)} serves wholesome hot meals to the children at Janaseva Ashrama today.`;
  if (amt < 1000) return `Your noble gift of ${formatINR(amt)} covers fresh kitchen staples, vegetables & doctor care.`;
  if (amt < 3000) return `Your generous sponsorship of ${formatINR(amt)} provides nutritious feasts & textbooks for resident boys.`;
  return `Your noble contribution of ${formatINR(amt)} covers full-day Annadana, monthly pantry staples & holistic shelter care for all 25 boys.`;
}

export function MetaAdsDonateComponent() {
  const searchParams = useSearchParams();

  // URL Attribution & UTM tracking
  const [callerRef] = useState<string>(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) return urlRef.trim().toUpperCase();
    if (typeof window !== "undefined") {
      try {
        return (
          sessionStorage.getItem("antigravity_caller_ref") ||
          localStorage.getItem("antigravity_caller_ref") ||
          "DIRECT"
        );
      } catch {}
    }
    return "DIRECT";
  });
  const [leadId] = useState<string>(() => searchParams.get("lead_id") || "");

  // Amount State (Starts from ₹11 upwards; defaults to URL param, cart.total, or ₹2,500 flagship)
  const [amount, setAmount] = useState<number>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 1000000 && PRESET_TIERS.some((t) => t.amt === parsed)) {
        return parsed;
      }
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("janaseva-cart-v1");
        if (raw) {
          const parsedCart = JSON.parse(raw);
          const savedCustom = Number(parsedCart.custom);
          if (savedCustom >= 10 && savedCustom <= 1000000) {
            return savedCustom;
          }
        }
      } catch {}
    }
    return 2500; // Flagship 25 boys feast tier default
  });

  const [customAmount, setCustomAmount] = useState<string>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 1000000 && !PRESET_TIERS.some((t) => t.amt === parsed)) {
        return String(parsed);
      }
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("janaseva-cart-v1");
        if (raw) {
          const parsedCart = JSON.parse(raw);
          const savedCustom = Number(parsedCart.custom);
          if (savedCustom >= 10 && savedCustom <= 1000000 && !PRESET_TIERS.some((t) => t.amt === savedCustom)) {
            return String(savedCustom);
          }
        }
      } catch {}
    }
    return "";
  });

  // Donor Details (Validated before proceeding to payment)
  const [donorName, setDonorName] = useState(() => searchParams.get("name") || "");
  const [donorPhone, setDonorPhone] = useState(() => (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10));
  const [donorEmail, setDonorEmail] = useState(() => (searchParams.get("email") || "").trim().toLowerCase());
  const [donorPan, setDonorPan] = useState("");
  const [showPanInput, setShowPanInput] = useState(false);
  const [occasion, setOccasion] = useState("general");
  const [showOccasionSelect, setShowOccasionSelect] = useState(() => Boolean(searchParams.get("occasion")));
  const [prayerNote, setPrayerNote] = useState("");

  // Alternate payment rails (Direct UPI / Bank Wire expandable drawers)
  const [showDirectUpi, setShowDirectUpi] = useState(false);
  const [showBankTransfer, setShowBankTransfer] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const cart = useCart();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Honeypot anti-spam
  const [honeypot, setHoneypot] = useState("");

  // Form Validation Errors
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    pan?: string;
    amount?: string;
    general?: string;
  }>({});

  // DOM Refs for smooth focus and scroll
  const topCardRef = useRef<HTMLDivElement>(null);
  const detailsCardRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const initializedFromCartRef = useRef(false);

  // Synchronize amount state ONCE on mount from searchParams or cart
  useEffect(() => {
    if (initializedFromCartRef.current) return;

    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 1000000) {
        initializedFromCartRef.current = true;
        if (PRESET_TIERS.some((t) => t.amt === parsed)) {
          setAmount(parsed);
          setCustomAmount("");
        } else {
          setAmount(parsed);
          setCustomAmount(String(parsed));
        }
        if (cart.setDedicatedAmount) {
          cart.setDedicatedAmount(parsed);
        }
        return;
      }
    }

    if (cart.hydrated) {
      initializedFromCartRef.current = true;
      if (cart.total >= 10) {
        if (PRESET_TIERS.some((t) => t.amt === cart.total)) {
          setAmount(cart.total);
          setCustomAmount("");
        } else {
          setAmount(cart.total);
          setCustomAmount(String(cart.total));
        }
      }
    }
  }, [cart.hydrated, searchParams, cart.setDedicatedAmount, cart.total]);

  // Sync occasion from searchParams
  useEffect(() => {
    const urlOccasion = searchParams.get("occasion");
    if (urlOccasion) {
      const matchingOcc = OCCASIONS.find(
        (o) => o.id === urlOccasion.toLowerCase() || o.label.toLowerCase() === urlOccasion.toLowerCase()
      );
      if (matchingOcc) {
        setOccasion(matchingOcc.id);
        setShowOccasionSelect(true);
      }
    }
  }, [searchParams]);

  // Derived effective donation amount
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const amountWords = finalAmount >= 10 ? numberToIndianWords(finalAmount) : "";
  const taxDeductionAmount = Math.round(finalAmount * 0.5); // 50% deduction under Section 80G

  // Dynamic Official UPI Link for Janaseva Ashrama
  const upiId = "9980359595@okbizaxis";
  const upiUri = `upi://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(
    `Donation for 25 Boys by ${donorName.trim() || "Supporter"}`
  )}`;
  const gpayUri = `gpay://upi/pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(
    `Donation for 25 Boys by ${donorName.trim() || "Supporter"}`
  )}`;
  const phonepeUri = `phonepe://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(
    `Donation for 25 Boys by ${donorName.trim() || "Supporter"}`
  )}`;
  const paytmUri = `paytmmp://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent(
    `Donation for 25 Boys by ${donorName.trim() || "Supporter"}`
  )}`;

  useEffect(() => {
    if (finalAmount > 0) {
      QRCode.toDataURL(upiUri, {
        width: 220,
        margin: 1,
        color: { dark: "#052f2c", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [finalAmount, upiUri]);

  // Dynamic Impact Description
  const impactSummary = getDynamicImpactText(finalAmount);

  // Track ViewContent on mount
  useEffect(() => {
    trackViewContent({
      content_name: "Standard Donor Checkout",
      content_category: "Child Welfare & Annadana",
      value: finalAmount || 2500,
      currency: "INR",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectTier = (amt: number) => {
    setAmount(amt);
    setCustomAmount("");
    clearFieldError("amount");
    if (cart.setDedicatedAmount) {
      cart.setDedicatedAmount(amt);
    }
    trackViewContent({
      content_name: `Select Tier ₹${amt}`,
      content_category: "Child Welfare",
      value: amt,
      currency: "INR",
    });
  };

  // Sticky bottom bar trigger on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (!topCardRef.current) return;
      const rect = topCardRef.current.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const clearFieldError = (field: keyof typeof formErrors) => {
    if (formErrors[field] || formErrors.general) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        delete next.general;
        return next;
      });
    }
  };

  const handleCopyBank = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(field);
      setTimeout(() => setCopiedBankField(null), 2500);
    }
  };

  /**
   * Strict Donor Validation Gate:
   * Validates Amount, Name, WhatsApp Mobile, Email, and PAN.
   * If any field fails, smoothly scrolls to and focuses the first invalid input!
   */
  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    // 1. Amount validation
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 10) {
      errors.amount = "Please choose or enter a contribution amount (minimum ₹10).";
      setFormErrors(errors);
      topCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }

    // 2. Name validation (Mandatory for 80G receipt and morning prayer blessing)
    const nameVal = validateName(donorName, "Full name");
    if (!nameVal.valid) {
      errors.name = nameVal.error || "Please enter your full name for the official 80G tax receipt.";
      setFormErrors(errors);
      detailsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => nameInputRef.current?.focus(), 250);
      return false;
    }

    // 3. WhatsApp Mobile validation (Mandatory 10-digit Indian phone)
    const phoneVal = validatePhone(donorPhone, true, "WhatsApp mobile number");
    if (!phoneVal.valid) {
      errors.phone = phoneVal.error || "Please enter your 10-digit WhatsApp number to receive your instant receipt.";
      setFormErrors(errors);
      detailsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => phoneInputRef.current?.focus(), 250);
      return false;
    }

    // 4. Email validation (Optional, but if entered must be valid)
    if (donorEmail.trim()) {
      const emailVal = validateEmail(donorEmail, false);
      if (!emailVal.valid) {
        errors.email = emailVal.error || "Please enter a valid email address or leave it empty.";
        setFormErrors(errors);
        detailsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    }

    // 5. PAN validation (If toggle is enabled or PAN is entered)
    if (showPanInput && donorPan.trim()) {
      const panVal = validatePan(donorPan, true);
      if (!panVal.valid) {
        errors.pan = panVal.error || "Please enter a valid 10-character PAN (e.g. ABCDE1234F).";
        setFormErrors(errors);
        detailsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => panInputRef.current?.focus(), 250);
        return false;
      }
    }

    setFormErrors({});
    return true;
  };

  /**
   * Handles payment initiation after strict validation.
   */
  const handlePayNow = async () => {
    // 1. Enforce strict validation
    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);
    setFormErrors({});

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      const selectedOccasionLabel =
        OCCASIONS.find((o) => o.id === occasion)?.label || "General Seva";
      const cleanOccasion = selectedOccasionLabel.replace(/[^\w\s-]/g, "").trim() || "General Seva";
      const cleanPrayerNote = prayerNote.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim();

      // 2. Initialize Razorpay order on server with verified donor details
      const res = await fetch("/api/v1/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          callerRefId: callerRef,
          leadId: leadId || undefined,
          donorName: donorName.trim(),
          donorPhone: donorPhone.replace(/\D/g, "").slice(-10),
          donorEmail: donorEmail.trim() || undefined,
          donorPan: donorPan.trim().toUpperCase() || undefined,
          occasion: cleanOccasion,
          prayerNote: cleanPrayerNote || undefined,
          website_hp: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        clearTimeout(safetyTimer);
        throw new Error(data.error || "Failed to initialize payment gateway. Please try again.");
      }

      // Funnel Step: Meta Pixel InitiateCheckout Event
      trackInitiateCheckout({
        content_name: `Support 25 Boys - ${cleanOccasion}`,
        value: finalAmount,
        currency: "INR",
        num_items: 1,
      });

      // 3. Open Live Razorpay Gateway
      if (data.orderId && data.keyId) {
        await openRazorpayCheckout({
          keyId: data.keyId,
          orderId: data.orderId,
          amountPaise: data.amount,
          currency: data.currency || "INR",
          name: "Janaseva Ashrama Bangalore",
          description: `Sponsor 25 Resident Boys · ${cleanOccasion}`,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim() || undefined,
          notes: {
            caller_ref_id: callerRef,
            lead_id: leadId || "",
            donor_name: donorName.trim(),
            donor_phone: donorPhone.trim(),
            occasion: cleanOccasion,
            prayer_note: cleanPrayerNote,
          },
          onDismiss: () => {
            clearTimeout(safetyTimer);
            setLoading(false);
          },
          onError: (err: any) => {
            clearTimeout(safetyTimer);
            setLoading(false);
            setFormErrors({
              general:
                "Browser popup was interrupted. You can complete your donation instantly with 0% fee using Direct UPI or QR code below!",
            });
            setShowDirectUpi(true);
          },
          onSuccess: async (response) => {
            clearTimeout(safetyTimer);
            trackDonationSuccess({
              amount: finalAmount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              donorName: donorName.trim(),
              donorPhone: donorPhone.trim(),
              donorEmail: donorEmail.trim(),
              callerRef,
              mode: "live",
            });

            try {
              await fetch("/api/v1/webhooks/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  event: "payment.captured",
                  payload: {
                    payment: {
                      entity: {
                        id: response.razorpay_payment_id,
                        order_id: response.razorpay_order_id,
                        amount: data.amount,
                        currency: "INR",
                        status: "captured",
                        notes: {
                          caller_ref_id: callerRef,
                          lead_id: leadId || "",
                          donor_name: donorName.trim(),
                          donor_phone: donorPhone.trim(),
                          donor_email: donorEmail.trim(),
                          occasion: cleanOccasion,
                          prayer_note: cleanPrayerNote,
                        },
                      },
                    },
                  },
                }),
              });
            } catch (webhookErr) {
              console.warn("Attribution webhook delivery:", webhookErr);
            }

            window.location.href = `/thank-you?amount=${finalAmount}&payment_id=${encodeURIComponent(
              response.razorpay_payment_id || ""
            )}&order_id=${encodeURIComponent(
              response.razorpay_order_id || ""
            )}&ref=${encodeURIComponent(callerRef)}`;
          },
        });
      } else if (data.mode === "demo") {
        const demoPaymentId = `pay_sim_${Date.now()}`;
        await fetch("/api/v1/webhooks/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "simulate_donation",
            callerRefId: callerRef,
            amount: finalAmount,
            donorName: donorName.trim(),
            donorPhone: donorPhone.trim(),
            paymentId: demoPaymentId,
            leadId: leadId ? Number(leadId) : undefined,
          }),
        }).catch(() => {});

        trackDonationSuccess({
          amount: finalAmount,
          paymentId: demoPaymentId,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim(),
          callerRef,
          mode: "demo",
        });

        window.location.href = `/thank-you?amount=${finalAmount}&payment_id=${demoPaymentId}&ref=${encodeURIComponent(
          callerRef
        )}&demo=true`;
      } else {
        throw new Error(data.error || "Payment gateway could not generate an order. Please try again.");
      }
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setFormErrors({
        general:
          err.message ||
          "Payment gateway connection could not be opened. You can complete your donation instantly using Direct UPI or QR code below.",
      });
      setShowDirectUpi(true);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg pb-24 sm:pb-16 animate-fadeIn">
      {/* Invisible Honeypot anti-bot protection */}
      <input
        type="text"
        name="website_hp"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        style={{ display: "none" }}
      />

      {/* ── 1. UNIFIED COMPACT TRUST & URGENT NEED BAR (Mobile Optimized) ── */}
      <div className="mb-3 rounded-2xl bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 p-3 sm:p-3.5 text-white shadow-md border border-amber-400/30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LogoMark size={36} className="shadow-xs ring-1 ring-amber-400/60 shrink-0" />
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                Janaseva Ashrama Bangalore
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-300">
                Official 80G Tax-Exempt Donation · 25 Resident Boys
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <span className="rounded-full bg-emerald-500/30 border border-emerald-400/60 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-200">
              🛡️ 80G Tax Free
            </span>
            <span className="text-[8px] sm:text-[9px] text-white/70 font-mono">
              Govt: {JJ_ACT_REGISTRATION.registrationNumber}
            </span>
          </div>
        </div>

        {/* Live Urgent Need Banner */}
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
            </span>
            <span className="text-white/90 truncate text-[10px] sm:text-[11px] font-medium">
              <strong className="text-amber-200 font-bold">Urgent Need:</strong> 6 Meals needed tonight. Even ₹11 blesses a child.
            </span>
          </div>
          <span className="text-[10px] font-black text-amber-300 shrink-0 bg-white/10 px-1.5 py-0.5 rounded">
            19/25 Sponsored
          </span>
        </div>
      </div>

      {/* ── GLOBAL ERROR ALERT ── */}
      {formErrors.general && (
        <div className="mb-3 rounded-2xl bg-rose-50 border border-rose-300 p-3 text-xs text-rose-800 font-semibold flex items-start gap-2 shadow-sm">
          <span className="text-base leading-none shrink-0">⚠️</span>
          <div className="flex-1 leading-relaxed">{formErrors.general}</div>
        </div>
      )}

      {/* ── MAIN CHECKOUT CONTAINER ── */}
      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-xl border-2 border-amber-400/40 space-y-4">

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1: CHOOSE CONTRIBUTION AMOUNT (COMPACT MOBILE CHIPS)
        ══════════════════════════════════════════════════════════════════ */}
        <section ref={topCardRef} aria-labelledby="step-1-heading" className="space-y-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-teal-900/10">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-950 text-[11px] font-black text-amber-300">
                1
              </span>
              <h2 id="step-1-heading" className="text-xs sm:text-sm font-black uppercase tracking-wider text-teal-950">
                Select Sacred Contribution:
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-800">
              ✓ Starts ₹11 · 80G Tax Free
            </span>
          </div>

          {/* Compact Amount Chips Grid (4 columns on mobile for maximum space efficiency) */}
          <div className="grid grid-cols-4 gap-1.5">
            {PRESET_TIERS.map((tier) => {
              const isSelected = amount === tier.amt && !customAmount;
              return (
                <button
                  key={tier.amt}
                  type="button"
                  onClick={() => handleSelectTier(tier.amt)}
                  className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer tap-scale flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-teal-950 text-white border-amber-400 ring-2 ring-amber-400 shadow-md font-black"
                      : "bg-cream/60 hover:bg-cream text-teal-950 border-teal-900/15"
                  } ${tier.featured ? "col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{tier.icon}</span>
                    <span className={`text-xs sm:text-sm font-black ${isSelected ? "text-amber-300" : "text-teal-950"}`}>
                      {tier.label}
                    </span>
                  </div>
                  <span className={`text-[9px] truncate w-full block mt-0.5 ${isSelected ? "text-white/90" : "text-teal-950/70"}`}>
                    {tier.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Input Box */}
          <div className="rounded-xl bg-cream/40 p-2.5 border border-teal-900/15 space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="meta-custom-amount"
                className="text-[11px] font-bold uppercase tracking-wider text-teal-950 flex items-center gap-1"
              >
                <span>✏️</span>
                <span>Or Enter Custom Amount:</span>
              </label>
              {customAmount && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomAmount("");
                    setAmount(2500);
                    if (cart.setDedicatedAmount) cart.setDedicatedAmount(2500);
                  }}
                  className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  Reset (₹2,500)
                </button>
              )}
            </div>

            <div className="relative flex items-center rounded-xl border border-teal-900/20 bg-white px-3 py-1 focus-within:border-teal-900 focus-within:ring-2 focus-within:ring-amber-400 transition">
              <span className="font-display text-lg font-black text-teal-950 select-none mr-1.5">
                ₹
              </span>
              <input
                ref={customInputRef}
                id="meta-custom-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Type amount (e.g. 51, 500, 2500)"
                value={customAmount}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "");
                  setCustomAmount(clean);
                  clearFieldError("amount");
                  const num = parseFloat(clean);
                  if (clean && num >= 10 && num <= 1000000) {
                    setAmount(num);
                    if (cart.setDedicatedAmount) cart.setDedicatedAmount(num);
                  }
                }}
                className="w-full bg-transparent py-1.5 text-base font-black text-teal-950 placeholder:text-teal-950/35 placeholder:font-normal outline-none"
              />
              {customAmount && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomAmount("");
                    if (cart.setDedicatedAmount) cart.setDedicatedAmount(amount);
                  }}
                  className="text-xs font-bold text-teal-900/50 hover:text-teal-900 p-1 cursor-pointer shrink-0"
                  title="Clear amount"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Add Chips */}
            <div className="flex items-center gap-1 pt-0.5 overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-bold text-teal-950/60 uppercase shrink-0">Add:</span>
              {[100, 250, 500, 1000, 2500].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => {
                    const current = customAmount ? parseFloat(customAmount) || 0 : amount;
                    const next = current + inc;
                    setAmount(next);
                    setCustomAmount(String(next));
                    clearFieldError("amount");
                    if (cart.setDedicatedAmount) cart.setDedicatedAmount(next);
                  }}
                  className="rounded-lg bg-white hover:bg-teal-950 hover:text-white border border-teal-900/15 px-2 py-0.5 text-[10px] font-bold text-teal-950 transition cursor-pointer shadow-2xs shrink-0"
                >
                  +{formatINR(inc)}
                </button>
              ))}
            </div>

            {formErrors.amount && (
              <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                <span>⚠️</span> {formErrors.amount}
              </p>
            )}
          </div>

          {/* Compact Live Impact & Tax Summary */}
          <div className="rounded-xl bg-amber-50/70 p-2.5 border border-amber-300/80 text-xs text-amber-950 flex items-center justify-between gap-2 shadow-2xs">
            <div className="min-w-0 flex items-center gap-1.5">
              <span className="text-base select-none shrink-0">🌸</span>
              <p className="font-semibold text-teal-950 leading-snug text-[11px] truncate">
                {impactSummary}
              </p>
            </div>
            <span className="rounded bg-emerald-100 text-emerald-900 font-bold text-[9px] px-1.5 py-0.5 shrink-0">
              Claim ₹{taxDeductionAmount.toLocaleString("en-IN")} (80G)
            </span>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2: DONOR DETAILS (REQUIRED FOR 80G RECEIPT & PRAYERS)
        ══════════════════════════════════════════════════════════════════ */}
        <section ref={detailsCardRef} aria-labelledby="step-2-heading" className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-teal-900/10">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-950 text-[11px] font-black text-amber-300">
                2
              </span>
              <h2 id="step-2-heading" className="text-xs sm:text-sm font-black uppercase tracking-wider text-teal-950">
                Donor Details for 80G Tax Receipt &amp; Blessings
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-rose-600">
              * Required
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Full Name Field */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="donor-full-name" className="text-xs font-bold text-teal-950">
                  Full Name <span className="text-rose-600 font-black">*</span>
                </label>
                <span className="text-[10px] text-teal-950/60">For 80G certificate &amp; prayers</span>
              </div>
              <input
                ref={nameInputRef}
                id="donor-full-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Ramesh Kumar / Ananya Sharma"
                value={donorName}
                onChange={(e) => {
                  setDonorName(e.target.value);
                  clearFieldError("name");
                }}
                className={`w-full rounded-xl border p-2 text-base sm:text-sm text-teal-950 outline-none transition ${
                  formErrors.name
                    ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                    : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                }`}
              />
              {formErrors.name && (
                <p className="mt-0.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <span>⚠️</span> {formErrors.name}
                </p>
              )}
            </div>

            {/* WhatsApp Mobile Number Field */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="donor-whatsapp-phone" className="text-xs font-bold text-teal-950">
                  WhatsApp Mobile Number <span className="text-rose-600 font-black">*</span>
                </label>
                <span className="text-[10px] text-emerald-700 font-bold">Instant receipt delivery</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-black text-teal-950/70 select-none">
                  +91
                </span>
                <input
                  ref={phoneInputRef}
                  id="donor-whatsapp-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={donorPhone}
                  onChange={(e) => {
                    setDonorPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    clearFieldError("phone");
                  }}
                  className={`w-full rounded-xl border py-2 pl-11 pr-3 text-base sm:text-sm font-bold text-teal-950 outline-none transition ${
                    formErrors.phone
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                  }`}
                />
              </div>
              {formErrors.phone && (
                <p className="mt-0.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <span>⚠️</span> {formErrors.phone}
                </p>
              )}
            </div>

            {/* Email Address Field (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="donor-email-address" className="text-xs font-bold text-teal-950">
                  Email Address <span className="text-teal-950/50 font-normal">(Optional)</span>
                </label>
                <span className="text-[10px] text-teal-950/60">PDF tax receipt backup</span>
              </div>
              <input
                id="donor-email-address"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={donorEmail}
                onChange={(e) => {
                  setDonorEmail(e.target.value);
                  clearFieldError("email");
                }}
                className={`w-full rounded-xl border p-2 text-base sm:text-sm text-teal-950 outline-none transition ${
                  formErrors.email
                    ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                    : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                }`}
              />
              {formErrors.email && (
                <p className="mt-0.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <span>⚠️</span> {formErrors.email}
                </p>
              )}
            </div>

            {/* Optional 80G PAN & Dedication Toggles */}
            <div className="pt-0.5 flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowPanInput(!showPanInput)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                  showPanInput
                    ? "bg-teal-950 text-white border-teal-950"
                    : "bg-cream/70 text-teal-900 border-teal-900/15 hover:bg-cream"
                }`}
              >
                <span>📜</span>
                <span>{showPanInput ? "Hide PAN" : "+ Add PAN (80G Form 10BE)"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOccasionSelect(!showOccasionSelect)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                  showOccasionSelect
                    ? "bg-teal-950 text-white border-teal-950"
                    : "bg-cream/70 text-teal-900 border-teal-900/15 hover:bg-cream"
                }`}
              >
                <span>🎂</span>
                <span>{showOccasionSelect ? "Hide Dedication" : "+ Dedicate (Birthday / Memorial)"}</span>
              </button>
            </div>

            {/* Expandable PAN Input */}
            {showPanInput && (
              <div className="rounded-xl bg-cream/40 p-3 border border-teal-900/15 animate-fadeIn space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="donor-pan-number" className="text-xs font-bold text-teal-950">
                    PAN Card Number (10 Characters)
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold">Form 10BE</span>
                </div>
                <input
                  ref={panInputRef}
                  id="donor-pan-number"
                  type="text"
                  maxLength={10}
                  autoCapitalize="characters"
                  placeholder="ABCDE1234F"
                  value={donorPan}
                  onChange={(e) => {
                    setDonorPan(sanitizePan(e.target.value));
                    clearFieldError("pan");
                  }}
                  className={`w-full rounded-xl border p-2 text-base sm:text-sm font-mono uppercase text-teal-950 outline-none transition ${
                    formErrors.pan
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                  }`}
                />
                {formErrors.pan && (
                  <p className="text-xs text-rose-600 font-semibold">⚠️ {formErrors.pan}</p>
                )}
              </div>
            )}

            {/* Expandable Dedication / Occasion */}
            {showOccasionSelect && (
              <div className="rounded-xl bg-cream/40 p-3 border border-teal-900/15 animate-fadeIn space-y-2">
                <label className="block text-xs font-bold text-teal-950">
                  Select Auspicious Dedication:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setOccasion(occ.id)}
                      className={`p-1.5 rounded-lg text-left border text-xs cursor-pointer transition ${
                        occasion === occ.id
                          ? "bg-teal-950 text-white font-bold border-teal-950"
                          : "bg-white text-teal-950 border-teal-900/15"
                      }`}
                    >
                      <p className="font-bold text-[11px]">{occ.label}</p>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Prayer wish or family member names..."
                  value={prayerNote}
                  onChange={(e) => setPrayerNote(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/20 bg-white p-2 text-xs text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3: PRIMARY 1-TAP PAYMENT ACTION (INSTANT GATEWAY)
        ══════════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="step-3-heading" className="space-y-2.5 pt-1">
          {/* Big Primary CTA Button */}
          <button
            type="button"
            onClick={handlePayNow}
            disabled={loading}
            className="focus-ring tap-scale w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed animate-heartbeat"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Connecting Secure Gateway...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO PAY {formatINR(finalAmount)}</span>
                <span>💝 →</span>
              </>
            )}
          </button>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold text-teal-950/70 text-center">
            <span>⚡ 1-Tap Pay via</span>
            <span className="rounded bg-teal-900/10 px-1 py-0.2 text-[9px] font-black text-teal-900">Google Pay</span>
            <span className="rounded bg-teal-900/10 px-1 py-0.2 text-[9px] font-black text-teal-900">PhonePe</span>
            <span className="rounded bg-teal-900/10 px-1 py-0.2 text-[9px] font-black text-teal-900">Paytm</span>
            <span className="rounded bg-teal-900/10 px-1 py-0.2 text-[9px] font-black text-teal-900">Cards</span>
            <span>· 🔒 256-Bit SSL · Instant 80G Receipt</span>
          </div>

          {/* Secondary Direct UPI & Bank Transfer Accordion Links */}
          <div className="pt-1 flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowDirectUpi(!showDirectUpi);
                setShowBankTransfer(false);
              }}
              className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer inline-flex items-center gap-1 text-[11px]"
            >
              <span>📱</span>
              <span>{showDirectUpi ? "Hide QR Code" : "Pay via Direct UPI / QR Code"}</span>
            </button>

            <span className="text-teal-950/30">|</span>

            <button
              type="button"
              onClick={() => {
                setShowBankTransfer(!showBankTransfer);
                setShowDirectUpi(false);
              }}
              className="font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer inline-flex items-center gap-1 text-[11px]"
            >
              <span>🏦</span>
              <span>{showBankTransfer ? "Hide Bank Wire" : "Axis Bank Wire"}</span>
            </button>
          </div>

          {/* Direct UPI Drawer */}
          {showDirectUpi && (
            <div className="rounded-2xl bg-cream/50 p-4 border border-teal-900/15 animate-fadeIn text-center space-y-3">
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-950 px-2.5 py-0.5 text-[10px] font-black uppercase">
                ⚡ Scan &amp; Pay (0% Platform Fee)
              </span>

              {qrDataUrl && (
                <div className="flex justify-center my-1">
                  <div className="p-2 bg-white rounded-2xl border-2 border-amber-400/50 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="Janaseva Ashrama UPI QR Code"
                      className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-teal-900/15 text-left text-xs">
                <div>
                  <span className="text-[9px] font-bold text-teal-900/60 uppercase block">Official Trust UPI:</span>
                  <p className="font-mono text-xs font-black text-teal-950">{upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyBank(upiId, "upi")}
                  className="rounded-lg bg-teal-900 text-white px-2 py-1 text-[10px] font-bold hover:bg-teal-950 cursor-pointer"
                >
                  {copiedBankField === "upi" ? "✓ Copied" : "Copy UPI"}
                </button>
              </div>

              {/* 1-Tap Mobile App Links */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <a
                  href={gpayUri}
                  className="p-2 rounded-xl bg-white border border-teal-900/15 hover:border-emerald-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-1.5 text-xs"
                >
                  <span>🟢 Google Pay</span>
                </a>
                <a
                  href={phonepeUri}
                  className="p-2 rounded-xl bg-white border border-teal-900/15 hover:border-purple-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-1.5 text-xs"
                >
                  <span>🟣 PhonePe</span>
                </a>
              </div>

              {/* WhatsApp Receipt Button */}
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  `Namaste Janaseva Ashrama, I have completed a direct UPI donation of ₹${finalAmount} for the 25 resident boys.\n\nDonor Name: ${donorName.trim() || "Well-Wisher"}\nMobile: ${donorPhone.trim() || "Mobile"}${donorPan ? `\nPAN: ${donorPan.trim().toUpperCase()}` : ""}\nPlease issue my official 80G tax receipt.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 px-3 text-center text-xs shadow-sm transition"
              >
                💬 Confirm on WhatsApp for 80G Receipt
              </a>
            </div>
          )}

          {/* Bank Wire Drawer */}
          {showBankTransfer && (
            <div className="rounded-2xl bg-teal-950 text-white p-3.5 border border-amber-400/30 animate-fadeIn text-xs space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/15">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Official Axis Bank Account
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[8px] font-bold text-emerald-300">
                  0% Fee
                </span>
              </div>

              <div>
                <span className="text-[9px] text-white/60 uppercase block">Beneficiary Name</span>
                <p className="font-bold text-white text-xs">{BANK_DETAILS.accountName}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-xl bg-white/10 p-2">
                  <span className="text-[8px] text-white/60 uppercase block">Account Number</span>
                  <p className="font-mono text-xs font-black text-amber-300">{BANK_DETAILS.accountNumber}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyBank(BANK_DETAILS.accountNumber, "acc")}
                    className="mt-0.5 text-[9px] font-bold text-amber-300 underline cursor-pointer"
                  >
                    {copiedBankField === "acc" ? "✓ Copied" : "Copy A/C"}
                  </button>
                </div>

                <div className="rounded-xl bg-white/10 p-2">
                  <span className="text-[8px] text-white/60 uppercase block">IFSC Code</span>
                  <p className="font-mono text-xs font-black text-amber-300">{BANK_DETAILS.ifscCode}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyBank(BANK_DETAILS.ifscCode, "ifsc")}
                    className="mt-0.5 text-[9px] font-bold text-amber-300 underline cursor-pointer"
                  >
                    {copiedBankField === "ifsc" ? "✓ Copied" : "Copy IFSC"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── 4. Authentic Life & Proof of 25 Resident Boys (Below Checkout Card) ── */}
      <section className="mt-6 rounded-3xl bg-white p-4 sm:p-5 shadow-sm border border-teal-900/10">
        <h3 className="font-display text-base font-black text-teal-950 mb-0.5">
          Life at Janaseva Ashrama (25 Resident Boys)
        </h3>
        <p className="text-xs text-teal-950/70 mb-3">
          Turahalli, Bengaluru · Wholesome satvik meals, school education &amp; loving shelter since 2000.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-teal-950/10">
            <Image
              src="/media/annadana-hall-hd.jpg"
              alt="Annadana Hall at Janaseva Ashrama Bangalore"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-white font-bold leading-tight">
              🍲 Satvik Annadana
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-teal-950/10">
            <Image
              src="/media/learning.jpg"
              alt="Resident boys studying at Janaseva Ashrama"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-white font-bold leading-tight">
              📚 Evening Vidya
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-teal-950/10">
            <Image
              src="/media/boys-group-red-assembly.jpg"
              alt="Boys group assembly at Janaseva Ashrama"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-white font-bold leading-tight">
              ✨ 25 Boys
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-teal-900/10 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-teal-950/80">
          <div>
            <span className="block font-black text-xs text-teal-950">25 Boys</span>
            <span>Loving Care</span>
          </div>
          <div>
            <span className="block font-black text-xs text-teal-950">4 Meals/Day</span>
            <span>Satvik Nutrition</span>
          </div>
          <div>
            <span className="block font-black text-xs text-teal-950">100% Free</span>
            <span>Schooling &amp; Health</span>
          </div>
        </div>
      </section>

      {/* ── 5. Official Government & Tax Credentials ── */}
      <section className="mt-3.5 rounded-3xl bg-cream/50 p-4 border border-teal-900/10 text-xs text-teal-950">
        <h4 className="font-bold uppercase tracking-wider text-[10px] text-teal-950/70 mb-2.5">
          Official Government &amp; Tax Accreditations
        </h4>

        <div className="grid gap-2 sm:grid-cols-3 text-left">
          <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 shadow-2xs">
            <span className="text-sm">🏛️</span>
            <p className="font-bold text-[11px] mt-0.5 text-teal-950">Juvenile Justice Act</p>
            <p className="text-[9px] text-teal-950/70 font-mono">Reg: {JJ_ACT_REGISTRATION.registrationNumber}</p>
          </div>

          <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 shadow-2xs">
            <span className="text-sm">📜</span>
            <p className="font-bold text-[11px] mt-0.5 text-teal-950">Section 80G Form 10AC</p>
            <p className="text-[9px] text-teal-950/70 font-mono">URN: {FORM_10AC.urn}</p>
          </div>

          <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 shadow-2xs">
            <span className="text-sm">🛡️</span>
            <p className="font-bold text-[11px] mt-0.5 text-teal-950">Income Tax PAN</p>
            <p className="text-[9px] text-teal-950/70 font-mono">PAN: {SITE.pan}</p>
          </div>
        </div>
      </section>

      {/* ── 6. Frequently Asked Questions ── */}
      <section className="mt-3.5 rounded-3xl bg-white p-4 border border-teal-900/10">
        <h4 className="font-display text-sm font-bold text-teal-950 mb-2">
          Frequently Asked Questions
        </h4>

        <div className="space-y-1.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="rounded-xl border border-teal-900/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-2.5 text-left font-bold text-xs text-teal-950 flex items-center justify-between gap-2 hover:bg-cream/40 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-sm font-black text-amber-700">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="p-2.5 pt-0 text-xs text-teal-950/75 leading-relaxed bg-sand/15">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Direct Contact & WhatsApp Help */}
      <div className="mt-5 text-center text-xs text-teal-950/70 space-y-1.5">
        <p>
          Need assistance or wish to plan an in-person campus visit?
        </p>
        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
            "Namaste Janaseva Ashrama, I have a question regarding donating."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
        >
          <span>💬</span>
          <span>Chat on WhatsApp: +91 99803 59595</span>
        </a>
      </div>

      {/* ── 7. 📱 MOBILE STICKY BOTTOM DONATION BAR ── */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-2.5 px-4 shadow-2xl sm:hidden flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-display text-base font-black text-teal-950">
                {formatINR(finalAmount)}
              </span>
              <span className="rounded bg-emerald-100 text-emerald-900 text-[8px] font-black px-1.5 py-0.2">
                80G
              </span>
            </div>
            <p className="text-[10px] text-teal-950/70 truncate font-semibold">
              {impactSummary}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!donorName.trim() || donorPhone.trim().length < 10) {
                detailsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                if (!donorName.trim()) {
                  nameInputRef.current?.focus();
                } else {
                  phoneInputRef.current?.focus();
                }
              } else {
                handlePayNow();
              }
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 animate-heartbeat"
          >
            <span>PROCEED TO PAY</span>
            <span>💝</span>
          </button>
        </div>
      )}
    </div>
  );
}

export { MetaAdsDonateComponent as StandardDonorCheckout };
