"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "./CartProvider";
import { formatINR, SITE, FORM_10AC, BANK_DETAILS } from "@/lib/site";
import { trackDonationSuccess, trackViewContent, trackInitiateCheckout } from "@/lib/tracking";
import { validateName, validatePhone, validateEmail, validatePan, sanitizePan } from "@/lib/validation";
import { openRazorpayCheckout } from "@/lib/razorpay-client";

interface PresetTier {
  amt: number;
  label: string;
  badge?: string;
  meaning: string;
  icon: string;
}

const PRESET_TIERS: PresetTier[] = [
  { amt: 11, label: "₹11", badge: "Shagun", meaning: "Auspicious token offering & sacred blessing for 25 boys", icon: "✨" },
  { amt: 101, label: "₹101", meaning: "Full hot satvik lunch (rice, sambar, sabzi) for 1 boy", icon: "🍲" },
  { amt: 251, label: "₹251", meaning: "Full school stationery kit, notebooks & pencils for 1 boy", icon: "📚" },
  { amt: 501, label: "₹501", badge: "Popular ★", meaning: "3 days nutritious meals & pediatric care for 1 boy", icon: "💛" },
  { amt: 1001, label: "₹1,001", meaning: "1 week fresh farm vegetables, milk & groceries for the ashrama kitchen", icon: "🥦" },
  { amt: 2501, label: "₹2,501", badge: "Special Feast", meaning: "Wholesome special feast with sweet payasam for all 25 boys!", icon: "🎂" },
  { amt: 5001, label: "₹5,001", meaning: "1 month comprehensive schooling, clothes & nutrition for 1 boy", icon: "🌟" },
];

const OCCASIONS = [
  { id: "general", label: "General Seva & Blessings" },
  { id: "birthday", label: "Birthday Celebration" },
  { id: "memorial", label: "In Loving Memory (Smrithi Seva)" },
  { id: "anniversary", label: "Wedding / Anniversary" },
  { id: "festival", label: "Festival / Auspicious Day" },
];

export function UnifiedDonationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cart = useCart();

  // 1. Amount selection state
  const [amount, setAmount] = useState<number>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const p = parseFloat(urlAmt);
      if (!isNaN(p) && p >= 10 && p <= 500000) return p;
    }
    if (cart.hydrated && cart.total > 0) return cart.total;
    return 101; // Welcoming accessible starter tier
  });

  const [customInput, setCustomInput] = useState<string>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const p = parseFloat(urlAmt);
      if (!isNaN(p) && !PRESET_TIERS.some((t) => t.amt === p)) return String(p);
    }
    return "";
  });

  // Sync amount with cart when cart hydrates
  useEffect(() => {
    if (cart.hydrated && cart.total > 0 && !searchParams.get("amount")) {
      setAmount(cart.total);
      if (!PRESET_TIERS.some((t) => t.amt === cart.total)) {
        setCustomInput(String(cart.total));
      }
    }
  }, [cart.hydrated, cart.total, searchParams]);

  // Sync custom input to cart
  const effectiveAmount = customInput && !isNaN(Number(customInput)) && Number(customInput) > 0
    ? Number(customInput)
    : amount;

  // 2. Donor details
  const [donorName, setDonorName] = useState(() => searchParams.get("name") || "");
  const [donorPhone, setDonorPhone] = useState(() => (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10));
  const [donorEmail, setDonorEmail] = useState(() => (searchParams.get("email") || "").trim().toLowerCase());
  const [donorPan, setDonorPan] = useState("");
  const [showPan, setShowPan] = useState(false);

  // 3. Occasion & Dedication
  const [occasion, setOccasion] = useState(() => {
    const occ = searchParams.get("occasion");
    if (occ) {
      const found = OCCASIONS.find((o) => o.id === occ.toLowerCase() || o.label.toLowerCase().includes(occ.toLowerCase()));
      if (found) return found.id;
    }
    return "general";
  });
  const [showDedication, setShowDedication] = useState(() => Boolean(searchParams.get("occasion") || searchParams.get("purpose")));
  const [prayerNote, setPrayerNote] = useState(() => searchParams.get("purpose") || searchParams.get("message") || "");

  // 4. Payment method tabs
  const [paymentMethod, setPaymentMethod] = useState<"gateway" | "upi" | "bank">("gateway");
  const [loading, setLoading] = useState(false);
  const [gatewayError, setGatewayError] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; amount?: string }>({});
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Honeypot anti-spam
  const [honeypot, setHoneypot] = useState("");

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Derive caller reference
  const callerRef = typeof window !== "undefined"
    ? sessionStorage.getItem("antigravity_caller_ref") || localStorage.getItem("antigravity_caller_ref") || "DIRECT"
    : "DIRECT";

  // Active impact description
  const activePreset = PRESET_TIERS.find((t) => t.amt === effectiveAmount);
  const impactText = activePreset
    ? activePreset.meaning
    : `Provides vital nutrition, wholesome satvik meals & school education for 25 boys at Janaseva Ashrama.`;

  // Dynamic UPI URL & QR
  const upiId = "janaseva.ashrama@axisbank";
  const upiUri = `upi://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${effectiveAmount}&cu=INR&tn=Donation%20for%2025%20Boys`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUri)}`;

  // Handle amount selection
  const handleSelectPreset = (amt: number) => {
    setAmount(amt);
    setCustomInput("");
    setGatewayError("");
    setFormErrors((prev) => ({ ...prev, amount: undefined }));
    cart.setCustom(amt);
    trackViewContent({
      content_name: `Select Tier ₹${amt}`,
      value: amt,
      currency: "INR",
    });
  };

  const handleCustomChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    setCustomInput(digits);
    setGatewayError("");
    setFormErrors((prev) => ({ ...prev, amount: undefined }));
    const num = Number(digits);
    if (num >= 10) {
      setAmount(num);
      cart.setCustom(num);
    }
  };

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(field);
      setTimeout(() => setCopiedBankField(null), 2500);
    }
  };

  // Primary Gateway Checkout Action
  const handlePayOnline = async () => {
    const errors: typeof formErrors = {};

    if (!effectiveAmount || effectiveAmount < 10) {
      errors.amount = "Minimum donation contribution is ₹10.";
    }

    const nameCheck = validateName(donorName, "Full Name");
    if (!nameCheck.valid) {
      errors.name = nameCheck.error || "Please enter your full name for morning prayers & 80G receipt.";
    }

    const phoneCheck = validatePhone(donorPhone, true, "WhatsApp Number");
    if (!phoneCheck.valid) {
      errors.phone = phoneCheck.error || "Please enter a valid 10-digit WhatsApp number to receive your instant tax receipt.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.name && nameInputRef.current) nameInputRef.current.focus();
      else if (errors.phone && phoneInputRef.current) phoneInputRef.current.focus();
      return;
    }

    setLoading(true);
    setGatewayError("");
    setFormErrors({});

    const safetyTimer = setTimeout(() => {
      setLoading(false);
      // Auto-fallback to direct UPI if gateway takes too long
      setGatewayError("Gateway popup was delayed. You can also pay directly using the UPI options below!");
      setPaymentMethod("upi");
    }, 12000);

    try {
      const selectedOccasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || "General Seva";

      // 1. Create order on server
      const res = await fetch("/api/v1/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: effectiveAmount,
          callerRefId: callerRef,
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
        clearTimeout(safetyTimer);
        throw new Error(data.error || "Failed to initialize payment order.");
      }

      trackInitiateCheckout({
        content_name: `Support 25 Boys - ₹${effectiveAmount}`,
        value: effectiveAmount,
        currency: "INR",
        num_items: 1,
      });

      // 2. Open Razorpay Gateway
      if (data.orderId && data.keyId) {
        await openRazorpayCheckout({
          keyId: data.keyId,
          orderId: data.orderId,
          amountPaise: data.amount,
          currency: "INR",
          name: "Janaseva Ashrama Bangalore",
          description: `Sponsor 25 Boys · ${selectedOccasionLabel}`,
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorEmail: donorEmail.trim() || "donor@janasevaashrama.org",
          onDismiss: () => {
            clearTimeout(safetyTimer);
            setLoading(false);
          },
          onError: (err: any) => {
            clearTimeout(safetyTimer);
            setLoading(false);
            setGatewayError(err?.description || "Gateway payment was cancelled. You can pay directly via Google Pay or PhonePe below!");
            setPaymentMethod("upi");
          },
          onSuccess: async (response) => {
            clearTimeout(safetyTimer);
            trackDonationSuccess({
              amount: effectiveAmount,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              donorName,
              donorPhone,
              donorEmail,
              callerRef,
              mode: "live",
            });

            // Redirect to thank you page
            window.location.href = `/thank-you?amount=${effectiveAmount}&payment_id=${encodeURIComponent(
              response.razorpay_payment_id || ""
            )}&order_id=${encodeURIComponent(response.razorpay_order_id || "")}`;
          },
        });
      }
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setLoading(false);
      console.warn("[Checkout] Gateway fallback to UPI:", err);
      setGatewayError("Gateway popup could not open in your browser. Please use Direct UPI (Google Pay / PhonePe) below!");
      setPaymentMethod("upi");
    }
  };

  // Direct UPI "I Have Paid" Confirmation
  const handleDirectUpiConfirmation = async () => {
    const errors: typeof formErrors = {};
    const nameCheck = validateName(donorName, "Full Name");
    if (!nameCheck.valid) errors.name = nameCheck.error;
    const phoneCheck = validatePhone(donorPhone, true, "WhatsApp Number");
    if (!phoneCheck.valid) errors.phone = phoneCheck.error;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.name && nameInputRef.current) nameInputRef.current.focus();
      else if (errors.phone && phoneInputRef.current) phoneInputRef.current.focus();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/supporter-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor: {
            name: donorName.trim(),
            phone: donorPhone.trim(),
            email: donorEmail.trim() || undefined,
            pan: sanitizePan(donorPan),
          },
          customAmount: effectiveAmount,
          selectedTiers: [],
          collectionMode: "upi",
          notes: `Direct UPI payment of ₹${effectiveAmount} via ${upiId}. Occasion: ${occasion}`,
          idempotencyKey: `upi_direct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          website_hp: "",
        }),
      });

      const data = await res.json();
      setLoading(false);
      window.location.href = `/thank-you?amount=${effectiveAmount}&mode=upi&reference=${encodeURIComponent(
        data.referenceNo || "UPI-DIRECT"
      )}`;
    } catch (e) {
      setLoading(false);
      // Open WhatsApp directly
      const text = encodeURIComponent(
        `Namaste Janaseva Ashrama, I have completed a direct UPI donation of ₹${effectiveAmount} to ${upiId}.\n\nName: ${donorName}\nMobile: ${donorPhone}\nPlease generate my 80G tax receipt.`
      );
      window.open(`https://wa.me/919980359595?text=${text}`, "_blank");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-6 sm:py-10">
      {/* ── CARD HEADER: TRUST & COMPASSION ── */}
      <div className="overflow-hidden rounded-3xl bg-white shadow-2xl border border-teal-900/10">
        <div className="relative bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Official 80G Donation Portal
                </span>
                <span className="text-xs text-emerald-200/80 font-medium hidden sm:inline">
                  JJ Act Govt Reg: KA18CH0242
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Support 25 Resident Boys at Janaseva Ashrama
              </h1>
              <p className="mt-1 text-sm sm:text-base text-teal-100/90 leading-relaxed max-w-2xl">
                Every rupee goes directly to wholesome satvik meals, school education & loving shelter.
                Instant 50% 80G tax receipt issued automatically.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-sm p-3 border border-white/15 text-xs">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-bold text-white">100% Tax Deductible</p>
                <p className="text-[11px] text-amber-200">Form 10AC · URN: AABTJ7431MF20231</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: CHOOSE AMOUNT (1-TAP PRESETS) ── */}
        <div className="p-6 sm:p-8 border-b border-teal-900/10 bg-cream/30">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-extrabold text-teal-950 uppercase tracking-wide flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">1</span>
              Choose Your Contribution Amount
            </label>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Starts from ₹11 upwards
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {PRESET_TIERS.map((tier) => {
              const isSelected = effectiveAmount === tier.amt && !customInput;
              return (
                <button
                  key={tier.amt}
                  type="button"
                  onClick={() => handleSelectPreset(tier.amt)}
                  className={`relative flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center transition-all duration-200 border-2 ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/80 shadow-md transform scale-[1.02] text-teal-950"
                      : "border-teal-900/15 bg-white hover:border-amber-400 hover:bg-amber-50/30 text-teal-900"
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-2.5 right-2 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-xs">
                      {tier.badge}
                    </span>
                  )}
                  <span className="text-xl mb-1">{tier.icon}</span>
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight">{tier.label}</span>
                </button>
              );
            })}

            {/* Custom Amount Box */}
            <div
              className={`relative col-span-2 sm:col-span-1 flex flex-col justify-center rounded-2xl p-2.5 sm:p-3 border-2 transition-all ${
                customInput
                  ? "border-amber-500 bg-amber-50/80 shadow-md"
                  : "border-teal-900/15 bg-white hover:border-amber-400"
              }`}
            >
              <span className="text-[11px] font-bold text-teal-800 mb-1">Custom Amount (₹)</span>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 font-extrabold text-teal-950 text-base">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customInput}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="Other (₹)"
                  className="w-full rounded-xl border border-teal-900/20 bg-white py-1.5 pl-6 pr-2 text-base font-extrabold text-teal-950 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Real-time Emotional Impact Strip */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-500/10 p-3.5 border border-amber-500/25">
            <span className="text-2xl mt-0.5">💛</span>
            <div>
              <p className="text-sm font-bold text-amber-950">
                Your <span className="underline decoration-amber-500 font-extrabold">{formatINR(effectiveAmount)}</span> Donation Impact:
              </p>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-0.5 font-medium leading-relaxed">
                {impactText}
              </p>
              <p className="text-[11px] text-teal-900/75 mt-1">
                ✓ 100% Tax Deductible (50% relief under Section 80G) · Instant WhatsApp 80G Receipt
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: DONOR DETAILS (2 REQUIRED FIELDS) ── */}
        <div className="p-6 sm:p-8 border-b border-teal-900/10 bg-white">
          <label className="text-sm font-extrabold text-teal-950 uppercase tracking-wide flex items-center gap-2 mb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">2</span>
            Donor Details (For 80G Receipt & Morning Prayers)
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={donorName}
                onChange={(e) => {
                  setDonorName(e.target.value);
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g. Ramesh Kumar"
                className={`w-full rounded-xl border-2 px-3.5 py-2.5 text-sm font-semibold text-teal-950 outline-none transition ${
                  formErrors.name
                    ? "border-red-500 bg-red-50/40 focus:border-red-600"
                    : "border-teal-900/15 bg-cream/40 focus:border-amber-500 focus:bg-white"
                }`}
              />
              {formErrors.name ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.name}</p>
              ) : (
                <p className="mt-1 text-[11px] text-teal-950/60">Chanted during morning shloka prayers at the ashrama</p>
              )}
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                WhatsApp Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-teal-950/70">+91</span>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  maxLength={10}
                  value={donorPhone}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setDonorPhone(clean);
                    if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="9876543210"
                  className={`w-full rounded-xl border-2 py-2.5 pl-11 pr-3 text-sm font-semibold text-teal-950 outline-none transition ${
                    formErrors.phone
                      ? "border-red-500 bg-red-50/40 focus:border-red-600"
                      : "border-teal-900/15 bg-cream/40 focus:border-amber-500 focus:bg-white"
                  }`}
                />
              </div>
              {formErrors.phone ? (
                <p className="mt-1 text-xs font-semibold text-red-600">{formErrors.phone}</p>
              ) : (
                <p className="mt-1 text-[11px] text-emerald-800 font-medium">✓ Instant 80G tax receipt PDF will be sent here</p>
              )}
            </div>
          </div>

          {/* Optional Expanders (PAN & Dedication) */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowPan(!showPan)}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline underline-offset-4 flex items-center gap-1"
            >
              {showPan ? "− Hide PAN Field" : "+ Add PAN for 80G Tax Exemption (50% deduction)"}
            </button>

            <span className="text-teal-900/30">|</span>

            <button
              type="button"
              onClick={() => setShowDedication(!showDedication)}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 underline underline-offset-4 flex items-center gap-1"
            >
              {showDedication ? "− Hide Dedication" : "+ Dedicate for Birthday / Memorial"}
            </button>
          </div>

          {/* PAN Input (Collapsible) */}
          {showPan && (
            <div className="mt-3 p-3.5 rounded-2xl bg-teal-50 border border-teal-200 animate-in fade-in">
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Income Tax PAN (Permanent Account Number)
              </label>
              <input
                type="text"
                maxLength={10}
                value={donorPan}
                onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full sm:w-64 rounded-xl border-2 border-teal-900/15 bg-white px-3 py-2 text-sm font-mono font-bold text-teal-950 uppercase outline-none focus:border-amber-500"
              />
              <p className="mt-1 text-[11px] text-teal-800">
                Required only to claim 50% deduction on your Income Tax return under Section 80G (Form 10AC).
              </p>
            </div>
          )}

          {/* Dedication Inputs (Collapsible) */}
          {showDedication && (
            <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 animate-in fade-in space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-950 mb-1">Occasion / Seva Type</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full sm:w-72 rounded-xl border-2 border-amber-900/15 bg-white px-3 py-2 text-xs font-bold text-teal-950 outline-none focus:border-amber-500"
                >
                  {OCCASIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-950 mb-1">
                  Prayer Note / Celebrant Name (Optional)
                </label>
                <input
                  type="text"
                  value={prayerNote}
                  onChange={(e) => setPrayerNote(e.target.value)}
                  placeholder="e.g. In memory of Late Shri Krishnappa / Birthday of Ananya"
                  className="w-full rounded-xl border-2 border-amber-900/15 bg-white px-3 py-2 text-xs font-medium text-teal-950 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Honeypot hidden input */}
          <input
            type="text"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* ── SECTION 3: 100% WORKING PAYMENT METHOD SELECTOR ── */}
        <div className="p-6 sm:p-8 bg-cream/20">
          <label className="text-sm font-extrabold text-teal-950 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">3</span>
            Select Instant Payment Method
          </label>

          {/* Payment Method Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-teal-900/10 mb-5">
            <button
              type="button"
              onClick={() => { setPaymentMethod("gateway"); setGatewayError(""); }}
              className={`rounded-xl py-2.5 px-2 text-xs font-extrabold transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                paymentMethod === "gateway"
                  ? "bg-white text-teal-950 shadow-md border border-teal-900/10"
                  : "text-teal-900 hover:text-teal-950"
              }`}
            >
              <span>⚡</span>
              <span>Online Gateway</span>
              <span className="text-[10px] text-emerald-800 font-normal hidden sm:inline">(UPI / Cards)</span>
            </button>

            <button
              type="button"
              onClick={() => { setPaymentMethod("upi"); setGatewayError(""); }}
              className={`rounded-xl py-2.5 px-2 text-xs font-extrabold transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                paymentMethod === "upi"
                  ? "bg-white text-teal-950 shadow-md border border-teal-900/10"
                  : "text-teal-900 hover:text-teal-950"
              }`}
            >
              <span>📱</span>
              <span>Direct UPI / QR</span>
              <span className="text-[10px] text-amber-800 font-normal hidden sm:inline">(1-Tap GPay)</span>
            </button>

            <button
              type="button"
              onClick={() => { setPaymentMethod("bank"); setGatewayError(""); }}
              className={`rounded-xl py-2.5 px-2 text-xs font-extrabold transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1 ${
                paymentMethod === "bank"
                  ? "bg-white text-teal-950 shadow-md border border-teal-900/10"
                  : "text-teal-900 hover:text-teal-950"
              }`}
            >
              <span>🏦</span>
              <span>Bank Transfer</span>
              <span className="text-[10px] text-teal-700 font-normal hidden sm:inline">(NEFT / IMPS)</span>
            </button>
          </div>

          {/* Gateway Error Notification (with seamless 1-tap UPI switch) */}
          {gatewayError && (
            <div className="mb-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3.5 flex items-start gap-2.5">
              <span className="text-xl">💡</span>
              <div className="text-xs text-amber-950">
                <p className="font-bold">{gatewayError}</p>
                <p className="mt-0.5 text-amber-900">
                  You can complete your contribution instantly below via Google Pay, PhonePe, Paytm, or scanning the QR code!
                </p>
              </div>
            </div>
          )}

          {/* ════ TAB 1: ONLINE GATEWAY (RAZORPAY) ════ */}
          {paymentMethod === "gateway" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-teal-950">Instant 1-Tap Gateway</p>
                  <p className="text-[11px] text-teal-950/60">
                    Supports Google Pay, PhonePe, Paytm, BHIM, Credit/Debit Cards & NetBanking across all Indian banks.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-85">
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">UPI</span>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900">CARDS</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePayOnline}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-4 px-6 text-center text-base sm:text-lg font-black text-white shadow-xl hover:from-amber-600 hover:to-amber-800 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Connecting Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>DONATE {formatINR(effectiveAmount)} NOW ❤️</span>
                    <span className="text-xl">→</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-teal-900/60 font-medium pt-1">
                <span>🔒 256-Bit Bank Encryption</span>
                <span>•</span>
                <span>RBI Authorized</span>
                <span>•</span>
                <span>Instant WhatsApp 80G Receipt</span>
              </div>
            </div>
          )}

          {/* ════ TAB 2: DIRECT UPI (GPAY / PHONEPE / QR CODE) ════ */}
          {paymentMethod === "upi" && (
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-teal-900/10 shadow-sm space-y-4">
              <div className="text-center">
                <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 mb-2">
                  100% Reliable · Zero Popups · Instant
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-teal-950">
                  Scan QR or Tap Your UPI App
                </h3>
                <p className="text-xs text-teal-950/70 mt-0.5">
                  Official Trust Account: <span className="font-bold text-teal-950">Janaseva Ashrama (Axis Bank)</span>
                </p>
              </div>

              {/* QR Code and UPI ID */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                <div className="relative rounded-2xl bg-white p-2.5 shadow-md border-2 border-teal-900/15 text-center">
                  <img
                    src={qrCodeUrl}
                    alt={`UPI QR Code for ₹${effectiveAmount}`}
                    width={180}
                    height={180}
                    className="mx-auto rounded-xl"
                  />
                  <p className="mt-1 text-[11px] font-bold text-teal-950">Scan with any UPI App</p>
                  <p className="text-[10px] text-teal-950/60 font-semibold">{formatINR(effectiveAmount)} pre-filled</p>
                </div>

                <div className="space-y-3 text-center sm:text-left max-w-xs">
                  <div>
                    <span className="text-[11px] font-bold text-teal-900/70 block mb-1">Official UPI VPA ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-black text-teal-950 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200 select-all">
                        {upiId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(upiId, "upi")}
                        className="rounded-lg bg-teal-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-teal-950"
                      >
                        {copiedBankField === "upi" ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* 1-Tap App Deep Links on Mobile */}
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-teal-950 mb-1.5">Tap to pay directly on phone:</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <a
                        href={upiUri}
                        className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-2 text-xs font-black text-white shadow-xs inline-flex items-center gap-1"
                      >
                        <span>📱 Open UPI App (GPay / PhonePe)</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Button */}
              <div className="pt-2 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={handleDirectUpiConfirmation}
                  disabled={loading}
                  className="w-full rounded-2xl bg-emerald-800 hover:bg-emerald-900 py-3.5 px-4 text-center text-sm sm:text-base font-extrabold text-white shadow-md transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Confirming...</span>
                  ) : (
                    <span>✓ I Have Completed UPI Payment (Get 80G Receipt)</span>
                  )}
                </button>
                <p className="text-center text-[11px] text-teal-950/60 mt-1.5">
                  Need help? WhatsApp ashrama team directly: <a href="https://wa.me/919980359595" target="_blank" rel="noopener noreferrer" className="font-bold underline text-emerald-800">+91 99803 59595</a>
                </p>
              </div>
            </div>
          )}

          {/* ════ TAB 3: DIRECT BANK TRANSFER (AXIS BANK) ════ */}
          {paymentMethod === "bank" && (
            <div className="rounded-2xl bg-white p-5 sm:p-6 border border-teal-900/10 shadow-sm space-y-4">
              <div className="text-center mb-2">
                <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 mb-1">
                  NEFT / RTGS / IMPS
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-teal-950">
                  Direct Bank Wire Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-cream/40 p-4 rounded-2xl border border-teal-900/10">
                <div>
                  <span className="text-[10px] font-bold text-teal-900/60 uppercase">Beneficiary Name</span>
                  <p className="font-extrabold text-teal-950 text-xs mt-0.5">{BANK_DETAILS.accountName}</p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-teal-900/60 uppercase">Bank & Branch</span>
                  <p className="font-extrabold text-teal-950 text-xs mt-0.5">{BANK_DETAILS.bankName}, {BANK_DETAILS.branch} Branch</p>
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-teal-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-teal-900/60 uppercase">Account Number</span>
                    <p className="font-mono font-extrabold text-teal-950 text-sm">{BANK_DETAILS.accountNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.accountNumber, "acc")}
                    className="rounded bg-teal-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-teal-950"
                  >
                    {copiedBankField === "acc" ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-teal-900/10">
                  <div>
                    <span className="text-[10px] font-bold text-teal-900/60 uppercase">IFSC Code</span>
                    <p className="font-mono font-extrabold text-teal-950 text-sm">{BANK_DETAILS.ifscCode}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(BANK_DETAILS.ifscCode, "ifsc")}
                    className="rounded bg-teal-900 px-2 py-1 text-[11px] font-bold text-white hover:bg-teal-950"
                  >
                    {copiedBankField === "ifsc" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Submit on WhatsApp button */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/919980359595?text=${encodeURIComponent(
                    `Namaste Janaseva Ashrama, I have completed a direct bank transfer of ₹${effectiveAmount} to Axis Bank A/c ${BANK_DETAILS.accountNumber}.\n\nDonor Name: ${donorName || "Supporter"}\nMobile: ${donorPhone || "Phone"}\nPlease issue my 80G tax receipt.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800 py-3.5 px-4 text-center text-xs sm:text-sm font-extrabold text-white shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>💬 Send Transfer Screenshot on WhatsApp (+91 99803 59595)</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
