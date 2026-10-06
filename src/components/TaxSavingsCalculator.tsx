"use client";

import { useState } from "react";
import { formatINR, calculateTaxBenefit } from "@/lib/site";
import { useCart } from "./CartProvider";

const PRESETS = [1000, 2500, 5000, 10000, 25000, 50000];

export function TaxSavingsCalculator() {
  const [amount, setAmount] = useState<number>(5000);
  const [taxSlab, setTaxSlab] = useState<number>(30);
  const cart = useCart();
  const [added, setAdded] = useState(false);

  const benefit = calculateTaxBenefit(amount, taxSlab);

  const handleApplyDonation = () => {
    if (amount <= 0) return;
    cart.setCustom((cart.custom || 0) + amount);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-teal-900/10 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-900/10 pb-4">
        <div>
          <span className="rounded-lg bg-gold/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-950 border border-gold/40">
            Form 10AC Verified · URN: AABTJ7431MF20231 · PAN: AABTJ7431M
          </span>
          <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold text-teal-950">
            Section 80G Tax Exemption Calculator
          </h3>
          <p className="mt-1 text-xs text-teal-950/70">
            50% of your contribution is deductible from taxable income under Section 80G of the Indian Income Tax Act.
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            Save up to 15% - 15.6% Net
          </span>
        </div>
      </div>

      {/* Preset Amount Chips */}
      <div className="mt-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-2">
            Select or Enter Donation Amount:
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  amount === p
                    ? "bg-teal-950 text-white shadow"
                    : "bg-cream text-teal-950 hover:bg-sand border border-teal-900/10"
                }`}
              >
                {formatINR(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input and Tax Slab */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-teal-900/70 mb-1">
              Custom Amount (INR):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-bold text-teal-900/50">₹</span>
              <input
                type="number"
                min={100}
                step={100}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-teal-900/15 pl-8 pr-3 py-2 text-sm font-bold text-teal-950 focus:border-teal-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-teal-900/70 mb-1">
              Your Income Tax Slab:
            </label>
            <select
              value={taxSlab}
              onChange={(e) => setTaxSlab(Number(e.target.value))}
              className="w-full rounded-xl border border-teal-900/15 px-3 py-2 text-sm font-bold text-teal-950 bg-white focus:border-teal-900 focus:outline-none"
            >
              <option value={30}>30% Slab (Income above ₹10-15 Lakhs)</option>
              <option value={20}>20% Slab (Income ₹5-10 Lakhs)</option>
              <option value={10}>10% Slab (Lower Bracket)</option>
              <option value={0}>0% (Non-taxable / Student)</option>
            </select>
          </div>
        </div>

        {/* Mathematical Financial Breakdown Result */}
        <div className="rounded-2xl bg-cream p-4 sm:p-5 border border-teal-900/10 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-teal-950/70">Total Contribution:</span>
            <span className="font-bold text-teal-950 font-mono text-sm">{formatINR(benefit.donationAmount)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-teal-950/70">50% Section 80G Eligible Deduction:</span>
            <span className="font-bold text-teal-900 font-mono text-sm">{formatINR(benefit.eligibleDeduction)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-teal-950/70">Estimated Income Tax Saved ({benefit.taxBracketPercent}% Slab):</span>
            <span className="font-bold text-emerald-800 font-mono text-sm">{formatINR(benefit.estimatedTaxSavings)}</span>
          </div>

          <div className="border-t border-teal-900/10 pt-3 flex justify-between items-center">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-teal-900/60">
                Net Effective Cost to You:
              </span>
              <span className="text-[11px] text-teal-950/60">After verified 80G tax benefit</span>
            </div>
            <span className="font-display text-2xl font-bold text-teal-950 font-mono">
              {formatINR(benefit.effectiveCost)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-teal-950/60">
            Official 80G Receipt with unique receipt number will be issued instantly upon successful payment.
          </p>
          <button
            type="button"
            onClick={handleApplyDonation}
            className="w-full sm:w-auto rounded-xl bg-saffron px-6 py-3 font-bold text-white shadow-sm hover:bg-saffron-dark transition text-xs sm:text-sm active:scale-95 shrink-0"
          >
            {added ? "✓ Added to Impact Basket" : `Contribute ${formatINR(amount)} with 80G`}
          </button>
        </div>
      </div>
    </div>
  );
}
