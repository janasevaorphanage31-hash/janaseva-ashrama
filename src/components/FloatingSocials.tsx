"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { track } from "@/lib/track";

export function FloatingSocials() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Hide on admin or checkout
  if (pathname?.startsWith("/admin") || pathname === "/checkout") return null;

  return (
    <aside
      ref={containerRef}
      aria-label="Quick Connect, Calling, Location and Social Channels"
      className="fixed left-3 sm:left-5 bottom-[calc(4.85rem+env(safe-area-inset-bottom))] md:bottom-24 z-40 no-print"
    >
      {/* ── EXPANDED FLOATING CONNECT POPUP ── */}
      {open && (
        <div className="mb-2 w-72 sm:w-80 rounded-3xl bg-teal-950/98 text-white p-4 sm:p-5 shadow-[0_16px_50px_rgba(0,0,0,0.5)] ring-1 ring-amber-400/40 border border-white/15 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-white/15">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Live Caretaker Desk
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-white mt-0.5">
                Reach Janaseva Ashrama
              </h3>
              <p className="text-[11px] text-white/70">
                Turahalli, Bengaluru · Open for visits
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close connect dock"
              className="text-white/60 hover:text-white p-1 text-sm rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Core Direct Channels: Call, WhatsApp, Location */}
          <div className="grid grid-cols-3 gap-2 py-3 border-b border-white/10">
            {/* 1. Direct Call */}
            <a
              href={`tel:${SITE.phoneIntl}`}
              onClick={() => track("connect_click", { type: "phone_call" })}
              className="focus-ring tap-scale flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-emerald-700/80 transition text-center group border border-white/10"
              title="Call Caretaker (+91 99803 59595)"
            >
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-white">Call Us</span>
              <span className="text-[9px] text-emerald-200">1-Tap Dial</span>
            </a>

            {/* 2. WhatsApp Chat */}
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama, I would like to visit and support the 25 resident boys.")}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("connect_click", { type: "whatsapp" })}
              className="focus-ring tap-scale flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-[#25D366]/80 transition text-center group border border-white/10"
              title="Chat on WhatsApp"
            >
              <div className="h-8 w-8 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-white">WhatsApp</span>
              <span className="text-[9px] text-emerald-200">Instant</span>
            </a>

            {/* 3. Google Maps Location */}
            <a
              href={SITE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("connect_click", { type: "google_maps" })}
              className="focus-ring tap-scale flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white/10 hover:bg-amber-600/80 transition text-center group border border-white/10"
              title="Google Maps Directions"
            >
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <span className="text-[11px] font-bold text-white">Location</span>
              <span className="text-[9px] text-amber-200">GPS Map</span>
            </a>
          </div>

          {/* Social Channels Strip */}
          <div className="pt-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">
              Official Social Channels:
            </span>
            <div className="flex items-center justify-between gap-1.5">
              {/* Instagram */}
              <a
                href={SITE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Instagram (@janaseva_ashrama)"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl bg-[#E1306C] text-white hover:scale-110 active:scale-95 transition shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href={SITE.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="YouTube Channel"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF0000] text-white hover:scale-110 active:scale-95 transition shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={SITE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl bg-[#1877F2] text-white hover:scale-110 active:scale-95 transition shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={SITE.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="LinkedIn"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl bg-[#0A66C2] text-white hover:scale-110 active:scale-95 transition shadow-xs"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.69 1.69 0 0 0 0-3.38 1.69 1.69 0 0 0 0 3.38m1.39 9.74v-8.37H5.07v8.37h2.78z" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href={SITE.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="X (Twitter)"
                className="focus-ring flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F1419] text-white hover:scale-110 active:scale-95 transition shadow-xs"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── COLLAPSED FLOATING PILL TRIGGER (HIGH CONVERSION & ERGONOMIC) ── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Open connect menu: Call, WhatsApp, Location, Socials"
        className={`focus-ring tap-scale flex items-center gap-2 rounded-full px-3.5 py-2.5 text-xs font-bold text-white shadow-xl ring-2 transition-all cursor-pointer ${
          open
            ? "bg-teal-900 ring-amber-400"
            : "bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 ring-white/30 hover:ring-amber-400/70 hover:scale-105"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-5 w-5 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0 shadow-xs">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
            </svg>
          </span>
          <span className="h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center text-teal-950 shrink-0 shadow-xs">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </span>
          <span className="tracking-wide">📞 Call · WhatsApp · Maps</span>
        </span>
        <span className="text-[10px] text-amber-300 font-extrabold ml-0.5">
          {open ? "▲" : "▼"}
        </span>
      </button>
    </aside>
  );
}
