"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatINR, SITE } from "@/lib/site";
import type { SiteContentMap } from "@/lib/site-content";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

export function CinematicHero({ content }: { content?: Partial<SiteContentMap> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const cart = useCart();

  useEffect(() => {
    track("hero_view", { type: "givea_style_cinematic_hero" });
  }, []);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  // Video source showing authentic Ashrama prayer, Annadana and boys
  const posterSrc = content?.heroPosterUrl || "/media/annadana-hall-hd.jpg";
  const videoSrc = content?.heroVideoUrl || "/media/video-chant-prayer.mp4";

  return (
    <section
      aria-label="Janaseva Ashrama Introduction"
      className="relative w-full max-w-full overflow-hidden bg-teal-950 flex flex-col"
    >
      {/* ── 1. FULL-WIDTH EDGE-TO-EDGE CINEMATIC VIDEO (GIVEA STYLE) ── */}
      <div className="relative w-full h-[45svh] sm:h-[55svh] md:h-[64svh] lg:h-[72svh] max-h-[780px] overflow-hidden bg-black select-none">
        {/* Background poster (LCP-critical) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt="Fresh Annadana food preparation for 25 boys at Janaseva Ashrama"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Autoplay edge-to-edge looping video */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          aria-hidden
          onLoadedData={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Minimal scrim gradient for text legibility at bottom and top */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-teal-950 via-teal-950/60 to-transparent pointer-events-none" />

        {/* ── Top Bar Controls ── */}
        <div className="absolute inset-x-0 top-3 sm:top-5 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-auto">
          {/* Live Kitchen Badge */}
          <div className="flex items-center gap-2 rounded-full bg-black/55 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-white backdrop-blur border border-white/20 shadow-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="uppercase tracking-wider">Live Ashrama Kitchen · Annadana for 25 Boys</span>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
            className="focus-ring tap-scale flex items-center gap-2 rounded-full border border-white/25 bg-black/55 px-3 sm:px-4 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-black/75 shadow-lg transition cursor-pointer"
          >
            {isMuted ? (
              <svg className="h-4 w-4 fill-current text-white/80" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 fill-current text-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
            <span className="hidden sm:inline">{isMuted ? "Sound Off" : "Sound On"}</span>
          </button>
        </div>

        {/* ── Urgent Need & Quick Give Panel (Floating on Bottom of Video) ── */}
        <div className="absolute inset-x-0 bottom-3 sm:bottom-6 z-20 mx-auto max-w-4xl px-3 sm:px-6 pointer-events-auto">
          <div className="rounded-2xl sm:rounded-3xl bg-teal-950/85 backdrop-blur-md p-3.5 sm:p-5 border border-white/20 shadow-2xl space-y-3">
            {/* Live Annadana Goal Meter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                  Today&apos;s Annadana Seva Status
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-white/90">
                19 of 25 Boys Sponsored · <span className="text-amber-400 font-extrabold">6 Meals Still Needed</span>
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-white/15 h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-saffron to-amber-400 rounded-full transition-all duration-1000 relative"
                style={{ width: "76%" }}
              >
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              </div>
            </div>

            {/* 1-Tap Tactile Quick Amount Chips */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pt-0.5">
              {[
                { amount: 100, label: "₹100", sub: "1 Boy Meal" },
                { amount: 300, label: "₹300", sub: "3 Meals" },
                { amount: 500, label: "₹500", sub: "5 Meals" },
                { amount: 1500, label: "₹1,500", sub: "Breakfast" },
                { amount: 4500, label: "₹4,500", sub: "Full Day (25 Boys)", popular: true },
              ].map((chip) => (
                <button
                  key={chip.amount}
                  type="button"
                  onClick={() => cart.openBottomDonate(chip.amount, chip.amount === 4500 ? "food_one_day" : undefined)}
                  className={`shrink-0 rounded-xl px-2.5 sm:px-3 py-1.5 text-left border transition active:scale-95 cursor-pointer ${
                    chip.popular
                      ? "bg-saffron text-white border-amber-300 shadow-md ring-1 ring-white/50"
                      : "bg-white/12 text-white border-white/20 hover:bg-white/20"
                  }`}
                >
                  <span className="block text-xs font-black leading-tight text-amber-300">{chip.label}</span>
                  <span className="block text-[9px] sm:text-[10px] text-white/80 leading-tight truncate">{chip.sub}</span>
                </button>
              ))}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => cart.openBottomDonate(4500, "food_one_day")}
                className="focus-ring w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-saffron via-amber-500 to-saffron px-5 py-3 text-xs sm:text-sm font-black text-white shadow-lg hover:brightness-110 active:scale-98 transition cursor-pointer"
              >
                <span>🍛 SPONSOR NOW (UPI / GPAY / CARDS)</span>
                <span>&rarr;</span>
              </button>

              <Link
                href="/celebrate-special-day"
                className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl sm:rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition active:scale-98"
              >
                🎂 Celebrate Birthday (₹3,500)
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. SLEEK HORIZONTAL CATEGORY DOCK (STREAMLINED FOR MOBILE) ── */}
      <div className="relative z-30 w-full bg-teal-950 border-t border-white/15 py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex overflow-x-auto gap-2 sm:gap-3 pb-1 no-scrollbar md:grid md:grid-cols-5 md:gap-3.5">
            {/* Block 1: Support a Boy */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(100)}
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer group hover:border-amber-400"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">🤲</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Support a Boy
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium truncate">
                ಒಬ್ಬ ಮಗುವಿಗೆ ಸೇವೆ
              </span>
              <span className="mt-1 rounded-md bg-white/15 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300">
                ₹100 / ₹500
              </span>
            </button>

            {/* Block 2: 25 Resident Boys */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(4500, "food_one_day")}
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer group hover:border-amber-400"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">👦</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                25 Resident Boys
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium truncate">
                ಮಕ್ಕಳ ಆಶ್ರಯ ಕೇಂದ್ರ
              </span>
              <span className="mt-1 rounded-md bg-white/15 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300">
                Daily Care &amp; Shelter
              </span>
            </button>

            {/* Block 3: Celebrate Birthday */}
            <Link
              href="/celebrate-special-day"
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer group hover:border-amber-400"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">🎂</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Celebrate Birthday
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium truncate">
                ಹುಟ್ಟುಹಬ್ಬದ ಹಬ್ಬ
              </span>
              <span className="mt-1 rounded-md bg-white/15 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300">
                Feast · ₹3,500
              </span>
            </Link>

            {/* Block 4: Child Education */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(9600, "education_one_year")}
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer group hover:border-amber-400"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">📚</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Child Education
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium truncate">
                ಶಾಲಾ ವಿದ್ಯಾಭ್ಯಾಸ
              </span>
              <span className="mt-1 rounded-md bg-white/15 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300">
                Tuition &amp; Kits
              </span>
            </button>

            {/* Block 5: Full Day Annadana */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(4500, "food_one_day")}
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-gradient-to-b from-amber-500/25 to-teal-900 border border-amber-400/60 transition-all cursor-pointer group hover:border-amber-300 shadow-sm"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-400 text-teal-950 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">🍲</span>
              </div>
              <span className="text-xs font-black text-amber-300 truncate">
                Annadana Meals
              </span>
              <span className="text-[10px] text-white/90 font-bold truncate">
                ಎಲ್ಲಾ ಮಕ್ಕಳಿಗೆ ಊಟ
              </span>
              <span className="mt-1 rounded-md bg-amber-400 px-1.5 py-0.2 text-[9px] font-black text-teal-950">
                Full Day · ₹4,500
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
