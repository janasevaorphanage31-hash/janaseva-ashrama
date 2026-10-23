"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { formatINR, SITE, FORM_10AC } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import { trackDonationSuccess, trackViewContent, trackInitiateCheckout } from "@/lib/tracking";
import { numberToIndianWords } from "@/lib/number-words";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  sanitizePan,
} from "@/lib/validation";
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { useCart } from "@/components/CartProvider";

const PRESET_TIERS = [
  {
    amt: 500,
    title: "Morning Milk & Fruit",
    desc: "Warm cow milk & fresh bananas before morning shlokas for 25 boys",
    icon: "🥛",
    badge: "Daily Seva",
  },
  {
    amt: 1000,
    title: "Punya Annadana Feast",
    desc: "Fresh steaming lunch or dinner with rice, sambar, ghee & sweet payasa",
    icon: "🍲",
    badge: "Most Popular ★",
  },
  {
    amt: 2500,
    title: "Full Day Annadana",
    desc: "Complete 3 meals (breakfast, lunch & dinner) for all 25 resident boys",
    icon: "🍛",
    badge: "High Impact",
  },
  {
    amt: 5000,
    title: "Vidya & School Kits",
    desc: "School uniforms, notebooks, stationery & evening coaching for 5 boys",
    icon: "📚",
    badge: "Education",
  },
  {
    amt: 10000,
    title: "Monthly Arogya & Care",
    desc: "Doctor consultations, wellness checkups & living shelter support",
    icon: "🩺",
    badge: "Comprehensive",
  },
];

const OCCASIONS = [
  { id: "birthday", label: "🎂 Birthday Seva", sub: "Celebrant birthday prayer" },
  { id: "anniversary", label: "💍 Wedding Anniversary", sub: "Marital blessing seva" },
  { id: "memorial", label: "🕊️ In Memory / Pitru Smarane", sub: "Pious remembrance" },
  { id: "gratitude", label: "🌸 General Seva & Thanks", sub: "Daily thanksgiving" },
];

export function DonateClientComponent() {
  const searchParams = useSearchParams();
  const { setDedicatedAmount } = useCart();

  // URL / Attribution state
  const [callerRef, setCallerRef] = useState<string>(() => {
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
  const [leadId, setLeadId] = useState<string>(() => searchParams.get("lead_id") || "");

  // Donation amount state
  const [amount, setAmount] = useState<number>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000 && PRESET_TIERS.some((t) => t.amt === parsed)) {
        return parsed;
      }
    }
    return 1000;
  });
  const [customAmount, setCustomAmount] = useState<string>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000 && !PRESET_TIERS.some((t) => t.amt === parsed)) {
        return String(parsed);
      }
    }
    return "";
  });

  // Occasion & Dedication
  const [occasion, setOccasion] = useState<string>(() => {
    const urlOccasion = searchParams.get("occasion");
    if (urlOccasion) {
      const match = OCCASIONS.find(
        (o) => o.id === urlOccasion.toLowerCase() || o.label.toLowerCase().includes(urlOccasion.toLowerCase()),
      );
      if (match) return match.id;
    }
    return "birthday";
  });
  const [prayerNote, setPrayerNote] = useState<string>("");

  // Donor credentials
  const [donorName, setDonorName] = useState(() => searchParams.get("name") || "");
  const [donorPhone, setDonorPhone] = useState(() => (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10));
  const [donorEmail, setDonorEmail] = useState(() => (searchParams.get("email") || "").trim().toLowerCase());
  const [donorPan, setDonorPan] = useState("");
  const [showPanInput, setShowPanInput] = useState(false);

  // Invisible honeypot for bot / spam prevention
  const [honeypot, setHoneypot] = useState("");

  // Inline validation errors (no abrasive alert popups)
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    pan?: string;
    amount?: string;
    general?: string;
  }>({});

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Field refs for smooth auto-scroll to error
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const amountSectionRef = useRef<HTMLDivElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  // Sync caller reference to session/local storage
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) {
      const clean = urlRef.trim().toUpperCase();
      try {
        sessionStorage.setItem("antigravity_caller_ref", clean);
        localStorage.setItem("antigravity_caller_ref", clean);
      } catch {}
    }
  }, [searchParams]);

  // Derived effective donation amount
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const amountWords = finalAmount >= 10 ? numberToIndianWords(finalAmount) : "";

  // Synchronize cart state and floating Giving Basket bar
  useEffect(() => {
    if (finalAmount >= 10 && finalAmount <= 500000) {
      setDedicatedAmount(finalAmount);
    }
  }, [finalAmount, setDedicatedAmount]);

  // Track ViewContent on mount for campaign & donation landing
  useEffect(() => {
    trackViewContent({
      content_name: "Janaseva Ashrama Donation Portal",
      content_category: "Child Welfare Donation",
      value: finalAmount || 1000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear specific error field as the user types
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

  const handlePayNow = async () => {
    // Reset errors
    const errors: typeof formErrors = {};

    // 1. Validate Amount
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 10) {
      errors.amount = "Please choose or enter a valid donation amount (minimum ₹10).";
    } else if (finalAmount > 1000000) {
      errors.amount = "Online contributions are capped at ₹10,00,000. Please contact the Ashrama for larger endowments.";
    }

    // 2. Validate Donor Name
    const nameCheck = validateName(donorName, "Full Name");
    if (!nameCheck.valid) {
      errors.name = nameCheck.error || "Please enter your full name for morning prayer chanting.";
    }

    // 3. Validate Mobile Phone (10 digits)
    const phoneCheck = validatePhone(donorPhone, true, "WhatsApp / Mobile Number");
    if (!phoneCheck.valid) {
      errors.phone = phoneCheck.error || "Please enter a valid 10-digit WhatsApp number to receive your 80G receipt.";
    }

    // 4. Validate Email (if provided)
    if (donorEmail.trim()) {
      const emailCheck = validateEmail(donorEmail, false);
      if (!emailCheck.valid) {
        errors.email = emailCheck.error;
      }
    }

    // 5. Validate PAN (if provided)
    if (donorPan.trim()) {
      const panCheck = validatePan(donorPan, false);
      if (!panCheck.valid) {
        errors.pan = panCheck.error || "Invalid PAN card format (expected 5 letters, 4 numbers, 1 letter, e.g. ABCDE1234F).";
      }
    }

    // If there are errors, stop and scroll to first error
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.amount && amountSectionRef.current) {
        amountSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.name && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.phone && phoneInputRef.current) {
        phoneInputRef.current.focus();
        phoneInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.pan && panInputRef.current) {
        panInputRef.current.focus();
        panInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setLoading(true);
    setFormErrors({});

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      const selectedOccasionLabel =
        OCCASIONS.find((o) => o.id === occasion)?.label || "Special Blessing Seva";
      const cleanOccasion = selectedOccasionLabel.replace(/[^\w\s-]/g, "").trim() || "Special Blessing Seva";
      const cleanPrayerNote = prayerNote.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim();

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
          occasion: cleanOccasion,
          prayerNote: cleanPrayerNote || undefined,
          website_hp: honeypot, // Honeypot field
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        clearTimeout(safetyTimer);
        throw new Error(data.error || "Failed to initialize secure checkout. Please try again.");
      }

      // Funnel Step 2: Track InitiateCheckout
      trackInitiateCheckout({
        content_name: cleanOccasion,
        value: finalAmount,
        currency: "INR",
        num_items: 1,
      });

      // 2. Open Live Razorpay Gateway
      if (data.orderId && data.keyId) {
        await openRazorpayCheckout({
          keyId: data.keyId,
          orderId: data.orderId,
          amountPaise: data.amount,
          currency: data.currency || "INR",
          name: "Janaseva Ashrama Bangalore",
          description: `${cleanOccasion} · 25 Resident Boys Seva`,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim() || "donor@janasevaashrama.org",
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
                err?.description ||
                err?.message ||
                "Your payment transaction could not be processed. No money was debited from your account. Please try another payment method.",
            });
          },
          onSuccess: async (response) => {
            clearTimeout(safetyTimer);
            // 1. Meta Pixel & Google Ads Conversion Tracking (Donate + Purchase)
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

            // 2. Trigger webhook attribution verification
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

            // 3. Redirect to dedicated /thank-you page
            window.location.href = `/thank-you?amount=${finalAmount}&payment_id=${encodeURIComponent(
              response.razorpay_payment_id || "",
            )}&order_id=${encodeURIComponent(
              response.razorpay_order_id || "",
            )}&ref=${encodeURIComponent(callerRef)}`;
          },
        });
      } else if (data.mode === "demo") {
        // Staging / Demo simulated donation
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
        }).catch(() => {});

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
          callerRef,
        )}&demo=true`;
      } else {
        throw new Error(data.error || "Payment gateway could not generate an order. Please try again.");
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
    <div className="mx-auto max-w-xl animate-fadeIn">
      {/* Invisible Honeypot anti-spam protection */}
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

      {/* Main Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-teal-900/10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <LogoMark size={56} className="shadow-md ring-4 ring-amber-300/30" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 text-saffron-dark px-3.5 py-1 text-xs font-black uppercase tracking-wider">
            <span>✨</span>
            <span>Auspicious Birthday &amp; Special Day Seva</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-teal-950 mt-2 tracking-tight">
            Celebrate with 25 Resident Boys
          </h1>

          <p className="text-xs sm:text-sm text-teal-950/70 mt-1.5 max-w-md mx-auto leading-relaxed">
            Janaseva Ashrama · Turahalli Bangalore · Form 10AC Section 80G 100% Tax Deductible
          </p>

          {/* Telecaller Dedicated Care Advisor Pill */}
          {callerRef && callerRef !== "DIRECT" && (
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Assisted by Care Advisor: <strong>{callerRef}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Global Error Banner (if any) */}
        {formErrors.general && (
          <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 font-semibold flex items-start gap-3">
            <span className="text-base leading-none">⚠️</span>
            <div className="flex-1 leading-relaxed">{formErrors.general}</div>
          </div>
        )}

        {/* ── 1. Occasion Selector ── */}
        <div className="mb-6">
          <label className="block text-xs font-black uppercase tracking-wider text-teal-950 mb-2.5">
            1. Select Auspicious Occasion:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {OCCASIONS.map((item) => {
              const isSelected = occasion === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setOccasion(item.id)}
                  className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                    isSelected
                      ? "bg-teal-950 text-white border-teal-950 shadow-md ring-2 ring-amber-400"
                      : "bg-cream/40 text-teal-950 border-teal-900/10 hover:bg-cream"
                  }`}
                >
                  <p className="text-xs font-extrabold flex items-center gap-1.5">
                    {item.label}
                  </p>
                  <p
                    className={`text-[10px] mt-0.5 ${
                      isSelected ? "text-amber-300 font-medium" : "text-teal-950/60"
                    }`}
                  >
                    {item.sub}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 2. Preset Blessing Tiers ── */}
        <div ref={amountSectionRef} className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-teal-950">
              2. Choose Contribution Blessing Tier:
            </label>
            <span className="text-[11px] text-teal-950/60 font-semibold">100% Tax Deductible</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRESET_TIERS.map((tier) => {
              const isSelected = amount === tier.amt && !customAmount;
              return (
                <button
                  key={tier.amt}
                  type="button"
                  onClick={() => {
                    setAmount(tier.amt);
                    setCustomAmount("");
                    clearFieldError("amount");
                  }}
                  className={`p-3 rounded-2xl text-left transition-all border cursor-pointer relative ${
                    isSelected
                      ? "bg-teal-950 text-white border-teal-950 shadow-md ring-2 ring-amber-400 scale-[1.01]"
                      : "bg-cream/40 text-teal-950 border-teal-900/10 hover:bg-cream"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{tier.icon}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-amber-400 text-teal-950"
                          : "bg-teal-900/10 text-teal-900"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-base font-black mt-1 text-inherit">
                    {formatINR(tier.amt)}
                  </p>
                  <p className="text-xs font-bold mt-0.5">{tier.title}</p>
                  <p
                    className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                      isSelected ? "text-emerald-100/90" : "text-teal-950/65"
                    }`}
                  >
                    {tier.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Amount Field */}
          <div className="mt-3 rounded-2xl bg-cream/30 p-3 border border-teal-900/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-teal-950">Or Enter Any Custom Amount:</span>
              <span className="text-[11px] text-teal-950/60">Min ₹10 · Max ₹10,00,000</span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-base font-bold text-teal-950/60">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={1000000}
                placeholder="e.g. 5000"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  clearFieldError("amount");
                }}
                className={`w-full rounded-xl border py-2.5 pl-8 pr-3 text-base sm:text-sm font-bold text-teal-950 outline-none transition ${
                  formErrors.amount
                    ? "border-rose-500 ring-2 ring-rose-200"
                    : "border-teal-900/20 focus:ring-2 focus:ring-amber-500"
                }`}
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-teal-950/50 uppercase">Quick Add:</span>
              {[500, 1000, 2500, 5000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => {
                    const current = customAmount ? parseFloat(customAmount) || 0 : amount;
                    setCustomAmount(String(current + inc));
                    clearFieldError("amount");
                  }}
                  className="rounded-lg bg-white border border-teal-900/15 px-2 py-0.5 text-[11px] font-bold text-teal-950 hover:bg-teal-950 hover:text-white transition cursor-pointer"
                >
                  +{formatINR(inc)}
                </button>
              ))}
            </div>

            {formErrors.amount && (
              <p className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1">
                <span>⚠️</span> {formErrors.amount}
              </p>
            )}
          </div>

          {/* Real-Time Indian Rupee in Words & 80G Tax Calculation */}
          <div className="mt-2.5 space-y-2">
            {amountWords && (
              <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-teal-950 flex items-center gap-2">
                <span className="text-amber-600">📜</span>
                <span>
                  Amount in Words: <strong className="text-teal-950">{amountWords}</strong>
                </span>
              </div>
            )}
            <div className="rounded-xl bg-emerald-50 px-3 py-2 border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-950">
              <span className="flex items-center gap-1 font-semibold">
                <span>🛡️</span>
                <span>80G Tax Saved: <strong>~{formatINR(Math.round(finalAmount * 0.15))}</strong></span>
              </span>
              <span className="text-[11px] text-emerald-800 font-bold">
                Effective Cost: {formatINR(Math.max(0, finalAmount - Math.round(finalAmount * 0.15)))}
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. Donor Details ── */}
        <div className="mb-6 space-y-3.5">
          <label className="block text-xs font-black uppercase tracking-wider text-teal-950">
            3. Celebrant &amp; Donor Details:
          </label>

          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-teal-950">
                Celebrant / Donor Full Name <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-teal-950/60 font-medium">For morning prayer shloka</span>
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
                  : "border-teal-900/20 focus:ring-2 focus:ring-amber-500"
              }`}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                <span>⚠️</span> {formErrors.name}
              </p>
            )}
          </div>

          {/* Mobile / WhatsApp */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-teal-950">
                WhatsApp Mobile Number <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-teal-950/60 font-medium">For instant 80G tax receipt</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-teal-950/60">+91</span>
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
                    : "border-teal-900/20 focus:ring-2 focus:ring-amber-500"
                }`}
              />
            </div>
            {formErrors.phone && (
              <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                <span>⚠️</span> {formErrors.phone}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-teal-950">Email Address (Optional)</label>
              <span className="text-[11px] text-teal-950/60 font-medium">For PDF certificate &amp; receipt</span>
            </div>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="e.g. ramesh@example.com"
              value={donorEmail}
              onChange={(e) => {
                setDonorEmail(e.target.value);
                clearFieldError("email");
              }}
              className={`w-full rounded-xl border p-2.5 text-base sm:text-sm text-teal-950 outline-none transition ${
                formErrors.email
                  ? "border-rose-500 ring-2 ring-rose-200"
                  : "border-teal-900/20 focus:ring-2 focus:ring-amber-500"
              }`}
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                <span>⚠️</span> {formErrors.email}
              </p>
            )}
          </div>

          {/* Prayer / Blessings Note */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-teal-950">
                Special Prayer Wish or Family Names (Optional)
              </label>
              <span className="text-[11px] text-teal-950/60 font-medium">Chanted by boys</span>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Praying for child's good health and wisdom on his 10th birthday..."
              value={prayerNote}
              onChange={(e) => setPrayerNote(e.target.value)}
              className="w-full rounded-xl border border-teal-900/20 p-2.5 text-base sm:text-xs text-teal-950 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* PAN Card Toggle (Form 10AC Section 80G Tax Exemption) */}
          <div className="rounded-2xl bg-cream/35 p-3.5 border border-teal-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">📜</span>
                <div>
                  <p className="text-xs font-bold text-teal-950">Claim 80G Tax Deduction</p>
                  <p className="text-[10px] text-teal-950/65">
                    Save up to 50% income tax under Form 10AC Section 80G
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPanInput(!showPanInput)}
                className="text-xs font-bold text-teal-900 underline hover:text-amber-700 cursor-pointer"
              >
                {showPanInput ? "Hide PAN" : "+ Add PAN"}
              </button>
            </div>

            {showPanInput && (
              <div className="mt-3 pt-3 border-t border-teal-900/10 animate-fadeIn">
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  Income Tax PAN Card Number
                </label>
                <input
                  ref={panInputRef}
                  type="text"
                  maxLength={10}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="ABCDE1234F"
                  value={donorPan}
                  onChange={(e) => {
                    setDonorPan(sanitizePan(e.target.value));
                    clearFieldError("pan");
                  }}
                  className={`w-full rounded-xl border p-2.5 text-base sm:text-xs font-mono uppercase tracking-wider text-teal-950 outline-none transition ${
                    formErrors.pan
                      ? "border-rose-500 ring-2 ring-rose-200"
                      : "border-teal-900/20 focus:ring-2 focus:ring-amber-500"
                  }`}
                />
                {formErrors.pan ? (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <span>⚠️</span> {formErrors.pan}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] text-teal-950/60">
                    PAN is recorded directly in your official Income Tax Form 10BE filing.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instant UPI & Payment Options Trust Strip */}
        <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-bold text-teal-950/70">
          <span>⚡ Instant 1-Tap Payment via</span>
          <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Google Pay</span>
          <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">PhonePe</span>
          <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Paytm</span>
          <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">UPI / Cards</span>
        </div>

        {/* ── 4. Pay / Donate CTA Button ── */}
        <button
          type="button"
          onClick={handlePayNow}
          disabled={loading}
          className="focus-ring tap-scale w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Preparing Secure Gateway...</span>
            </>
          ) : (
            <>
              <span>Complete Auspicious Blessing</span>
              <span className="font-extrabold text-amber-200">({formatINR(finalAmount)})</span>
              <span>💝</span>
            </>
          )}
        </button>

        {/* ── Trust & Verification Footer ── */}
        <div className="mt-5 pt-4 border-t border-teal-900/10 grid grid-cols-3 gap-2 text-center text-[10px] text-teal-950/70 font-semibold">
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">🛡️</span>
            <span>256-Bit SSL Secured</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">📜</span>
            <span>80G Tax Deductible</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm">⚡</span>
            <span>Instant WhatsApp Receipt</span>
          </div>
        </div>
      </div>

      {/* Institutional Assurance Footnote */}
      <div className="mt-4 text-center text-xs text-teal-950/60 space-y-1">
        <p>
          Registered Charitable Trust: <strong>Janaseva Ashrama (Est. 2000)</strong>
        </p>
        <p>
          Income Tax Form 10AC: <strong>{FORM_10AC.urn}</strong> · Govt of Karnataka Recognized
        </p>
      </div>
    </div>
  );
}
