"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

const URGENT_PRESETS = [
  { amount: 11, label: "₹11", sublabel: "Milk" },
  { amount: 51, label: "₹51", sublabel: "Breakfast" },
  { amount: 101, label: "₹101", sublabel: "Meal", isPopular: true },
  { amount: 501, label: "₹501", sublabel: "Arogya" },
  { amount: 2501, label: "₹2,501", sublabel: "Feast" },
];

export function UrgentDonationBar() {
  const pathname = usePathname();
  const { openBottomDonate, isBottomDonateOpen, count, total } = useCart();
  const [minimized, setMinimized] = useState(false);
  const [activePreset, setActivePreset] = useState<number>(101);

  // Auto-hide on admin, checkout, or when bottom donation drawer is open
  if (
    pathname?.startsWith("/admin") ||
    pathname === "/checkout" ||
    isBottomDonateOpen
  ) {
    return null;
  }

  const handlePresetClick = (amount: number) => {
    setActivePreset(amount);
    track("urgent_bar_preset_select", { amount });
    openBottomDonate(amount);
  };

  const handleDonateNow = () => {
    track("urgent_bar_donate_click", { amount: activePreset });
    openBottomDonate(activePreset);
  };

  // If minimized by user on mobile, show an unobtrusive floating badge
  if (minimized) {
    return (
      <aside
        aria-label="Reopen urgent donation bar"
        className="fixed z-50 no-print bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 right-3"
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="focus-ring tap-scale flex items-center gap-1.5 rounded-full bg-saffron text-white px-3.5 py-2 text-xs font-black shadow-xl ring-2 ring-white/40 cursor-pointer animate-heartbeat"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-200" />
          </span>
          <span>⚡ Feed 25 Boys (₹11+)</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Floating Urgent Donation Bar"
      className={`fixed z-40 no-print transition-all duration-300 ${
        total > 0
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-5 inset-x-2 sm:inset-x-4 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl md:w-full"
          : "hidden md:block md:bottom-5 md:left-1/2 md:-translate-x-1/2 md:max-w-4xl md:w-full"
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-teal-950/98 text-white p-2.5 sm:p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] ring-1 ring-amber-400/40 backdrop-blur-xl border border-white/15">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-saffron/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-amber-400/15 blur-2xl" />

        {/* CONDITION A: If items in basket, show Giving Basket + Checkout on Desktop / Mobile */}
        {total > 0 ? (
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-saffron text-xs font-black text-white shrink-0 shadow-md">
                {count}
              </span>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-amber-300 truncate">
                  Giving Basket: {formatINR(total)}
                </p>
                <p className="text-[10px] text-white/70 truncate hidden xs:block">
                  100% Direct Allocation to 25 Resident Boys · Form 10AC 80G Tax Exemption
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/checkout"
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-saffron to-amber-600 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-lg hover:brightness-110 transition active:scale-95"
              >
                <span>Checkout Now →</span>
              </Link>
              <button
                type="button"
                onClick={() => setMinimized(true)}
                aria-label="Minimize bar"
                className="text-white/60 hover:text-white p-1 text-xs shrink-0 cursor-pointer"
                title="Minimize"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          /* CONDITION B: Zero basket items, show Auspicious Shagun Presets + Donate CTA */
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            {/* Urgency Status Indicator */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-90"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-red-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-300">
                      LIVE NEED
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      Feed 25 Resident Boys
                    </span>
                  </div>
                  <p className="text-[10px] text-white/70 hidden lg:block truncate">
                    Tonight&apos;s meals · Form 10AC 80G Tax Free
                  </p>
                </div>
              </div>

              {/* Mobile Dismiss/Minimize button */}
              <button
                type="button"
                onClick={() => setMinimized(true)}
                aria-label="Minimize urgent donation bar"
                className="sm:hidden text-white/60 hover:text-white p-1 text-xs shrink-0 cursor-pointer"
                title="Minimize"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets & Pulsing Donate Button */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2.5 w-full sm:w-auto shrink-0">
              {/* Amount Presets with Official 5 Tiers */}
              <div className="flex items-center gap-1 shrink-0 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => openBottomDonate(4500, "food_one_day")}
                  className="focus-ring tap-scale rounded-xl px-2 sm:px-2.5 py-1.5 text-center transition cursor-pointer border bg-amber-500/20 text-amber-300 hover:bg-amber-500/35 border-amber-400/50 shadow-xs"
                  title="Official 5 Support Tiers"
                >
                  <span className="block text-[11px] sm:text-xs leading-none font-black">🏛️ 5 Tiers</span>
                  <span className="hidden sm:block text-[8px] opacity-90 leading-tight mt-0.5 text-amber-200">
                    Official
                  </span>
                </button>
                {URGENT_PRESETS.map((p) => {
                  const isSelected = activePreset === p.amount;
                  return (
                    <button
                      key={p.amount}
                      type="button"
                      onClick={() => handlePresetClick(p.amount)}
                      className={`focus-ring tap-scale rounded-xl px-2 sm:px-2.5 py-1.5 text-center transition cursor-pointer border ${
                        isSelected
                          ? "bg-amber-400 text-teal-950 font-black border-amber-300 shadow-sm"
                          : "bg-white/10 text-white/90 hover:bg-white/20 font-bold border-white/10"
                      }`}
                    >
                      <span className="block text-[11px] sm:text-xs leading-none">{p.label}</span>
                      <span className="hidden sm:block text-[8px] opacity-75 leading-tight mt-0.5">
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
                <span>DONATE 💝</span>
                <span className="hidden sm:inline text-[10px] opacity-90 font-normal">({formatINR(activePreset)})</span>
              </button>

              {/* Desktop Dismiss/Minimize */}
              <button
                type="button"
                onClick={() => setMinimized(true)}
                aria-label="Minimize bar"
                className="hidden sm:block text-white/50 hover:text-white p-1 text-xs shrink-0 ml-1 cursor-pointer"
                title="Minimize floating banner"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
