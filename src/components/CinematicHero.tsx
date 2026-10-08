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

        {/* ── Floating Video Action Trigger (Bottom Center) ── */}
        <div className="absolute inset-x-0 bottom-4 sm:bottom-6 z-20 flex flex-col sm:flex-row items-center justify-center gap-3 px-4 pointer-events-auto">
          <button
            type="button"
            onClick={() => cart.openBottomDonate(4500, "food_one_day")}
            className="focus-ring tap-scale group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-saffron to-amber-600 px-6 py-3.5 text-xs sm:text-sm font-black text-white shadow-[0_8px_30px_rgba(217,121,36,0.6)] ring-2 ring-white/60 border border-amber-300 hover:scale-105 transition-all cursor-pointer animate-heartbeat"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-85"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-200"></span>
            </span>
            <span className="uppercase tracking-wider">SPONSOR 25 BOYS (₹4,500 FULL DAY ANNADANA) 💝</span>
          </button>

          <button
            type="button"
            onClick={() => cart.openBottomDonate(100)}
            className="focus-ring tap-scale flex items-center gap-1.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-3 text-xs font-bold text-white border border-white/25 shadow-md transition cursor-pointer"
          >
            <span>⚡ Feed 1 Child (₹100)</span>
          </button>
        </div>
      </div>

      {/* ── 2. GIVEA-STYLE 5 CATEGORY ICON DOCK (DIRECTLY UNDER VIDEO) ── */}
      <div className="relative z-30 w-full bg-teal-950 border-t border-white/15 py-3 sm:py-5 px-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 items-stretch">
            {/* Block 1: Support / Seva */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(100)}
              className="focus-ring tap-scale group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer hover:border-amber-400"
            >
              {/* Hand Holding Heart SVG Icon */}
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span className="font-display text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Support a Boy
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium">
                ಒಬ್ಬ ಮಗುವಿಗೆ ಸೇವೆ
              </span>
              <span className="mt-1 inline-block rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                ₹100 / ₹500
              </span>
            </button>

            {/* Block 2: 25 Resident Boys (Family / 3 Children with Heart Icon) */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(4500, "food_one_day")}
              className="focus-ring tap-scale group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer hover:border-amber-400"
            >
              {/* 3 People / Group Icon */}
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c.83 0 1.5-.67 1.5-1.5S12.83 1.5 12 1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm-5 4c.83 0 1.5-.67 1.5-1.5S7.83 5.5 7 5.5 5.5 6.17 5.5 7 6.17 8.5 7 8.5zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 5.5 17 5.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9c-2.21 0-4 1.79-4 4v5h8v-5c0-2.21-1.79-4-4-4zm-6 3c-1.66 0-3 1.34-3 3v3h3v-4c0-.73.26-1.4.7-1.93-.42-.05-.85-.07-1.7-.07zm12 0c-.85 0-1.28.02-1.7.07.44.53.7 1.2.7 1.93v4h3v-3c0-1.66-1.34-3-3-3z" />
                </svg>
              </div>
              <span className="font-display text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                25 Resident Boys
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium">
                ಮಕ್ಕಳ ಆಶ್ರಯ ಕೇಂದ್ರ
              </span>
              <span className="mt-1 inline-block rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                Daily Care &amp; Shelter
              </span>
            </button>

            {/* Block 3: Celebrate Birthday (Birthday Cake with Candle Icon) */}
            <Link
              href="/celebrate-special-day"
              className="focus-ring tap-scale group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer hover:border-amber-400"
            >
              {/* Birthday Cake SVG Icon */}
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m-1-5.5a1 1 0 012 0c0 .55-.45 1.5-1 2.5-.55-1-1-1.95-1-2.5zM7 9h10a2 2 0 012 2v2H5v-2a2 2 0 012-2zm-3 6h16a1 1 0 011 1v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a1 1 0 011-1z" />
                </svg>
              </div>
              <span className="font-display text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Celebrate Birthday
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium">
                ಹುಟ್ಟುಹಬ್ಬದ ಹಬ್ಬ
              </span>
              <span className="mt-1 inline-block rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                Feast · ₹3,500
              </span>
            </Link>

            {/* Block 4: Community / Education (Hands Holding Community Icon) */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(9600, "education_one_year")}
              className="focus-ring tap-scale group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer hover:border-amber-400"
            >
              {/* Community Hands Embracing Icon */}
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17c1.5 2 4 3 9 3s7.5-1 9-3" />
                </svg>
              </div>
              <span className="font-display text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Child Education
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium">
                ಶಾಲಾ ವಿದ್ಯಾಭ್ಯಾಸ
              </span>
              <span className="mt-1 inline-block rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                Tuition &amp; Kits
              </span>
            </button>

            {/* Block 5: Annadana Meals (Food Cloche on Platter Icon) */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(4500, "food_one_day")}
              className="focus-ring tap-scale group col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-amber-500/25 to-teal-900 border-2 border-amber-400/60 transition-all cursor-pointer hover:border-amber-300 shadow-md"
            >
              {/* Food Cloche SVG Icon */}
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-amber-400 text-teal-950 mb-2 group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 sm:h-7 sm:w-7 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v2m0 0a8 8 0 018 8H4a8 8 0 018-8zm-9 11h18a1 1 0 011 1v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-1a1 1 0 011-1zm3 5h12" />
                </svg>
              </div>
              <span className="font-display text-xs sm:text-sm font-black text-amber-300 transition-colors">
                Annadana Meals
              </span>
              <span className="text-[10px] text-white/90 font-bold">
                ಎಲ್ಲಾ ಮಕ್ಕಳಿಗೆ ಊಟ
              </span>
              <span className="mt-1 inline-block rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-teal-950">
                Full Day · ₹4,500
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
