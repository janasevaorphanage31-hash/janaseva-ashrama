"use client";

import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

export function BlinkingDonationFloatingButton() {
  const pathname = usePathname();
  const { openBottomDonate, isBottomDonateOpen } = useCart();

  // Hide on admin and checkout pages
  if (pathname?.startsWith("/admin") || pathname === "/checkout" || isBottomDonateOpen) {
    return null;
  }

  const handleClick = () => {
    track("floating_blinking_donate_click", { page: pathname });
    openBottomDonate(4500, "food_one_day");
  };

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 z-40 md:bottom-6 md:left-6 no-print">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Open donation options for 25 boys"
        className="focus-ring tap-scale group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-saffron to-amber-600 px-4 py-3 text-xs sm:text-sm font-black text-white shadow-[0_8px_30px_rgba(217,121,36,0.5)] ring-2 ring-white/60 border border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer animate-heartbeat"
      >
        {/* Blinking Pulse Beacon */}
        <span className="relative flex h-3.5 w-3.5 shrink-0">
          <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-200"></span>
        </span>

        {/* Text */}
        <span className="flex items-center gap-1.5 uppercase tracking-wider drop-shadow-sm">
          <span>💝 DONATE NOW</span>
          <span className="hidden sm:inline opacity-90 text-[11px] font-bold">· 25 BOYS</span>
        </span>

        <span className="rounded-lg bg-teal-950/25 px-1.5 py-0.5 text-[10px] font-black text-amber-100">
          ⚡ 80G
        </span>
      </button>
    </div>
  );
}

/**
 * Reusable Blinking Donate Trigger for inline impact sections and cards.
 * Clicking it immediately triggers the Bottom Donation Drawer with optional pre-filled amount.
 */
export function BlinkingDonateTrigger({
  amount,
  tierId,
  label = "DONATE NOW 💝",
  sublabel,
  className = "",
  size = "md",
}: {
  amount?: number;
  tierId?: string;
  label?: string;
  sublabel?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { openBottomDonate } = useCart();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openBottomDonate(amount, tierId);
  };

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-[11px]"
      : size === "lg"
      ? "px-6 py-3.5 text-sm sm:text-base"
      : "px-4 py-2.5 text-xs sm:text-sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`focus-ring tap-scale inline-flex items-center justify-center gap-2 rounded-xl bg-saffron text-white font-black uppercase tracking-wider shadow-md hover:bg-saffron-dark transition-all cursor-pointer animate-heartbeat ${sizeClasses} ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-200"></span>
      </span>
      <span>{label}</span>
      {sublabel && <span className="text-[10px] opacity-80 font-normal">({sublabel})</span>}
    </button>
  );
}
