"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import { SUPPORTER_CATEGORIES, OFFICIAL_FORM_META } from "@/lib/supporter-form";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";

const TIER_IMAGES: Record<string, string> = {
  food_one_day: "/media/annadana-hall-hd.jpg",
  food_one_month: "/media/banana-leaf-feast.jpg",
  cloth_one_set: "/media/boys-group-red-assembly.jpg",
  education_one_month: "/media/art-drawings.jpg",
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
    shortTitle: "Daily Meals",
    tabLabel: "Meals",
    oneLineDesc: "Hot breakfast, lunch, snacks & dinner for 25 boys.",
    pillOptions: [
      { id: "all_children", label: "Full Day", impact: "All 25 Boys · 4 Meals" },
      { id: "two_times", label: "2 Meals", impact: "Lunch & Dinner" },
      { id: "one_time", label: "1 Meal", impact: "Single Feast" },
    ],
  },
  food_one_month: {
    shortTitle: "Monthly Ration",
    tabLabel: "Ration",
    oneLineDesc: "Essential monthly rice, dal, oil & fresh groceries.",
    pillOptions: [
      { id: "4_children", label: "4 Boys", impact: "1 Month Groceries" },
      { id: "2_children", label: "2 Boys", impact: "1 Month Groceries" },
      { id: "1_child", label: "1 Boy", impact: "1 Month Groceries" },
    ],
  },
  cloth_one_set: {
    shortTitle: "Clothing Sets",
    tabLabel: "Clothes",
    oneLineDesc: "Durable cotton shirts, pants & festival outfits.",
    pillOptions: [
      { id: "8_children", label: "8 Boys", impact: "8 Full Sets" },
      { id: "6_children", label: "6 Boys", impact: "6 Full Sets" },
      { id: "3_children", label: "3 Boys", impact: "3 Full Sets" },
    ],
  },
  education_one_month: {
    shortTitle: "Monthly Vidya",
    tabLabel: "Tuition",
    oneLineDesc: "School tuition, notebooks, stationery & tutoring.",
    pillOptions: [
      { id: "12_children", label: "12 Boys", impact: "Batch Tuition" },
      { id: "8_children", label: "8 Boys", impact: "Schooling Support" },
      { id: "4_children", label: "4 Boys", impact: "Essential Coaching" },
    ],
  },
  education_one_year: {
    shortTitle: "Full Year School",
    tabLabel: "School",
    oneLineDesc: "Annual school fees, uniform sets & full academic year.",
    pillOptions: [
      { id: "3_children", label: "3 Boys", impact: "Full Academic Year" },
      { id: "2_children", label: "2 Boys", impact: "Full Academic Year" },
      { id: "1_child", label: "1 Boy", impact: "Full Academic Year" },
    ],
  },
};

export function OfficialSupportTiersSection({
  tiers,
}: {
  tiers?: typeof SUPPORTER_CATEGORIES;
} = {}) {
  const activeCategories = tiers && tiers.length > 0 ? tiers : SUPPORTER_CATEGORIES;
  const { openBottomDonate, setQty, qty } = useCart();

  // Active category filter tab: "all" or specific category ID or "bank_wire"
  const [activeTab, setActiveTab] = useState<string>("all");

  // Selected pricing option per category
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
    food_one_day: "all_children",
    food_one_month: "4_children",
    cloth_one_set: "8_children",
    education_one_month: "12_children",
    education_one_year: "1_child",
  });

  const [copiedBank, setCopiedBank] = useState(false);
  const [addedNotification, setAddedNotification] = useState<string | null>(null);

  const handleSelectOption = (categoryId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [categoryId]: optionId }));
    track("tier_pricing_option_toggle", { categoryId, optionId });
  };

  const handleSponsorTier = (categoryId: string) => {
    const cat = activeCategories.find((c) => c.id === categoryId);
    if (!cat) return;
    const currentOptionId = selectedOptions[categoryId] || cat.options[0].id;
    const option = cat.options.find((o) => o.id === currentOptionId) || cat.options[0];

    track("tier_sponsor_click", {
      categoryId,
      optionId: option.id,
      amount: option.amount,
    });

    openBottomDonate(option.amount, categoryId);
  };

  const handleAddToCart = (categoryId: string) => {
    const currentOptionId = selectedOptions[categoryId] || "all_children";
    const slug = TIER_SLUG_MAP[categoryId]?.[currentOptionId];
    if (!slug) return;

    const currentQty = qty[slug] || 0;
    setQty(slug, currentQty + 1);

    const cat = activeCategories.find((c) => c.id === categoryId);
    const option = cat?.options.find((o) => o.id === currentOptionId);

    setAddedNotification(`Added "${cat?.title} (${formatINR(option?.amount || 0)})" to Giving Basket!`);
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
      aria-label="Sponsorship Tiers"
      className="scroll-mt-16 w-full max-w-full overflow-hidden bg-sand/30 py-8 md:py-14 border-b border-teal-900/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── REDESIGNED CLEAN PUNCHY HEADER ("a word is enough") ── */}
        <div className="text-center max-w-2xl mx-auto mb-6 md:mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-saffron/15 border border-saffron/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-saffron-dark mb-2">
            <span>ಸಂಸ್ಥೆಯ ಸೇವೆ</span>
            <span>·</span>
            <span>Sponsorship</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-teal-950 tracking-tight">
            Sponsor 25 Boys
          </h2>

          {/* Minimal 1-Word / Punchy Trust Chips */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] font-bold text-teal-900">
            <span className="rounded-full bg-white px-2.5 py-1 border border-teal-900/10 shadow-2xs">
              ✓ 80G Tax-Exempt
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 border border-teal-900/10 shadow-2xs">
              ✓ 100% Direct Care
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 border border-teal-900/10 shadow-2xs">
              ✓ JJ Act KA18CH0242
            </span>
          </div>

          {/* Toast Notification */}
          {addedNotification && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-900 text-white px-3.5 py-1.5 text-xs font-bold shadow-md animate-fadeIn">
              <span>🛒</span>
              <span>{addedNotification}</span>
              <Link href="/checkout" className="underline text-gold hover:text-white font-extrabold ml-1">
                Checkout →
              </Link>
            </div>
          )}
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
            All Tiers (6)
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
            const imgUrl = TIER_IMAGES[cat.id] || "/media/annadana-hall-hd.jpg";
            const currentSlug = TIER_SLUG_MAP[cat.id]?.[currentOptionId];
            const inCartQty = currentSlug ? qty[currentSlug] || 0 : 0;
            const currentPill = meta?.pillOptions.find((p) => p.id === currentOptionId);

            return (
              <div
                key={cat.id}
                id={`tier-card-${cat.id}`}
                className={`group relative flex flex-col justify-between rounded-3xl bg-white p-4 sm:p-5 transition-all duration-200 border shadow-xs hover:shadow-md ${
                  isFlagship
                    ? "border-amber-400 ring-2 ring-amber-400/20"
                    : "border-teal-900/10 hover:border-teal-900/25"
                }`}
              >
                {/* Popular Flagship Badge */}
                {isFlagship && (
                  <div className="absolute -top-2.5 right-4 rounded-full bg-saffron px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-xs z-10">
                    ★ Most Critical
                  </div>
                )}

                <div>
                  {/* Photo Header */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-teal-900 mb-3 shadow-2xs">
                    <Image
                      src={imgUrl}
                      alt={cat.title}
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
                      <h3 className="font-display text-lg font-bold text-teal-950 leading-tight">
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
                              ? "bg-teal-900 text-white font-extrabold shadow-2xs"
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

                  {/* Impact Summary Line */}
                  <div className="flex items-center justify-between px-1 py-1 text-xs">
                    <span className="font-display text-lg font-extrabold text-teal-950">
                      {formatINR(currentOption.amount)}
                    </span>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-900/10">
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
                      className="focus-ring tap-scale flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-saffron py-2.5 px-3 text-xs font-black uppercase tracking-wider text-white shadow-xs hover:bg-saffron-dark transition cursor-pointer"
                    >
                      <span>Sponsor {formatINR(currentOption.amount)} 💝</span>
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
                    <span>✓ 80G Tax Benefit Included</span>
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
                    <p className="font-bold text-white text-xs truncate">{OFFICIAL_FORM_META.societyName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div className="rounded-lg bg-black/30 p-2 border border-white/10">
                      <span className="text-[9px] text-amber-300 uppercase block font-bold">Axis Bank A/c</span>
                      <p className="font-mono font-bold text-amber-200 text-xs tracking-wider select-all">913020019616990</p>
                    </div>
                    <div className="rounded-lg bg-black/30 p-2 border border-white/10">
                      <span className="text-[9px] text-amber-300 uppercase block font-bold">IFSC Code</span>
                      <p className="font-mono font-bold text-amber-200 text-xs tracking-wider select-all">UTIB0000102</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="w-full text-center py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-[11px] font-bold text-amber-200 transition cursor-pointer"
                  >
                    {copiedBank ? "✓ Bank Details Copied!" : "📋 Copy Bank Details"}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                <button
                  type="button"
                  onClick={() => openBottomDonate(2500, "food_one_day")}
                  className="focus-ring tap-scale flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400 py-2.5 text-xs font-black uppercase tracking-wider text-teal-950 shadow-xs hover:bg-amber-300 transition cursor-pointer"
                >
                  <span>Quick Custom Donate ⚡</span>
                </button>

                <div className="text-center text-[10px]">
                  <Link
                    href="/supporter-form"
                    className="font-bold text-amber-300 hover:text-white underline underline-offset-2"
                  >
                    Download Official Supporter Form →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
