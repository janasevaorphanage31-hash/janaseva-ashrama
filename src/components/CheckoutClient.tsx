"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { BANK_DETAILS, SITE, formatINR } from "@/lib/site";
import { track } from "@/lib/track";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  sanitizePan,
  sanitizeName,
  NAME_REGEX,
  EMAIL_REGEX,
  PAN_REGEX,
} from "@/lib/validation";
import { ValidationErrorModal } from "./ValidationErrorModal";

const OCCASION_CHOICES = [
  "Birthday",
  "Wedding Anniversary",
  "First Salary",
  "Graduation",
  "In Memory Of",
  "Festival / Celebration",
  "Tribute",
];

const POPULAR_QUICK_ITEMS = [
  // 🍲 Food & Annadana
  {
    slug: "meal",
    name: "Sponsor a Warm Meal (Annadana)",
    desc: "Fresh hot lunch or dinner for 1 boy with rice, dal, and fresh vegetables",
    unitPrice: 100,
    image: "/media/food.jpg",
    icon: "🍲",
    badge: "Most Popular",
    category: "food",
  },
  {
    slug: "fruits",
    name: "Fresh Fruit & Milk Nutrition",
    desc: "Apples, bananas, and pure milk for immunity and healthy growth of 1 boy",
    unitPrice: 150,
    image: "/media/fruits.jpg",
    icon: "🍎",
    badge: "Daily Health",
    category: "food",
  },
  {
    slug: "pantry",
    name: "50kg Monthly Kitchen Staples",
    desc: "Sona Masoori rice and Toor dal bulk sacks for the main Ashrama kitchen",
    unitPrice: 2500,
    image: "/media/pantry.jpg",
    icon: "🍚",
    badge: "Bulk Staples",
    category: "food",
  },
  // 📚 Education & Vidya
  {
    slug: "school-kit",
    name: "Complete School & Vidya Kit",
    desc: "Sturdy school backpack, full set of notebooks, stationery & geometry tools",
    unitPrice: 250,
    image: "/media/school-kit.jpg",
    icon: "🎒",
    badge: "Vidya Kit",
    category: "edu",
  },
  {
    slug: "education",
    name: "Evening Tutoring & Learning Support",
    desc: "Syllabus guides and dedicated evening coaching in Math, English & Science",
    unitPrice: 250,
    image: "/media/education.jpg",
    icon: "📖",
    badge: "Tutoring",
    category: "edu",
  },
  {
    slug: "uniform",
    name: "New School Uniform & Footwear",
    desc: "Tailored pair of school uniforms, durable black shoes, and socks",
    unitPrice: 400,
    image: "/media/learning.jpg",
    icon: "👕",
    badge: "Classroom Dignity",
    category: "edu",
  },
  {
    slug: "digital-lab",
    name: "Digital Coding & Computer Lab",
    desc: "Computer lab access, educational typing, and digital literacy mentoring",
    unitPrice: 750,
    image: "/media/poster.jpg",
    icon: "💻",
    badge: "Tech Skills",
    category: "edu",
  },
  // 🩺 Healthcare & Arogya
  {
    slug: "health",
    name: "Pediatric Health & Doctor Care",
    desc: "Doctor consultation, essential medicines, and routine pediatric screening",
    unitPrice: 500,
    image: "/media/health.jpg",
    icon: "🩺",
    badge: "Doctor Care",
    category: "health",
  },
  {
    slug: "clean-water",
    name: "Safe Drinking Water & Sanitation",
    desc: "RO purifier filter replacements and child hygiene protection units",
    unitPrice: 350,
    image: "/media/wellness.jpg",
    icon: "💧",
    badge: "Clean Water",
    category: "health",
  },
  {
    slug: "health-camp",
    name: "Rural Health & Eye Camp Kit",
    desc: "Diagnostics vitals, eye refraction testing, and emergency medicines",
    unitPrice: 1200,
    image: "/media/wellness.jpg",
    icon: "🏥",
    badge: "Community Camp",
    category: "health",
  },
  // 🏠 Shelter & Living
  {
    slug: "essentials",
    name: "Personal Hygiene & Care Sanctuary",
    desc: "Bath soaps, coconut hair oil, toothpaste, toothbrush, and cotton towel",
    unitPrice: 300,
    image: "/media/essentials.jpg",
    icon: "🧼",
    badge: "Hygiene",
    category: "shelter",
  },
  {
    slug: "bedding",
    name: "Cozy Bedding & Warm Blanket Set",
    desc: "Clean mattress bedsheet, soft pillow cover, and warm winter fleece blanket",
    unitPrice: 600,
    image: "/media/garden.jpg",
    icon: "🛏️",
    badge: "Warm Sleep",
    category: "shelter",
  },
  {
    slug: "activities",
    name: "Sports, Cricket & Childhood Play Kit",
    desc: "Cricket bats, footballs, carrom boards, and art drawing sketchbooks",
    unitPrice: 350,
    image: "/media/play.jpg",
    icon: "🏏",
    badge: "Play & Joy",
    category: "shelter",
  },
  // 🎉 Celebrations & Feasts
  {
    slug: "birthday-feast",
    name: "Grand Birthday Celebration Feast",
    desc: "Festive sweet feast (Payasam/Laddoo) and lunch for all 25 boys in ashrama",
    unitPrice: 1500,
    image: "/media/food.jpg",
    icon: "🎂",
    badge: "Celebration",
    category: "celebration",
  },
  {
    slug: "memorial-meal",
    name: "Sacred Remembrance Meal (Smrithi)",
    desc: "Honour departed parents or elders by feeding boys with silent prayers",
    unitPrice: 1000,
    image: "/media/food.jpg",
    icon: "🕊️",
    badge: "Remembrance",
    category: "celebration",
  },
];

const CATEGORY_TABS = [
  { id: "all", label: "All Needs", icon: "🌟" },
  { id: "food", label: "Food & Annadana", icon: "🍲" },
  { id: "edu", label: "Education & Vidya", icon: "📚" },
  { id: "health", label: "Healthcare & Arogya", icon: "🩺" },
  { id: "shelter", label: "Shelter & Care", icon: "🏠" },
  { id: "celebration", label: "Celebrations & Feasts", icon: "🎉" },
];

const PRESET_CUSTOM_AMOUNTS = [250, 500, 1000, 2500, 5000];

function cleanIndianMobile(val: string): string {
  let digits = val.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => {
      open: () => void;
      on: (e: string, cb: (r: unknown) => void) => void;
    };
  }
}

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const inputCls =
  "w-full rounded-2xl border-2 border-teal-900/15 bg-cream px-4 py-3 text-base text-teal-900 outline-none focus:border-teal-800";

export function CheckoutClient() {
  const cart = useCart();
  const router = useRouter();
  const search = useSearchParams();

  const [form, setForm] = useState({ name: "", email: "", phone: "", pan: "", anonymous: false });
  const [dedicationEnabled, setDedicationEnabled] = useState(false);
  const [dedication, setDedication] = useState({ occasion: "Birthday", name: "", message: "" });
  const [deliveryPreference, setDeliveryPreference] = useState<"email" | "whatsapp" | "both">("both");
  const [updateConsent, setUpdateConsent] = useState(true);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [demoNote, setDemoNote] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [validationModalMessage, setValidationModalMessage] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [customInputValue, setCustomInputValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const attempt = useRef<{ sig: string; key: string } | null>(null);

  const handleCopyBank = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(field);
      setTimeout(() => setCopiedBankField(null), 2500);
    }
  };

  // 1-Click Demo / Test Donor Auto-Fill Helper ("unlock all testing checks fields")
  const handleAutoFillTestDonor = () => {
    setForm({
      name: "Ramesh Kumar",
      email: "donor@janasevaashrama.org",
      phone: "9980359595",
      pan: "ABCDE1234F",
      anonymous: false,
    });
    setUpdateConsent(true);
    setError("");
    setValidationModalOpen(false);
  };

  // Check URL params for pre-set occasion (e.g. from Make a Day Matter)
  useEffect(() => {
    const occ = search.get("occasion");
    if (occ) {
      const match = OCCASION_CHOICES.find((o) => o.toLowerCase() === occ.toLowerCase());
      queueMicrotask(() => {
        setDedicationEnabled(true);
        if (match) setDedication((prev) => ({ ...prev, occasion: match }));
      });
    }
  }, [search]);

  if (!cart.hydrated) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-900 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-teal-900/70">Preparing your impact basket…</p>
      </div>
    );
  }

  const finish = (publicId: string) => {
    cart.clear();
    router.push(`/receipt/${publicId}`);
  };

  const handleApplyCustomAmount = (amountNum: number) => {
    if (amountNum >= 10 && amountNum <= 500000) {
      cart.setCustom(amountNum);
      setCustomInputValue("");
      track("quick_custom_add", { amount: amountNum });
    }
  };

  const handleClearCart = () => {
    if (confirmingClear) {
      cart.clear();
      setConfirmingClear(false);
    } else {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 3000);
    }
  };

  async function submit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (busy) return;
    setError("");
    setPaymentFailed(false);

    // 0. Ensure there is an amount to donate
    if (cart.total <= 0) {
      const msg = "Please select at least one item or enter a custom contribution to proceed.";
      setError(msg);
      setValidationModalMessage(msg);
      setValidationModalOpen(true);
      return;
    }

    // 1. Validate Donor Name (Letters and spaces only, min 2 chars)
    const nameCheck = validateName(form.name, "Full name");
    if (!nameCheck.valid) {
      setError(nameCheck.error!);
      setValidationModalMessage(nameCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 2. Validate Donor Email (RFC format)
    const emailCheck = validateEmail(form.email, true);
    if (!emailCheck.valid) {
      setError(emailCheck.error!);
      setValidationModalMessage(emailCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 3. Validate Mobile Phone (REQUIRED: 10 digits for Indian standard)
    const phoneCheck = validatePhone(form.phone, true, "Mobile phone number");
    if (!phoneCheck.valid) {
      setError(phoneCheck.error!);
      setValidationModalMessage(phoneCheck.error!);
      setValidationModalOpen(true);
      return;
    }

    // 4. Validate PAN (5 letters, 4 digits, 1 letter format if provided)
    if (form.pan.trim()) {
      const panCheck = validatePan(form.pan, false);
      if (!panCheck.valid) {
        setError(panCheck.error!);
        setValidationModalMessage(panCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    // 5. Validate Dedication Name (if enabled)
    if (dedicationEnabled) {
      const dedCheck = validateName(dedication.name, "Dedication name");
      if (!dedCheck.valid) {
        setError(dedCheck.error!);
        setValidationModalMessage(dedCheck.error!);
        setValidationModalOpen(true);
        return;
      }
    }

    // 6. Validate Consent
    if (!updateConsent) {
      const consentMsg = "Please confirm the receipt and updates acknowledgment to proceed.";
      setError(consentMsg);
      setValidationModalMessage(consentMsg);
      setValidationModalOpen(true);
      return;
    }

    setBusy(true);
    track("checkout_submit", { total: cart.total });

    const items = cart.lines.map((l) => ({ slug: l.item.slug, qty: l.qty }));
    const missionSlug = search.get("mission") ?? "";
    const giftReference = search.get("giftReference") ?? "";
    const sig = JSON.stringify([
      items,
      cart.custom,
      cart.campaign?.slug ?? "",
      missionSlug,
      giftReference,
      dedicationEnabled ? dedication : null,
      deliveryPreference,
    ]);

    if (!attempt.current || attempt.current.sig !== sig) {
      attempt.current = { sig, key: crypto.randomUUID() + "-" + Date.now().toString(36) };
    }

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customAmount: cart.custom,
          campaignSlug: cart.campaign?.slug,
          missionSlug: missionSlug || undefined,
          giftReference: giftReference || undefined,
          donor: form,
          dedication: dedicationEnabled ? dedication : undefined,
          deliveryPreference,
          updateConsent,
          idempotencyKey: attempt.current.key,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      if (data.status) return finish(data.publicId); // already processed

      if (data.mode === "demo") {
        setDemoNote(true);
        await fetch("/api/donations/demo-complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: data.publicId }),
        });
        return finish(data.publicId);
      }

      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load the secure payment gateway. Check your connection and try again.");
      }

      const rz = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount * 100,
        currency: "INR",
        name: "Janaseva Ashrama",
        description: dedicationEnabled ? `${dedication.occasion} Dedication` : "Child Welfare Contribution",
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#06312f" },
        modal: {
          ondismiss: () => {
            setBusy(false);
          },
        },
        handler: async (r: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const v = await fetch("/api/donations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId: data.publicId, ...r }),
            });
            const vd = await v.json();
            if (!v.ok) throw new Error(vd.error || "Verification failed.");
            finish(data.publicId);
          } catch (err) {
            track("payment_failed", { stage: "verify" });
            setError((err as Error).message);
            setPaymentFailed(true);
            setBusy(false);
          }
        },
      });

      rz.on("payment.failed", () => {
        track("payment_failed", { stage: "gateway" });
        setError("Your payment was not completed by the gateway. No amount has been deducted.");
        setPaymentFailed(true);
        setBusy(false);
      });

      rz.open();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ── EMPTY BASKET STATE: COMPLETE CATALOG PICKER (NO DEAD ENDS!) ───────────
  // ═════════════════════════════════════════════════════════════════════════
  if (cart.total === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Psychological Reassurance Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl text-center">
          <span className="inline-block rounded-full bg-gold/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-gold mb-3">
            ✨ Step 1: Select What You Wish to Provide
          </span>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Provide Wholesome Meals, Education &amp; Care for 25 Boys
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-xs sm:text-sm text-white/80 leading-relaxed">
            Every contribution directly supports the 25 young boys (ages 07–18) residing at Janaseva Ashrama in Bengaluru. Select daily needs below or choose any custom amount.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 text-[11px] sm:text-xs text-gold/90 font-semibold">
            <span className="rounded-lg bg-white/10 px-2.5 py-1">✓ Form 10AC 80G Tax Exemption (50% Deduction)</span>
            <span className="rounded-lg bg-white/10 px-2.5 py-1">✓ JJ Act Form 28 Reg: KA18CH0242</span>
            <span className="rounded-lg bg-white/10 px-2.5 py-1">✓ Instant WhatsApp 80G Receipt</span>
          </div>
        </div>

        {/* 1-Tap Anchor Foster Care Bundle Banner */}
        <div className="mt-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-gold/20 to-teal-500/10 p-4 sm:p-5 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-saffron px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                Best All-Round Impact
              </span>
              <span className="text-xs font-bold text-teal-900">1-Month Full Foster Care Bundle</span>
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-teal-950 mt-1">
              Complete Child Sponsor Bundle ({formatINR(2500)})
            </h3>
            <p className="text-xs text-teal-950/70 mt-0.5">
              10 Hot Meals + School Kit + Pediatric Healthcare + Cozy Bedding + Fruit Basket
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              cart.setQty("meal", 10);
              cart.setQty("school-kit", 1);
              cart.setQty("health", 1);
              cart.setQty("bedding", 1);
              cart.setQty("fruits", 1);
              track("bundle_add", { source: "checkout_empty" });
            }}
            className="focus-ring shrink-0 rounded-xl bg-saffron px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-saffron-dark transition active:scale-95"
          >
            ⚡ 1-Tap Add Bundle (₹2,500)
          </button>
        </div>

        {/* Categorized Impact Selection Cards (2 in a row on mobile!) */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-teal-950">
                Verified Needs Catalog (Tap to Add)
              </h2>
              <p className="text-xs text-teal-950/65">
                Select any item below to immediately start your contribution basket.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-bold transition flex items-center gap-1 ${
                    activeCategory === cat.id
                      ? "bg-teal-900 text-white shadow-xs"
                      : "bg-white text-teal-950/70 border border-teal-900/10 hover:bg-cream"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {POPULAR_QUICK_ITEMS.filter((item) => activeCategory === "all" || item.category === activeCategory).map((item) => {
              const currentQty = cart.qty[item.slug] || 0;
              return (
                <div
                  key={item.slug}
                  className="group flex flex-col justify-between rounded-2xl bg-white p-3 sm:p-4 border border-teal-900/10 shadow-xs transition hover:border-teal-900/30 hover:shadow-md"
                >
                  <div>
                    <div className="relative h-28 sm:h-36 w-full rounded-xl bg-teal-900/10 overflow-hidden mb-2.5">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                      <span className="absolute top-2 left-2 rounded-md bg-teal-950/85 backdrop-blur-xs px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gold shadow-xs">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-display text-xs sm:text-sm font-bold text-teal-950 line-clamp-2 leading-snug">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-[10px] sm:text-xs text-teal-950/70 line-clamp-2">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-teal-900/10 flex items-center justify-between gap-1.5">
                    <span className="font-display font-bold text-xs sm:text-base text-teal-950">
                      {formatINR(item.unitPrice)}
                    </span>

                    {currentQty > 0 ? (
                      <div className="flex items-center gap-1 rounded-xl bg-teal-900 text-white px-1.5 py-1">
                        <button
                          type="button"
                          onClick={() => cart.setQty(item.slug, currentQty - 1)}
                          className="h-5 w-5 rounded bg-white/20 text-xs font-bold hover:bg-white/30 flex items-center justify-center"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="text-xs font-bold font-mono px-1">{currentQty}</span>
                        <button
                          type="button"
                          onClick={() => cart.setQty(item.slug, currentQty + 1)}
                          className="h-5 w-5 rounded bg-white/20 text-xs font-bold hover:bg-white/30 flex items-center justify-center"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          cart.setQty(item.slug, 1);
                          track("quick_item_add", { item: item.slug });
                        }}
                        className="focus-ring rounded-xl bg-saffron px-3 py-1.5 text-[11px] sm:text-xs font-bold text-white transition hover:bg-saffron-dark shadow-xs"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Or Give Any Custom Amount (Direct Input) */}
        <div className="mt-8 rounded-3xl bg-white p-5 sm:p-7 border border-teal-900/10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-teal-950">
                Or Give Your Own Custom Amount
              </h3>
              <p className="text-xs text-teal-950/65">
                Every rupee provides food, milk, gas, and school coaching for the 25 boys.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
              80G Tax Deductible
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_CUSTOM_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleApplyCustomAmount(amt)}
                className="focus-ring flex-1 min-w-[70px] rounded-xl border-2 border-teal-900/15 bg-cream px-3 py-2 text-xs font-bold text-teal-950 transition hover:border-teal-900 hover:bg-teal-900 hover:text-white"
              >
                ₹{amt}
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-teal-900/60 font-mono">
                ₹
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(cleanIndianMobile(e.target.value))}
                placeholder="Enter custom amount (e.g. 500, 1000, 5000)"
                className="w-full rounded-2xl border-2 border-teal-900/20 bg-cream py-3 pl-8 pr-4 text-base font-mono font-bold text-teal-950 outline-none focus:border-teal-900"
              />
            </div>
            <button
              type="button"
              onClick={() => handleApplyCustomAmount(Number(customInputValue))}
              disabled={!customInputValue || Number(customInputValue) < 10}
              className="rounded-2xl bg-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-saffron-dark disabled:opacity-50 shadow-sm shrink-0"
            >
              Continue to Give &rarr;
            </button>
          </div>
        </div>

        {/* Direct Bank Wire Details Card */}
        <div className="mt-8 rounded-3xl bg-teal-950 text-white p-5 sm:p-7 shadow-lg border border-teal-800">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Direct Bank Transfer (NEFT / IMPS)</span>
              <h3 className="font-display text-base sm:text-lg font-bold text-white mt-0.5">Axis Bank Official Account</h3>
            </div>
            <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300">Form 10AC 80G</span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-white/10 p-3">
              <span className="text-[10px] text-white/60 uppercase tracking-wider">Account Name</span>
              <p className="font-bold text-white mt-0.5">{BANK_DETAILS.accountName}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <span className="text-[10px] text-white/60 uppercase tracking-wider">Bank &amp; Branch</span>
              <p className="font-bold text-white mt-0.5">{BANK_DETAILS.bankName} · {BANK_DETAILS.branch}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gold uppercase tracking-wider">A/C Number</span>
                <p className="font-mono text-sm sm:text-base font-black text-white mt-0.5">{BANK_DETAILS.accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyBank(BANK_DETAILS.accountNumber, "acc_empty")}
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30"
              >
                {copiedBankField === "acc_empty" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gold uppercase tracking-wider">IFSC Code</span>
                <p className="font-mono text-sm sm:text-base font-black text-white mt-0.5">{BANK_DETAILS.ifscCode}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyBank(BANK_DETAILS.ifscCode, "ifsc_empty")}
                className="rounded-xl bg-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/30"
              >
                {copiedBankField === "ifsc_empty" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ── ACTIVE BASKET STATE: FULL CONTROL, ALTERING & VERIFIED CHECKOUT ──────
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 py-6 lg:grid-cols-[1fr_390px]" noValidate>
      <div className="space-y-6">

        {/* ── CARD 1: REVIEW & ALTER YOUR SELECTIONS (Donor Empowerment) ── */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-teal-900/10 pb-3">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-teal-950 flex items-center gap-2">
                <span>🛒 Your Impact Basket</span>
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-900">
                  {cart.count} {cart.count === 1 ? "item" : "items"}
                </span>
              </h2>
              <p className="text-xs text-teal-950/65 mt-0.5">
                Adjust quantities with [ − ] [ + ], add extra needs, or remove anything anytime.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddDrawer(!showAddDrawer)}
                className="text-xs font-bold text-teal-900 bg-cream hover:bg-sand border border-teal-900/15 rounded-xl px-3 py-1.5 transition"
              >
                {showAddDrawer ? "Close Catalog ✕" : "+ Add More Needs"}
              </button>
              <button
                type="button"
                onClick={handleClearCart}
                className={`text-xs font-bold rounded-xl px-2.5 py-1.5 transition ${
                  confirmingClear
                    ? "bg-red-600 text-white font-extrabold animate-pulse"
                    : "text-red-700/80 hover:text-red-800 hover:bg-red-50"
                }`}
              >
                {confirmingClear ? "Confirm Clear? ✕" : "Clear All 🗑"}
              </button>
            </div>
          </div>

          {/* Quick Add In-Place Selector (When expanded) */}
          {showAddDrawer && (
            <div className="mt-4 p-4 rounded-2xl bg-cream/70 border border-teal-900/15 animate-in fade-in">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                  Select Extra Needs to Add:
                </p>
                {/* Category mini-filter */}
                <div className="flex flex-wrap gap-1">
                  {CATEGORY_TABS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition ${
                        activeCategory === cat.id ? "bg-teal-900 text-white" : "bg-white text-teal-900 border"
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {POPULAR_QUICK_ITEMS.filter((item) => activeCategory === "all" || item.category === activeCategory).map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => {
                      cart.setQty(item.slug, (cart.qty[item.slug] || 0) + 1);
                      track("drawer_add", { item: item.slug });
                    }}
                    className="flex flex-col text-left p-2.5 rounded-xl bg-white border border-teal-900/10 hover:border-teal-900/30 transition shadow-xs"
                  >
                    <span className="text-xs font-bold text-teal-950 truncate">{item.icon} {item.name}</span>
                    <span className="text-[11px] font-mono font-bold text-saffron-dark mt-1">
                      +{formatINR(item.unitPrice)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Line items with Live Stepper & Remover */}
          <div className="mt-4 space-y-3">
            {cart.lines.map((l) => (
              <div
                key={l.item.slug}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-cream/50 p-3.5 border border-teal-900/10 transition"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-teal-950 leading-snug">
                    {l.item.name}
                  </h3>
                  <p className="text-xs text-teal-950/60 font-mono mt-0.5">
                    {formatINR(l.item.unitPrice)} each
                  </p>
                </div>

                {/* Alter Quantity & Subtotal Stepper */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 border border-teal-900/15 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => cart.setQty(l.item.slug, l.qty - 1)}
                      aria-label="Decrease quantity"
                      className="h-7 w-7 rounded-lg bg-cream hover:bg-sand text-teal-950 font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold font-mono text-xs text-teal-950">
                      {l.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => cart.setQty(l.item.slug, l.qty + 1)}
                      aria-label="Increase quantity"
                      className="h-7 w-7 rounded-lg bg-teal-900 hover:bg-teal-950 text-white font-bold flex items-center justify-center transition active:scale-95 cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <span className="w-20 text-right font-display font-bold text-sm sm:text-base text-teal-950">
                    {formatINR(l.subtotal)}
                  </span>

                  <button
                    type="button"
                    onClick={() => cart.setQty(l.item.slug, 0)}
                    aria-label={`Remove ${l.item.name}`}
                    className="p-1.5 rounded-lg text-red-700/70 hover:text-red-800 hover:bg-red-50 transition cursor-pointer"
                    title="Remove item"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}

            {/* Custom contribution item (if added) */}
            {cart.custom > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gold/15 p-3.5 border border-gold/30">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-teal-950">
                    Custom Contribution
                  </h3>
                  <p className="text-xs text-teal-950/70">
                    General Ashrama food &amp; education allocation
                  </p>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="font-display font-bold text-base text-teal-950">
                    {formatINR(cart.custom)}
                  </span>
                  <button
                    type="button"
                    onClick={() => cart.setCustom(0)}
                    className="p-1.5 rounded-lg text-red-700/70 hover:text-red-800 hover:bg-red-50 transition cursor-pointer"
                    title="Remove custom contribution"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── CARD 2: DONOR CONTACT & VERIFIED RECEIPT DETAILS ── */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-teal-950">
                Donor Information
              </h2>
              <p className="text-xs text-teal-950/65 mt-0.5">
                Official 80G tax receipt PDF and personal WhatsApp video will be generated instantly.
              </p>
            </div>

            {/* 1-Click Test / Demo Donor Auto-Fill Helper */}
            <button
              type="button"
              onClick={handleAutoFillTestDonor}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-500/25 transition cursor-pointer self-start sm:self-auto"
            >
              <span>⚡ 1-Tap Fill Demo Donor</span>
            </button>
          </div>

          <div className="mt-5 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-teal-950">
                Full Name *
                <span className="block font-normal text-[11px] text-teal-950/60 mt-0.5">
                  Required for your official Form 10AC Section 80G tax exemption certificate.
                </span>
                <input
                  className={`${inputCls} mt-1`}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: sanitizeName(e.target.value) })}
                  placeholder="Letters only, e.g. Anita Sharma"
                  required
                />
              </label>
              {form.name.trim().length >= 2 && NAME_REGEX.test(form.name.trim()) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> Printed on your official 80G tax certificate
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-teal-950">
                Email Address *
                <span className="block font-normal text-[11px] text-teal-950/60 mt-0.5">
                  Your instant digital receipt PDF will be delivered to this email.
                </span>
                <input
                  type="email"
                  className={`${inputCls} mt-1`}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
                  placeholder="name@example.com"
                  required
                />
              </label>
              {EMAIL_REGEX.test(form.email) && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> Instant 80G PDF receipt will be sent here
                </p>
              )}
            </div>

            {/* Mobile / WhatsApp Number (MANDATORY for Razorpay & WhatsApp Receipt) */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-teal-950">
                Mobile / WhatsApp Phone Number *
                <span className="block font-normal text-[11px] text-teal-950/60 mt-0.5">
                  Required for Razorpay gateway verification &amp; instant WhatsApp 80G receipt + boys&apos; video
                </span>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-900/60 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`${inputCls} pl-12 font-mono font-medium`}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: cleanIndianMobile(e.target.value) })}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </label>
              {form.phone.length === 10 && /^[6-9]\d{9}$/.test(form.phone) ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> 10-digit mobile confirmed for instant WhatsApp 80G receipt &amp; video
                </p>
              ) : form.phone.length > 0 && form.phone.length < 10 ? (
                <p className="mt-1 text-[11px] text-amber-800">
                  {10 - form.phone.length} more digits needed (10-digit Indian mobile number)
                </p>
              ) : null}
            </div>

            {/* PAN Number (Optional) */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-teal-950">
                PAN Number{" "}
                <span className="font-normal text-teal-950/60">(Optional, required only for 50% 80G tax deduction)</span>
                <input
                  className={`${inputCls} mt-1 uppercase font-mono`}
                  maxLength={10}
                  placeholder="10-character PAN e.g. ABCDE1234F"
                  value={form.pan}
                  onChange={(e) => setForm({ ...form, pan: sanitizePan(e.target.value) })}
                />
              </label>
              {form.pan.length === 10 && PAN_REGEX.test(form.pan) ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <span className="font-bold">✓</span> Valid 80G tax exemption format confirmed
                </p>
              ) : form.pan.length > 0 && form.pan.length < 10 ? (
                <p className="mt-1 text-[11px] text-amber-800">
                  {10 - form.pan.length} more characters needed (e.g. ABCDE1234F)
                </p>
              ) : null}
            </div>

            {/* Anonymous preference */}
            <label className="flex items-start gap-3 rounded-2xl bg-cream p-3 text-xs sm:text-sm text-teal-950 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded accent-teal-800"
                checked={form.anonymous}
                onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
              />
              <span>
                <strong>Keep my contribution anonymous:</strong> Do not display my name on the public Live Impact Wall or campaign pages.
              </span>
            </label>
          </div>
        </div>

        {/* ── CARD 3: DEDICATE THIS IMPACT (Optional) ── */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-teal-950">
                Dedicate this Impact (Optional)
              </h2>
              <p className="text-xs text-teal-950/60 mt-0.5">
                Celebrate a birthday, anniversary, or dedicate in loving memory of family.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDedicationEnabled(!dedicationEnabled)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                dedicationEnabled
                  ? "bg-saffron text-white"
                  : "bg-cream text-teal-900 border border-teal-900/15 hover:bg-sand"
              }`}
            >
              {dedicationEnabled ? "Active ✓" : "+ Add"}
            </button>
          </div>

          {dedicationEnabled && (
            <div className="mt-4 space-y-3 pt-3 border-t border-teal-900/10 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-1.5">
                  Occasion Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {OCCASION_CHOICES.map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setDedication({ ...dedication, occasion: occ })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        dedication.occasion === occ
                          ? "bg-teal-900 text-white"
                          : "bg-cream text-teal-900 hover:bg-sand"
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70">
                  Honoree or Person&apos;s Name
                </label>
                <input
                  className={`${inputCls} mt-1`}
                  placeholder="e.g. Arjun, or Late Shri R. Sharma"
                  value={dedication.name}
                  onChange={(e) => setDedication({ ...dedication, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70">
                  Dedication Message (appears on 80G certificate)
                </label>
                <textarea
                  rows={2}
                  className={`${inputCls} mt-1 text-sm`}
                  placeholder="e.g. Wishing you boundless joy, good health and blessings on your special day."
                  value={dedication.message}
                  onChange={(e) => setDedication({ ...dedication, message: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── CARD 4: RECEIPT DELIVERY & MANDATORY CONSENT ── */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10">
          <h2 className="font-display text-lg font-bold text-teal-950">
            Receipt &amp; Impact Proof Delivery
          </h2>
          <p className="mt-0.5 text-xs text-teal-950/65">
            Choose where to receive your verified Form 10AC tax receipt and photo updates:
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { id: "both", label: "WhatsApp & Email" },
              { id: "whatsapp", label: "WhatsApp" },
              { id: "email", label: "Email only" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDeliveryPreference(p.id as typeof deliveryPreference)}
                className={`py-2 px-3 rounded-2xl text-xs font-bold text-center border transition cursor-pointer ${
                  deliveryPreference === p.id
                    ? "bg-teal-900 text-white border-teal-900"
                    : "bg-cream text-teal-900 border-teal-900/15 hover:bg-sand"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Mandatory Transparency & Receipt Consent Checkbox */}
          <label className="mt-4 flex items-start gap-2.5 text-xs text-teal-950/80 cursor-pointer p-3 rounded-xl bg-cream border border-teal-900/10">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded accent-teal-800"
              checked={updateConsent}
              onChange={(e) => setUpdateConsent(e.target.checked)}
              required
            />
            <span className="leading-relaxed">
              <strong>I confirm my details for official Form 10AC 80G tax receipt generation *</strong> and agree to receive transparent child outcome reports. (Zero marketing spam).
            </span>
          </label>
        </div>

        {/* ── CARD 5: DIRECT BANK TRANSFER (NEFT / IMPS / RTGS) ── */}
        <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10">
          <div className="flex items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Direct Bank Transfer Available
                </span>
              </div>
              <h3 className="mt-1 font-display text-base sm:text-lg font-bold text-teal-950">
                Prefer Direct NEFT / IMPS / RTGS?
              </h3>
            </div>
            <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 border border-teal-900/10">
              Axis Bank
            </span>
          </div>

          <p className="mt-2.5 text-xs text-teal-950/70 leading-relaxed">
            You can also donate directly to our official orphanage bank account via your banking app or net banking. All transfers are eligible for Form 10AC 80G tax deductions.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-cream p-3.5 border border-teal-900/10">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-900/60">
                Account Holder Name
              </span>
              <p className="font-bold text-teal-950 mt-0.5 leading-snug">
                {BANK_DETAILS.accountName}
              </p>
            </div>

            <div className="rounded-2xl bg-cream p-3.5 border border-teal-900/10">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-teal-900/60">
                Bank &amp; Branch
              </span>
              <p className="font-bold text-teal-950 mt-0.5">
                {BANK_DETAILS.bankName} · {BANK_DETAILS.branch} Branch
              </p>
            </div>

            <div className="rounded-2xl bg-teal-950 text-white p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gold">
                  Account Number
                </span>
                <p className="font-mono text-base font-black tracking-wider text-white mt-0.5">
                  {BANK_DETAILS.accountNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyBank(BANK_DETAILS.accountNumber, "acc")}
                className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 transition cursor-pointer"
              >
                {copiedBankField === "acc" ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="rounded-2xl bg-teal-950 text-white p-3.5 shadow-xs flex items-center justify-between">
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gold">
                  IFSC Code
                </span>
                <p className="font-mono text-base font-black tracking-wider text-white mt-0.5">
                  {BANK_DETAILS.ifscCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyBank(BANK_DETAILS.ifscCode, "ifsc")}
                className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25 transition cursor-pointer"
              >
                {copiedBankField === "ifsc" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-600/20 text-xs">
            <span className="text-emerald-950">
              <strong>After transferring:</strong> Send transaction screenshot on WhatsApp to receive your 80G tax receipt immediately.
            </span>
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                `Hello Janaseva Ashrama, I have completed a direct bank transfer of ₹${cart.total || "donation"} to Axis Bank A/c ${BANK_DETAILS.accountNumber}. Please find the screenshot attached for 80G receipt generation.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 transition shadow-xs text-xs"
            >
              <span>Share on WhatsApp →</span>
            </a>
          </div>
        </div>

        {/* Failure / Error Alert with Reassurance */}
        {error && (
          <div role="alert" className="rounded-3xl bg-red-50 p-5 ring-1 ring-red-200">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-red-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-bold text-sm text-red-900">
                  {paymentFailed ? "Payment Incomplete - No Amount Deducted" : "Please Check"}
                </h3>
                <p className="mt-1 text-xs text-red-800 leading-relaxed">{error}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => submit()}
                    disabled={busy}
                    className="rounded-xl bg-red-700 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                  >
                    Retry Payment
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoFillTestDonor}
                    className="rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-amber-700 cursor-pointer"
                  >
                    ⚡ Auto-Fill Demo Details
                  </button>
                  <a
                    href="tel:9980359595"
                    className="text-xs font-bold text-red-900 underline ml-2"
                  >
                    Helpline: +91 9980359595
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── STICKY RIGHT COLUMN: ORDER SUMMARY & TRUST GUARANTEES ── */}
      <aside className="h-fit rounded-3xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-teal-900/10 lg:sticky lg:top-20 space-y-4">
        <h2 className="font-display text-xl font-bold text-teal-950">
          Giving Summary
        </h2>

        {cart.campaign && (
          <p className="rounded-xl bg-saffron/10 px-3 py-2 text-xs font-semibold text-saffron-dark">
            Supporting: {cart.campaign.title}
          </p>
        )}

        {dedicationEnabled && dedication.name && (
          <div className="rounded-xl bg-teal-50 px-3 py-2 text-xs text-teal-900 border border-teal-900/10">
            <span className="font-bold text-saffron-dark">{dedication.occasion}:</span> {dedication.name}
          </div>
        )}

        {/* Itemized List with Instant Controls */}
        <div className="divide-y divide-teal-900/10 text-xs">
          {cart.lines.map((l) => (
            <div key={l.item.slug} className="py-2.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-teal-950 truncate">{l.item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-teal-950/60 font-mono">{formatINR(l.item.unitPrice)}</span>
                  <span className="text-teal-900 font-bold">× {l.qty}</span>
                  <button
                    type="button"
                    onClick={() => cart.setQty(l.item.slug, 0)}
                    className="text-[11px] text-red-700/60 hover:text-red-800 underline ml-1 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <span className="font-display font-bold text-sm text-teal-950 shrink-0">
                {formatINR(l.subtotal)}
              </span>
            </div>
          ))}

          {cart.custom > 0 && (
            <div className="py-2.5 flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-teal-950">Custom Contribution</p>
                <button
                  type="button"
                  onClick={() => cart.setCustom(0)}
                  className="text-[11px] text-red-700/60 hover:text-red-800 underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
              <span className="font-display font-bold text-sm text-teal-950 shrink-0">
                {formatINR(cart.custom)}
              </span>
            </div>
          )}
        </div>

        {/* Total calculation */}
        <div className="border-t border-dashed border-teal-900/20 pt-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-900/60">Total Contribution</span>
            <p className="text-[11px] text-emerald-800 font-semibold">✓ 100% Tax Deductible (80G)</p>
          </div>
          <span className="font-display text-2xl sm:text-3xl font-bold text-teal-950">
            {formatINR(cart.total)}
          </span>
        </div>

        {/* Primary Checkout Button */}
        <button
          disabled={busy || cart.total === 0}
          type="submit"
          className="focus-ring w-full rounded-2xl bg-saffron px-6 py-4 text-sm font-bold tracking-wide text-white shadow-lg transition hover:bg-saffron-dark disabled:opacity-60 active:scale-95 cursor-pointer"
        >
          {busy ? "Processing Secure Payment…" : `GIVE ${formatINR(cart.total)} SECURELY`}
        </button>

        {/* Trust & Psychological Reassurances */}
        <div className="rounded-2xl bg-cream p-3.5 border border-teal-900/10 space-y-2 text-[11px] text-teal-950/70">
          <p className="flex items-center gap-1.5 font-bold text-teal-950">
            <svg className="h-4 w-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Bank-Grade 256-Bit SSL Encryption</span>
          </p>
          <p className="leading-relaxed">
            Powered by <strong>Razorpay</strong>. Instant UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking &amp; Cards.
          </p>
          <p className="font-semibold text-emerald-900 pt-1 border-t border-teal-900/10">
            ✓ Form 10AC Provisional 80G Approval (AY 2024-25 to 2026-27)
          </p>
        </div>

        {demoNote && (
          <p className="text-xs font-semibold text-saffron-dark text-center">
            Demo environment: Simulated payment verification.
          </p>
        )}
      </aside>

      {/* Mobile Sticky Payment Bar */}
      <div className="fixed inset-x-3 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-30 rounded-2xl bg-white/95 p-2.5 shadow-2xl ring-1 ring-teal-900/10 backdrop-blur lg:hidden no-print">
        <button
          disabled={busy || cart.total === 0}
          type="submit"
          className="focus-ring flex w-full items-center justify-between rounded-xl bg-saffron px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60 shadow-md cursor-pointer"
        >
          <span>{busy ? "Please wait…" : "GIVE SECURELY"}</span>
          <span>{formatINR(cart.total)}</span>
        </button>
      </div>

      <ValidationErrorModal
        isOpen={validationModalOpen}
        message={validationModalMessage}
        onClose={() => setValidationModalOpen(false)}
      />
    </form>
  );
}
