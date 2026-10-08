"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

/**
 * iOS-grade Scroll to Top (Scroll Back) floating action.
 * Smoothly fades and springs into view when the user scrolls past 350px.
 * Enables 1-tap instant return to the top of the page for mobile & desktop.
 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const { count, total } = useCart();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleScroll = () => {
      // Throttle scroll listener
      if (timeout) return;
      timeout = setTimeout(() => {
        setVisible(window.scrollY > 350);
        timeout = null as unknown as NodeJS.Timeout;
      }, 80);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  // Position above bottom nav / giving basket on mobile
  const bottomCls = total > 0 || count > 0
    ? "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-6"
    : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-6";

  return (
    <div
      className={`fixed ${bottomCls} right-3 sm:right-5 z-40 no-print transition-all duration-300 ease-out animate-fadeIn`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll back to top of page"
        title="Scroll to Top"
        className="focus-ring tap-scale group flex items-center gap-1.5 rounded-full bg-teal-950/90 hover:bg-teal-900 text-white px-3 sm:px-3.5 py-2 text-xs font-bold shadow-[0_8px_25px_rgba(5,47,44,0.35)] ring-1 ring-white/20 border border-amber-400/40 backdrop-blur-md transition-all hover:scale-105 active:scale-90 cursor-pointer"
      >
        {/* iOS style sleek arrow icon */}
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-teal-950 transition-colors">
          <svg
            className="h-3.5 w-3.5 stroke-current stroke-2 fill-none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </span>
        <span className="text-[11px] font-black uppercase tracking-wider text-amber-200 group-hover:text-white">
          Top
        </span>
      </button>
    </div>
  );
}
