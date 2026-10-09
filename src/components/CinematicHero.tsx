"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatINR, SITE } from "@/lib/site";
import type { SiteContentMap } from "@/lib/site-content";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

export interface ShagunTier {
  amount: number;
  name: string;
  kannada: string;
  meaning: string;
  icon: string;
  isPopular?: boolean;
}

export const DIVINE_SHAGUN_TIERS: ShagunTier[] = [
  {
    amount: 11,
    name: "Ekadashi Shagun",
    kannada: "ಶುಭ ಹಾಲು ಸೇವೆ",
    meaning: "1 Glass Pure Morning Cow Milk for 1 Boy",
    icon: "🥛",
  },
  {
    amount: 21,
    name: "Dharma Jyothi",
    kannada: "ಹಣ್ಣು ಪೋಷಣೆ",
    meaning: "Fresh Banana & Morning Fruit Nutrition",
    icon: "🍌",
  },
  {
    amount: 51,
    name: "Pancha Bhoota",
    kannada: "ಬೆಳಗಿನ ಬಿಸಿ ತಿಂಡಿ",
    meaning: "Steaming Hot Idlis & Sambar Breakfast for 1 Boy",
    icon: "🍲",
  },
  {
    amount: 101,
    name: "Punya Annadana",
    kannada: "ಮಧ್ಯಾಹ್ನದ ಅನ್ನದಾನ",
    meaning: "Full Hot Lunch (Rice, Dal, Sabzi & Curd) for 1 Boy",
    icon: "🍛",
    isPopular: true,
  },
  {
    amount: 251,
    name: "Saraswati Vidya",
    kannada: "ವಿದ್ಯಾ ಕಿಟ್ ಸೇವೆ",
    meaning: "School Notebooks, Geometry & Stationery Kit",
    icon: "📚",
  },
  {
    amount: 501,
    name: "Arogya Raksha",
    kannada: "ಆರೋಗ್ಯ ರಕ್ಷಣೆ",
    meaning: "Pediatric Health Checkup, Vitamins & Tonic",
    icon: "🩺",
  },
  {
    amount: 1001,
    name: "Anna Daata",
    kannada: "ವಾರದ ರೇಷನ್ ಸೇವೆ",
    meaning: "1-Week Kitchen Vegetables & Sona Masoori Rice",
    icon: "🍚",
  },
  {
    amount: 2101,
    name: "Maha Prasada",
    kannada: "ಸಿಹಿ ಪಾಯಸದ ಹಬ್ಬ",
    meaning: "Festival Sweet Payasam Feast for All 25 Boys",
    icon: "🎉",
  },
  {
    amount: 2501,
    name: "Sampoorna Bhojana",
    kannada: "ಎಲ್ಲಾ 25 ಮಕ್ಕಳಿಗೆ ಊಟ",
    meaning: "1-Time Full Dining Hall Feast for All 25 Boys",
    icon: "🥘",
  },
  {
    amount: 5001,
    name: "Sarva Seva",
    kannada: "ಸಂಪೂರ್ಣ ದಿನದ ಅನ್ನದಾನ",
    meaning: "Full Day All 3 Meals + Snacks for All 25 Boys",
    icon: "👑",
  },
];

export function CinematicHero({ content }: { content?: Partial<SiteContentMap> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [selectedShagun, setSelectedShagun] = useState<number>(101);
  const cart = useCart();

  useEffect(() => {
    track("hero_view", { type: "unobstructed_video_hero_with_divine_shagun" });
  }, []);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSelectShagun = (amount: number) => {
    setSelectedShagun(amount);
    track("hero_shagun_select", { amount });
  };

  const handleInstantDonate = () => {
    track("hero_instant_shagun_donate", { amount: selectedShagun });
    cart.openBottomDonate(selectedShagun);
  };

  const activeTier = DIVINE_SHAGUN_TIERS.find((t) => t.amount === selectedShagun) || DIVINE_SHAGUN_TIERS[3];
  const posterSrc = content?.heroPosterUrl || "/media/poster-desktop.jpg";
  const videoSrc = content?.heroVideoUrl || "/media/video-chant-prayer.mp4";
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  return (
    <section
      aria-label="Janaseva Ashrama Introduction and Divine Shagun Giving"
      className="relative w-full max-w-full overflow-hidden bg-teal-950 flex flex-col text-white"
    >
      {/* ── 1. FULL-WIDTH 100% UNOBSTRUCTED CINEMATIC VIDEO VIEWPORT ── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:h-[62svh] lg:h-[70svh] min-h-[260px] max-h-[760px] overflow-hidden bg-black select-none flex items-center justify-center">
        {/* Background poster (LCP-critical, authentic Ashrama 25 boys in orange prayer) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterSrc}
          alt="Authentic Annadana food preparation and prayers for 25 boys at Janaseva Ashrama Bangalore"
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full ${
            fitMode === "contain" ? "object-contain" : "object-cover object-center"
          }`}
        />

        {/* Autoplay edge-to-edge looping video of real Janaseva Ashrama prayer hall */}
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
          className={`absolute inset-0 h-full w-full ${
            fitMode === "contain" ? "object-contain" : "object-cover object-center"
          } transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/media/video-chant-prayer.mp4" type="video/mp4" />
        </video>

        {/* Subtle, non-intrusive vignette for contrast */}
        <div className="absolute inset-x-0 top-0 h-20 sm:h-24 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-teal-950 via-teal-950/60 to-transparent pointer-events-none" />

        {/* Top Floating Controls */}
        <div className="absolute inset-x-0 top-2.5 sm:top-4 z-20 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex items-center justify-between pointer-events-auto">
          {/* Live Kitchen Beacon */}
          <div className="flex items-center gap-2 rounded-full bg-black/65 px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold text-white backdrop-blur border border-white/20 shadow-lg">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-red-500"></span>
            </span>
            <span className="uppercase tracking-wider">Live Ashrama Feed · 25 Resident Boys</span>
          </div>

          {/* Action Controls: Fit Mode & Sound Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setFitMode((m) => (m === "cover" ? "contain" : "cover"))}
              title={fitMode === "cover" ? "Fit entire hall without cropping" : "Fill screen"}
              className="focus-ring tap-scale flex items-center gap-1.5 rounded-full border border-white/25 bg-black/65 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white backdrop-blur hover:bg-black/85 shadow-lg transition cursor-pointer"
            >
              <span>{fitMode === "cover" ? "🔍 Fit View" : "⛶ Fill"}</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              aria-label={isMuted ? "Unmute video sound" : "Mute video sound"}
              className="focus-ring tap-scale flex items-center gap-1.5 rounded-full border border-white/25 bg-black/65 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold text-white backdrop-blur hover:bg-black/85 shadow-lg transition cursor-pointer"
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
        </div>

        {/* Minimal Bottom Location Tag (Does NOT cover the video!) */}
        <div className="absolute inset-x-0 bottom-2.5 sm:bottom-3 z-20 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex items-center justify-between text-[10px] sm:text-xs text-white/80 pointer-events-none">
          <span className="rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur border border-white/10 font-medium truncate max-w-[70%] sm:max-w-none">
            📍 Turahalli, Bangalore · Chanting, Prayer &amp; Pure Annadana
          </span>
          <span className="hidden sm:inline-block rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur border border-white/10 font-bold text-amber-300">
            Form 10AC 80G Tax Deductible
          </span>
        </div>
      </div>

      {/* ── 2. HIGH-CONVERSION SALES PSYCHOLOGY & DIVINE SHAGUN ENGINE (Directly Below Video) ── */}
      <div className="w-full bg-gradient-to-b from-teal-950 via-teal-900 to-teal-950 px-3 sm:px-6 lg:px-8 py-6 sm:py-8 border-b border-white/15">
        <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
          {/* Live Annadana Status Tracker */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-white/10 p-3 sm:p-4 border border-white/15 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider">
                🔥 Live Urgent Seva Status Today:
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                19 of 25 Boys Sponsored · <strong className="text-amber-400">6 Meals Still Needed</strong>
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-full sm:w-48 bg-white/15 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-saffron to-amber-400 rounded-full transition-all duration-1000"
                style={{ width: "76%" }}
              />
            </div>
          </div>

          {/* Emotional Mandate Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-amber-300 border border-amber-400/30">
              <span>✨ Divine Shagun Math · ಪವಿತ್ರ ಶಕುನ ಸೇವೆ</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-white">
              Every Visitor Leaves a Blessing — Even ₹11 Feeds a Child
            </h2>
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-2xl mx-auto">
              ₹11 is less than a cup of tea, but in an ashrama it gives a glass of fresh milk to a boy who lost his parents. Select your sacred Shagun below and touch a young life with 1-tap UPI.
            </p>
          </div>

          {/* ── 9 SACRED DIVINE SHAGUN BUTTONS (Mathematical Conversion Architecture) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-200">
              <span className="uppercase tracking-wider">Select Your Auspicious Shagun:</span>
              <span className="font-mono text-amber-300">Selected: {formatINR(selectedShagun)}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
              {DIVINE_SHAGUN_TIERS.map((tier) => {
                const isSelected = selectedShagun === tier.amount;
                return (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => handleSelectShagun(tier.amount)}
                    className={`focus-ring tap-scale relative p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-b from-amber-400 to-amber-500 text-teal-950 border-amber-300 shadow-lg ring-2 ring-white/70 scale-[1.02]"
                        : "bg-white/10 hover:bg-white/18 text-white border-white/15 hover:border-amber-400/50"
                    }`}
                  >
                    {tier.isPopular && (
                      <span className="absolute -top-2 right-2 rounded-full bg-saffron px-1.5 py-0.2 text-[8px] font-black uppercase text-white shadow">
                        Popular ★
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-1">
                      <span className={`font-display text-base sm:text-lg font-black ${isSelected ? "text-teal-950" : "text-amber-300"}`}>
                        ₹{tier.amount}
                      </span>
                      <span className="text-base" aria-hidden="true">{tier.icon}</span>
                    </div>

                    <span className={`block text-xs font-bold mt-1 leading-tight ${isSelected ? "text-teal-950 font-black" : "text-white"}`}>
                      {tier.name}
                    </span>

                    <span className={`block text-[10px] mt-0.5 line-clamp-1 ${isSelected ? "text-teal-900/90 font-medium" : "text-amber-200/80"}`}>
                      {tier.kannada}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Selected Tier Real-World Breakdown Box */}
          <div className="rounded-2xl bg-white/10 p-3.5 sm:p-4 border border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-3xl shrink-0" aria-hidden="true">{activeTier.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-400 text-teal-950 px-2 py-0.5 text-[10px] font-black uppercase">
                    Your Impact
                  </span>
                  <h3 className="font-display text-sm sm:text-base font-bold text-white">
                    {activeTier.name} — {formatINR(activeTier.amount)}
                  </h3>
                </div>
                <p className="text-xs text-amber-200 mt-0.5">
                  {activeTier.meaning} ({activeTier.kannada})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                <span>✓</span> 80G Tax Exemption
              </span>
              <span className="text-[11px] text-amber-300 font-semibold flex items-center gap-1">
                <span>✓</span> 100% Direct Allocation
              </span>
            </div>
          </div>

          {/* Primary High-Conversion Action Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleInstantDonate}
              className="focus-ring tap-scale w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron via-amber-500 to-saffron px-6 py-4 text-sm sm:text-base font-black text-white shadow-xl hover:brightness-110 active:scale-98 transition cursor-pointer animate-heartbeat"
            >
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-200"></span>
              </span>
              <span>⚡ DONATE {formatINR(selectedShagun)} SHAGUN (UPI / GPAY / CARDS) →</span>
            </button>

            <Link
              href="/celebrate-special-day"
              className="w-full sm:w-auto text-center px-5 py-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/25 transition active:scale-98 shrink-0"
            >
              🎂 Sponsor Birthday Feast ({formatINR(2101)})
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. SLEEK HORIZONTAL CATEGORY DOCK (STREAMLINED FOR MOBILE) ── */}
      <div className="relative z-30 w-full bg-teal-950 py-3 sm:py-4 px-3 sm:px-6 lg:px-8 border-b border-teal-900/40">
        <div className="mx-auto max-w-7xl">
          <div className="flex overflow-x-auto gap-2 sm:gap-3 pb-1 no-scrollbar md:grid md:grid-cols-5 md:gap-3.5">
            {/* Block 1: Support a Boy */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(11)}
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer group hover:border-amber-400"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">🤲</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Shagun Seva
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium truncate">
                ಒಬ್ಬ ಮಗುವಿಗೆ ಸೇವೆ
              </span>
              <span className="mt-1 rounded-md bg-white/15 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300">
                ₹11 / ₹101
              </span>
            </button>

            {/* Block 2: 25 Resident Boys */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(2501)}
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
                Care &amp; Shelter
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
                Feast · ₹2,101
              </span>
            </Link>

            {/* Block 4: Child Education */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(251)}
              className="focus-ring tap-scale shrink-0 w-36 md:w-auto flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl bg-white/10 hover:bg-white/18 border border-white/15 transition-all cursor-pointer group hover:border-amber-400"
            >
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                <span className="text-lg">📚</span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate">
                Child Vidya
              </span>
              <span className="text-[10px] text-amber-200/80 font-medium truncate">
                ಶಾಲಾ ವಿದ್ಯಾಭ್ಯಾಸ
              </span>
              <span className="mt-1 rounded-md bg-white/15 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-300">
                Kit · ₹251
              </span>
            </button>

            {/* Block 5: Full Day Annadana */}
            <button
              type="button"
              onClick={() => cart.openBottomDonate(5001)}
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
                Full Day · ₹5,001
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
