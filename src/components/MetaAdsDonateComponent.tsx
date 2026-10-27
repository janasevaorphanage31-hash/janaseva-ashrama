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

export interface SevaOption {
  amt: number;
  label: string;
  name: string;
  impact: string;
  badge?: string;
  icon: string;
  image: string;
  featured?: boolean;
  category: "quick" | "official" | "birthday";
}

// ── 1. POPULAR QUICK SEVA TIERS (₹11 to ₹4,500) ──
const QUICK_SEVA_TIERS: SevaOption[] = [
  {
    amt: 11,
    label: "₹11",
    name: "Cow Milk",
    impact: "1 warm glass of pure cow milk for 1 young boy before morning prayers",
    badge: "Shagun",
    icon: "🥛",
    image: "/media/food.jpg",
    category: "quick",
  },
  {
    amt: 51,
    label: "₹51",
    name: "Morning Breakfast",
    impact: "Steaming hot idlis, sambar & fresh chutney from the ashrama kitchen",
    badge: "Shagun",
    icon: "🍲",
    image: "/media/prayer-meals.jpg",
    category: "quick",
  },
  {
    amt: 101,
    label: "₹101",
    name: "Satvik Full Meal",
    impact: "Hot wholesome satvik lunch with rice, sambar, rasam & fresh vegetables",
    badge: "Daily Punya",
    icon: "🍛",
    image: "/media/banana-leaf-feast.jpg",
    category: "quick",
  },
  {
    amt: 251,
    label: "₹251",
    name: "School Vidya Kit",
    impact: "Full set of notebooks, geometry box, pencils & academic stationery",
    badge: "Vidya Dana",
    icon: "📚",
    image: "/media/school-kit.jpg",
    category: "quick",
  },
  {
    amt: 501,
    label: "₹501",
    name: "3-Day Arogya & Care",
    impact: "3 days nutritious satvik meals, fresh cow milk & pediatric doctor care",
    badge: "Arogya Seva",
    icon: "🩺",
    image: "/media/boys-meal-gratitude.jpg",
    category: "quick",
  },
  {
    amt: 1000,
    label: "₹1,000",
    name: "Feeds 1 Boy for 1 Wk",
    impact: "All 3 daily meals for 1 resident boy for a full week + evening tuition",
    badge: "Feeds 1 Week",
    icon: "🍲",
    image: "/media/learning.jpg",
    category: "quick",
  },
  {
    amt: 2500,
    label: "₹2,500",
    name: "25 Boys Festive Lunch",
    impact: "Hosts a special festive hot lunch feast with sweet payasam for all 25 boys",
    badge: "Most Chosen ★",
    icon: "🍛",
    image: "/media/annadana-hall-hd.jpg",
    featured: true,
    category: "quick",
  },
  {
    amt: 4500,
    label: "₹4,500",
    name: "Full Day Annadana (25 Boys)",
    impact: "Sponsors all 4 meals (breakfast, lunch, snacks & dinner) for all 25 boys",
    badge: "Complete 24-Hr Seva",
    icon: "✨",
    image: "/media/boys-group-red-assembly.jpg",
    featured: true,
    category: "quick",
  },
];

// ── 2. OFFICIAL 5 SUPPORT TIERS (FORM 28 JJ ACT REGISTERED) ──
const OFFICIAL_TIERS: SevaOption[] = [
  {
    amt: 1500,
    label: "₹1,500",
    name: "Breakfast for 25 Boys",
    impact: "Nutritious morning idli, vada, sambar & warm cow milk for all 25 boys",
    badge: "Morning Annadana",
    icon: "🍲",
    image: "/media/prayer-meals.jpg",
    category: "official",
  },
  {
    amt: 2000,
    label: "₹2,000",
    name: "1 Mo Ration (1 Boy)",
    impact: "Full month supply of Sona Masoori rice, toor dal, cooking oil & spices",
    badge: "Monthly Ration",
    icon: "🌾",
    image: "/media/pantry.jpg",
    category: "official",
  },
  {
    amt: 1800,
    label: "₹1,800",
    name: "Clothes (3 Boys)",
    impact: "3 pairs of durable everyday cotton uniforms & festive traditional outfits",
    badge: "Vastra Dana",
    icon: "👕",
    image: "/media/lawn-cheer-circle.jpg",
    category: "official",
  },
  {
    amt: 2400,
    label: "₹2,400",
    name: "Education (8 Boys)",
    impact: "1 month schooling fees, textbook sets, and evening tuition for 8 boys",
    badge: "Vidya Seva",
    icon: "📚",
    image: "/media/art-schooling.jpg",
    category: "official",
  },
  {
    amt: 3200,
    label: "₹3,200",
    name: "1 Full Academic Year",
    impact: "Annual school admission, textbook bundle, school bag & shoes for 1 boy",
    badge: "Full Year Adoption",
    icon: "🎓",
    image: "/media/abacus-math-class.jpg",
    featured: true,
    category: "official",
  },
  {
    amt: 8000,
    label: "₹8,000",
    name: "1 Mo Ration (4 Boys)",
    impact: "Comprehensive monthly grocery ration basket feeding 4 resident boys",
    badge: "Pantry Sponsor",
    icon: "🌾",
    image: "/media/grains.jpg",
    category: "official",
  },
];

// ── 3. BIRTHDAY & SPECIAL OCCASION CELEBRATIONS ──
const BIRTHDAY_CELEBRATIONS: SevaOption[] = [
  {
    amt: 2500,
    label: "₹2,500",
    name: "Birthday Satvik Feast",
    impact: "Festive meal feast with sweet payasam served to all 25 resident boys",
    badge: "Celebration",
    icon: "🍛",
    image: "/media/birthday-feast-annadana.jpg",
    category: "birthday",
  },
  {
    amt: 3500,
    label: "₹3,500",
    name: "Cake & Payasam Feast",
    impact: "Celebration cake, evening sweets, and special feast with resident boys",
    badge: "Trending 🎂",
    icon: "🎂",
    image: "/media/birthday-cake-celebration.jpg",
    featured: true,
    category: "birthday",
  },
  {
    amt: 4500,
    label: "₹4,500",
    name: "Full Day Birthday Seva",
    impact: "All 4 meals + birthday song & personalized WhatsApp prayer blessing video",
    badge: "Special Video Blessing",
    icon: "✨",
    image: "/media/birthday-wishes-orange.jpg",
    featured: true,
    category: "birthday",
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
  if (amt === 11) return "Provides 1 glass of warm, pure cow milk for a young boy before morning prayers.";
  if (amt === 21) return "Provides fresh bananas & seasonal study fruits for a child.";
  if (amt === 51) return "Serves a steaming hot breakfast (idlis, sambar & chutney) fresh from the kitchen.";
  if (amt === 101) return "Provides a full hot satvik lunch with rice, sambar, and fresh vegetables for 1 boy.";
  if (amt === 251) return "Provides a full set of school notebooks, pencils, and geometry stationery.";
  if (amt === 501) return "Sponsors 3 full days of satvik meals, morning milk, and pediatric wellness care.";
  if (amt === 1000) return "Feeds an orphaned boy with all nutritious meals for an entire week + evening tutoring.";
  if (amt === 1500) return "Sponsors a nutritious hot breakfast feast with warm cow milk for all 25 boys.";
  if (amt === 1800) return "Provides 3 pairs of durable everyday cotton uniforms & festival outfits.";
  if (amt === 2000) return "Provides 1 month full grocery ration basket (rice, dal & staples) for a boy.";
  if (amt === 2400) return "Covers monthly tuition, exam materials, and academic supplies for 8 boys.";
  if (amt === 2500) return "Hosts a special festive hot lunch feast with sweet payasam for all 25 boys.";
  if (amt === 3000) return "Sponsors 2 wholesome hot meals (lunch & dinner) with sweet for all 25 boys.";
  if (amt === 3200) return "Adopts an orphaned child for 1 full academic school year (admissions, books, shoes).";
  if (amt === 3500) return "Sponsors celebration cake, evening sweet payasam & special feast with 25 boys.";
  if (amt === 4500) return "Sponsors complete 24-hour 4-meal Annadana (breakfast, lunch, snacks & dinner) for all 25 boys.";
  if (amt === 5000) return "Sponsors a grand birthday/anniversary celebration feast & evening cake cutting with all 25 boys.";
  if (amt === 6000) return "Covers full monthly pantry groceries & ration staples for 4 resident boys.";
  if (amt === 8000) return "Covers full monthly pantry groceries & ration staples for 4 resident boys.";
  if (amt === 9600) return "Full Vidya school uniforms, textbooks, shoes & tutoring for resident boys.";
  if (amt < 100) return `Your gift of ${formatINR(amt)} provides warm cow milk and morning study fruit for resident boys.`;
  if (amt < 500) return `Your gift of ${formatINR(amt)} serves wholesome hot meals to the children at Janaseva Ashrama today.`;
  if (amt < 2000) return `Your noble gift of ${formatINR(amt)} covers fresh kitchen staples, vegetables & doctor care.`;
  if (amt < 5000) return `Your generous sponsorship of ${formatINR(amt)} provides nutritious feasts & textbooks for resident boys.`;
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

  // Giving frequency (One-Time Seva vs Monthly Punya)
  const [frequency, setFrequency] = useState<"onetime" | "monthly">("onetime");

  // Active Seva Category Tab ("quick" | "official" | "birthday")
  const [sevaTab, setSevaTab] = useState<"quick" | "official" | "birthday">(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (OFFICIAL_TIERS.some((t) => t.amt === parsed)) return "official";
      if (BIRTHDAY_CELEBRATIONS.some((t) => t.amt === parsed)) return "birthday";
    }
    return "quick";
  });

  // Photo Gallery Accordion toggle (closed by default to guarantee mobile zero-scroll above the fold)
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showCustomInputInline, setShowCustomInputInline] = useState(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      const standardPills = [51, 101, 251, 501, 1000, 1800, 2500, 3000, 4500, 5000, 6000, 9600];
      if (parsed >= 10 && parsed <= 1000000 && !standardPills.includes(parsed)) {
        return true;
      }
    }
    return false;
  });

  // Paid Ads Tracking (Meta & Google Ads)
  const [utmSource] = useState(() => searchParams.get("utm_source") || "");
  const [utmMedium] = useState(() => searchParams.get("utm_medium") || "");
  const [utmCampaign] = useState(() => searchParams.get("utm_campaign") || "");
  const [utmTerm] = useState(() => searchParams.get("utm_term") || "");
  const [utmContent] = useState(() => searchParams.get("utm_content") || "");
  const [gclid] = useState(() => searchParams.get("gclid") || "");
  const [fbclid] = useState(() => searchParams.get("fbclid") || "");

  // Persist UTM and Click IDs across session
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (utmSource) sessionStorage.setItem("jana_utm_source", utmSource);
      if (utmMedium) sessionStorage.setItem("jana_utm_medium", utmMedium);
      if (utmCampaign) sessionStorage.setItem("jana_utm_campaign", utmCampaign);
      if (gclid) sessionStorage.setItem("jana_gclid", gclid);
      if (fbclid) sessionStorage.setItem("jana_fbclid", fbclid);
    } catch {}
  }, [utmSource, utmMedium, utmCampaign, gclid, fbclid]);

  // Ensure body scroll lock and stale modal backdrops are always removed on checkout
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
      const staleBackdrops = document.querySelectorAll(".razorpay-backdrop, .razorpay-container");
      staleBackdrops.forEach((el) => {
        if (!el.querySelector("iframe")) el.remove();
      });
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, []);

  // Amount State (Starts from ₹11 upwards; defaults to URL param, cart.total, or ₹2,500 flagship)
  const [amount, setAmount] = useState<number>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      if (parsed >= 10 && parsed <= 1000000) {
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
    return 2500; // Flagship 25 boys feast default
  });

  const [customAmount, setCustomAmount] = useState<string>(() => {
    const urlAmt = searchParams.get("amount");
    if (urlAmt) {
      const parsed = parseFloat(urlAmt);
      const isPreset =
        QUICK_SEVA_TIERS.some((t) => t.amt === parsed) ||
        OFFICIAL_TIERS.some((t) => t.amt === parsed) ||
        BIRTHDAY_CELEBRATIONS.some((t) => t.amt === parsed);
      if (parsed >= 10 && parsed <= 1000000 && !isPreset) {
        return String(parsed);
      }
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

  // Payment drawer toggles
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
        setAmount(parsed);
        const standardPills = [51, 101, 251, 501, 1000, 1800, 2500, 3000, 4500, 5000, 6000, 9600];
        if (!standardPills.includes(parsed)) {
          setCustomAmount(String(parsed));
          setShowCustomInputInline(true);
        } else {
          setCustomAmount("");
          setShowCustomInputInline(false);
          if (OFFICIAL_TIERS.some((t) => t.amt === parsed)) setSevaTab("official");
          if (BIRTHDAY_CELEBRATIONS.some((t) => t.amt === parsed)) setSevaTab("birthday");
        }
        if (cart.setDedicatedAmount) cart.setDedicatedAmount(parsed);
        return;
      }
    }

    if (cart.hydrated) {
      initializedFromCartRef.current = true;
      if (cart.total >= 10) {
        setAmount(cart.total);
        const standardPills = [51, 101, 251, 501, 1000, 1800, 2500, 3000, 4500, 5000, 6000, 9600];
        if (!standardPills.includes(cart.total)) {
          setCustomAmount(String(cart.total));
          setShowCustomInputInline(true);
        } else {
          setCustomAmount("");
          setShowCustomInputInline(false);
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
  const taxDeductionAmount = Math.round(finalAmount * 0.5); // 50% Section 80G tax benefit

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
        color: { dark: "#042825", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [finalAmount, upiUri]);

  // Dynamic Impact Description
  const impactSummary = getDynamicImpactText(finalAmount);

  // Current active tier list based on selected Seva Tab
  const activeTiers = useMemo(() => {
    if (sevaTab === "official") return OFFICIAL_TIERS;
    if (sevaTab === "birthday") return BIRTHDAY_CELEBRATIONS;
    return QUICK_SEVA_TIERS;
  }, [sevaTab]);

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

  const handleSelectTier = (tier: SevaOption) => {
    setAmount(tier.amt);
    setCustomAmount("");
    clearFieldError("amount");
    if (cart.setDedicatedAmount) {
      cart.setDedicatedAmount(tier.amt);
    }
    trackViewContent({
      content_name: `Select ${tier.name} - ₹${tier.amt}`,
      content_category: "Child Welfare",
      value: tier.amt,
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
   * Fast, Friction-Free Donor Validation Gate:
   * Validates Amount, Name, Email (if given), and PAN (if given).
   * Phone is gracefully prefilled or prompted in Razorpay modal if left blank.
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

    // 2. Name validation: Auto-fallback to "Janaseva Supporter" if left blank
    if (!donorName.trim()) {
      setDonorName("Janaseva Supporter");
    }

    // 3. WhatsApp Mobile validation (if entered partially)
    const cleanPhone = donorPhone.replace(/\D/g, "");
    if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
      setFormErrors(errors);
      detailsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      phoneInputRef.current?.focus();
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
   * Handles payment initiation without friction.
   */
  const handlePayNow = async () => {
    const isValid = validateForm();
    if (!isValid) return;

    setLoading(true);
    setFormErrors({});

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 15000);

    try {
      const effectiveName = donorName.trim() || "Janaseva Supporter";
      const cleanPhone = donorPhone.replace(/\D/g, "").slice(-10);
      const effectivePhone = cleanPhone.length >= 10 ? cleanPhone : "9980359595";
      const selectedOccasionLabel =
        OCCASIONS.find((o) => o.id === occasion)?.label || "General Seva";
      const cleanOccasion = selectedOccasionLabel.replace(/[^\w\s-]/g, "").trim() || "General Seva";
      const cleanPrayerNote = prayerNote.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "").trim();

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
          frequency,
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          gclid,
          fbclid,
          website_hp: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        clearTimeout(safetyTimer);
        throw new Error(data.error || "Failed to initialize payment gateway. Please try again.");
      }

      trackInitiateCheckout({
        content_name: `Support 25 Boys - ${cleanOccasion} (${frequency})`,
        value: finalAmount,
        currency: "INR",
        num_items: 1,
      });

      if (data.orderId && data.keyId) {
        await openRazorpayCheckout({
          keyId: data.keyId,
          orderId: data.orderId,
          amountPaise: data.amount,
          currency: data.currency || "INR",
          name: "Janaseva Ashrama Bangalore",
          description: `Sponsor 25 Resident Boys · ${cleanOccasion}`,
          donorName: effectiveName,
          donorPhone: cleanPhone.length >= 10 ? cleanPhone : "",
          donorEmail: donorEmail.trim() || undefined,
          notes: {
            caller_ref_id: callerRef,
            lead_id: leadId || "",
            donor_name: effectiveName,
            donor_phone: cleanPhone.length >= 10 ? cleanPhone : "",
            occasion: cleanOccasion,
            prayer_note: cleanPrayerNote,
            frequency,
          },
          onDismiss: () => {
            clearTimeout(safetyTimer);
            setLoading(false);
            if (typeof document !== "undefined") {
              document.body.style.overflow = "";
              const stale = document.querySelectorAll(".razorpay-backdrop, .razorpay-container");
              stale.forEach((el) => {
                if (!el.querySelector("iframe")) el.remove();
              });
            }
          },
          onError: () => {
            clearTimeout(safetyTimer);
            setLoading(false);
            setFormErrors({
              general:
                "Payment was interrupted. You can complete your donation instantly with 0% fee using Direct UPI or QR code below!",
            });
            setShowDirectUpi(true);
            if (typeof document !== "undefined") {
              document.body.style.overflow = "";
              const stale = document.querySelectorAll(".razorpay-backdrop, .razorpay-container");
              stale.forEach((el) => {
                if (!el.querySelector("iframe")) el.remove();
              });
            }
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
                          frequency,
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
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
        const stale = document.querySelectorAll(".razorpay-backdrop, .razorpay-container");
        stale.forEach((el) => {
          if (!el.querySelector("iframe")) el.remove();
        });
      }
    }
  };

  return (
    <div className="mx-auto max-w-xl lg:max-w-6xl xl:max-w-7xl pb-24 sm:pb-16 animate-fadeIn">
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

      {/* ── COMPACT MOBILE TRUST STRIP ── */}
      <div className="lg:hidden mb-2.5 rounded-xl bg-teal-950 text-white px-3 py-2 flex items-center justify-between text-xs border border-amber-400/30 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-300" />
          </span>
          <span className="text-[11px] font-bold text-amber-200 truncate">
            Direct Ashrama Seva · 25 Resident Boys
          </span>
        </div>
        <span className="rounded bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">
          ✓ 80G Form 10AC
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* ── MAIN CHECKOUT CARD (ORDER-1 ON MOBILE FOR ZERO-SCROLL, RIGHT COLUMN ON DESKTOP) ── */}
        <div className="order-1 lg:order-2 col-span-1 lg:col-span-7 lg:sticky lg:top-20 space-y-4">
        {/* ── GLOBAL ERROR ALERT ── */}
        {formErrors.general && (
          <div className="rounded-2xl bg-rose-50 border border-rose-300 p-3.5 text-xs text-rose-800 font-semibold flex items-start gap-2 shadow-sm">
            <span className="text-base leading-none shrink-0">⚠️</span>
            <div className="flex-1 leading-relaxed">{formErrors.general}</div>
          </div>
        )}

        <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-2xl border-2 border-amber-400/40 space-y-4">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: ACTIVE SEVA CONFIRMATION & GIVING FREQUENCY (ABOVE THE FOLD)
        ══════════════════════════════════════════════════════════════════ */}
        <div ref={topCardRef} className="pb-3 border-b border-teal-900/10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <span>🌸</span>
                <span>Your Sacred Seva Contribution</span>
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-display text-2xl sm:text-3xl font-black text-[#042825] tracking-tight">
                  ₹{formatINR(finalAmount)}
                </span>
                <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-black text-emerald-900">
                  50% Tax Saved: ₹{taxDeductionAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Giving Frequency Toggle (One-Time vs Monthly) */}
            <div className="inline-flex rounded-xl bg-amber-50 p-0.5 border border-amber-300/60 text-[10px] font-bold shrink-0">
              <button
                type="button"
                onClick={() => setFrequency("onetime")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  frequency === "onetime"
                    ? "bg-[#042825] text-white shadow-xs font-black"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                One-Time
              </button>
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  frequency === "monthly"
                    ? "bg-[#042825] text-white shadow-xs font-black"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                <span>🔄 Monthly</span>
                <span className="text-[8px] rounded bg-amber-400 text-teal-950 px-1 font-black">Punya</span>
              </button>
            </div>
          </div>

          {/* Real-time Dynamic Impact line */}
          <div className="rounded-xl bg-amber-50/70 px-3 py-1.5 border border-amber-200/80 text-xs text-amber-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm select-none shrink-0">🍲</span>
              <p className="font-bold text-[#042825] text-[11px] sm:text-xs truncate">
                {impactSummary}
              </p>
            </div>
            {amountWords && (
              <span className="text-[9px] text-amber-900/80 font-medium hidden sm:inline shrink-0">
                ({amountWords})
              </span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: 1-ROW FAST AMOUNT SWITCHER STRIP + BROWSE PHOTOS TOGGLE
        ══════════════════════════════════════════════════════════════════ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#042825]/70">
              Change Seva Amount:
            </span>
            <button
              type="button"
              onClick={() => setShowPhotoGallery(!showPhotoGallery)}
              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 bg-amber-100/60 hover:bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 transition cursor-pointer"
            >
              <span>📷</span>
              <span>{showPhotoGallery ? "Hide Photos" : "Browse All 8 Seva Photos ▾"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[101, 251, 501, 1000, 1800, 2500, 3000, 4500, 6000].map((amt) => {
              const isSelected = !customAmount && amount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setAmount(amt);
                    setCustomAmount("");
                    setShowCustomInputInline(false);
                    clearFieldError("amount");
                    if (cart.setDedicatedAmount) cart.setDedicatedAmount(amt);
                    trackViewContent({
                      content_name: `Select Quick Chip ₹${amt}`,
                      content_category: "Child Welfare",
                      value: amt,
                      currency: "INR",
                    });
                  }}
                  className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                    isSelected
                      ? "bg-[#042825] text-amber-300 border-[#042825] shadow-sm scale-105 ring-1 ring-amber-400"
                      : "bg-white text-teal-950 border-teal-900/15 hover:border-amber-400 hover:bg-amber-50/50"
                  }`}
                >
                  ₹{amt >= 1000 ? `${(amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1)}k` : amt}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setShowCustomInputInline(true);
                if (!customAmount) {
                  setCustomAmount(String(amount));
                }
                setTimeout(() => customInputRef.current?.focus(), 50);
              }}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                customAmount || showCustomInputInline
                  ? "bg-[#042825] text-amber-300 border-[#042825] shadow-sm ring-1 ring-amber-400"
                  : "bg-white text-teal-950 border-teal-900/15 hover:border-amber-400 hover:bg-amber-50/50"
              }`}
            >
              ✏️ Other
            </button>
          </div>

          {/* Inline Custom Input */}
          {(showCustomInputInline || customAmount) && (
            <div className="rounded-2xl bg-cream/70 p-2.5 sm:p-3 border border-amber-300/80 animate-fadeIn space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="meta-custom-amount-inline"
                  className="text-[10px] font-black uppercase tracking-wider text-[#042825] flex items-center gap-1"
                >
                  <span>✏️</span>
                  <span>Enter Custom Amount (₹11 to ₹10,00,000):</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomAmount("");
                    setShowCustomInputInline(false);
                    setAmount(2500);
                    if (cart.setDedicatedAmount) cart.setDedicatedAmount(2500);
                  }}
                  className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div className="relative flex items-center rounded-xl border-2 border-teal-900/20 bg-white px-3 py-1 focus-within:border-teal-900 focus-within:ring-2 focus-within:ring-amber-400 transition">
                <span className="font-display text-lg font-black text-[#042825] select-none mr-2">
                  ₹
                </span>
                <input
                  ref={customInputRef}
                  id="meta-custom-amount-inline"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Type any amount (e.g. 500, 1800, 5000)"
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
                  className="w-full bg-transparent py-1 text-base sm:text-lg font-black text-[#042825] placeholder:text-teal-950/35 placeholder:font-normal outline-none"
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

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold text-[#042825]/60 uppercase">Quick Add:</span>
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
                    className="rounded-lg bg-white hover:bg-[#042825] hover:text-white border border-teal-900/15 px-2 py-0.5 text-[10px] font-black text-[#042825] transition cursor-pointer shadow-2xs"
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
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3: DONOR DETAILS FORM (ZERO SCROLL ABOVE THE FOLD)
        ══════════════════════════════════════════════════════════════════ */}
        <div ref={detailsCardRef} className="pt-2 border-t border-teal-900/10 space-y-2.5">
          <div className="flex items-center justify-between pb-0.5">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#042825] text-[10px] font-black text-amber-300">
                2
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-[#042825]">
                Donor Details (80G Tax Receipt &amp; Blessings):
              </h2>
            </div>
            <span className="text-[9px] font-bold text-rose-600">* Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Full Name */}
            <div>
              <label htmlFor="donor-full-name" className="text-[11px] font-bold text-[#042825] flex items-center justify-between mb-1">
                <span>Full Name <span className="text-rose-600 font-black">*</span></span>
                <span className="text-[9px] text-teal-950/60 font-medium">Chanted in morning prayer</span>
              </label>
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
                className={`w-full rounded-xl border py-2 px-3 text-sm text-[#042825] outline-none transition ${
                  formErrors.name
                    ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                    : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                }`}
              />
              {formErrors.name && (
                <p className="mt-0.5 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <span>⚠️</span> {formErrors.name}
                </p>
              )}
            </div>

            {/* WhatsApp Mobile */}
            <div>
              <label htmlFor="donor-whatsapp-phone" className="text-[11px] font-bold text-[#042825] flex items-center justify-between mb-1">
                <span>WhatsApp Mobile <span className="text-rose-600 font-black">*</span></span>
                <span className="text-[9px] text-emerald-700 font-bold">Instant 80G receipt</span>
              </label>
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
                  className={`w-full rounded-xl border py-2 pl-11 pr-3 text-sm font-bold text-[#042825] outline-none transition ${
                    formErrors.phone
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                  }`}
                />
              </div>
              {formErrors.phone && (
                <p className="mt-0.5 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <span>⚠️</span> {formErrors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Clean 1-Row Collapsible Action Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
            <button
              type="button"
              onClick={() => setShowPanInput(!showPanInput)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                showPanInput
                  ? "bg-[#042825] text-white border-[#042825]"
                  : "bg-cream/70 text-teal-900 border-teal-900/15 hover:bg-cream"
              }`}
            >
              <span>📜</span>
              <span>{showPanInput ? "Hide PAN & Email" : "+ Add PAN (80G Form 10BE) & Email"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOccasionSelect(!showOccasionSelect)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                showOccasionSelect
                  ? "bg-[#042825] text-white border-[#042825]"
                  : "bg-cream/70 text-teal-900 border-teal-900/15 hover:bg-cream"
              }`}
            >
              <span>🎂</span>
              <span>{showOccasionSelect ? "Hide Dedication" : "+ Dedicate (Birthday / Memorial)"}</span>
            </button>
          </div>

          {/* Expandable PAN & Email Section */}
          {showPanInput && (
            <div className="rounded-2xl bg-cream/40 p-3 border border-teal-900/15 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="donor-pan-number" className="text-[11px] font-bold text-[#042825]">
                    Income Tax PAN Card Number
                  </label>
                  <span className="text-[9px] text-emerald-800 font-bold">CBDT Form 10BE</span>
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
                  className={`w-full rounded-xl border p-2 text-sm font-mono uppercase text-[#042825] outline-none transition ${
                    formErrors.pan
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                  }`}
                />
                {formErrors.pan && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">⚠️ {formErrors.pan}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="donor-email-address" className="text-[11px] font-bold text-[#042825]">
                    Email Address <span className="text-teal-950/50 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[9px] text-teal-950/60 font-medium">For PDF backup</span>
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
                  className={`w-full rounded-xl border p-2 text-sm text-[#042825] outline-none transition ${
                    formErrors.email
                      ? "border-rose-500 ring-2 ring-rose-200 bg-rose-50/20"
                      : "border-teal-900/20 focus:border-teal-900 focus:ring-2 focus:ring-amber-400 bg-white"
                  }`}
                />
                {formErrors.email && (
                  <p className="text-[10px] text-rose-600 font-semibold mt-0.5">⚠️ {formErrors.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Expandable Birthday Dedication */}
          {showOccasionSelect && (
            <div className="rounded-2xl bg-cream/40 p-3 border border-teal-900/15 animate-fadeIn space-y-2">
              <label className="block text-[11px] font-bold text-[#042825]">
                Select Auspicious Dedication:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccasion(occ.id)}
                    className={`p-1.5 rounded-xl text-left border text-xs cursor-pointer transition ${
                      occasion === occ.id
                        ? "bg-[#042825] text-white font-bold border-[#042825] shadow-xs"
                        : "bg-white text-teal-950 border-teal-900/15 hover:bg-sand/30"
                    }`}
                  >
                    <p className="font-bold text-[11px]">{occ.label}</p>
                    <p className={`text-[9px] ${occasion === occ.id ? "text-amber-300" : "text-teal-950/60"}`}>
                      {occ.sub}
                    </p>
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="donor-prayer-note" className="block text-[10px] font-bold text-teal-950/70 mb-0.5">
                  Special Prayer Note or Family Names:
                </label>
                <input
                  id="donor-prayer-note"
                  type="text"
                  placeholder="e.g. Birthday of my daughter Ananya / In loving memory of father"
                  value={prayerNote}
                  onChange={(e) => setPrayerNote(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/20 bg-white p-2 text-xs text-[#042825] outline-none focus:border-teal-900 focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4: HIGH-CONVERTING PRIMARY CTA BUTTON & TRUST (ABOVE THE FOLD)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="pt-2 border-t border-teal-900/10 space-y-2.5">
          <button
            type="button"
            onClick={handlePayNow}
            disabled={loading}
            className="focus-ring tap-scale relative z-30 touch-manipulation min-h-[52px] w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#D97706] hover:from-[#D97706] hover:to-[#EA580C] text-white font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-orange-600/30 transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed animate-heartbeat pointer-events-auto"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Connecting Secure Gateway...</span>
              </>
            ) : (
              <>
                <span>PROCEED TO PAY {formatINR(finalAmount)} {frequency === "monthly" ? "/ MONTH" : ""}</span>
                <span>💝 →</span>
              </>
            )}
          </button>

          {/* Trust Strip */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-teal-950/70 text-center">
            <span>⚡ Instant 1-Tap Pay via</span>
            <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Google Pay</span>
            <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">PhonePe</span>
            <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Paytm</span>
            <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">Cards</span>
            <span className="rounded bg-teal-900/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">NetBanking</span>
            <span>· 🔒 256-Bit SSL · Instant 80G Receipt</span>
          </div>

          {/* Direct QR & Bank Wire Toggles */}
          <div className="pt-0.5 flex items-center justify-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowDirectUpi(!showDirectUpi);
                setShowBankTransfer(false);
              }}
              className="font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer inline-flex items-center gap-1 text-[11px]"
            >
              <span>📱</span>
              <span>{showDirectUpi ? "Hide QR Code" : "Pay via Direct UPI / Dynamic QR"}</span>
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
              <span>{showBankTransfer ? "Hide Bank Wire" : "Axis Bank Wire Transfer"}</span>
            </button>
          </div>

          {/* Quick Mobile UPI App Direct Launch Row */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <a
              href={gpayUri}
              className="py-2.5 px-1 rounded-xl bg-white border border-teal-900/15 hover:border-emerald-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-1 text-[11px] active:scale-95 transition min-h-[44px] touch-manipulation pointer-events-auto"
              title="Open Google Pay"
            >
              <span>🟢</span>
              <span>Google Pay</span>
            </a>
            <a
              href={phonepeUri}
              className="py-2.5 px-1 rounded-xl bg-white border border-teal-900/15 hover:border-purple-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-1 text-[11px] active:scale-95 transition min-h-[44px] touch-manipulation pointer-events-auto"
              title="Open PhonePe"
            >
              <span>🟣</span>
              <span>PhonePe</span>
            </a>
            <a
              href={paytmUri}
              className="py-2.5 px-1 rounded-xl bg-white border border-teal-900/15 hover:border-blue-600 shadow-2xs font-bold text-teal-950 flex items-center justify-center gap-1 text-[11px] active:scale-95 transition min-h-[44px] touch-manipulation pointer-events-auto"
              title="Open Paytm"
            >
              <span>🔵</span>
              <span>Paytm</span>
            </a>
          </div>

          {/* ── DIRECT UPI / DYNAMIC QR CODE DRAWER (IMMEDIATELY VISIBLE UNDER BUTTON) ── */}
          {showDirectUpi && (
            <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/15 animate-fadeIn text-center space-y-3">
              <span className="inline-block rounded-full bg-emerald-100 text-emerald-950 px-3 py-0.5 text-[10px] font-black uppercase">
                ⚡ Scan &amp; Pay (0% Platform Fee)
              </span>

              {qrDataUrl && (
                <div className="flex justify-center my-1">
                  <div className="p-2 bg-white rounded-2xl border-2 border-amber-400/50 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="Janaseva Ashrama UPI QR Code"
                      className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-teal-900/15 text-left text-xs">
                <div>
                  <span className="text-[9px] font-bold text-teal-900/60 uppercase block">Official Trust UPI:</span>
                  <p className="font-mono text-xs font-black text-[#042825]">{upiId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyBank(upiId, "upi")}
                  className="rounded-lg bg-[#042825] text-white px-2.5 py-1 text-[11px] font-bold hover:bg-teal-950 cursor-pointer"
                >
                  {copiedBankField === "upi" ? "✓ Copied" : "Copy UPI"}
                </button>
              </div>

              {/* WhatsApp Receipt Button */}
              <a
                href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                  `Namaste Janaseva Ashrama, I have completed a direct UPI donation of ₹${finalAmount} for the 25 resident boys.\n\nDonor Name: ${donorName.trim() || "Well-Wisher"}\nMobile: ${donorPhone.trim() || "Mobile"}${donorPan ? `\nPAN: ${donorPan.trim().toUpperCase()}` : ""}\nPlease issue my official 80G tax receipt.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-3 text-center text-xs shadow-sm transition"
              >
                💬 Confirm on WhatsApp for 80G Receipt
              </a>
            </div>
          )}

          {/* ── AXIS BANK WIRE TRANSFER DRAWER (IMMEDIATELY VISIBLE UNDER BUTTON) ── */}
          {showBankTransfer && (
            <div className="rounded-2xl bg-[#042825] text-white p-4 border border-amber-400/30 animate-fadeIn text-xs space-y-2.5 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Official Axis Bank Account
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  0% Fee
                </span>
              </div>

              <div>
                <span className="text-[9px] text-white/60 uppercase block">Beneficiary Name</span>
                <p className="font-bold text-white text-xs">{BANK_DETAILS.accountName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-white/10 p-2.5">
                  <span className="text-[9px] text-white/60 uppercase block">Account Number</span>
                  <p className="font-mono text-xs font-black text-amber-300">{BANK_DETAILS.accountNumber}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyBank(BANK_DETAILS.accountNumber, "acc")}
                    className="mt-1 text-[10px] font-bold text-amber-300 underline cursor-pointer"
                  >
                    {copiedBankField === "acc" ? "✓ Copied" : "Copy A/C"}
                  </button>
                </div>

                <div className="rounded-xl bg-white/10 p-2.5">
                  <span className="text-[9px] text-white/60 uppercase block">IFSC Code</span>
                  <p className="font-mono text-xs font-black text-amber-300">{BANK_DETAILS.ifscCode}</p>
                  <button
                    type="button"
                    onClick={() => handleCopyBank(BANK_DETAILS.ifscCode, "ifsc")}
                    className="mt-1 text-[10px] font-bold text-amber-300 underline cursor-pointer"
                  >
                    {copiedBankField === "ifsc" ? "✓ Copied" : "Copy IFSC"}
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
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5: EXPANDABLE PHOTO GALLERY ACCORDION (BROWSE ALL 8 SCHEMES)
        ══════════════════════════════════════════════════════════════════ */}
        {showPhotoGallery && (
          <div className="pt-4 border-t-2 border-amber-400/30 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📷</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#042825]">
                  Browse All Seva Schemes with Authentic Photos:
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoGallery(false)}
                className="text-[11px] font-bold text-teal-900/60 hover:text-teal-900 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* 3 Dedicated Seva Tabs with Icons */}
            <div className="grid grid-cols-3 gap-1 rounded-2xl bg-cream/90 p-1 border border-teal-900/10 text-center">
              <button
                type="button"
                onClick={() => setSevaTab("quick")}
                className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                  sevaTab === "quick"
                    ? "bg-[#042825] text-white shadow-sm ring-1 ring-amber-400"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                <span>🌟 Popular Seva</span>
                <span className="text-[9px] font-normal opacity-80">₹11 - ₹4,500</span>
              </button>
              <button
                type="button"
                onClick={() => setSevaTab("official")}
                className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                  sevaTab === "official"
                    ? "bg-[#042825] text-white shadow-sm ring-1 ring-amber-400"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                <span>🏛️ 5 Official Tiers</span>
                <span className="text-[9px] font-normal opacity-80">JJ Act Form 28</span>
              </button>
              <button
                type="button"
                onClick={() => setSevaTab("birthday")}
                className={`py-2 px-1 text-[11px] sm:text-xs font-black rounded-xl transition cursor-pointer flex flex-col items-center justify-center ${
                  sevaTab === "birthday"
                    ? "bg-[#042825] text-white shadow-sm ring-1 ring-amber-400"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                <span>🎂 Celebrations</span>
                <span className="text-[9px] font-normal opacity-80">Birthday Feast</span>
              </button>
            </div>

            {/* Photo Tiles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeTiers.map((tier) => {
                const isSelected = amount === tier.amt && !customAmount;
                return (
                  <button
                    key={`${tier.category}-${tier.amt}`}
                    type="button"
                    onClick={() => {
                      handleSelectTier(tier);
                      topCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`group relative overflow-hidden p-2.5 sm:p-3 rounded-2xl text-left transition-all border cursor-pointer tap-scale flex flex-col justify-between min-h-[105px] sm:min-h-[115px] ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-400 shadow-xl scale-[1.02]"
                        : "border-teal-900/15 hover:border-amber-400/60"
                    }`}
                  >
                    {/* Authentic Photography Background */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tier.image}
                      alt={tier.name}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Warm Radiant Scrim Overlay for 100% Crisp Legibility */}
                    <div
                      className={`absolute inset-0 transition-colors ${
                        isSelected
                          ? "bg-gradient-to-t from-[#042825]/95 via-[#042825]/80 to-[#042825]/50"
                          : "bg-gradient-to-t from-black/90 via-black/75 to-black/45 group-hover:from-black/85"
                      }`}
                    />

                    {/* Top Badge */}
                    <div className="relative z-10 flex items-center justify-between w-full">
                      <span className="text-base select-none">{tier.icon}</span>
                      {tier.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[8px] font-black uppercase shadow-xs ${
                            isSelected
                              ? "bg-gradient-to-r from-amber-400 to-orange-400 text-[#042825]"
                              : "bg-white/25 text-white backdrop-blur-xs"
                          }`}
                        >
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    {/* Amount & Impact Label */}
                    <div className="relative z-10 mt-auto">
                      <span
                        className={`font-display text-base sm:text-lg font-black leading-none drop-shadow-sm ${
                          isSelected ? "text-amber-300" : "text-white"
                        }`}
                      >
                        {tier.label}
                      </span>
                      <p className="text-[10px] text-white/95 font-bold line-clamp-1 leading-tight mt-0.5 drop-shadow-xs">
                        {tier.name}
                      </p>
                      <p className="text-[9px] text-white/80 line-clamp-2 leading-tight mt-0.5 font-medium drop-shadow-xs">
                        {tier.impact}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* ── LEFT COLUMN: AUTHENTIC PROOF, STORIES & CREDENTIALS (ORDER-2 ON MOBILE, LEFT COLUMN ON DESKTOP) ── */}
      <div className="order-2 lg:order-1 col-span-1 lg:col-span-5 space-y-4">
        {/* ── 1. PANTONE-GRADED EMOTIONAL HERO BANNER WITH AUTHENTIC PRAYER PHOTO ── */}
        <div className="relative overflow-hidden rounded-3xl bg-[#042825] text-white shadow-2xl border border-amber-400/40">
          {/* Authentic Background Photo with Warm Vignette */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/boys-meal-gratitude.jpg"
            alt="Resident orphaned boys praying with gratitude at Janaseva Ashrama Bangalore"
            className="absolute inset-0 h-full w-full object-cover object-center filter brightness-90 transition-transform duration-700"
          />
          {/* High-Contrast Vedic Emerald & Saffron Scrim Overlay (Pantone 567 C & 151 C) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#042825] via-[#042825]/85 to-[#042825]/60" />

          <div className="relative z-10 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <LogoMark size={40} className="shadow-md ring-2 ring-amber-400/70 shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight font-display">
                    Janaseva Ashrama Bangalore
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-semibold text-amber-300">
                    Registered Orphanage &amp; Children&apos;s Home · Est. 2000
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="rounded-full bg-emerald-500/30 border border-emerald-400 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-200">
                  🛡️ 80G Tax Free
                </span>
                <span className="text-[8px] sm:text-[9px] text-white/70 font-mono">
                  Govt: {JJ_ACT_REGISTRATION.registrationNumber}
                </span>
              </div>
            </div>

            <p className="text-xs text-amber-100/90 leading-relaxed font-medium mt-1">
              Every sacred contribution feeds, educates, and protects <strong>25 resident orphaned boys</strong>.
              All donors are remembered in daily <strong>6:30 AM morning shloka prayers</strong>.
            </p>

            {/* Urgent Need Strip */}
            <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300" />
                </span>
                <span className="text-white truncate text-[11px]">
                  <strong className="text-amber-300">Urgent Tonight:</strong> 6 Meals needed. Even ₹11 provides warm cow milk.
                </span>
              </div>
              <span className="rounded-md bg-amber-400/20 border border-amber-300/40 px-2 py-0.5 text-[10px] font-black text-amber-200 shrink-0">
                19/25 Sponsored
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. AUTHENTIC LIFE & PROOF OF 25 RESIDENT BOYS ── */}
        <section className="rounded-3xl bg-white p-5 shadow-sm border border-teal-900/10">
          <h3 className="font-display text-base font-black text-[#042825] mb-1">
            Life at Janaseva Ashrama (25 Resident Boys)
          </h3>
          <p className="text-xs text-teal-950/70 mb-3.5">
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-white font-bold leading-tight">
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-white font-bold leading-tight">
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
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-white font-bold leading-tight">
                ✨ 25 Boys
              </div>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-teal-900/10 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-teal-950/80">
            <div>
              <span className="block font-black text-sm text-[#042825]">25 Boys</span>
              <span>Loving Care</span>
            </div>
            <div>
              <span className="block font-black text-sm text-[#042825]">4 Meals/Day</span>
              <span>Satvik Nutrition</span>
            </div>
            <div>
              <span className="block font-black text-sm text-[#042825]">100% Free</span>
              <span>Schooling &amp; Health</span>
            </div>
          </div>
        </section>

        {/* ── 3. OFFICIAL GOVERNMENT & TAX CREDENTIALS ── */}
        <section className="rounded-3xl bg-cream/70 p-4 sm:p-5 border border-teal-900/10 text-xs text-teal-950">
          <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#042825]/70 mb-3">
            Official Government &amp; Tax Accreditations
          </h4>

          <div className="grid gap-2.5 sm:grid-cols-3 text-left">
            <div className="rounded-xl bg-white p-3 border border-teal-900/10 shadow-2xs">
              <span className="text-base">🏛️</span>
              <p className="font-bold text-[11px] mt-1 text-[#042825]">Juvenile Justice Act</p>
              <p className="text-[10px] text-teal-950/70 font-mono">Reg: {JJ_ACT_REGISTRATION.registrationNumber}</p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-teal-900/10 shadow-2xs">
              <span className="text-base">📜</span>
              <p className="font-bold text-[11px] mt-1 text-[#042825]">Section 80G Form 10AC</p>
              <p className="text-[10px] text-teal-950/70 font-mono">URN: {FORM_10AC.urn}</p>
            </div>

            <div className="rounded-xl bg-white p-3 border border-teal-900/10 shadow-2xs">
              <span className="text-base">🛡️</span>
              <p className="font-bold text-[11px] mt-1 text-[#042825]">Income Tax PAN</p>
              <p className="text-[10px] text-teal-950/70 font-mono">PAN: {SITE.pan}</p>
            </div>
          </div>
        </section>

        {/* ── 4. FREQUENTLY ASKED QUESTIONS ── */}
        <section className="rounded-3xl bg-white p-5 border border-teal-900/10">
          <h4 className="font-display text-base font-bold text-[#042825] mb-3">
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

        {/* ── 5. DIRECT CONTACT & WHATSAPP HELP ── */}
        <div className="text-center text-xs text-teal-950/70 space-y-2 pt-2">
          <p>
            Need assistance or wish to plan an in-person campus visit?
          </p>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
              "Namaste Janaseva Ashrama, I have a question regarding donating."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
          >
            <span>💬</span>
            <span>Chat directly on WhatsApp: +91 99803 59595</span>
          </a>
          <p className="text-[11px] text-teal-950/60 pt-1">
            Janaseva Ashrama · Turahalli, Uttarahalli Hobli, Bengaluru 560061
          </p>
        </div>
      </div>
      </div>

      {/* ── 7. 📱 MOBILE STICKY BOTTOM DONATION BAR ── */}
      {showStickyBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-2.5 px-4 shadow-2xl sm:hidden flex items-center justify-between gap-3 animate-in slide-in-from-bottom">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-display text-base font-black text-[#042825]">
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
            onClick={handlePayNow}
            disabled={loading}
            className="shrink-0 min-h-[46px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#D97706] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5 animate-heartbeat relative z-50 pointer-events-auto touch-manipulation disabled:opacity-75"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : (
              <>
                <span>PROCEED TO PAY</span>
                <span>💝</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export { MetaAdsDonateComponent as StandardDonorCheckout };
