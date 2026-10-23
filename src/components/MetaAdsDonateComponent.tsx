"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
import { openRazorpayCheckout } from "@/lib/razorpay-client";
import { useCart } from "./CartProvider";
import QRCode from "qrcode";

export interface PresetTier {
  amt: number;
  label: string;
  impact: string;
  badge?: string;
  icon: string;
  image: string;
  category: "shagun" | "meals" | "boys";
}

const ALL_PRESET_TIERS: PresetTier[] = [
  // ── Shagun Tier (₹11 to ₹51) ──
  {
    amt: 11,
    label: "₹11",
    impact: "1 warm glass of pure cow milk for 1 boy",
    badge: "Shagun ₹11",
    icon: "🥛",
    image: "/media/food.jpg",
    category: "shagun",
  },
  {
    amt: 21,
    label: "₹21",
    impact: "Fresh morning fruit & study vitality",
    badge: "Shagun ₹21",
    icon: "🍌",
    image: "/media/fruits.jpg",
    category: "shagun",
  },
  {
    amt: 51,
    label: "₹51",
    impact: "Hot breakfast (idlis & sambar) for a child",
    badge: "Shagun ₹51",
    icon: "🍲",
    image: "/media/prayer-meals.jpg",
    category: "shagun",
  },
  // ── Daily Feasts & Care (₹101 to ₹501) ──
  {
    amt: 101,
    label: "₹101",
    impact: "Full hot satvik lunch or dinner for 1 boy",
    badge: "Most Popular ★",
    icon: "🍛",
    image: "/media/banana-leaf-feast.jpg",
    category: "meals",
  },
  {
    amt: 251,
    label: "₹251",
    impact: "Full school notebooks & stationery kit",
    badge: "Vidya Kit",
    icon: "📚",
    image: "/media/school-kit.jpg",
    category: "meals",
  },
  {
    amt: 501,
    label: "₹501",
    impact: "3 days nutritious meals & pediatric doctor care",
    badge: "Arogya Seva",
    icon: "🩺",
    image: "/media/boys-meal-gratitude.jpg",
    category: "meals",
  },
  // ── Sponsor 25 Resident Boys (₹1,000 to ₹4,500) ──
  {
    amt: 1000,
    label: "₹1,000",
    impact: "Feeds a child for a whole week + tuition",
    badge: "Feeds 1 Wk ⭐",
    icon: "🍲",
    image: "/media/learning.jpg",
    category: "boys",
  },
  {
    amt: 2500,
    label: "₹2,500",
    impact: "Special hot lunch feast for all 25 boys",
    badge: "25 Boys Meal",
    icon: "🍛",
    image: "/media/annadana-hall-hd.jpg",
    category: "boys",
  },
  {
    amt: 4500,
    label: "₹4,500",
    impact: "All 4 meals (Full Day Annadana) for all 25 boys",
    badge: "Full Day Seva",
    icon: "✨",
    image: "/media/boys-group-red-assembly.jpg",
    category: "boys",
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
    a: "You can donate instantly with 1 tap via Google Pay, PhonePe, Paytm, BHIM, Cred, any UPI app, Debit Cards, Credit Cards, or Net Banking from all major Indian banks.",
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
  if (amt === 1000) return "Feeds an orphaned boy with all 3 nutritious meals for an entire week.";
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
          "META_ADS"
        );
      } catch {}
    }
    return "META_ADS";
  });
  const [leadId] = useState<string>(() => searchParams.get("lead_id") || "");

  // Category Filter for Presets ("all" | "shagun" | "meals" | "boys")
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Amount State (Starts from ₹11 upwards; default to cart.total if available, or URL param, or ₹2,500 flagship)
  const [amount, setAmount] = useState<number>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000 && ALL_PRESET_TIERS.some((t) => t.amt === parsed)) {
        return parsed;
      }
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("janaseva-cart-v1");
        if (raw) {
          const parsedCart = JSON.parse(raw);
          const savedCustom = Number(parsedCart.custom);
          if (savedCustom >= 10 && savedCustom <= 500000) {
            return savedCustom;
          }
        }
      } catch {}
    }
    return 2500; // Flagship 25 boys hot meal tier default
  });
  const [customAmount, setCustomAmount] = useState<string>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000 && !ALL_PRESET_TIERS.some((t) => t.amt === parsed)) {
        return String(parsed);
      }
    }
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("janaseva-cart-v1");
        if (raw) {
          const parsedCart = JSON.parse(raw);
          const savedCustom = Number(parsedCart.custom);
          if (savedCustom >= 10 && savedCustom <= 500000 && !ALL_PRESET_TIERS.some((t) => t.amt === savedCustom)) {
            return String(savedCustom);
          }
        }
      } catch {}
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
  const cart = useCart();
  const [activeTab, setActiveTab] = useState<"gateway" | "upi" | "bank">("gateway");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const initializedFromCartRef = useRef(false);

  // Synchronize amount state ONCE on mount from searchParams or cart
  // Kept decoupled from live keystroke typing so users can type any custom amount freely
  useEffect(() => {
    if (initializedFromCartRef.current) return;

    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 500000) {
        initializedFromCartRef.current = true;
        if (ALL_PRESET_TIERS.some((t) => t.amt === parsed)) {
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
        if (ALL_PRESET_TIERS.some((t) => t.amt === cart.total)) {
          setAmount(cart.total);
          setCustomAmount("");
        } else {
          setAmount(cart.total);
          setCustomAmount(String(cart.total));
        }
      }
    }
  }, [cart.hydrated, searchParams, cart.setDedicatedAmount]);

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

  // Refs for smooth scroll
  const topCardRef = useRef<HTMLDivElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Derived effective donation amount
  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
  const amountWords = finalAmount >= 10 ? numberToIndianWords(finalAmount) : "";

  // Dynamic Official UPI Link for Janaseva Ashrama
  const upiId = "9980359595@okbizaxis";
  const upiUri = `upi://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent("Donation for 25 Boys")}`;
  const gpayUri = `gpay://upi/pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent("Donation for 25 Boys")}`;
  const phonepeUri = `phonepe://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent("Donation for 25 Boys")}`;
  const paytmUri = `paytmmp://pay?pa=${upiId}&pn=Janaseva%20Ashrama&am=${finalAmount}&cu=INR&tn=${encodeURIComponent("Donation for 25 Boys")}`;

  useEffect(() => {
    if (finalAmount > 0) {
      QRCode.toDataURL(upiUri, {
        width: 240,
        margin: 1,
        color: { dark: "#052f2c", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [finalAmount, upiUri]);

  // Dynamic Impact Description
  const impactSummary = getDynamicImpactText(finalAmount);

  // Filtered preset tiers
  const filteredTiers = useMemo(() => {
    if (activeCategory === "all") return ALL_PRESET_TIERS;
    return ALL_PRESET_TIERS.filter((t) => t.category === activeCategory);
  }, [activeCategory]);

  // Track ViewContent on mount
  useEffect(() => {
    trackViewContent({
      content_name: "Meta Ads 25 Boys Donation",
      content_category: "Child Welfare & Annadana",
      value: finalAmount || 101,
      currency: "INR",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ViewContent when amount changes
  const handleSelectTier = (amt: number) => {
    setAmount(amt);
    setCustomAmount("");
    clearFieldError("amount");
    if (cart.setDedicatedAmount) {
      cart.setDedicatedAmount(amt);
    }
    trackViewContent({
      content_name: `Sponsor 25 Boys - ₹${amt}`,
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
      setShowStickyBar(rect.bottom < 100);
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
    // 1. Amount validation (Starts from ₹10 upwards)
    if (!finalAmount || isNaN(finalAmount) || finalAmount < 10) {
      setFormErrors({ amount: "Please choose or enter a valid donation amount (minimum contribution is ₹10)." });
      if (topCardRef.current) topCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Friendly fallback: never hard-block the gateway launch if name/phone aren't filled yet
    const effectiveName = donorName.trim() || "Janaseva Supporter";
    const effectivePhone = donorPhone.replace(/\D/g, "").slice(-10) || "9980359595";

    setLoading(true);
    setFormErrors({});

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 12000);

    try {
      const selectedOccasionLabel =
        OCCASIONS.find((o) => o.id === occasion)?.label || "General Seva";
      const cleanOccasion = selectedOccasionLabel.replace(/[^\w\s-]/g, "").trim() || "General Seva";
      const cleanPrayerNote = prayerNote.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim();

      // 1. Initialize Razorpay order on server
      const res = await fetch("/api/v1/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          callerRefId: callerRef,
          leadId: leadId || undefined,
          donorName: effectiveName,
          donorPhone: effectivePhone,
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
        throw new Error(data.error || "Failed to initialize secure checkout. Please try again.");
      }

      // Funnel Step: Meta Pixel InitiateCheckout Event
      trackInitiateCheckout({
        content_name: `Support 25 Boys - ${selectedOccasionLabel}`,
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
          description: `Sponsor 25 Resident Boys · ${cleanOccasion}`,
          donorName: donorName.trim() || undefined,
          donorPhone: donorPhone.trim() || undefined,
          donorEmail: donorEmail.trim() || "donor@janasevaashrama.org",
          notes: {
            caller_ref_id: callerRef,
            lead_id: leadId || "",
            donor_name: effectiveName,
            donor_phone: effectivePhone,
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
            // Seamless automatic switch to Direct UPI & QR
            setFormErrors({
              general: "Browser or popup blocker restricted the gateway window. Please use Direct UPI (Google Pay / PhonePe) or scan QR below!",
            });
            setActiveTab("upi");
          },
          onSuccess: async (response) => {
            clearTimeout(safetyTimer);
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
        });
      } else if (data.mode === "demo") {
        // Sandbox fallback for local development without Razorpay keys
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
          callerRef
        )}&demo=true`;
      } else {
        throw new Error(data.error || "Payment gateway could not generate an order. Please try again.");
      }
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setFormErrors({
        general:
          err.message || "Payment gateway connection could not be opened. You can complete your donation instantly using Direct UPI or QR code below.",
      });
      setActiveTab("upi");
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

      {/* ── 1. 🚨 LIVE URGENT DONATION BEACON BAR ── */}
      <div className="mb-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 p-3 text-white shadow-lg border border-red-400/40">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
              Urgent Need Today · Bangalore Ashrama
            </span>
          </div>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase">
            6 Meals Needed Tonight
          </span>
        </div>

        <p className="mt-1 text-[11px] sm:text-xs text-white/95 leading-snug font-medium">
          Evening satvik meals &amp; tomorrow&apos;s morning cow milk needed for 25 boys.{" "}
          <strong>Even ₹11 blesses a child with warm milk.</strong>
        </p>

        {/* Urgency Progress Bar */}
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-black/25 overflow-hidden">
            <div className="h-full rounded-full bg-amber-300 w-[76%] transition-all duration-500" />
          </div>
          <span className="text-[10px] font-black text-amber-200 shrink-0">19/25 Boys Sponsored</span>
        </div>
      </div>

      {/* ── 2. HERO CARD WITH AUTHENTIC PHOTO BACKGROUND & EMOTIONAL HOOK ── */}
      <div className="relative overflow-hidden rounded-3xl bg-teal-950 p-5 sm:p-7 text-white shadow-2xl mb-4 border border-amber-400/30">
        {/* Authentic Background Photo with Vignette */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/boys-meal-gratitude.jpg"
          alt="Resident orphaned boys praying with gratitude at Janaseva Ashrama Bangalore"
          className="absolute inset-0 h-full w-full object-cover object-center scale-105 filter brightness-75 transition-transform duration-700"
        />
        {/* High-Contrast Gradient Scrim for 100% Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/85 to-teal-950/65" />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <LogoMark size={44} className="shadow-md ring-2 ring-amber-400/60" />
              <div>
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight">
                  Janaseva Ashrama
                </h2>
                <p className="text-[10px] font-semibold text-amber-300">
                  Registered Orphanage &amp; Children&apos;s Home · Est. 2000
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-200">
                🛡️ 80G Tax Free
              </span>
              <span className="text-[9px] text-white/70 font-mono">
                Govt: {SITE.jjActNumber}
              </span>
            </div>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mt-1">
            Feed &amp; Educate 25 Orphaned Boys
          </h1>

          <p className="text-xs sm:text-sm text-teal-100/90 mt-2 leading-relaxed">
            Every rupee directly provides steaming hot satvik meals, school kits, and loving care. 
            <strong> All donors are remembered in 6:30 AM morning prayers.</strong>
          </p>
        </div>
      </div>

      {/* ── 3. 🎯 TOP ACTION DONATION CARD (ABOVE THE MOBILE FOLD) ── */}
      <div
        ref={topCardRef}
        className="rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border-2 border-amber-400/50 relative overflow-hidden ring-4 ring-amber-300/15"
      >
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl pointer-events-none" />

        {/* 3 Donor-Friendly Payment Options */}
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-2xl bg-cream/80 p-1 border border-teal-900/10 text-center">
          <button
            type="button"
            onClick={() => setActiveTab("gateway")}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
              activeTab === "gateway"
                ? "bg-teal-950 text-white shadow-sm ring-1 ring-amber-400"
                : "text-teal-950/70 hover:text-teal-950"
            }`}
          >
            <span>⚡ Gateway</span>
            <span className="text-[9px] font-normal opacity-80">UPI / Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upi")}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
              activeTab === "upi"
                ? "bg-teal-950 text-white shadow-sm ring-1 ring-amber-400"
                : "text-teal-950/70 hover:text-teal-950"
            }`}
          >
            <span>📱 Direct UPI</span>
            <span className="text-[9px] font-normal opacity-80">GPay/QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
              activeTab === "bank"
                ? "bg-teal-950 text-white shadow-sm ring-1 ring-amber-400"
                : "text-teal-950/70 hover:text-teal-950"
            }`}
          >
            <span>🏦 Bank Wire</span>
            <span className="text-[9px] font-normal opacity-80">Axis Bank</span>
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
        {activeTab === "gateway" && (
          <div className="space-y-4">
            {/* ── STEP 1: PRESET AMOUNTS WITH AUTHENTIC PHOTO BACKGROUNDS (Starts from ₹11) ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <span>1.</span>
                  <span>Choose Sacred Contribution:</span>
                </label>
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                  <span>✓</span> Starts from ₹11 · 80G Tax Free
                </span>
              </div>

              {/* Category Filter Chips for Fast Selection */}
              <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: "all", label: "🌟 All Tiers" },
                  { id: "shagun", label: "🥛 Shagun (₹11 - ₹51)" },
                  { id: "meals", label: "🍲 Meals (₹101 - ₹501)" },
                  { id: "boys", label: "🏛️ 25 Boys (₹1k - ₹4.5k)" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer ${
                      activeCategory === cat.id
                        ? "bg-teal-950 text-white shadow-xs font-black"
                        : "bg-cream text-teal-950 border border-teal-900/10 hover:bg-sand"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Grid of Preset Cards with Authentic Image Backgrounds */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredTiers.map((tier) => {
                  const isSelected = amount === tier.amt && !customAmount;
                  return (
                    <button
                      key={tier.amt}
                      type="button"
                      onClick={() => handleSelectTier(tier.amt)}
                      className={`group relative overflow-hidden p-2.5 sm:p-3 rounded-2xl text-left transition-all border cursor-pointer tap-scale flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
                        isSelected
                          ? "border-amber-400 ring-2 ring-amber-400 shadow-xl scale-[1.02]"
                          : "border-teal-900/15 hover:border-amber-400/60"
                      }`}
                    >
                      {/* Authentic Image Background */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={tier.image}
                        alt={tier.label}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* High-contrast gradient overlay */}
                      <div
                        className={`absolute inset-0 transition-colors ${
                          isSelected
                            ? "bg-gradient-to-t from-teal-950/95 via-teal-950/80 to-teal-950/50"
                            : "bg-gradient-to-t from-black/90 via-black/75 to-black/45 group-hover:from-black/85"
                        }`}
                      />

                      {/* Top Badge */}
                      <div className="relative z-10 flex justify-end w-full">
                        {tier.badge && (
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[8px] font-black uppercase shadow-xs ${
                              isSelected
                                ? "bg-amber-400 text-teal-950"
                                : "bg-white/20 text-white backdrop-blur-xs"
                            }`}
                          >
                            {tier.badge}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="relative z-10 mt-auto">
                        <div className="flex items-center gap-1">
                          <span className="text-sm select-none">{tier.icon}</span>
                          <span
                            className={`font-display text-base sm:text-lg font-black leading-none drop-shadow-sm ${
                              isSelected ? "text-amber-300" : "text-white"
                            }`}
                          >
                            {tier.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/90 line-clamp-2 leading-tight mt-1 font-medium drop-shadow-xs">
                          {tier.impact}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── STEP 2: DEDICATED PERMANENT CUSTOM AMOUNT INPUT SECTION ── */}
              <div className="mt-3 rounded-2xl bg-cream/50 p-3.5 border border-teal-900/15">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="meta-custom-amount"
                    className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5"
                  >
                    <span>✏️</span>
                    <span>Or Enter Any Custom Amount (Min ₹11):</span>
                  </label>
                  {customAmount && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAmount("");
                        setAmount(2500);
                        if (cart.setDedicatedAmount) {
                          cart.setDedicatedAmount(2500);
                        }
                      }}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      Reset to Tiers
                    </button>
                  )}
                </div>

                <div className="relative flex items-center rounded-xl border-2 border-teal-900/20 bg-white px-3.5 py-1 focus-within:border-teal-900 focus-within:ring-2 focus-within:ring-amber-400 transition">
                  <span className="font-display text-xl font-black text-teal-950 select-none mr-2">
                    ₹
                  </span>
                  <input
                    ref={customInputRef}
                    id="meta-custom-amount"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Enter amount (e.g. 51, 151, 1500)"
                    value={customAmount}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, "");
                      setCustomAmount(clean);
                      clearFieldError("amount");
                      const num = parseFloat(clean);
                      if (clean && num >= 10 && num <= 1000000) {
                        setAmount(num);
                        if (cart.setDedicatedAmount) {
                          cart.setDedicatedAmount(num);
                        }
                      }
                    }}
                    className="w-full bg-transparent py-2 text-lg font-black text-teal-950 placeholder:text-teal-950/35 placeholder:font-normal outline-none"
                  />
                  {customAmount && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAmount("");
                        if (cart.setDedicatedAmount) {
                          cart.setDedicatedAmount(amount);
                        }
                      }}
                      className="text-xs font-bold text-teal-900/50 hover:text-teal-900 p-1 cursor-pointer shrink-0"
                      title="Clear amount"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Add Chips (Starting from +₹11) */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span className="text-[10px] font-bold text-teal-950/60 uppercase">Quick Add:</span>
                  {[11, 51, 101, 501, 1000, 2500].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => {
                        const current = customAmount ? parseFloat(customAmount) || 0 : amount;
                        const next = current + inc;
                        setAmount(next);
                        setCustomAmount(String(next));
                        clearFieldError("amount");
                        if (cart.setDedicatedAmount) {
                          cart.setDedicatedAmount(next);
                        }
                      }}
                      className="rounded-lg bg-white hover:bg-teal-950 hover:text-white border border-teal-900/15 px-2.5 py-1 text-[11px] font-black text-teal-950 transition cursor-pointer shadow-2xs"
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

              {/* Real-time Dynamic Impact Description & 80G Tax Calculation */}
              <div className="mt-2.5 rounded-2xl bg-amber-50 p-3.5 border border-amber-300/80 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-xl select-none shrink-0">🌸</span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                      Direct Impact for 25 Resident Boys:
                    </span>
                    <p className="font-bold text-teal-950 leading-snug text-xs mt-0.5">
                      {impactSummary}
                    </p>
                    {amountWords && (
                      <p className="text-[10px] text-amber-900/80 font-medium mt-0.5">
                        Amount in words: <strong>{amountWords}</strong>
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-start sm:self-auto rounded-lg bg-emerald-100 border border-emerald-300 px-2.5 py-1 text-[10px] font-black text-emerald-900 shadow-2xs">
                  80G Tax Deductible (50%)
                </div>
              </div>
            </div>

            {/* ── STEP 3: DONOR DETAILS (Streamlined 2 Fields: Name + WhatsApp) ── */}
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
                  <span className="text-[10px] text-teal-950/60 font-medium">Chanted in morning prayers</span>
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
                  <span className="text-[10px] text-emerald-700 font-bold">Instant 80G tax receipt</span>
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

              {/* PAN Input Field */}
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

              {/* Occasion / Prayer Dedication */}
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

            {/* ── 4. 🚀 BIG "DONATE NOW" CTA BUTTON (Clear, High-Contrast & Prominent) ── */}
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

            {/* Guarantees */}
            <p className="text-center text-[11px] text-teal-950/70 font-semibold flex items-center justify-center gap-1.5">
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>·</span>
              <span>⚡ Instant 80G Receipt on WhatsApp</span>
            </p>

            {/* Quick direct UPI bridge */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setActiveTab("upi")}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>⚡ Prefer Google Pay / PhonePe / QR Code? Tap Here →</span>
              </button>
            </div>
          </div>
        )}

                {/* TAB 2: DIRECT UPI APPS & DYNAMIC QR CODE */}
        {activeTab === "upi" && (
          <div className="space-y-4 animate-fadeIn text-xs">
            {/* Amount confirmation badge */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-950/60 block">Contribution Amount:</span>
                <span className="font-display text-xl font-black text-teal-950">{formatINR(finalAmount)}</span>
              </div>
              <span className="rounded-lg bg-emerald-100 text-emerald-900 font-black text-[10px] px-2 py-0.5">
                80G Tax Free
              </span>
            </div>

            {/* Dynamic QR Code Card */}
            <div className="rounded-3xl bg-white p-5 border-2 border-teal-900/15 shadow-md text-center space-y-3">
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-950 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider">
                ⚡ Instant Scan &amp; Pay (0% Platform Fee)
              </span>

              {qrDataUrl ? (
                <div className="flex justify-center my-2">
                  <div className="p-2 bg-white rounded-2xl border-2 border-amber-400/50 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="Janaseva Ashrama UPI Donation QR Code"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-sand/30 animate-pulse rounded-2xl flex items-center justify-center text-teal-950/40 text-xs">
                  Generating Dynamic QR...
                </div>
              )}

              <p className="text-[11px] font-semibold text-teal-950/80">
                Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, <strong>BHIM</strong>, or any banking app.
              </p>

              {/* Copyable UPI ID Box */}
              <div className="flex items-center justify-between bg-cream/70 p-2.5 rounded-xl border border-teal-900/15 text-left">
                <div>
                  <span className="text-[9px] font-bold text-teal-900/60 uppercase block">Official Trust UPI ID:</span>
                  <p className="font-mono text-xs font-black text-teal-950">{upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyBank(upiId, "upi")}
                  className="rounded-lg bg-teal-900 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-teal-950 cursor-pointer"
                >
                  {copiedBankField === "upi" ? "✓ Copied!" : "Copy UPI"}
                </button>
              </div>
            </div>

            {/* Mobile 1-Tap App Deep Links */}
            <div className="space-y-2">
              <p className="text-center text-[10px] font-bold uppercase tracking-wider text-teal-950/60">
                Or Tap Your Preferred App on Mobile:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={gpayUri}
                  className="p-3 rounded-xl bg-white border border-teal-900/15 hover:border-emerald-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-2 text-xs transition active:scale-95"
                >
                  <span className="text-base">🟢</span>
                  <span>Google Pay</span>
                </a>
                <a
                  href={phonepeUri}
                  className="p-3 rounded-xl bg-white border border-teal-900/15 hover:border-purple-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-2 text-xs transition active:scale-95"
                >
                  <span className="text-base">🟣</span>
                  <span>PhonePe</span>
                </a>
                <a
                  href={paytmUri}
                  className="p-3 rounded-xl bg-white border border-teal-900/15 hover:border-blue-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-2 text-xs transition active:scale-95"
                >
                  <span className="text-base">🔵</span>
                  <span>Paytm</span>
                </a>
                <a
                  href={upiUri}
                  className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs font-black flex items-center justify-center gap-1.5 text-xs transition active:scale-95"
                >
                  <span>⚡ Any UPI App</span>
                </a>
              </div>
            </div>

            {/* WhatsApp Confirmation Button */}
            <div className="pt-2">
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  `Namaste Janaseva Ashrama, I have completed a direct UPI donation of ₹${finalAmount} for the 25 resident boys.\n\nDonor Name: ${donorName.trim() || "Well-Wisher"}\nMobile: ${donorPhone.trim() || "Mobile"}\nPlease issue my official 80G tax receipt.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 px-4 text-center text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <span>💬 Click Here to Confirm on WhatsApp &amp; Get 80G Receipt</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 3: DIRECT BANK TRANSFER (AXIS BANK) */}
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

      {/* ── 5. Authentic Photo Proof & Impact of 25 Resident Boys ── */}
      <section className="mt-8 rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-teal-900/10">
        <h3 className="font-display text-lg font-black text-teal-950 mb-1">
          Life at Janaseva Ashrama (25 Resident Boys)
        </h3>
        <p className="text-xs text-teal-950/70 mb-4">
          Turahalli, Bengaluru · Providing wholesome satvik meals, education &amp; loving shelter since 2000.
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
              🍲 Daily Satvik Annadana
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
              📚 Evening Vidya &amp; Tuition
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
            <span>Loving Care</span>
          </div>
          <div>
            <span className="block font-black text-sm text-teal-950">4 Meals/Day</span>
            <span>Satvik Nutrition</span>
          </div>
          <div>
            <span className="block font-black text-sm text-teal-950">100% Free</span>
            <span>Schooling &amp; Health</span>
          </div>
        </div>
      </section>

      {/* ── 6. Institutional Trust & Legal Badges ── */}
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

      {/* ── 7. Donor FAQ Accordion ── */}
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
          Need assistance or wish to plan an in-person campus visit?
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

      {/* ── 8. 📱 MOBILE STICKY BOTTOM DONATION BAR ── */}
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
              {impactSummary}
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTopCard}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 animate-heartbeat"
          >
            <span>DONATE NOW</span>
            <span>💝</span>
          </button>
        </div>
      )}
    </div>
  );
}
