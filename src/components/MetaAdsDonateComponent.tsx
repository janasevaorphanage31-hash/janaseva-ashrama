"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatINR, SITE, FORM_10AC, BANK_DETAILS } from "@/lib/site";
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

export interface PresetTier {
  amt: number;
  label: string;
  impact: string;
  badge?: string;
  icon: string;
  popular?: boolean;
}

const META_ADS_PRESET_TIERS: PresetTier[] = [
  {
    amt: 500,
    label: "₹500",
    impact: "Feeds a child for a whole week",
    badge: "Most Popular ★",
    icon: "🍲",
    popular: true,
  },
  {
    amt: 1000,
    label: "₹1,000",
    impact: "Complete school kit & notebooks for a boy",
    badge: "Vidya Kit",
    icon: "📚",
  },
  {
    amt: 2000,
    label: "₹2,000",
    impact: "1 month healthcare & pediatric nutrition",
    badge: "Healthcare",
    icon: "🩺",
  },
  {
    amt: 4500,
    label: "₹4,500",
    impact: "1 Day Annadana (all 4 hot meals for 25 boys)",
    badge: "Full Day Seva",
    icon: "🍛",
  },
  {
    amt: 6000,
    label: "₹6,000",
    impact: "1 month kitchen groceries & dal for 4 boys",
    badge: "Monthly Ration",
    icon: "🍚",
  },
];

const OCCASIONS = [
  { id: "general", label: "🌸 General Seva", sub: "Daily meal & child care" },
  { id: "birthday", label: "🎂 Birthday Blessing", sub: "In honour of birthday" },
  { id: "anniversary", label: "💍 Wedding Anniversary", sub: "Family blessing" },
  { id: "memorial", label: "🕊️ In Loving Memory", sub: "Pious remembrance" },
];

const FAQS = [
  {
    q: "Will I get an 80G tax exemption receipt?",
    a: "Yes, instantly! Janaseva Ashrama is registered under Section 80G Form 10AC (URN: AABTJ7431MF20231). As soon as your contribution is completed, your official 80G tax receipt is generated and dispatched to your WhatsApp number and email.",
  },
  {
    q: "Can I visit Janaseva Ashrama in Bengaluru?",
    a: "Absolutely! We welcome donors, families, and visitors 7 days a week between 9:00 AM and 7:00 PM. Our campus is located in Turahalli, Uttarahalli Hobli, Bengaluru 560061.",
  },
  {
    q: "What payment methods are supported?",
    a: "You can pay with 1 tap using Google Pay, PhonePe, Paytm, BHIM, Cred, any UPI app, Debit Cards, Credit Cards, or Net Banking from all major Indian banks.",
  },
  {
    q: "How is my donation utilized for the 25 boys?",
    a: "100% of your contribution goes directly to the children's daily freshly prepared satvik meals, school uniforms, notebooks, evening coaching, and routine medical checkups under Juvenile Justice Act registration KA18CH0242.",
  },
];

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
          "META_ADS"
        );
      } catch {}
    }
    return "META_ADS";
  });
  const [leadId] = useState<string>(() => searchParams.get("lead_id") || "");

  // Amount State (Default ₹500 according to Meta Ads spec: "₹500 feeds a child for a week")
  const [amount, setAmount] = useState<number>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000 && META_ADS_PRESET_TIERS.some((t) => t.amt === parsed)) {
        return parsed;
      }
    }
    return 500;
  });
  const [customAmount, setCustomAmount] = useState<string>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000 && !META_ADS_PRESET_TIERS.some((t) => t.amt === parsed)) {
        return String(parsed);
      }
    }
    return "";
  });

  // Donor Details
  const [donorName, setDonorName] = useState(() => searchParams.get("name") || "");
  const [donorPhone, setDonorPhone] = useState(() => (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10));
  const [donorEmail, setDonorEmail] = useState(() => (searchParams.get("email") || "").trim().toLowerCase());
  const [donorPan, setDonorPan] = useState("");
  const [showPanInput, setShowPanInput] = useState(false);
  const [occasion, setOccasion] = useState("general");
  const [showOccasionSelect, setShowOccasionSelect] = useState(false);
  const [prayerNote, setPrayerNote] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"online" | "bank">("online");
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
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

  // Refs for smooth scroll to errors or sticky bar trigger
  const topCardRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Derived effective donation amount
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const amountWords = finalAmount >= 10 ? numberToIndianWords(finalAmount) : "";

  // Dynamic Impact Description
  const currentTier = META_ADS_PRESET_TIERS.find((t) => t.amt === finalAmount);
  const impactSummary = currentTier
    ? currentTier.impact
    : finalAmount < 500
    ? `Provides warm morning milk & fruits for resident boys`
    : finalAmount < 1000
    ? `Feeds a resident child nutritious satvik meals for ${Math.max(1, Math.round(finalAmount / 71))} days`
    : finalAmount < 2500
    ? `Covers school education kit, notebooks & evening tutoring for 2 boys`
    : finalAmount < 5000
    ? `Provides 1 full day of fresh meals and nutrition for all 25 resident boys`
    : `Covers monthly groceries, kitchen staples & holistic care for the resident children`;

  // Track ViewContent on mount
  useEffect(() => {
    trackViewContent({
      content_name: "Meta Ads 25 Boys Donation",
      content_category: "Child Welfare & Annadana",
      value: finalAmount || 500,
      currency: "INR",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ViewContent when amount changes
  const handleSelectTier = (amt: number) => {
    setAmount(amt);
    setCustomAmount("");
    clearFieldError("amount");
    trackViewContent({
      content_name: `Sponsor 25 Boys - ₹${amt}`,
      content_category: "Child Welfare",
      value: amt,
      currency: "INR",
    });
  };

  // Observe top card visibility for mobile sticky bar
  useEffect(() => {
    const handleScroll = () => {
      if (!topCardRef.current) return;
      const rect = topCardRef.current.getBoundingClientRect();
      // Show sticky bar when donor has scrolled past the top card button
      setShowStickyBar(rect.bottom < 120);
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

  const scrollToTopCard = () => {
    if (topCardRef.current) {
      topCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePayNow = async () => {
    const errors: typeof formErrors = {};

    // 1. Amount validation
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 10) {
      errors.amount = "Please choose or enter a valid donation amount (minimum ₹10).";
    } else if (finalAmount > 1000000) {
      errors.amount = "Online contributions are capped at ₹10,00,000. Please contact the Ashrama directly for larger endowments.";
    }

    // 2. Full Name validation
    const nameCheck = validateName(donorName, "Full Name");
    if (!nameCheck.valid) {
      errors.name = nameCheck.error || "Please enter your full name for morning prayer chanting & 80G receipt.";
    }

    // 3. Mobile validation (10 digits)
    const phoneCheck = validatePhone(donorPhone, true, "WhatsApp / Mobile Number");
    if (!phoneCheck.valid) {
      errors.phone = phoneCheck.error || "Please enter a valid 10-digit WhatsApp number to receive your instant 80G tax receipt.";
    }

    // 4. Email validation (if provided)
    if (donorEmail.trim()) {
      const emailCheck = validateEmail(donorEmail, false);
      if (!emailCheck.valid) {
        errors.email = emailCheck.error;
      }
    }

    // 5. PAN validation (if provided)
    if (donorPan.trim()) {
      const panCheck = validatePan(donorPan, false);
      if (!panCheck.valid) {
        errors.pan = panCheck.error || "Invalid PAN format (e.g. ABCDE1234F).";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.name && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.phone && phoneInputRef.current) {
        phoneInputRef.current.focus();
        phoneInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (topCardRef.current) {
        topCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      const selectedOccasionLabel =
        OCCASIONS.find((o) => o.id === occasion)?.label || "General Seva";

      // 1. Initialize Razorpay order on server
      const res = await fetch("/api/v1/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          callerRefId: callerRef,
          leadId: leadId || undefined,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim() || undefined,
          donorPan: donorPan.trim().toUpperCase() || undefined,
          occasion: selectedOccasionLabel,
          prayerNote: prayerNote.trim() || undefined,
          website_hp: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize secure checkout. Please try again.");
      }

      // Funnel Step: Meta Pixel InitiateCheckout Event
      trackInitiateCheckout({
        content_name: `Support 25 Boys - ${selectedOccasionLabel}`,
        value: finalAmount,
        currency: "INR",
        num_items: 1,
      });

      // Load Razorpay checkout script if missing
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () =>
            reject(new Error("Unable to reach payment gateway. Please check your internet connection."));
          document.body.appendChild(script);
        });
      }

      if ((window as any).Razorpay && data.mode === "live") {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency || "INR",
          name: "Janaseva Ashrama Bangalore",
          description: `Sponsor 25 Resident Boys · ${selectedOccasionLabel}`,
          order_id: data.orderId,
          prefill: {
            name: donorName.trim(),
            contact: donorPhone.trim(),
            email: donorEmail.trim() || "donor@janasevaashrama.org",
          },
          notes: {
            caller_ref_id: callerRef,
            lead_id: leadId || "",
            donor_name: donorName.trim(),
            donor_phone: donorPhone.trim(),
            occasion: selectedOccasionLabel,
            prayer_note: prayerNote.trim(),
          },
          theme: { color: "#06312f" },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
          handler: async function (response: any) {
            // Track Meta Pixel Donate & Purchase events
            trackDonationSuccess({
              amount: finalAmount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              donorName,
              donorPhone,
              donorEmail,
              callerRef,
              mode: "live",
            });

            // Trigger attribution webhook
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
                          donor_name: donorName,
                          donor_phone: donorPhone,
                          donor_email: donorEmail,
                          occasion: selectedOccasionLabel,
                          prayer_note: prayerNote,
                        },
                      },
                    },
                  },
                }),
              });
            } catch (webhookErr) {
              console.warn("Attribution webhook delivery:", webhookErr);
            }

            // Redirect to verified /thank-you page
            window.location.href = `/thank-you?amount=${finalAmount}&payment_id=${encodeURIComponent(
              response.razorpay_payment_id || ""
            )}&order_id=${encodeURIComponent(
              response.razorpay_order_id || ""
            )}&ref=${encodeURIComponent(callerRef)}`;
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setLoading(false);
          setFormErrors({
            general:
              resp?.error?.description ||
              "Your transaction was not completed. No money has been deducted from your account. Please try another payment method.",
          });
        });
        rzp.open();
      } else {
        // Demo / Sandbox fallback
        const demoPaymentId = `pay_sim_${Date.now()}`;
        await fetch("/api/v1/webhooks/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "simulate_donation",
            callerRefId: callerRef,
            amount: finalAmount,
            donorName,
            donorPhone,
            paymentId: demoPaymentId,
            leadId: leadId ? Number(leadId) : undefined,
          }),
        });

        trackDonationSuccess({
          amount: finalAmount,
          paymentId: demoPaymentId,
          donorName,
          donorPhone,
          donorEmail,
          callerRef,
          mode: "demo",
        });

        window.location.href = `/thank-you?amount=${finalAmount}&payment_id=${demoPaymentId}&ref=${encodeURIComponent(
          callerRef
        )}&demo=true`;
      }
    } catch (err: any) {
      setFormErrors({
        general:
          err.message || "An unexpected error occurred while preparing your donation. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl pb-24 sm:pb-16 animate-fadeIn">
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

      {/* ── 1. Minimal Trust Bar (Zero Distraction, Maximum Credibility) ── */}
      <header className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <LogoMark size={40} className="shadow-xs ring-2 ring-amber-400/40" />
          <div>
            <h2 className="text-sm font-black tracking-tight text-teal-950 leading-tight">
              Janaseva Ashrama
            </h2>
            <p className="text-[10px] font-semibold text-teal-950/70">
              Makkala Ashraya Kendra · Est. 2000
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-900 shadow-2xs">
            <span>🛡️</span>
            <span>80G Tax Free</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-950 shadow-2xs">
            <span>Govt Reg: {SITE.jjActNumber}</span>
          </span>
        </div>
      </header>

      {/* ── 2. Emotional Headline & Social Proof Hook ── */}
      <div className="text-center mb-4 px-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-[11px] font-black text-amber-900 uppercase tracking-wider mb-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span>Support 25 Resident Orphaned Boys in Bengaluru</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-teal-950 tracking-tight leading-tight">
          Give Pure Satvik Meals &amp; Education
        </h1>

        <p className="text-xs sm:text-sm text-teal-950/75 mt-1.5 max-w-md mx-auto leading-relaxed">
          Your sacred contribution reaches the children directly with fresh hot meals, school uniforms, and loving shelter. 100% Tax Deductible.
        </p>
      </div>

      {/* ── 3. 🎯 TOP ACTION DONATION CARD (ABOVE THE FOLD ON MOBILE) ── */}
      <div
        ref={topCardRef}
        className="rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border-2 border-amber-400/40 relative overflow-hidden ring-4 ring-amber-300/10"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-28 w-28 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

        {/* Online vs Direct Bank Transfer Tabs */}
        <div className="mb-4 flex rounded-2xl bg-cream/70 p-1 border border-teal-900/10">
          <button
            type="button"
            onClick={() => setActiveTab("online")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "online"
                ? "bg-teal-950 text-white shadow-sm ring-1 ring-amber-400"
                : "text-teal-950/70 hover:text-teal-950"
            }`}
          >
            <span>⚡ Instant Online (UPI / Cards)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "bank"
                ? "bg-teal-950 text-white shadow-sm ring-1 ring-amber-400"
                : "text-teal-950/70 hover:text-teal-950"
            }`}
          >
            <span>🏦 Direct Bank Transfer</span>
          </button>
        </div>

        {/* Global Error Notice */}
        {formErrors.general && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-semibold flex items-start gap-2.5">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1 leading-relaxed">{formErrors.general}</div>
          </div>
        )}

        {/* TAB 1: ONLINE DONATION (UPI / CARDS / RAZORPAY) */}
        {activeTab === "online" && (
          <div className="space-y-4">
            {/* ── PRESET TIERS GRID (Checklist Point 3: ₹500, ₹1000, ₹2000, etc.) ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <span>1.</span>
                  <span>Select Contribution Amount:</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <span>✓</span> 80G Tax Deductible
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {META_ADS_PRESET_TIERS.map((tier) => {
                  const isSelected = amount === tier.amt && !customAmount;
                  return (
                    <button
                      key={tier.amt}
                      type="button"
                      onClick={() => handleSelectTier(tier.amt)}
                      className={`relative p-3 rounded-2xl text-left border transition-all cursor-pointer tap-scale ${
                        isSelected
                          ? "bg-teal-950 text-white border-teal-950 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                          : "bg-cream/40 text-teal-950 border-teal-900/15 hover:bg-cream hover:border-amber-400/50"
                      }`}
                    >
                      {tier.badge && (
                        <span
                          className={`absolute -top-2 right-2 rounded-full px-2 py-0.5 text-[8px] font-black uppercase shadow-xs ${
                            isSelected
                              ? "bg-amber-400 text-teal-950"
                              : "bg-teal-900/10 text-teal-900"
                          }`}
                        >
                          {tier.badge}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{tier.icon}</span>
                        <span className="font-display text-base font-black tracking-tight">
                          {tier.label}
                        </span>
                      </div>

                      <p
                        className={`text-[10px] font-bold mt-1 line-clamp-1 leading-tight ${
                          isSelected ? "text-amber-300" : "text-teal-950/70"
                        }`}
                      >
                        {tier.impact}
                      </p>
                    </button>
                  );
                })}

                {/* Custom Amount Preset Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setCustomAmount(customAmount || "1500");
                    clearFieldError("amount");
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer tap-scale ${
                    customAmount
                      ? "bg-teal-950 text-white border-teal-950 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                      : "bg-cream/40 text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">✏️</span>
                    <span className="font-display text-base font-black tracking-tight">
                      Custom
                    </span>
                  </div>
                  <p
                    className={`text-[10px] font-bold mt-1 line-clamp-1 leading-tight ${
                      customAmount ? "text-amber-300" : "text-teal-950/70"
                    }`}
                  >
                    Any amount ₹10+
                  </p>
                </button>
              </div>

              {/* Custom Amount Numeric Input Box */}
              {customAmount !== "" && (
                <div className="mt-2.5 rounded-2xl bg-cream/40 p-3 border border-teal-900/15 animate-fadeIn">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-teal-950">Enter Custom Amount:</span>
                    <span className="text-[10px] text-teal-950/60">Min ₹10 · Max ₹10,00,000</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base font-black text-teal-950">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={10}
                      max={1000000}
                      placeholder="e.g. 1500"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        clearFieldError("amount");
                      }}
                      className="w-full rounded-xl border border-teal-900/20 bg-white py-2.5 pl-8 pr-3 text-base font-black text-teal-950 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Quick Add Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-teal-950/50 uppercase">Quick Add:</span>
                    {[500, 1000, 2000, 4500].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => {
                          const current = parseFloat(customAmount) || 0;
                          setCustomAmount(String(current + inc));
                          clearFieldError("amount");
                        }}
                        className="rounded-lg bg-white border border-teal-900/15 px-2 py-0.5 text-[11px] font-bold text-teal-950 hover:bg-teal-950 hover:text-white transition cursor-pointer"
                      >
                        +{formatINR(inc)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Impact & 80G Tax Savings Strip */}
              <div className="mt-2.5 rounded-2xl bg-amber-50 p-3 border border-amber-300/70 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-start sm:items-center gap-2">
                  <span className="text-lg shrink-0">🌸</span>
                  <div>
                    <span className="font-bold block leading-tight text-amber-950">
                      {impactSummary}
                    </span>
                    {amountWords && (
                      <span className="text-[10px] text-amber-900/80 font-medium block mt-0.5">
                        Amount in words: <strong>{amountWords}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-auto rounded-lg bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-950">
                  Tax Saved: ~{formatINR(Math.round(finalAmount * 0.15))}
                </div>
              </div>

              {formErrors.amount && (
                <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <span>⚠️</span> {formErrors.amount}
                </p>
              )}
            </div>

            {/* ── 2. DONOR DETAILS INPUT (Streamlined 2 Fields) ── */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-black uppercase tracking-wider text-teal-950">
                2. Donor &amp; Receipt Details:
              </label>

              {/* Full Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-teal-950">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-teal-950/60 font-medium">Chanted in morning shlokas</span>
                </div>
                <input
                  ref={nameInputRef}
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Ramesh Kumar / Ananya Sharma"
                  value={donorName}
                  onChange={(e) => {
                    setDonorName(e.target.value);
                    clearFieldError("name");
                  }}
                  className={`w-full rounded-xl border p-2.5 text-base sm:text-sm text-teal-950 outline-none transition ${
                    formErrors.name
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-teal-900/20 focus:ring-2 focus:ring-amber-500 bg-white"
                  }`}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {formErrors.name}
                  </p>
                )}
              </div>

              {/* WhatsApp Mobile Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-teal-950">
                    WhatsApp Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">Instant 80G receipt on WhatsApp</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-black text-teal-950/70">+91</span>
                  <input
                    ref={phoneInputRef}
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
                    className={`w-full rounded-xl border py-2.5 pl-11 pr-3 text-base sm:text-sm font-bold text-teal-950 outline-none transition ${
                      formErrors.phone
                        ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                        : "border-teal-900/20 focus:ring-2 focus:ring-amber-500 bg-white"
                    }`}
                  />
                </div>
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {formErrors.phone}
                  </p>
                )}
              </div>

              {/* Optional Email & PAN Expandable Accordions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => setShowPanInput(!showPanInput)}
                  className="inline-flex items-center gap-1 rounded-lg bg-cream/70 hover:bg-cream px-2.5 py-1 text-teal-900 font-bold border border-teal-900/10 cursor-pointer"
                >
                  <span>📜</span>
                  <span>{showPanInput ? "Hide PAN" : "+ Add PAN (80G Tax Credit)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowOccasionSelect(!showOccasionSelect)}
                  className="inline-flex items-center gap-1 rounded-lg bg-cream/70 hover:bg-cream px-2.5 py-1 text-teal-900 font-bold border border-teal-900/10 cursor-pointer"
                >
                  <span>🎂</span>
                  <span>{showOccasionSelect ? "Hide Occasion" : "+ Dedicate (Birthday / Memorial)"}</span>
                </button>
              </div>

              {/* PAN Input Field (When expanded) */}
              {showPanInput && (
                <div className="rounded-2xl bg-cream/30 p-3 border border-teal-900/10 animate-fadeIn space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-teal-950">
                      Income Tax PAN Number (10 Alphanumeric)
                    </label>
                    <span className="text-[10px] text-emerald-800 font-semibold">Form 10BE Filing</span>
                  </div>
                  <input
                    type="text"
                    maxLength={10}
                    autoCapitalize="characters"
                    placeholder="ABCDE1234F"
                    value={donorPan}
                    onChange={(e) => {
                      setDonorPan(sanitizePan(e.target.value));
                      clearFieldError("pan");
                    }}
                    className="w-full rounded-xl border border-teal-900/20 bg-white p-2 text-sm font-mono uppercase text-teal-950 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {formErrors.pan && (
                    <p className="text-xs text-rose-600 font-semibold">⚠️ {formErrors.pan}</p>
                  )}
                </div>
              )}

              {/* Occasion / Prayer Dedication (When expanded) */}
              {showOccasionSelect && (
                <div className="rounded-2xl bg-cream/30 p-3 border border-teal-900/10 animate-fadeIn space-y-2">
                  <label className="block text-xs font-bold text-teal-950">
                    Select Auspicious Dedication:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {OCCASIONS.map((occ) => (
                      <button
                        key={occ.id}
                        type="button"
                        onClick={() => setOccasion(occ.id)}
                        className={`p-2 rounded-xl text-left border text-xs cursor-pointer ${
                          occasion === occ.id
                            ? "bg-teal-950 text-white font-bold border-teal-950"
                            : "bg-white text-teal-950 border-teal-900/10"
                        }`}
                      >
                        <p className="font-bold text-[11px]">{occ.label}</p>
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Special prayer wish or family member names..."
                    value={prayerNote}
                    onChange={(e) => setPrayerNote(e.target.value)}
                    className="w-full rounded-xl border border-teal-900/20 bg-white p-2 text-xs text-teal-950 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* 1-Tap UPI Trust Strip */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold text-teal-950/70">
              <span>⚡ 1-Tap Instant Payment via</span>
              <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Google Pay</span>
              <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">PhonePe</span>
              <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Paytm</span>
              <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">UPI / Cards</span>
            </div>

            {/* ── 3. 🚀 BIG "DONATE NOW" CTA BUTTON (Checklist Point 2: Clear & Prominent) ── */}
            <button
              type="button"
              onClick={handlePayNow}
              disabled={loading}
              className="focus-ring tap-scale w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-orange-500/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed animate-heartbeat"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Connecting Secure Gateway...</span>
                </>
              ) : (
                <>
                  <span>DONATE {formatINR(finalAmount)} NOW</span>
                  <span>💝 →</span>
                </>
              )}
            </button>

            {/* Instant WhatsApp Receipt Guarantee */}
            <p className="text-center text-[11px] text-teal-950/70 font-semibold flex items-center justify-center gap-1.5">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>·</span>
              <span>⚡ Instant 80G Receipt on WhatsApp</span>
            </p>
          </div>
        )}

        {/* TAB 2: DIRECT BANK TRANSFER (AXIS BANK) */}
        {activeTab === "bank" && (
          <div className="space-y-3 animate-fadeIn text-xs">
            <div className="rounded-2xl bg-teal-950 text-white p-4 shadow-md border border-amber-400/30">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Official Axis Bank Account
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  0% Commission
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                <div>
                  <span className="text-[10px] text-white/60 uppercase">Beneficiary Name</span>
                  <p className="font-bold text-white text-xs">{BANK_DETAILS.accountName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/10 p-2.5">
                    <span className="text-[9px] text-white/60 uppercase block">Account Number</span>
                    <p className="font-mono text-sm font-black text-amber-300">{BANK_DETAILS.accountNumber}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyBank(BANK_DETAILS.accountNumber, "acc")}
                      className="mt-1 text-[10px] font-bold text-amber-300 underline hover:text-white cursor-pointer"
                    >
                      {copiedBankField === "acc" ? "✓ Copied!" : "Copy A/C No"}
                    </button>
                  </div>

                  <div className="rounded-xl bg-white/10 p-2.5">
                    <span className="text-[9px] text-white/60 uppercase block">IFSC Code</span>
                    <p className="font-mono text-sm font-black text-amber-300">{BANK_DETAILS.ifscCode}</p>
                    <button
                      type="button"
                      onClick={() => handleCopyBank(BANK_DETAILS.ifscCode, "ifsc")}
                      className="mt-1 text-[10px] font-bold text-amber-300 underline hover:text-white cursor-pointer"
                    >
                      {copiedBankField === "ifsc" ? "✓ Copied!" : "Copy IFSC"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-white/80 pt-1 text-[11px]">
                  <div>
                    <span className="text-[9px] text-white/60 uppercase block">Bank &amp; Branch</span>
                    <p className="font-medium">{BANK_DETAILS.bankName}, {BANK_DETAILS.branch}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/60 uppercase block">Account Type</span>
                    <p className="font-medium">{BANK_DETAILS.accountType}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-amber-950 space-y-1 text-xs">
              <p className="font-bold">After transferring via NetBanking, NEFT or UPI:</p>
              <p>
                Please WhatsApp your payment screenshot / UTR to{" "}
                <a
                  href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                    "Namaste Janaseva Ashrama, I have completed a direct bank transfer donation."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-teal-900 underline"
                >
                  +91 99803 59595
                </a>{" "}
                for your official Section 80G tax receipt.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Authentic Photo Proof & Impact of 25 Resident Boys ── */}
      <section className="mt-8 rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-teal-900/10">
        <h3 className="font-display text-lg font-black text-teal-950 mb-1">
          Life at Janaseva Ashrama (25 Resident Boys)
        </h3>
        <p className="text-xs text-teal-950/70 mb-4">
          Turahalli, Bengaluru · Providing holistic care, education, and love since 2000.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-teal-950/10">
            <Image
              src="/media/annadana-hall-hd.jpg"
              alt="Annadana Hall at Janaseva Ashrama Bangalore"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white font-bold leading-tight">
              🍲 Daily Annadana Feast
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-teal-950/10">
            <Image
              src="/media/learning.jpg"
              alt="Resident boys studying at Janaseva Ashrama"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white font-bold leading-tight">
              📚 Evening Vidya Study
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-teal-950/10 col-span-2 sm:col-span-1">
            <Image
              src="/media/boys-group-red-assembly.jpg"
              alt="Boys group assembly at Janaseva Ashrama"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white font-bold leading-tight">
              ✨ 25 Resident Children
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-teal-900/10 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-teal-950/80">
          <div>
            <span className="block font-black text-sm text-teal-950">25 Boys</span>
            <span>Full-Time Shelter</span>
          </div>
          <div>
            <span className="block font-black text-sm text-teal-950">4 Meals/Day</span>
            <span>Nutritious Satvik</span>
          </div>
          <div>
            <span className="block font-black text-sm text-teal-950">100% Free</span>
            <span>Schooling &amp; Books</span>
          </div>
        </div>
      </section>

      {/* ── 5. Institutional Trust & Legal Badges ── */}
      <section className="mt-4 rounded-3xl bg-cream/50 p-4 sm:p-5 border border-teal-900/10 text-xs text-teal-950">
        <h4 className="font-bold uppercase tracking-wider text-[11px] text-teal-950/70 mb-3 text-center sm:text-left">
          Official Government &amp; Tax Credentials
        </h4>

        <div className="grid gap-2.5 sm:grid-cols-3 text-center sm:text-left">
          <div className="rounded-xl bg-white p-3 border border-teal-900/10 shadow-2xs">
            <span className="text-base">🏛️</span>
            <p className="font-bold text-[11px] mt-1 text-teal-950">Juvenile Justice Act</p>
            <p className="text-[10px] text-teal-950/70 font-mono">Reg: {SITE.jjActNumber}</p>
          </div>

          <div className="rounded-xl bg-white p-3 border border-teal-900/10 shadow-2xs">
            <span className="text-base">📜</span>
            <p className="font-bold text-[11px] mt-1 text-teal-950">Section 80G Form 10AC</p>
            <p className="text-[10px] text-teal-950/70 font-mono">URN: {FORM_10AC.urn}</p>
          </div>

          <div className="rounded-xl bg-white p-3 border border-teal-900/10 shadow-2xs">
            <span className="text-base">🛡️</span>
            <p className="font-bold text-[11px] mt-1 text-teal-950">Income Tax PAN</p>
            <p className="text-[10px] text-teal-950/70 font-mono">PAN: {SITE.pan}</p>
          </div>
        </div>
      </section>

      {/* ── 6. Donor FAQ Accordion ── */}
      <section className="mt-4 rounded-3xl bg-white p-5 border border-teal-900/10">
        <h4 className="font-display text-base font-bold text-teal-950 mb-3">
          Frequently Asked Questions
        </h4>

        <div className="space-y-2">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="rounded-2xl border border-teal-900/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-3 text-left font-bold text-xs text-teal-950 flex items-center justify-between gap-2 hover:bg-cream/40 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="text-sm font-black text-amber-700">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="p-3 pt-0 text-xs text-teal-950/75 leading-relaxed bg-sand/15">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Direct Contact & WhatsApp Help */}
      <div className="mt-6 text-center text-xs text-teal-950/70 space-y-2">
        <p>
          Need assistance or wish to plan an in-person visit?
        </p>
        <a
          href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
            "Namaste Janaseva Ashrama, I have a question regarding donating."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
        >
          <span>💬</span>
          <span>Chat directly on WhatsApp: +91 99803 59595</span>
        </a>
        <p className="text-[11px] text-teal-950/60 pt-1">
          Janaseva Ashrama · Turahalli, Uttarahalli Hobli, Bengaluru 560061
        </p>
      </div>

      {/* ── 7. 📱 MOBILE STICKY BOTTOM DONATION BAR ── */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-3 px-4 shadow-2xl sm:hidden flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-black text-teal-950">
                {formatINR(finalAmount)}
              </span>
              <span className="rounded bg-emerald-100 text-emerald-900 text-[9px] font-black px-1.5 py-0.2">
                80G
              </span>
            </div>
            <p className="text-[10px] text-teal-950/70 truncate font-semibold">
              {currentTier ? currentTier.impact : "Sponsor 25 Resident Boys"}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTopCard}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>DONATE NOW</span>
            <span>💝</span>
          </button>
        </div>
      )}
    </div>
  );
}
