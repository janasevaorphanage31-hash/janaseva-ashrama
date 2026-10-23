"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR, BANK_DETAILS } from "@/lib/site";
import { SUPPORTER_CATEGORIES } from "@/lib/supporter-form";
import type { BankDetailsItem } from "@/lib/site-content";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";

const TIER_IMAGES: Record<string, string> = {
  food_one_day: "/media/annadana-hall-hd.jpg",
  food_one_month: "/media/pantry.jpg",
  cloth_one_set: "/media/boys-group-red-assembly.jpg",
  education_one_month: "/media/learning.jpg",
  education_one_year: "/media/abacus-math-class.jpg",
};

const TIER_SLUG_MAP: Record<string, Record<string, string>> = {
  food_one_day: {
    all_children: "tier-1-full-day",
    two_times: "tier-1-two-times",
    one_time: "tier-1-one-time",
  },
  food_one_month: {
    "4_children": "tier-2-month-4",
    "2_children": "tier-2-month-2",
    "1_child": "tier-2-month-1",
  },
  cloth_one_set: {
    "8_children": "tier-3-cloth-8",
    "6_children": "tier-3-cloth-6",
    "3_children": "tier-3-cloth-3",
  },
  education_one_month: {
    "12_children": "tier-4-edu-12",
    "8_children": "tier-4-edu-8",
    "4_children": "tier-4-edu-4",
  },
  education_one_year: {
    "3_children": "tier-5-edu-year-3",
    "2_children": "tier-5-edu-year-2",
    "1_child": "tier-5-edu-year-1",
  },
};

const CONCISE_META: Record<
  string,
  {
    shortTitle: string;
    tabLabel: string;
    oneLineDesc: string;
    pillOptions: { id: string; label: string; impact: string }[];
  }
> = {
  food_one_day: {
    shortTitle: "One Day Food for all 25 Children",
    tabLabel: "Tier 1: Food",
    oneLineDesc: "Wholesome daily Annadana: hot breakfast, nutritious lunch, snacks & dinner for all 25 children.",
    pillOptions: [
      { id: "all_children", label: "Full Day", impact: "All 25 Boys · 4 Complete Meals (Breakfast, Lunch, Snacks, Dinner)" },
      { id: "two_times", label: "2 Meals", impact: "All 25 Boys · Lunch & Dinner" },
      { id: "one_time", label: "1 Meal", impact: "All 25 Boys · Single Meal Feast" },
    ],
  },
  food_one_month: {
    shortTitle: "One Month Food for Children",
    tabLabel: "Tier 2: Ration",
    oneLineDesc: "Essential monthly rice, toor dal, fresh vegetables, milk & fruits for resident children.",
    pillOptions: [
      { id: "4_children", label: "4 Boys", impact: "4 Boys · 1 Month Full Groceries" },
      { id: "2_children", label: "2 Boys", impact: "2 Boys · 1 Month Full Groceries" },
      { id: "1_child", label: "1 Boy", impact: "1 Boy · 1 Month Full Groceries" },
    ],
  },
  cloth_one_set: {
    shortTitle: "One Set Cloth for Children",
    tabLabel: "Tier 3: Clothes",
    oneLineDesc: "Durable everyday cotton outfits, traditional festival wear & daily clothing sets.",
    pillOptions: [
      { id: "8_children", label: "8 Boys", impact: "8 Full Outfits & Festival Sets" },
      { id: "6_children", label: "6 Boys", impact: "6 Full Outfits & Festival Sets" },
      { id: "3_children", label: "3 Boys", impact: "3 Full Outfits & Festival Sets" },
    ],
  },
  education_one_month: {
    shortTitle: "One Month Education for Children",
    tabLabel: "Tier 4: Education",
    oneLineDesc: "School tuition, notebooks, stationery, exam preparation & evening tutoring.",
    pillOptions: [
      { id: "12_children", label: "12 Boys", impact: "12 Boys · Batch Tuition & Schooling" },
      { id: "8_children", label: "8 Boys", impact: "8 Boys · Monthly Schooling & Kits" },
      { id: "4_children", label: "4 Boys", impact: "4 Boys · Monthly Education Support" },
    ],
  },
  education_one_year: {
    shortTitle: "One Year Education for Children",
    tabLabel: "Tier 5: Full Year",
    oneLineDesc: "Annual school fees, textbook bundles, school bags, shoes & full academic year.",
    pillOptions: [
      { id: "3_children", label: "3 Boys", impact: "3 Boys · Complete Academic School Year" },
      { id: "2_children", label: "2 Boys", impact: "2 Boys · Complete Academic School Year" },
      { id: "1_child", label: "1 Boy", impact: "1 Boy · Complete Academic School Year" },
    ],
  },
};

export const SCHEME_PRICE_CARDS = [
  {
    amount: 1800,
    label: "Clothes · 3 Boys",
    sub: "3 cotton outfit sets",
    image: "/media/boys-group-red-assembly.jpg",
    catId: "cloth_one_set",
    optId: "3_children",
  },
  {
    amount: 2000,
    label: "1 Mo Ration · 1 Boy",
    sub: "Rice, dal & groceries",
    image: "/media/pantry.jpg",
    catId: "food_one_month",
    optId: "1_child",
  },
  {
    amount: 2500,
    label: "1 Meal · 25 Boys",
    sub: "Hot lunch with sweet payasam",
    image: "/media/annadana-hall-hd.jpg",
    catId: "food_one_day",
    optId: "one_time",
  },
  {
    amount: 3000,
    label: "2 Meals · 25 Boys",
    sub: "Lunch & dinner feast",
    image: "/media/banana-leaf-feast.jpg",
    catId: "food_one_day",
    optId: "two_times",
  },
  {
    amount: 4500,
    label: "Full Day · 25 Boys",
    sub: "All 4 daily meals (B/L/S/D)",
    badge: "Most Chosen ⭐",
    image: "/media/annadana-hall-hd.jpg",
    catId: "food_one_day",
    optId: "all_children",
  },
  {
    amount: 6000,
    label: "1 Mo Ration · 4 Boys",
    sub: "Monthly pantry provisions",
    badge: "Popular Care",
    image: "/media/pantry.jpg",
    catId: "food_one_month",
    optId: "4_children",
  },
  {
    amount: 9600,
    label: "Schooling · 12 Boys",
    sub: "Monthly education & kits",
    image: "/media/learning.jpg",
    catId: "education_one_month",
    optId: "12_children",
  },
];

export function OfficialSupportTiersSection({
  tiers,
  bankDetails,
}: {
  tiers?: typeof SUPPORTER_CATEGORIES;
  bankDetails?: BankDetailsItem;
} = {}) {
  const activeCategories = tiers && tiers.length > 0 ? tiers : SUPPORTER_CATEGORIES;
  const activeBank = bankDetails || {
    accountHolder: BANK_DETAILS.accountName,
    accountNumber: BANK_DETAILS.accountNumber,
    ifsc: BANK_DETAILS.ifscCode,
    bankName: BANK_DETAILS.bankName,
    branch: BANK_DETAILS.branch,
  };
  const { openBottomDonate, setQty, setDedicatedAmount, qty, total } = useCart();

  // Dynamically compute Scheme Price Selector cards based on activeCategories
  const schemePriceCards = useMemo(() => {
    const foodDay = activeCategories.find((c) => c.id === "food_one_day");
    const foodMonth = activeCategories.find((c) => c.id === "food_one_month");
    const cloth = activeCategories.find((c) => c.id === "cloth_one_set");
    const eduMonth = activeCategories.find((c) => c.id === "education_one_month");

    const clothOpt3 = cloth?.options?.find((o) => o.id === "3_children") || cloth?.options?.[2] || cloth?.options?.[0];
    const foodMonthOpt1 = foodMonth?.options?.find((o) => o.id === "1_child") || foodMonth?.options?.[2];
    const foodDayOpt1 = foodDay?.options?.find((o) => o.id === "one_time") || foodDay?.options?.[2];
    const foodDayOpt2 = foodDay?.options?.find((o) => o.id === "two_times") || foodDay?.options?.[1];
    const foodDayOptFull = foodDay?.options?.find((o) => o.id === "all_children") || foodDay?.options?.[0];
    const foodMonthOpt4 = foodMonth?.options?.find((o) => o.id === "4_children") || foodMonth?.options?.[0];
    const eduMonthOpt12 = eduMonth?.options?.find((o) => o.id === "12_children") || eduMonth?.options?.[0];

    return [
      {
        amount: clothOpt3?.amount || 1800,
        label: clothOpt3?.label ? `Clothes · ${clothOpt3.label.replace(" (1 Set Cloth)", "")}` : "Clothes · 3 Boys",
        sub: clothOpt3?.subLabel || "3 cotton outfit sets",
        image: cloth?.imageUrl || TIER_IMAGES.cloth_one_set,
        catId: "cloth_one_set",
        optId: clothOpt3?.id || "3_children",
      },
      {
        amount: foodMonthOpt1?.amount || 2000,
        label: foodMonthOpt1?.label ? `Ration · ${foodMonthOpt1.label.replace(" (1 Month)", "")}` : "1 Mo Ration · 1 Boy",
        sub: foodMonthOpt1?.subLabel || "Rice, dal & groceries",
        image: foodMonth?.imageUrl || TIER_IMAGES.food_one_month,
        catId: "food_one_month",
        optId: foodMonthOpt1?.id || "1_child",
      },
      {
        amount: foodDayOpt1?.amount || 2500,
        label: foodDayOpt1?.label || "1 Meal · 25 Boys",
        sub: foodDayOpt1?.subLabel || "Hot lunch with sweet payasam",
        image: foodDay?.imageUrl || TIER_IMAGES.food_one_day,
        catId: "food_one_day",
        optId: foodDayOpt1?.id || "one_time",
      },
      {
        amount: foodDayOpt2?.amount || 3000,
        label: foodDayOpt2?.label || "2 Meals · 25 Boys",
        sub: foodDayOpt2?.subLabel || "Lunch & dinner feast",
        image: "/media/banana-leaf-feast.jpg",
        catId: "food_one_day",
        optId: foodDayOpt2?.id || "two_times",
      },
      {
        amount: foodDayOptFull?.amount || 4500,
        label: foodDayOptFull?.label ? foodDayOptFull.label.replace(" (All Children)", " · 25 Boys") : "Full Day · 25 Boys",
        sub: foodDayOptFull?.subLabel || "All 4 daily meals (B/L/S/D)",
        badge: "Most Chosen ⭐",
        image: foodDay?.imageUrl || TIER_IMAGES.food_one_day,
        catId: "food_one_day",
        optId: foodDayOptFull?.id || "all_children",
      },
      {
        amount: foodMonthOpt4?.amount || 6000,
        label: foodMonthOpt4?.label ? `Ration · ${foodMonthOpt4.label.replace(" (1 Month)", "")}` : "1 Mo Ration · 4 Boys",
        sub: foodMonthOpt4?.subLabel || "Monthly pantry provisions",
        badge: "Popular Care",
        image: foodMonth?.imageUrl || TIER_IMAGES.food_one_month,
        catId: "food_one_month",
        optId: foodMonthOpt4?.id || "4_children",
      },
      {
        amount: eduMonthOpt12?.amount || 9600,
        label: eduMonthOpt12?.label ? `Schooling · ${eduMonthOpt12.label.replace(" (1 Month)", "")}` : "Schooling · 12 Boys",
        sub: eduMonthOpt12?.subLabel || "Monthly education & kits",
        image: eduMonth?.imageUrl || TIER_IMAGES.education_one_month,
        catId: "education_one_month",
        optId: eduMonthOpt12?.id || "12_children",
      },
    ];
  }, [activeCategories]);

  // Active category filter tab: "all" or specific category ID or "bank_wire"
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedExactAmount, setSelectedExactAmount] = useState<number | null>(4500);

  // Selected pricing option per category (Defaults to flagship Full Day Food ₹4,500)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
    food_one_day: "all_children",
    food_one_month: "4_children",
    cloth_one_set: "8_children",
    education_one_month: "12_children",
    education_one_year: "1_child",
  });

  const [copiedBank, setCopiedBank] = useState(false);
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

  const handleSelectExactAmount = (amount: number, categoryId: string, optionId: string) => {
    setSelectedExactAmount(amount);
    setSelectedOptions((prev) => ({ ...prev, [categoryId]: optionId }));
    setActiveTab("all");
    setDedicatedAmount(amount);
    track("tier_exact_amount_select", { amount, categoryId, optionId });

    if (typeof document !== "undefined") {
      const card = document.getElementById(`tier-card-${categoryId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Listen to mount query params (e.g. ?amount=4500&ref=TC01)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get("ref");
      if (ref) {
        const cleanRef = ref.trim().toUpperCase();
        if (/^[A-Z0-9_-]+$/.test(cleanRef)) {
          sessionStorage.setItem("antigravity_caller_ref", cleanRef);
          localStorage.setItem("antigravity_caller_ref", cleanRef);
        }
      }

      const amtParam = params.get("amount");
      const tierParam = params.get("tier");

      queueMicrotask(() => {
        if (amtParam) {
          const amt = parseInt(amtParam, 10);
          if (amt === 4500) handleSelectExactAmount(4500, "food_one_day", "all_children");
          else if (amt === 3000) handleSelectExactAmount(3000, "food_one_day", "two_times");
          else if (amt === 2500) handleSelectExactAmount(2500, "food_one_day", "one_time");
          else if (amt === 6000) handleSelectExactAmount(6000, "food_one_month", "4_children");
          else if (amt === 4000) handleSelectExactAmount(4000, "food_one_month", "2_children");
          else if (amt === 2000) handleSelectExactAmount(2000, "food_one_month", "1_child");
          else if (amt === 4800) handleSelectExactAmount(4800, "cloth_one_set", "8_children");
          else if (amt === 3600) handleSelectExactAmount(3600, "cloth_one_set", "6_children");
          else if (amt === 1800) handleSelectExactAmount(1800, "cloth_one_set", "3_children");
          else if (amt === 9600) handleSelectExactAmount(9600, "education_one_month", "12_children");
        }

        if (tierParam && activeCategories.some((c) => c.id === tierParam)) {
          setActiveTab(tierParam);
        }
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectOption = (categoryId: string, optionId: string) => {
    setSelectedExactAmount(null);
    setSelectedOptions((prev) => ({ ...prev, [categoryId]: optionId }));
    track("tier_pricing_option_toggle", { categoryId, optionId });
  };

  const handleSponsorTier = (categoryId: string) => {
    const cat = activeCategories.find((c) => c.id === categoryId);
    if (!cat) return;
    const currentOptionId = selectedOptions[categoryId] || cat.options[0].id;
    const option = cat.options.find((o) => o.id === currentOptionId) || cat.options[0];
    const meta = CONCISE_META[categoryId];

    track("tier_sponsor_click", {
      categoryId,
      optionId: option.id,
      amount: option.amount,
    });

    setDedicatedAmount(option.amount);

    openBottomDonate(
      option.amount,
      categoryId,
      `${meta?.shortTitle || cat.title} - ${option.label.split("(")[0].trim()} (${formatINR(option.amount)})`,
      "Sponsor 25 Boys (Form 28)"
    );
  };

  const handleAddToCart = (categoryId: string) => {
    const currentOptionId = selectedOptions[categoryId] || "all_children";
    const slug = TIER_SLUG_MAP[categoryId]?.[currentOptionId];
    if (!slug) return;

    const currentQty = qty[slug] || 0;
    setQty(slug, currentQty + 1);

    const cat = activeCategories.find((c) => c.id === categoryId);
    const option = cat?.options.find((o) => o.id === currentOptionId);
    const meta = CONCISE_META[categoryId];

    setAddedNotification(`Added "${meta?.shortTitle || cat?.title} (${formatINR(option?.amount || 0)})" to Giving Basket!`);
    setTimeout(() => setAddedNotification(null), 3000);

    track("tier_add_to_cart", { categoryId, optionId: currentOptionId, slug });
  };

  const handleCopyBank = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("A/c: 913020019616990 | IFSC: UTIB0000102 | Axis Bank Banashankari");
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2500);
    }
  };

  const visibleCategories =
    activeTab === "all" || activeTab === "bank_wire"
      ? activeCategories
      : activeCategories.filter((c) => c.id === activeTab);

  const showBankCard = activeTab === "all" || activeTab === "bank_wire";

  return (
    <section
      id="official-tiers"
      aria-label="Sponsor 25 Boys Official Sponsorship Tiers"
      className="scroll-mt-24 sm:scroll-mt-28 w-full max-w-full overflow-hidden bg-sand/30 py-8 md:py-14 border-b border-teal-900/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── AUTHORITATIVE TELECALLER & OFFICIAL FORM 28 HEADER ── */}
        <div className="text-center max-w-3xl mx-auto mb-5 md:mb-7">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/25 border border-gold/50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-teal-950 mb-2 shadow-2xs">
            <span>🏛️</span>
            <span>JJ Act Reg: KA18CH0242 · Form 28 Approved · 90% Primary NGO Focus</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-950 tracking-tight">
            Sponsor 25 Boys: Official Support Tiers
          </h2>

          <p className="mt-1 text-xs sm:text-sm font-bold text-saffron-dark">
            ಸಂಸ್ಥೆಯ ಅಧಿಕೃತ 5 ಸೇವಾ ಯೋಜನೆಗಳು · 25 ಆಶ್ರಮದ ಮಕ್ಕಳಿಗೆ 100% ನೇರ ಪೋಷಣೆ
          </p>

          {/* Compact Trust Guarantee Badges */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] font-bold text-teal-900">
            <span className="rounded-full bg-white px-3 py-0.5 border border-teal-900/10 shadow-2xs">
              ✓ Form 10AC Section 80G (100% Tax Free)
            </span>
            <span className="rounded-full bg-white px-3 py-0.5 border border-teal-900/10 shadow-2xs">
              ✓ Form 28 JJ Act KA18CH0242
            </span>
            <span className="rounded-full bg-white px-3 py-0.5 border border-teal-900/10 shadow-2xs">
              ✓ 25 Resident Boys Direct Care
            </span>
            <span className="rounded-full bg-white px-3 py-0.5 border border-teal-900/10 shadow-2xs">
              ✓ Instant WhatsApp 80G Certificate
            </span>
          </div>

          {/* Toast Notification */}
          {addedNotification && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-900 text-white px-3.5 py-1.5 text-xs font-bold shadow-md animate-fadeIn">
              <span>🛒</span>
              <span>{addedNotification}</span>
              <Link href={`/checkout?amount=${total > 0 ? total : selectedExactAmount}`} className="underline text-gold hover:text-white font-extrabold ml-1 cursor-pointer">
                Checkout →
              </Link>
            </div>
          )}
        </div>

        {/* ── SPONSOR 25 BOYS SCHEME PRICE SELECTOR WITH PHOTO BACKGROUNDS ── */}
        <div className="mb-6 bg-white/80 backdrop-blur-xs p-3 sm:p-4 rounded-3xl border border-teal-900/10 shadow-xs">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-teal-950 uppercase tracking-wider">
              <span>🏛️</span>
              <span>Sponsor 25 Boys Scheme &amp; Pricing (Tap to Choose):</span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 hidden sm:inline">
              100% Tax Free under 80G
            </span>
          </div>

          {/* Photo-backed Scheme Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-2.5">
            {schemePriceCards.map((card) => {
              const isSelected = selectedExactAmount === card.amount;
              return (
                <button
                  key={card.amount}
                  type="button"
                  onClick={() => {
                    handleSelectExactAmount(card.amount, card.catId, card.optId);
                  }}
                  className={`group relative overflow-hidden p-2.5 rounded-2xl text-left transition-all border cursor-pointer tap-scale flex flex-col justify-between min-h-[92px] sm:min-h-[105px] ${
                    isSelected
                      ? "border-amber-500 ring-2 ring-amber-400 shadow-lg scale-[1.02]"
                      : "border-teal-900/15 hover:border-amber-400/60"
                  }`}
                >
                  {/* Photo Background */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt={card.label}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* High-contrast gradient overlay */}
                  <div
                    className={`absolute inset-0 transition-colors ${
                      isSelected
                        ? "bg-gradient-to-t from-teal-950/95 via-teal-950/75 to-teal-950/40"
                        : "bg-gradient-to-t from-black/90 via-black/70 to-black/35 group-hover:from-black/85 group-hover:via-black/60"
                    }`}
                  />

                  {/* Top Badge */}
                  <div className="relative z-10 flex justify-end w-full">
                    {card.badge && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[8px] font-black uppercase text-teal-950 shadow">
                        {card.badge}
                      </span>
                    )}
                  </div>

                  <div className="relative z-10 mt-auto">
                    <span className="font-display text-sm sm:text-base font-black block text-amber-300 drop-shadow-sm leading-none">
                      {formatINR(card.amount)}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold block leading-tight text-white drop-shadow-sm mt-1">
                      {card.label}
                    </span>
                    <span className="text-[9px] sm:text-[10px] block line-clamp-1 text-white/80 mt-0.5 leading-tight">
                      {card.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CONCISE INTERACTIVE TABS (Instant Category Switcher) ── */}
        <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-2 mb-6 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              activeTab === "all"
                ? "bg-teal-950 text-white shadow-sm ring-1 ring-teal-900"
                : "bg-white text-teal-900/80 hover:bg-sand/80 border border-teal-900/10"
            }`}
          >
            All 5 Tiers
          </button>

          {activeCategories.map((cat) => {
            const meta = CONCISE_META[cat.id];
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? "bg-teal-900 text-white shadow-sm ring-1 ring-teal-800"
                    : "bg-white text-teal-900/80 hover:bg-sand/80 border border-teal-900/10"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{meta?.tabLabel || `Tier 0${cat.index}`}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveTab("bank_wire")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
              activeTab === "bank_wire"
                ? "bg-teal-900 text-white shadow-sm ring-1 ring-teal-800"
                : "bg-white text-teal-900/80 hover:bg-sand/80 border border-teal-900/10"
            }`}
          >
            <span>🏦</span>
            <span>Bank Wire</span>
          </button>
        </div>

        {/* ── REDESIGNED TIER CARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 items-stretch">
          {visibleCategories.map((cat) => {
            const meta = CONCISE_META[cat.id];
            const currentOptionId = selectedOptions[cat.id] || cat.options[0].id;
            const currentOption = cat.options.find((o) => o.id === currentOptionId) || cat.options[0];
            const isFlagship = cat.id === "food_one_day";
            const imgUrl = cat.imageUrl || TIER_IMAGES[cat.id] || "/media/annadana-hall-hd.jpg";
            const currentSlug = TIER_SLUG_MAP[cat.id]?.[currentOptionId];
            const inCartQty = currentSlug ? qty[currentSlug] || 0 : 0;
            const currentPill = meta?.pillOptions.find((p) => p.id === currentOptionId);

            return (
              <div
                key={cat.id}
                id={`tier-card-${cat.id}`}
                className={`group relative flex flex-col justify-between rounded-3xl bg-white/95 backdrop-blur-md p-4 sm:p-5 transition-all duration-300 border shadow-md hover:shadow-xl hover:-translate-y-0.5 ${
                  selectedExactAmount && currentOption.amount === selectedExactAmount
                    ? "border-2 border-amber-500 ring-4 ring-amber-400/50 bg-gradient-to-b from-white via-amber-50/30 to-orange-50/15 scale-[1.01]"
                    : isFlagship
                    ? "border-2 border-amber-500 ring-2 ring-amber-400/30 bg-gradient-to-b from-white via-amber-50/20 to-orange-50/10"
                    : "border-teal-900/10 hover:border-amber-500/40"
                }`}
              >
                {/* Popular Flagship Badge */}
                {isFlagship && (
                  <div className="absolute -top-3 right-4 rounded-full bg-gradient-celebrate px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md glow-saffron z-10 animate-shimmer">
                    ★ 90% Primary Campaign · Form 28 Regd
                  </div>
                )}

                <div>
                  {/* Photo Header */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-teal-900 mb-3 shadow-2xs">
                    <Image
                      src={imgUrl}
                      alt={meta?.shortTitle || cat.title}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-103"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />

                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="rounded-md bg-teal-950/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                        Tier 0{cat.index}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white">
                      <span className="text-xs font-bold text-amber-200 drop-shadow-xs">
                        25 Resident Boys
                      </span>
                      <span className="text-xl select-none" aria-hidden="true">
                        {cat.icon}
                      </span>
                    </div>
                  </div>

                  {/* Title & 1-Line Description */}
                  <div className="mb-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-base sm:text-lg font-bold text-teal-950 leading-tight">
                        {meta?.shortTitle || cat.title}
                      </h3>
                      <span className="text-[11px] font-semibold text-saffron-dark shrink-0">
                        {cat.kannadaTitle}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-teal-950/70 leading-relaxed">
                      {meta?.oneLineDesc || cat.desc}
                    </p>
                  </div>

                  {/* Clean Segmented Option Pills */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-sand/40 border border-teal-900/10 mb-3">
                    {cat.options.map((opt) => {
                      const isSelected = currentOption.id === opt.id;
                      const pillMeta = meta?.pillOptions.find((p) => p.id === opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(cat.id, opt.id)}
                          className={`py-1.5 px-1 rounded-lg text-center transition cursor-pointer ${
                            isSelected
                              ? "bg-teal-900 text-white font-extrabold shadow-2xs ring-1 ring-teal-800"
                              : "text-teal-950/75 hover:bg-white font-semibold text-xs"
                          }`}
                        >
                          <span className="block text-xs font-bold">
                            {formatINR(opt.amount)}
                          </span>
                          <span className="block text-[10px] opacity-80 truncate">
                            {pillMeta?.label || opt.label.split("(")[0].trim()}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dynamic Impact & Price Line */}
                  <div className="flex items-center justify-between px-2 py-1.5 text-xs bg-amber-50/60 rounded-xl border border-amber-200/50 mb-1">
                    <div>
                      <span className="font-display text-base sm:text-lg font-black text-teal-950 block">
                        {formatINR(currentOption.amount)}
                      </span>
                      <span className="text-[10px] font-semibold text-teal-950/60 block">
                        Tax Exempt under 80G
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-bold text-teal-900 bg-white px-2 py-0.5 rounded-lg border border-teal-900/10 shadow-2xs text-right truncate max-w-[55%]">
                      {currentPill?.impact || currentOption.subLabel || "Direct Seva"}
                    </span>
                  </div>
                </div>

                {/* Compact CTA Row */}
                <div className="mt-4 pt-3 border-t border-teal-900/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSponsorTier(cat.id)}
                      className="focus-ring tap-scale flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-celebrate py-3 px-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md glow-saffron hover:opacity-95 transition cursor-pointer"
                    >
                      <span>Sponsor {formatINR(currentOption.amount)} ({currentPill?.label || currentOption.label.split("(")[0].trim()}) 💝</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(cat.id)}
                      className={`focus-ring tap-scale rounded-xl py-2.5 px-3 text-xs font-bold transition border cursor-pointer ${
                        inCartQty > 0
                          ? "bg-teal-900 text-white border-teal-900"
                          : "bg-white text-teal-900 border-teal-900/20 hover:bg-sand/60"
                      }`}
                      title="Add to Giving Basket"
                    >
                      <span>{inCartQty > 0 ? `In (${inCartQty})` : "+ Cart"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-teal-950/60 px-0.5">
                    <span>✓ Form 28 KA18CH0242</span>
                    <Link
                      href="/supporter-form"
                      className="font-bold text-teal-900 hover:text-saffron-dark underline"
                    >
                      Official Form →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── 6TH CARD: DIRECT BANK WIRE & UPI ── */}
          {showBankCard && (
            <div className="flex flex-col justify-between rounded-3xl bg-teal-950 text-white p-4 sm:p-5 shadow-sm border border-amber-400/25">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-[10px] font-black text-amber-300">
                    Custom Seva · ನೇರ ಸೇವೆ
                  </span>
                  <span className="text-xl" aria-hidden="true">🏦</span>
                </div>

                <h3 className="mt-2.5 font-display text-lg font-bold leading-tight">
                  Bank Wire &amp; UPI
                </h3>
                <p className="mt-1 text-xs text-white/75 leading-relaxed">
                  Transfer directly to the registered trust account. 100% allocation with zero deductions.
                </p>

                {/* Account Details Box */}
                <div className="mt-3 rounded-xl bg-white/10 p-3 border border-white/10 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-white/60 uppercase block">Account Name</span>
                    <span className="font-bold">{activeBank.accountHolder}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-white/60 uppercase block">Account No</span>
                      <span className="font-mono font-bold text-amber-300">{activeBank.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 uppercase block">IFSC Code</span>
                      <span className="font-mono font-bold text-amber-300">{activeBank.ifsc}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/60 uppercase block">Bank &amp; Branch</span>
                    <span>{activeBank.bankName}, {activeBank.branch}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCopyBank}
                  className="focus-ring tap-scale flex items-center gap-1.5 rounded-xl bg-amber-400 text-teal-950 px-3.5 py-2 text-xs font-bold hover:bg-amber-300 transition cursor-pointer"
                >
                  <span>{copiedBank ? "✓ Copied!" : "📋 Copy Bank Details"}</span>
                </button>
                <span className="text-[10px] text-white/60">
                  Form 10AC Section 80G
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
