"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import { SUPPORTER_CATEGORIES, OFFICIAL_FORM_META } from "@/lib/supporter-form";
import { useCart } from "../CartProvider";
import { track } from "@/lib/track";

export function OfficialSupportTiersSection() {
  const { openBottomDonate } = useCart();

  // State mapping each category ID to its currently selected option ID
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({
    food_one_day: "all_children", // default ₹4,500
    food_one_month: "4_children", // default ₹6,000
    cloth_one_set: "8_children",  // default ₹4,800
    education_one_month: "12_children", // default ₹9,600
    education_one_year: "1_child", // default ₹9,600
  });

  const handleSelectOption = (categoryId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [categoryId]: optionId }));
    track("tier_pricing_option_toggle", { categoryId, optionId });
  };

  const handleSponsorTier = (categoryId: string) => {
    const cat = SUPPORTER_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    const currentOptionId = selectedOptions[categoryId] || cat.options[0].id;
    const option = cat.options.find((o) => o.id === currentOptionId) || cat.options[0];

    track("tier_sponsor_click", {
      categoryId,
      optionId: option.id,
      amount: option.amount,
    });

    // Open bottom donation drawer with selected tier and amount
    openBottomDonate(option.amount, categoryId);
  };

  return (
    <section
      id="official-tiers"
      aria-label="Official Support Tiers and Pricing"
      className="scroll-mt-16 w-full max-w-full overflow-hidden bg-sand/35 py-12 md:py-20 border-b border-teal-900/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-saffron/15 border border-saffron/30 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-saffron-dark mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-saffron opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron"></span>
            </span>
            <span>Official Trust Sponsorship Program · ಅಧಿಕೃತ ಸೇವಾ ಯೋಜನೆಗಳು</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-teal-950 leading-tight">
            Exact 5 Official Support Tiers &amp; Pricing
          </h2>

          <p className="mt-3 text-sm sm:text-base text-teal-950/80 leading-relaxed max-w-2xl mx-auto">
            Governed by <span className="font-bold text-teal-900">{OFFICIAL_FORM_META.societyName}</span> (Juvenile Justice Act Form 28: KA18CH0242).
            Select a verified sponsorship tier to support the daily nourishment, clothing, and schooling of all 25 boys.
          </p>

          {/* Trust Pillars Ribbon */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-bold text-teal-900">
            <span className="rounded-lg bg-white/80 px-3 py-1 border border-teal-900/10 shadow-2xs">
              ✓ Form 10AC 80G Tax Exemption
            </span>
            <span className="rounded-lg bg-white/80 px-3 py-1 border border-teal-900/10 shadow-2xs">
              ✓ 100% Direct Allocation to 25 Boys
            </span>
            <span className="rounded-lg bg-white/80 px-3 py-1 border border-teal-900/10 shadow-2xs">
              ✓ Banashankari Axis Bank Direct Transfer
            </span>
          </div>
        </div>

        {/* 5 Official Support Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7 items-stretch">
          {SUPPORTER_CATEGORIES.map((cat, idx) => {
            const currentOptionId = selectedOptions[cat.id] || cat.options[0].id;
            const currentOption = cat.options.find((o) => o.id === currentOptionId) || cat.options[0];
            const isFlagship = cat.id === "food_one_day"; // Tier 1 Daily Annadana Flagship

            return (
              <div
                key={cat.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:shadow-xl ${
                  isFlagship
                    ? "bg-gradient-to-b from-white via-white to-amber-50/50 border-2 border-saffron shadow-lg ring-2 ring-saffron/20 lg:scale-[1.02]"
                    : "bg-white border border-teal-900/15 shadow-sm hover:border-teal-900/30"
                }`}
              >
                {/* Popular Flagship Ribbon */}
                {isFlagship && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-saffron px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md">
                    ★ Most Critical Daily Need
                  </div>
                )}

                <div>
                  {/* Top Metadata */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-teal-900/10">
                    <span className="rounded-lg bg-teal-950/10 px-2.5 py-0.5 text-xs font-black text-teal-900">
                      Tier 0{cat.index}
                    </span>
                    <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                  </div>

                  {/* Title & Kannada */}
                  <div className="mt-3">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-teal-900 leading-tight">
                      {cat.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-saffron-dark mt-0.5">
                      {cat.kannadaTitle}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="mt-3 text-xs sm:text-sm text-teal-950/75 leading-relaxed">
                    {cat.desc}
                  </p>

                  {/* Pricing Selector Tabs */}
                  <div className="mt-5 space-y-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-teal-950/60">
                      Select Pricing Option:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-sand/40 border border-teal-900/10">
                      {cat.options.map((opt) => {
                        const isSelected = currentOption.id === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(cat.id, opt.id)}
                            className={`py-2 px-1 rounded-xl text-center transition cursor-pointer ${
                              isSelected
                                ? "bg-teal-900 text-white font-extrabold shadow-sm"
                                : "text-teal-950/80 hover:bg-white/80 font-bold"
                            }`}
                          >
                            <span className="block text-xs sm:text-sm">
                              {formatINR(opt.amount)}
                            </span>
                            <span className="block text-[9px] uppercase tracking-tight opacity-75 truncate">
                              {opt.id.replace(/_/g, " ")}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Selected Option Breakdown */}
                  <div className="mt-4 rounded-2xl bg-teal-50/70 p-3.5 border border-teal-900/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-900">
                        {currentOption.label}
                      </span>
                      <span className="font-display text-lg font-black text-saffron-dark">
                        {formatINR(currentOption.amount)}
                      </span>
                    </div>
                    {currentOption.subLabel && (
                      <p className="text-[11px] text-teal-950/70 mt-1">
                        Coverage: <span className="font-semibold text-teal-900">{currentOption.subLabel}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Card CTA Actions */}
                <div className="mt-6 pt-4 border-t border-teal-900/10 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleSponsorTier(cat.id)}
                    className="focus-ring tap-scale group flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-md hover:bg-saffron-dark transition-all cursor-pointer animate-heartbeat"
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-200"></span>
                    </span>
                    <span>Sponsor This Tier ({formatINR(currentOption.amount)}) 💝</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-teal-950/70 px-1">
                    <span className="flex items-center gap-1">
                      <span className="text-emerald-700 font-bold">✓</span> 80G Receipt
                    </span>
                    <Link
                      href="/supporter-form"
                      className="font-bold text-teal-900 underline hover:text-saffron-dark"
                    >
                      Supporter Form →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 6th Card: Custom Supporter Card & Direct Axis Bank Transfer */}
          <div className="flex flex-col justify-between rounded-3xl bg-teal-950 text-white p-6 sm:p-7 shadow-xl border border-amber-400/30">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <span className="rounded-lg bg-amber-400/20 px-2.5 py-0.5 text-xs font-black text-amber-300">
                  Custom &amp; Bank Transfer
                </span>
                <span className="text-2xl" aria-hidden="true">🏦</span>
              </div>

              <h3 className="mt-3 font-display text-xl sm:text-2xl font-bold leading-tight">
                Direct Axis Bank Annadana
              </h3>
              <p className="text-xs text-amber-300 font-medium mt-0.5">
                ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ ವಿವರಗಳು
              </p>

              <p className="mt-3 text-xs sm:text-sm text-white/80 leading-relaxed">
                Prefer to donate directly without platform gateways? Transfer directly into our official Axis Bank society account with 0% intermediate fees.
              </p>

              <div className="mt-4 rounded-2xl bg-white/10 p-4 border border-white/15 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-white/60 uppercase block">Account Holder</span>
                  <p className="font-bold text-white text-xs">{OFFICIAL_FORM_META.societyName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-white/60 uppercase block">Account No</span>
                    <p className="font-mono font-bold text-amber-300 text-sm">913020019616990</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/60 uppercase block">IFSC Code</span>
                    <p className="font-mono font-bold text-amber-300 text-sm">UTIB0000102</p>
                  </div>
                </div>
                <div className="pt-1 text-[11px] text-white/70">
                  Bank: Axis Bank · Branch: Banashankari, Bengaluru
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/15 space-y-2.5">
              <button
                type="button"
                onClick={() => openBottomDonate(2500, "food_one_day")}
                className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-teal-950 shadow-md hover:bg-amber-300 transition-all cursor-pointer"
              >
                <span>Quick Custom Donate ⚡</span>
              </button>

              <div className="text-center">
                <Link
                  href="/supporter-form"
                  className="text-xs font-bold text-amber-300 hover:text-white underline underline-offset-2"
                >
                  Download Official Printable Supporter Form →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
