"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatINR, SITE } from "@/lib/site";

export function DonationStrategySuite() {
  const router = useRouter();
  const { setQty, setCustom } = useCart();

  const [activeStrategy, setActiveStrategy] = useState<"bundle" | "tax" | "occasions" | "monthly" | "daily">("bundle");
  const [taxDonationAmount, setTaxDonationAmount] = useState<number>(10000);
  const [taxSlab, setTaxSlab] = useState<number>(30); // 30% slab default
  const [bundleAdded, setBundleAdded] = useState(false);

  // 80G Tax Calculation: In India, 80G deduction allows 50% of the donated amount to be deducted from taxable income.
  // Tax saved = (Donation * 50%) * (Tax Slab %) = Donation * 0.5 * (taxSlab / 100)
  const taxDeductionEligible = taxDonationAmount * 0.5;
  const taxSaved = Math.round(taxDeductionEligible * (taxSlab / 100));
  const effectiveCost = Math.max(0, taxDonationAmount - taxSaved);

  const handleAddBundle = () => {
    // Bundle: 10 Meals (₹1,000) + 1 School Kit (₹250) + 1 Health Care (₹500) + 1 Bedding (₹600) + 1 Fruit Basket (₹150) = ₹2,500
    setQty("meal", 10);
    setQty("school-kit", 1);
    setQty("health", 1);
    setQty("bedding", 1);
    setQty("fruits", 1);
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 3000);
  };

  const handleDonateTaxAmount = () => {
    setCustom(taxDonationAmount);
    router.push("/checkout");
  };

  const handleOccasionSelect = (itemSlug: string, count: number = 1) => {
    setQty(itemSlug, count);
    router.push("/checkout");
  };

  return (
    <div className="mt-10 rounded-3xl bg-white p-5 sm:p-7 md:p-8 shadow-sm ring-1 ring-teal-900/10 border border-teal-900/5">
      {/* Header with Title */}
      <div className="border-b border-teal-900/10 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-saffron/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-saffron-dark">
            Strategic Giving Suite
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
            ✓ Form 10AC 80G Approved
          </span>
        </div>
        <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-teal-950">
          More Ways to Maximize Your Giving Impact
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-teal-950/70">
          Choose from psychological anchor bundles, 80G tax benefit calculation, sacred life celebrations, and monthly sustainer pledges.
        </p>
      </div>

      {/* Strategy Navigation Tabs */}
      <div className="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
        {[
          { id: "bundle", label: "⚡ Child Sponsor Bundle", icon: "🎁" },
          { id: "tax", label: "🧮 80G Tax Savings Calculator", icon: "💰" },
          { id: "occasions", label: "🎂 Milestone & Memorial Seva", icon: "🕊️" },
          { id: "monthly", label: "🔄 Seva Circle Monthly Pledge", icon: "🤝" },
          { id: "daily", label: "☕ Daily Micro-Seva (₹33/day)", icon: "🌱" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStrategy(tab.id as any)}
            className={`focus-ring rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeStrategy === tab.id
                ? "bg-teal-900 text-white shadow-sm"
                : "bg-cream text-teal-900/80 hover:bg-sand hover:text-teal-950"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="mt-5 pt-1">
        {/* Panel 1: Complete Child Care Bundle */}
        {activeStrategy === "bundle" && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-teal-50/40 p-5 sm:p-6 border border-teal-900/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="inline-block rounded-md bg-saffron px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  Most Popular All-Round Care
                </span>
                <h4 className="font-display text-lg sm:text-xl font-bold text-teal-950">
                  The Complete 1-Month Child Sponsor Bundle ({formatINR(2500)})
                </h4>
                <p className="text-xs sm:text-sm text-teal-950/75 leading-relaxed">
                  Instead of picking single items, provide comprehensive, dignified foster care for 1 child for an entire month. This pre-curated package covers:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center shadow-2xs">
                    <span className="text-lg">🍲</span>
                    <p className="font-bold text-teal-900 mt-0.5">10 Hot Meals</p>
                    <p className="text-[10px] text-teal-950/60">Annadana (₹1,000)</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center shadow-2xs">
                    <span className="text-lg">🎒</span>
                    <p className="font-bold text-teal-900 mt-0.5">Vidya Kit</p>
                    <p className="text-[10px] text-teal-950/60">Books &amp; Bag (₹250)</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center shadow-2xs">
                    <span className="text-lg">🩺</span>
                    <p className="font-bold text-teal-900 mt-0.5">Healthcare</p>
                    <p className="text-[10px] text-teal-950/60">Doctor Check (₹500)</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center shadow-2xs">
                    <span className="text-lg">🛌</span>
                    <p className="font-bold text-teal-900 mt-0.5">Bedding &amp; Care</p>
                    <p className="text-[10px] text-teal-950/60">Care + Fruits (₹750)</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0">
                <div className="text-center lg:text-right">
                  <span className="text-xs text-teal-950/60 font-semibold">Total Bundle Amount</span>
                  <p className="font-display text-2xl sm:text-3xl font-extrabold text-teal-900">
                    {formatINR(2500)}
                  </p>
                  <span className="text-[11px] font-bold text-emerald-800">
                    ✓ 80G Tax Deductible
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddBundle}
                  className={`focus-ring w-full sm:w-auto rounded-xl px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95 ${
                    bundleAdded
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-saffron hover:bg-saffron-dark"
                  }`}
                >
                  {bundleAdded ? "✓ Added to Basket!" : "⚡ 1-Tap Add Bundle (₹2,500)"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: 80G Tax Calculator */}
        {activeStrategy === "tax" && (
          <div className="rounded-2xl bg-teal-50/70 p-5 sm:p-6 border border-teal-900/10">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-center">
              <div className="space-y-4">
                <div>
                  <span className="rounded-md bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-900 uppercase">
                    Tax Relief Tool
                  </span>
                  <h4 className="mt-1 font-display text-lg sm:text-xl font-bold text-teal-950">
                    Calculate Your Income Tax Savings (Section 80G)
                  </h4>
                  <p className="text-xs sm:text-sm text-teal-950/70">
                    Under Indian Income Tax Act Sec 80G(5)(iv), donations to Janaseva Ashrama (URN: {SITE.urn}) qualify for 50% tax deductions.
                  </p>
                </div>

                {/* Amount Slider & Presets */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-teal-900 mb-1.5">
                    <span>Choose Donation Amount:</span>
                    <span className="text-base text-saffron-dark font-display">{formatINR(taxDonationAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={taxDonationAmount}
                    onChange={(e) => setTaxDonationAmount(Number(e.target.value))}
                    className="w-full accent-saffron h-2 bg-teal-200/60 rounded-lg cursor-pointer"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[2500, 5000, 10000, 25000, 50000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTaxDonationAmount(amt)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          taxDonationAmount === amt
                            ? "bg-teal-900 text-white"
                            : "bg-white text-teal-900 border border-teal-900/10 hover:bg-cream"
                        }`}
                      >
                        {formatINR(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax Slab Picker */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-teal-900">Your Income Tax Slab:</span>
                  {[
                    { label: "30% Slab", val: 30 },
                    { label: "20% Slab", val: 20 },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setTaxSlab(s.val)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        taxSlab === s.val
                          ? "bg-teal-900 text-white font-bold"
                          : "bg-white text-teal-900 border border-teal-900/10"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Math Summary Card */}
              <div className="rounded-2xl bg-white p-5 border border-teal-900/15 shadow-sm space-y-3">
                <div className="flex justify-between text-xs text-teal-950/70 border-b border-teal-900/5 pb-2">
                  <span>Donation Contribution:</span>
                  <span className="font-bold text-teal-950">{formatINR(taxDonationAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-800 font-semibold border-b border-teal-900/5 pb-2">
                  <span>Approx Tax You Save (80G):</span>
                  <span>− {formatINR(taxSaved)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900/70">
                      Real Net Cost to You:
                    </span>
                    <p className="text-[10px] text-teal-950/50">After Form 10AC tax benefit</p>
                  </div>
                  <span className="font-display text-2xl font-black text-teal-900">
                    {formatINR(effectiveCost)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDonateTaxAmount}
                  className="focus-ring w-full mt-2 rounded-xl bg-saffron px-4 py-3 text-center text-xs sm:text-sm font-bold text-white shadow hover:bg-saffron-dark transition active:scale-95"
                >
                  Donate {formatINR(taxDonationAmount)} &amp; Claim 80G Receipt →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Panel 3: Milestone & Memorial Dedications */}
        {activeStrategy === "occasions" && (
          <div className="rounded-2xl bg-cream p-5 sm:p-6 border border-teal-900/10">
            <div className="max-w-xl">
              <span className="rounded-md bg-saffron/15 px-2.5 py-0.5 text-[10px] font-black text-saffron-dark uppercase">
                Sacred Life Moments
              </span>
              <h4 className="mt-1 font-display text-lg sm:text-xl font-bold text-teal-950">
                Celebrate or Remember Loved Ones with 25 Children
              </h4>
              <p className="text-xs sm:text-sm text-teal-950/75 leading-relaxed">
                Transform personal birthdays, anniversaries, or parents&apos; memorial days (Smrithi Seva) into an unforgettable celebration. Children sing and offer prayers in your family&apos;s honour, with full WhatsApp video proof delivered to you.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col justify-between rounded-2xl bg-white p-4 border border-teal-900/10 shadow-2xs">
                <div>
                  <span className="text-2xl">🎂</span>
                  <h5 className="font-bold text-teal-950 text-sm mt-1">Grand Birthday Feast</h5>
                  <p className="text-xs text-teal-950/65 mt-0.5">
                    Festive lunch with sweet Payasam/Laddoo for all 25 children on your special day.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-teal-900/5 flex items-center justify-between">
                  <span className="font-display font-bold text-teal-900">{formatINR(1500)}</span>
                  <button
                    type="button"
                    onClick={() => handleOccasionSelect("birthday-feast")}
                    className="rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white hover:bg-saffron-dark"
                  >
                    Sponsor Feast
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-white p-4 border border-teal-900/10 shadow-2xs">
                <div>
                  <span className="text-2xl">🕊️</span>
                  <h5 className="font-bold text-teal-950 text-sm mt-1">Sacred Remembrance Meal</h5>
                  <p className="text-xs text-teal-950/65 mt-0.5">
                    Honour departed parents or elders (Smrithi Seva) by feeding 10 children with silent prayers.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-teal-900/5 flex items-center justify-between">
                  <span className="font-display font-bold text-teal-900">{formatINR(1000)}</span>
                  <button
                    type="button"
                    onClick={() => handleOccasionSelect("memorial-meal")}
                    className="rounded-lg bg-teal-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-950"
                  >
                    Smrithi Seva
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-2xl bg-white p-4 border border-teal-900/10 shadow-2xs">
                <div>
                  <span className="text-2xl">🍎</span>
                  <h5 className="font-bold text-teal-950 text-sm mt-1">Fruit &amp; Milk Basket</h5>
                  <p className="text-xs text-teal-950/65 mt-0.5">
                    Provide fresh orchard fruits and morning dairy milk for immunity and smiles.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-teal-900/5 flex items-center justify-between">
                  <span className="font-display font-bold text-teal-900">{formatINR(150)}</span>
                  <button
                    type="button"
                    onClick={() => handleOccasionSelect("fruits")}
                    className="rounded-lg bg-teal-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-950"
                  >
                    Sponsor Fruits
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 4: Monthly Sustainer Pledge */}
        {activeStrategy === "monthly" && (
          <div className="rounded-2xl bg-teal-50/70 p-5 sm:p-6 border border-teal-900/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="rounded-md bg-teal-900 px-2.5 py-0.5 text-[10px] font-black text-white uppercase">
                  Seva Circle Sustainer
                </span>
                <h4 className="font-display text-lg sm:text-xl font-bold text-teal-950">
                  Become a Monthly Sustainer &amp; Guarantee Year-Round Care
                </h4>
                <p className="text-xs sm:text-sm text-teal-950/75 leading-relaxed">
                  Sporadic donations leave seasonal gaps during monsoon or exams. By pledging a steady monthly gift, you guarantee children never sleep hungry and always have textbooks ready.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center">
                    <p className="font-bold text-teal-900 text-sm">₹250 / mo</p>
                    <p className="text-[10px] text-teal-950/60 mt-0.5">₹8 / day · Books &amp; Study</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center ring-2 ring-saffron">
                    <p className="font-bold text-teal-900 text-sm">₹500 / mo</p>
                    <p className="text-[10px] text-teal-950/60 mt-0.5">₹16 / day · 60 Hot Meals/yr</p>
                  </div>
                  <div className="rounded-xl bg-white p-2.5 border border-teal-900/10 text-center">
                    <p className="font-bold text-teal-900 text-sm">₹1,000 / mo</p>
                    <p className="text-[10px] text-teal-950/60 mt-0.5">₹33 / day · Full Nutrition</p>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-3">
                <Link
                  href="/recurring-giving"
                  className="focus-ring w-full sm:w-auto rounded-xl bg-teal-900 px-6 py-3.5 text-center text-xs sm:text-sm font-bold text-white shadow-md hover:bg-teal-950 transition active:scale-95"
                >
                  Pledge Monthly Support →
                </Link>
                <p className="text-[11px] text-teal-950/60 text-center">
                  Zero commitment · Cancel or pause anytime · Form 10AC ledger
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Panel 5: Daily Micro-Seva */}
        {activeStrategy === "daily" && (
          <div className="rounded-2xl bg-gradient-to-br from-amber-50/50 to-white p-5 sm:p-6 border border-teal-900/10">
            <div className="max-w-xl">
              <span className="rounded-md bg-saffron/15 px-2.5 py-0.5 text-[10px] font-black text-saffron-dark uppercase">
                Temporal Micro-Giving
              </span>
              <h4 className="mt-1 font-display text-lg sm:text-xl font-bold text-teal-950">
                Less than a Cup of Chai a Day (₹33 / Day)
              </h4>
              <p className="text-xs sm:text-sm text-teal-950/75 leading-relaxed">
                Large donations are not required to transform an orphaned child&apos;s life. Micro-giving eliminates friction and allows students, interns, and young professionals to share everyday blessings.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { days: "3 Days Meals", amt: 100, label: "Feed 1 child hot food" },
                { days: "1 Week Vidya", amt: 250, label: "School stationery & bag" },
                { days: "2 Weeks Care", amt: 500, label: "Meals + Health checkup" },
                { days: "1 Month Care", amt: 1000, label: "Continuous sustenance" },
              ].map((m) => (
                <button
                  key={m.amt}
                  type="button"
                  onClick={() => {
                    setCustom(m.amt);
                    router.push("/checkout");
                  }}
                  className="rounded-xl bg-white p-3 border border-teal-900/10 text-left hover:border-saffron hover:shadow-xs transition active:scale-95 group"
                >
                  <span className="text-[10px] font-bold text-saffron-dark uppercase">{m.days}</span>
                  <p className="font-display text-base sm:text-lg font-bold text-teal-950 group-hover:text-saffron-dark">
                    {formatINR(m.amt)}
                  </p>
                  <p className="text-[10px] text-teal-950/60 mt-0.5">{m.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Urgent Kitchen Goal Tracker (Goal Gradient Psychology) */}
      <div className="mt-6 rounded-2xl bg-amber-50/70 p-4 border border-amber-900/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-xl text-amber-900">
            ⏳
          </span>
          <div>
            <p className="text-xs font-bold text-amber-950">
              Today&apos;s Annadana Goal: 20 of 25 Meals Sponsored (80%)
            </p>
            <div className="mt-1.5 h-2 w-48 sm:w-64 rounded-full bg-amber-200/70 overflow-hidden">
              <div className="h-full bg-amber-600 rounded-full" style={{ width: "80%" }} />
            </div>
            <p className="mt-1 text-[10px] text-amber-900/70">
              Only 5 meals needed to complete dinner coverage for all 25 children tonight.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setQty("meal", 5);
            router.push("/checkout");
          }}
          className="focus-ring shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs transition active:scale-95"
        >
          Sponsor Remaining 10 Meals ({formatINR(1000)}) →
        </button>
      </div>

      {/* Trust & Transparency Badges */}
      <div className="mt-5 pt-4 border-t border-teal-900/5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] text-teal-950/70">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-emerald-700 font-bold">✓</span>
          <span>100% Direct Pass-Through</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-emerald-700 font-bold">✓</span>
          <span>Form 10AC 80G Tax Exemption</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-emerald-700 font-bold">✓</span>
          <span>WhatsApp Video Proof</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-emerald-700 font-bold">✓</span>
          <span>Bank-Grade 256-Bit SSL</span>
        </div>
      </div>
    </div>
  );
}
