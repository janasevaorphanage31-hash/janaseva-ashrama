"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

const URGENT_PRESETS = [
  { amount: 100, label: "₹100", sublabel: "1 Meal" },
  { amount: 500, label: "₹500", sublabel: "5 Meals" },
  { amount: 2500, label: "₹2,500", sublabel: "Full Dinner", isPopular: true },
  { amount: 4500, label: "₹4,500", sublabel: "Full Day" },
];

export function UrgentDonationBar() {
  const pathname = usePathname();
  const { openBottomDonate, isBottomDonateOpen, count } = useCart();
  const [minimized, setMinimized] = useState(false);
  const [activePreset, setActivePreset] = useState<number>(2500);

  // Auto-hide on admin, checkout, or when bottom donation drawer is open
  if (pathname?.startsWith("/admin") || pathname === "/checkout" || isBottomDonateOpen) {
    return null;
  }

  // If user already has items in giving basket, yield space to the basket banner on mobile
  const isBasketActive = count > 0;

  const handlePresetClick = (amount: number) => {
    setActivePreset(amount);
    track("urgent_bar_preset_select", { amount });
    openBottomDonate(amount, amount === 4500 || amount === 2500 ? "food_one_day" : undefined);
  };

  const handleDonateNow = () => {
    track("urgent_bar_donate_click", { amount: activePreset });
    openBottomDonate(activePreset, activePreset === 4500 || activePreset === 2500 ? "food_one_day" : undefined);
  };

  if (minimized) {
    return (
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 z-40 md:bottom-5 md:left-6 no-print">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          aria-label="Expand urgent donation bar"
          className="focus-ring tap-scale group flex items-center gap-2 rounded-2xl bg-gradient-to-r from-saffron to-amber-600 px-3.5 py-2.5 text-xs font-black text-white shadow-lg ring-2 ring-white/60 hover:scale-105 active:scale-95 cursor-pointer animate-heartbeat"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-200"></span>
          </span>
          <span className="uppercase tracking-wider">🔴 URGENT NEED · 25 BOYS</span>
          <span className="text-[10px] text-amber-200">▲</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Urgent Donation Action Bar"
      className={`fixed z-40 no-print transition-all duration-300 ${
        isBasketActive
          ? "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-5"
          : "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] md:bottom-5"
      } inset-x-2 sm:inset-x-4 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl md:w-full`}
    >
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-teal-950/95 text-white p-3 sm:p-3.5 shadow-2xl ring-1 ring-amber-400/40 backdrop-blur-md border border-white/10">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-saffron/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          {/* Urgency Status Indicator */}
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-90"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="rounded-md bg-red-500/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-300">
                  LIVE URGENT NEED
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white truncate">
                  Tonight&apos;s Dinner for 25 Resident Boys
                </span>
              </div>
              <p className="text-[10px] text-white/70 hidden sm:block truncate mt-0.5">
                Rice, sambar &amp; fresh milk · ₹2,500 fills full dining hall · 80G Tax Exemption
              </p>
            </div>

            {/* Minimize button */}
            <button
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize urgent donation bar"
              className="sm:hidden text-white/60 hover:text-white p-1 text-xs shrink-0"
              title="Minimize"
            >
              ✕
            </button>
          </div>

          {/* Quick Presets & Pulsing Donate Button */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0">
            {/* Amount Presets */}
            <div className="flex items-center gap-1 shrink-0">
              {URGENT_PRESETS.map((p) => {
                const isSelected = activePreset === p.amount;
                return (
                  <button
                    key={p.amount}
                    type="button"
                    onClick={() => handlePresetClick(p.amount)}
                    className={`focus-ring tap-scale rounded-xl px-2 py-1.5 text-center transition cursor-pointer border ${
                      isSelected
                        ? "bg-amber-400 text-teal-950 font-black border-amber-300 shadow-sm"
                        : "bg-white/10 text-white/90 hover:bg-white/20 font-bold border-white/10"
                    }`}
                  >
                    <span className="block text-[11px] sm:text-xs leading-none">{p.label}</span>
                    <span className="hidden xs:block text-[8px] sm:text-[9px] opacity-75 leading-tight mt-0.5">
                      {p.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pulsing Blinking Donate Button */}
            <button
              type="button"
              onClick={handleDonateNow}
              className="focus-ring tap-scale group flex items-center justify-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-saffron to-amber-600 px-3.5 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg hover:from-saffron-dark hover:to-amber-700 transition active:scale-95 cursor-pointer animate-heartbeat whitespace-nowrap shrink-0"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200"></span>
              </span>
              <span>DONATE NOW 💝</span>
              <span className="hidden md:inline text-[10px] opacity-90 font-normal">({formatINR(activePreset)})</span>
            </button>

            {/* Desktop Close/Minimize */}
            <button
              type="button"
              onClick={() => setMinimized(true)}
              aria-label="Minimize bar"
              className="hidden sm:block text-white/50 hover:text-white p-1 text-xs shrink-0 ml-1"
              title="Minimize urgent banner"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
