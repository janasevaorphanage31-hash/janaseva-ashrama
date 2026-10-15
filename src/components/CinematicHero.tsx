"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SiteContentMap } from "@/lib/site-content";
import { track } from "@/lib/track";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";

export interface ShagunTier {
  amount: number;
  name: string;
  kannada: string;
  meaning: string;
  icon: string;
  isPopular?: boolean;
}

const HERO_SHAGUN_TIERS = [
  {
    amt: 1800,
    label: "Clothes · 3 Boys",
    sub: "Festive & daily cotton sets",
    image: "/media/boys-group-red-assembly.jpg",
    impact: "Complete cotton clothing sets and festival wear for 3 resident boys",
  },
  {
    amt: 2500,
    label: "1 Meal · 25 Boys",
    sub: "Hot lunch with sweet payasam",
    image: "/media/annadana-hall-hd.jpg",
    impact: "Steaming hot lunch feast with rice, sambar, fresh curd & sweet payasam for all 25 boys",
  },
  {
    amt: 3000,
    label: "2 Meals · 25 Boys",
    sub: "Lunch & dinner for all 25 boys",
    image: "/media/banana-leaf-feast.jpg",
    impact: "2 full hot meals (lunch and dinner) for all 25 resident boys",
  },
  {
    amt: 4500,
    label: "Full Day · 25 Boys",
    sub: "All 4 meals (Breakfast to Dinner)",
    badge: "Most Chosen ⭐",
    image: "/media/annadana-hall-hd.jpg",
    impact: "Wholesome 4-meal Annadana (breakfast, lunch, evening snacks & dinner) for all 25 boys",
  },
  {
    amt: 6000,
    label: "Month Ration · 4 Boys",
    sub: "Rice, dal, milk & vegetables",
    badge: "Monthly Care",
    image: "/media/pantry.jpg",
    impact: "Essential 1-month kitchen groceries, toor dal, fresh vegetables & milk for 4 resident boys",
  },
];

export function CinematicHero({ content }: { content?: Partial<SiteContentMap> }) {
  const { openBottomDonate } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  // Sponsor 25 Boys Scheme State (Anchored at ₹4,500 flagship Full Day Food)
  const [selectedAmt, setSelectedAmt] = useState<number>(4500);
  const [customAmt, setCustomAmt] = useState<string>("");

  const posterSrc = content?.heroPosterUrl || "/media/poster-desktop.jpg";
  const videoSrc = content?.heroVideoUrl || "/media/video-chant-prayer.mp4";

  const [prevVideoSrc, setPrevVideoSrc] = useState(videoSrc);
  if (prevVideoSrc !== videoSrc) {
    setPrevVideoSrc(videoSrc);
    setVideoReady(false);
  }

  useEffect(() => {
    track("hero_view", { type: "cinematic_video_hero" });
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (videoRef.current.readyState >= 2) {
        setVideoReady(true);
      }
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc]);

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const effectiveAmount = customAmt && Number(customAmt) > 0 ? Number(customAmt) : selectedAmt;
  const activeTier = HERO_SHAGUN_TIERS.find((t) => t.amt === effectiveAmount);

  const handleHeroDonate = () => {
    track("hero_quick_donate_click", {
      amount: effectiveAmount,
      tier: activeTier?.label || "Custom",
    });
    openBottomDonate(
      effectiveAmount,
      "food_one_day",
      activeTier ? `${activeTier.label} (${formatINR(effectiveAmount)}) for 25 Boys` : `Sponsor 25 Boys (${formatINR(effectiveAmount)})`,
      "Sponsor 25 Boys (Form 28)"
    );
  };

  return (
    <section
      aria-label="Janaseva Ashrama Introduction and Video"
      className="relative w-full max-w-full overflow-hidden bg-teal-950 flex flex-col text-white"
    >
      {/* ── 1. FULL-WIDTH 100% UNOBSTRUCTED CINEMATIC VIDEO VIEWPORT ── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:h-[58svh] lg:h-[65svh] min-h-[250px] max-h-[720px] overflow-hidden bg-black select-none flex items-center justify-center">
        {/* Background poster */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={posterSrc}
          src={posterSrc}
          alt="Authentic Annadana food preparation and prayers for 25 boys at Janaseva Ashrama Bangalore"
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full ${
            fitMode === "contain" ? "object-contain" : "object-cover object-center"
          }`}
        />

        {/* Autoplay edge-to-edge looping video */}
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted={isMuted}
          loop
          playsInline
          preload="auto"
          aria-hidden
          onLoadedData={() => setVideoReady(true)}
          onCanPlay={() => setVideoReady(true)}
          onPlaying={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full ${
            fitMode === "contain" ? "object-contain" : "object-cover object-center"
          } transition-opacity duration-700 ${
            videoReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/media/video-chant-prayer.mp4" type="video/mp4" />
        </video>

        {/* Vignette Gradients */}
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

        {/* Minimal Bottom Location Tag */}
        <div className="absolute inset-x-0 bottom-2.5 sm:bottom-3 z-20 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 flex items-center justify-between text-[10px] sm:text-xs text-white/80 pointer-events-none">
          <span className="rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur border border-white/10 font-medium truncate max-w-[70%] sm:max-w-none">
            📍 Turahalli, Bangalore · Chanting, Prayer &amp; Pure Annadana
          </span>
          <span className="hidden sm:inline-block rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur border border-white/10 font-bold text-amber-300">
            Form 10AC 80G Tax Deductible
          </span>
        </div>
      </div>

      {/* ── 2. DYNAMIC MISSION HEADLINE STRIP ── */}
      <div className="w-full bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 border-b border-teal-800/60 py-3 sm:py-3.5 px-4 text-center">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-base sm:text-lg md:text-xl font-black tracking-tight text-white leading-snug">
            {content?.heroHeadline || "Pure Love, Wholesome Food & Education for 25 Boys"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-teal-100/85 max-w-3xl mx-auto leading-relaxed">
            {content?.heroSubheadline || "See what today looks like at Janaseva Ashrama — and choose how you want to be part of tomorrow."}
          </p>
        </div>
      </div>

      {/* ── 3. ECOMMERCE DONATION SALES DECK: SPONSOR 25 BOYS SCHEME AMOUNTS WITH PHOTO BACKGROUNDS ── */}
      <div className="w-full bg-gradient-to-b from-teal-900 via-teal-950 to-teal-950 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/10 backdrop-blur-xl p-4 sm:p-5 border border-white/20 shadow-2xl">
          {/* Interactive Sponsor 25 Boys Scheme Cards with Photo Backgrounds */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                <span>🏛️</span>
                <span>Select Sponsorship Scheme &amp; Amount:</span>
              </label>
              <span className="text-[11px] font-semibold text-emerald-300">
                100% Direct Allocation to 25 Boys
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {HERO_SHAGUN_TIERS.map((tier) => {
                const isSelected = effectiveAmount === tier.amt && !customAmt;
                return (
                  <button
                    key={tier.amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmt(tier.amt);
                      setCustomAmt("");
                    }}
                    className={`group relative overflow-hidden p-2.5 sm:p-3 rounded-2xl text-left transition-all border cursor-pointer tap-scale flex flex-col justify-between min-h-[92px] sm:min-h-[108px] ${
                      isSelected
                        ? "border-amber-300 ring-2 ring-amber-300 shadow-xl shadow-orange-500/30 scale-[1.02]"
                        : "border-white/20 hover:border-amber-300/60"
                    }`}
                  >
                    {/* Authentic photo background */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tier.image}
                      alt={tier.label}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* High-contrast gradient overlay so text is 100% legible */}
                    <div
                      className={`absolute inset-0 transition-colors ${
                        isSelected
                          ? "bg-gradient-to-t from-teal-950/95 via-teal-950/75 to-teal-950/40"
                          : "bg-gradient-to-t from-black/90 via-black/70 to-black/35 group-hover:from-black/85 group-hover:via-black/60"
                      }`}
                    />

                    {/* Optional Top Badge */}
                    <div className="relative z-10 flex justify-end w-full">
                      {tier.badge && (
                        <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-black uppercase text-teal-950 shadow">
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 mt-auto">
                      <span className="font-display text-base sm:text-lg font-black block text-amber-300 drop-shadow-sm leading-none">
                        {formatINR(tier.amt)}
                      </span>
                      <span className="text-xs font-bold block leading-tight text-white drop-shadow-sm mt-1">
                        {tier.label}
                      </span>
                      <span className="text-[10px] block line-clamp-1 text-white/80 mt-0.5 leading-tight">
                        {tier.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Field (Clean single input without bulky increment chips) */}
            <div className="mt-2.5">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/60">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Or enter any custom sponsorship amount (min ₹10)"
                  value={customAmt}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setCustomAmt(cleaned);
                  }}
                  className="w-full rounded-xl border border-white/20 bg-teal-950/70 py-2.5 pl-8 pr-3 text-base sm:text-sm font-bold text-white outline-none focus:border-amber-400 placeholder:text-white/40"
                />
              </div>
            </div>
          </div>

          {/* Clean Emotional Impact & 80G Tax Exemption Strip */}
          <div className="mt-3 rounded-2xl bg-teal-950/80 p-3 sm:p-3.5 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base select-none shrink-0">🌸</span>
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 block">
                  Direct Impact for 25 Resident Boys:
                </span>
                <p className="text-xs text-white font-medium leading-snug">
                  {activeTier
                    ? activeTier.impact
                    : `Your contribution of ${formatINR(effectiveAmount)} directly covers wholesome meals, clothes & care for 25 resident boys.`}
                </p>
              </div>
            </div>
            <div className="shrink-0 self-start sm:self-auto rounded-lg bg-emerald-950/70 border border-emerald-400/30 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
              Form 10AC · 100% Tax Deductible (80G)
            </div>
          </div>

          {/* Finger-First Primary Donation CTA & Secondary Birthday Link */}
          <div className="mt-3.5 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleHeroDonate}
              className="focus-ring tap-scale w-full sm:flex-1 py-3.5 sm:py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-teal-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-orange-500/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 animate-heartbeat"
            >
              <span>FEED 25 BOYS · {formatINR(effectiveAmount)}</span>
              <span>💝 →</span>
            </button>

            <a
              href="#official-tiers"
              className="focus-ring tap-scale w-full sm:w-auto py-3.5 sm:py-4 px-4.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-teal-950 font-black text-xs sm:text-sm text-center transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>🏛️ Sponsor 25 Boys</span>
              <span className="rounded bg-teal-950 text-gold text-[9px] px-1 py-0.2 font-black uppercase">90% Focus</span>
            </a>

            <Link
              href="/celebrate-birthday"
              className="focus-ring tap-scale w-full sm:w-auto py-3.5 sm:py-4 px-4.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm text-center transition flex items-center justify-center gap-1.5"
            >
              <span>Celebrate Birthday</span>
              <span>🎂</span>
            </Link>
          </div>

          {/* Trust Guarantees Footer */}
          <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-white/80 font-medium">
            <span className="flex items-center justify-center gap-1">
              <span className="text-emerald-400">✓</span> Instant WhatsApp Receipt
            </span>
            <span className="flex items-center justify-center gap-1">
              <span className="text-emerald-400">✓</span> Govt Reg: KA18CH0242
            </span>
            <span className="flex items-center justify-center gap-1">
              <span className="text-emerald-400">✓</span> 100% Tax Free 80G
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

