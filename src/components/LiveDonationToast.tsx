"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/site";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

interface RecentDonation {
  id: string;
  donorName: string;
  amount: number;
  timeAgo: string;
  cause: string;
}

const RECENT_DONATIONS: RecentDonation[] = [
  { id: "1", donorName: "Pooja Gowda", amount: 251, timeAgo: "9 minutes ago", cause: "Annadana Meals" },
  { id: "2", donorName: "Rajesh & Sunita", amount: 4500, timeAgo: "14 minutes ago", cause: "Full Day Food (25 Boys)" },
  { id: "3", donorName: "Karthik K.", amount: 3500, timeAgo: "22 minutes ago", cause: "Birthday Feast" },
  { id: "4", donorName: "Suresh Kumar", amount: 1500, timeAgo: "35 minutes ago", cause: "Morning Breakfast" },
  { id: "5", donorName: "Dr. Sandhya Rao", amount: 9600, timeAgo: "48 minutes ago", cause: "1 Year Education" },
  { id: "6", donorName: "Sneha Reddy", amount: 6000, timeAgo: "1 hour ago", cause: "Monthly Ration Kit" },
  { id: "7", donorName: "Anand B.", amount: 500, timeAgo: "2 hours ago", cause: "School Books & Kit" },
  { id: "8", donorName: "Venkatesh Prasad", amount: 2500, timeAgo: "3 hours ago", cause: "Annadana Seva" },
];

export function LiveDonationToast() {
  const { openBottomDonate, isBottomDonateOpen } = useCart();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const interval = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % RECENT_DONATIONS.length);
        setVisible(true);
      }, 400);
    }, 7000);

    return () => clearInterval(interval);
  }, [dismissed]);

  if (dismissed || isBottomDonateOpen) return null;

  const current = RECENT_DONATIONS[currentIndex];

  const handleClick = () => {
    track("live_donation_toast_click", { donor: current.donorName, amount: current.amount });
    openBottomDonate(current.amount);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    track("live_donation_toast_dismiss", { donor: current.donorName });
  };

  return (
    <div className="fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom))] left-3 right-auto z-30 max-w-[calc(100vw-5.5rem)] sm:max-w-xs md:bottom-6 md:left-6 no-print pointer-events-auto">
      <div
        role="status"
        aria-live="polite"
        onClick={handleClick}
        className={`group flex items-center gap-2.5 rounded-2xl bg-white/95 px-3.5 py-2.5 text-xs text-teal-950 shadow-[0_8px_25px_rgba(5,47,44,0.18)] ring-1 ring-teal-900/10 border border-white backdrop-blur transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
          visible ? "translate-y-0 opacity-100 scale-100" : "translate-y-2 opacity-0 scale-95"
        }`}
      >
        {/* Heart Icon Badge */}
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 text-sm shadow-2xs">
          🧡
        </span>

        {/* Donor Text */}
        <div className="min-w-0 pr-1">
          <p className="font-bold leading-tight truncate text-teal-950">
            <span>{current.donorName}</span>{" "}
            <span className="text-teal-950/70 font-normal">donated</span>{" "}
            <span className="font-extrabold text-saffron-dark">{formatINR(current.amount)}</span>
          </p>
          <p className="text-[10px] text-teal-950/60 leading-tight truncate mt-0.5">
            {current.timeAgo} · <span className="text-teal-900 font-semibold">{current.cause}</span>
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss recent donation notification"
          className="ml-1 -mr-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-teal-950/40 hover:bg-sand/60 hover:text-teal-950 transition cursor-pointer text-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}
