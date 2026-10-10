"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

export function FloatingSocials() {
  const pathname = usePathname();
  const { total } = useCart();
  const [open, setOpen] = useState(false);
  const [activeIconIndex, setActiveIconIndex] = useState(0);

  // Cycle idle icon preview every 2.8 seconds between WhatsApp, Phone, Instagram, Facebook, X
  useEffect(() => {
    if (open) return;
    const interval = setInterval(() => {
      setActiveIconIndex((prev) => (prev + 1) % 5);
    }, 2800);
    return () => clearInterval(interval);
  }, [open]);

  // Hide on admin routes or checkout
  if (pathname?.startsWith("/admin") || pathname === "/checkout") return null;

  // Dynamic clearance: If Giving Basket is active, lift above it so CHECKOUT NOW is never covered
  const positionClass =
    total > 0
      ? "bottom-[calc(9.75rem+env(safe-area-inset-bottom))] md:bottom-24 right-4 md:right-6"
      : "bottom-[calc(5.25rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 md:right-6";

  return (
    <>
      {/* ── TRANSPARENT CLICK-OUTSIDE DISMISS (ZERO SCREEN-DIMMING OVERLAY) ── */}
      {open && (
        <div
          className="fixed inset-0 z-30 pointer-events-auto cursor-default"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── FLOATING SPEED-DIAL SOCIAL CHANNELS CONTAINER ── */}
      <aside
        aria-label="Direct Social Media, WhatsApp and Calling Channels"
        className={`fixed z-40 flex flex-col items-end gap-2.5 no-print transition-all duration-300 pointer-events-auto ${positionClass}`}
      >
        {/* Expanded Speed-Dial Stack */}
        {open && (
          <div
            className="flex flex-col items-end gap-2.5 mb-1 animate-in fade-in slide-in-from-bottom-3 duration-200"
            role="menu"
            aria-label="Social media, calling, and location channels"
          >
            {/* 1. WhatsApp */}
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama, I would like to support the 25 resident boys.")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("floating_social_click", { channel: "whatsapp" });
                setOpen(false);
              }}
              title="Chat on WhatsApp (+91 9980359595)"
              className="group flex items-center gap-2 tap-scale"
            >
              <span className="rounded-xl bg-teal-950/95 text-white px-2.5 py-1 text-[11px] font-bold shadow-md ring-1 ring-white/10 backdrop-blur-xs whitespace-nowrap opacity-95 group-hover:opacity-100 transition">
                WhatsApp
              </span>
              <div className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_4px_16px_rgba(37,211,102,0.4)] transition hover:scale-110 active:scale-95 ring-2 ring-white">
                <svg className="h-5.5 w-5.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                </svg>
              </div>
            </a>

            {/* 2. Direct Call */}
            <a
              href={`tel:${SITE.phoneIntl}`}
              onClick={() => {
                track("floating_social_click", { channel: "call" });
                setOpen(false);
              }}
              title="Call Caretaker: +91 9980359595"
              className="group flex items-center gap-2 tap-scale"
            >
              <span className="rounded-xl bg-teal-950/95 text-white px-2.5 py-1 text-[11px] font-bold shadow-md ring-1 ring-white/10 backdrop-blur-xs whitespace-nowrap opacity-95 group-hover:opacity-100 transition">
                Call Ashrama
              </span>
              <div className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-[#06312F] text-white shadow-[0_4px_16px_rgba(6,49,47,0.4)] transition hover:scale-110 active:scale-95 ring-2 ring-white">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                </svg>
              </div>
            </a>

            {/* 3. Instagram */}
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("floating_social_click", { channel: "instagram" });
                setOpen(false);
              }}
              title="Janaseva Ashrama on Instagram"
              className="group flex items-center gap-2 tap-scale"
            >
              <span className="rounded-xl bg-teal-950/95 text-white px-2.5 py-1 text-[11px] font-bold shadow-md ring-1 ring-white/10 backdrop-blur-xs whitespace-nowrap opacity-95 group-hover:opacity-100 transition">
                Instagram
              </span>
              <div className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-[0_4px_16px_rgba(220,39,67,0.35)] transition hover:scale-110 active:scale-95 ring-2 ring-white">
                <svg className="h-5.5 w-5.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
            </a>

            {/* 4. Facebook */}
            <a
              href={SITE.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("floating_social_click", { channel: "facebook" });
                setOpen(false);
              }}
              title="Official Facebook Page"
              className="group flex items-center gap-2 tap-scale"
            >
              <span className="rounded-xl bg-teal-950/95 text-white px-2.5 py-1 text-[11px] font-bold shadow-md ring-1 ring-white/10 backdrop-blur-xs whitespace-nowrap opacity-95 group-hover:opacity-100 transition">
                Facebook
              </span>
              <div className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-[0_4px_16px_rgba(24,119,242,0.35)] transition hover:scale-110 active:scale-95 ring-2 ring-white">
                <svg className="h-5.5 w-5.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
            </a>

            {/* 5. X (Twitter) */}
            <a
              href={SITE.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("floating_social_click", { channel: "twitter" });
                setOpen(false);
              }}
              title="Official X Handle"
              className="group flex items-center gap-2 tap-scale"
            >
              <span className="rounded-xl bg-teal-950/95 text-white px-2.5 py-1 text-[11px] font-bold shadow-md ring-1 ring-white/10 backdrop-blur-xs whitespace-nowrap opacity-95 group-hover:opacity-100 transition">
                X (Twitter)
              </span>
              <div className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-[#000000] text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition hover:scale-110 active:scale-95 ring-2 ring-white border border-white/20">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
            </a>

            {/* 6. Location / Google Maps */}
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                track("floating_social_click", { channel: "maps" });
                setOpen(false);
              }}
              title="Visit Ashrama: #27 Gundu Thopu, Turahalli"
              className="group flex items-center gap-2 tap-scale"
            >
              <span className="rounded-xl bg-teal-950/95 text-white px-2.5 py-1 text-[11px] font-bold shadow-md ring-1 ring-white/10 backdrop-blur-xs whitespace-nowrap opacity-95 group-hover:opacity-100 transition">
                Campus Location
              </span>
              <div className="focus-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EA4335] text-white shadow-[0_4px_16px_rgba(234,67,53,0.35)] transition hover:scale-110 active:scale-95 ring-2 ring-white">
                <svg className="h-5.5 w-5.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
            </a>
          </div>
        )}

        {/* ── TRIGGER BUTTON (ROUND FLOATING ACTION BUTTON) ── */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Close connect menu" : "Open WhatsApp, Calling, and Social channels"}
          title={open ? "Close connect menu" : "Connect: WhatsApp, Call, Instagram, Facebook, X"}
          className={`focus-ring tap-scale relative flex h-13 w-13 md:h-14 md:w-14 items-center justify-center rounded-full text-white shadow-[0_10px_35px_rgba(0,0,0,0.35)] ring-2 transition-all duration-300 cursor-pointer ${
            open
              ? "bg-teal-950 ring-amber-400 rotate-90 scale-105"
              : activeIconIndex === 0
              ? "bg-[#25D366] ring-white shadow-[0_8px_30px_rgba(37,211,102,0.5)] hover:scale-110 active:scale-95"
              : activeIconIndex === 1
              ? "bg-[#06312F] ring-amber-400 shadow-[0_8px_30px_rgba(6,49,47,0.5)] hover:scale-110 active:scale-95"
              : activeIconIndex === 2
              ? "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] ring-white shadow-[0_8px_30px_rgba(220,39,67,0.5)] hover:scale-110 active:scale-95"
              : activeIconIndex === 3
              ? "bg-[#1877F2] ring-white shadow-[0_8px_30px_rgba(24,119,242,0.5)] hover:scale-110 active:scale-95"
              : "bg-[#000000] ring-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-95"
          }`}
        >
          {/* Live Online Ping Indicator */}
          {!open && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-teal-950" />
            </span>
          )}

          {open ? (
            /* Close ✕ Icon */
            <svg className="h-6 w-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* Rotating Official Brand Logos */
            <div className="relative flex items-center justify-center w-full h-full animate-in fade-in zoom-in-90 duration-300">
              {activeIconIndex === 0 && (
                /* WhatsApp Logo */
                <svg className="h-6.5 w-6.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                </svg>
              )}
              {activeIconIndex === 1 && (
                /* Phone Call Logo */
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                </svg>
              )}
              {activeIconIndex === 2 && (
                /* Instagram Logo */
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              )}
              {activeIconIndex === 3 && (
                /* Facebook Logo */
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {activeIconIndex === 4 && (
                /* X Logo */
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
            </div>
          )}
        </button>
      </aside>
    </>
  );
}
