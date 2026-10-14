"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SiteContentMap } from "@/lib/site-content";
import { track } from "@/lib/track";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";
import { numberToIndianWords } from "@/lib/number-words";

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
    amt: 101,
    label: "1 Punya Meal",
    sub: "Hot meal for 1 boy",
    impact: "1 steaming hot lunch (rice, dal, sabzi & fresh curd) for 1 boy",
  },
  {
    amt: 501,
    label: "3 Days Care",
    sub: "Nutrition & doctor visit",
    impact: "3 full days of meals and pediatric healthcare for 1 boy",
  },
  {
    amt: 1001,
    label: "Week Ration",
    sub: "Vegetables & rice sack",
    impact: "1 week fresh farm vegetables, toor dal & Sona Masoori rice for ashrama kitchen",
  },
  {
    amt: 2501,
    label: "Feast 25 Boys ★",
    sub: "All 25 boys feast",
    badge: "Most Chosen",
    impact: "Full hot dining hall feast with sweet payasam for all 25 resident boys",
  },
  {
    amt: 5001,
    label: "Vidya & Kits",
    sub: "School sets for 5 boys",
    impact: "Complete school uniform sets, notebooks, geometry kits & evening tuition for 5 boys",
  },
];

export function CinematicHero({ content }: { content?: Partial<SiteContentMap> }) {
  const { openBottomDonate } = useCart();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  // Shagun Giving Deck State (Anchored at ₹2,501 for maximum psychological impact & average order value)
  const [selectedAmt, setSelectedAmt] = useState<number>(2501);
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
  const taxSavings = Math.round(effectiveAmount * 0.15); // Approximate 50% 80G deduction value for 30% tax bracket
  const amountWords = numberToIndianWords(effectiveAmount);

  const handleHeroDonate = () => {
    track("hero_quick_donate_click", {
      amount: effectiveAmount,
      tier: activeTier?.label || "Custom",
    });
    openBottomDonate(
      effectiveAmount,
      "annadana",
      activeTier ? `${activeTier.label} (${formatINR(effectiveAmount)}) for 25 Boys` : `Seva (${formatINR(effectiveAmount)}) for 25 Boys`,
      "Occasion Giving"
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

      {/* ── 3. ECOMMERCE DONATION SALES DECK: APPLIED MATH & NUMBER PSYCHOLOGY ── */}
      <div className="w-full bg-gradient-to-b from-teal-900 via-teal-950 to-teal-950 py-4 sm:py-6 px-3 sm:px-6 lg:px-8 border-b border-white/10">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white/10 backdrop-blur-xl p-4 sm:p-6 border border-white/20 shadow-2xl">
          {/* Header Row: Live Needs Urgency & Arithmetic */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 text-sm">
                🍲
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Today&apos;s Satvik Annadana Need
                </span>
                <p className="text-[11px] text-teal-100/80">
                  75 Meals Required Today (25 Boys × 3 Meals) · <strong>69 Sponsored</strong>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-400/40 px-3 py-1 text-[11px] font-black text-rose-300 self-start sm:self-auto">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
              <span>Only 6 Evening Meals Remaining Tonight!</span>
            </div>
          </div>

          {/* Interactive Shagun Amount Pills (Finger-First, 44px+ Touch Targets) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-amber-200">
                Choose Auspicious Shagun Blessing:
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
                    className={`relative p-2.5 sm:p-3 rounded-2xl text-left transition-all border cursor-pointer tap-scale flex flex-col justify-between ${
                      isSelected
                        ? "bg-gradient-to-b from-amber-500 to-orange-600 text-white border-amber-300 shadow-lg shadow-orange-500/30 ring-2 ring-amber-300 scale-[1.02]"
                        : "bg-teal-950/60 hover:bg-teal-900/80 text-white border-white/15"
                    }`}
                  >
                    {tier.badge && (
                      <span className="absolute -top-2 right-2 rounded-full bg-amber-300 px-2 py-0.2 text-[9px] font-black uppercase text-teal-950 shadow">
                        {tier.badge}
                      </span>
                    )}
                    <div>
                      <span className="font-display text-base sm:text-lg font-black block">
                        {formatINR(tier.amt)}
                      </span>
                      <span className="text-xs font-bold block leading-tight mt-0.5">
                        {tier.label}
                      </span>
                    </div>
                    <span className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? "text-amber-100" : "text-white/60"}`}>
                      {tier.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Field */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/60">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Or enter any custom amount (min ₹10)"
                  value={customAmt}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setCustomAmt(cleaned);
                  }}
                  className="w-full rounded-xl border border-white/20 bg-teal-950/70 py-2.5 pl-8 pr-3 text-base sm:text-sm font-bold text-white outline-none focus:border-amber-400 placeholder:text-white/40"
                />
              </div>

              {/* Quick increment chips */}
              <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-0.5">
                {[100, 500, 1000, 2500].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => {
                      const cur = customAmt ? Number(customAmt) || 0 : selectedAmt;
                      setCustomAmt(String(cur + inc));
                    }}
                    className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1.5 text-xs font-bold text-amber-200 transition cursor-pointer"
                  >
                    +{formatINR(inc)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Applied Math & Emotional Reality Box */}
          <div className="mt-3.5 rounded-2xl bg-teal-950/80 p-3 sm:p-4 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <span>🌸</span>
                <span>Direct Impact for 25 Resident Boys:</span>
              </div>
              <p className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                {activeTier
                  ? activeTier.impact
                  : `Your contribution of ${formatINR(effectiveAmount)} translates directly into essential kitchen groceries, nutrition, and child care.`}
              </p>
              {amountWords && (
                <p className="text-[11px] text-amber-200/80 italic font-mono">
                  Rupees: {amountWords}
                </p>
              )}
            </div>

            {/* 80G Tax Savings Arithmetic */}
            <div className="shrink-0 rounded-xl bg-emerald-950/70 border border-emerald-400/30 p-2.5 text-center sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                Form 10AC Section 80G
              </span>
              <span className="font-display text-sm sm:text-base font-extrabold text-white block mt-0.5">
                Save ~{formatINR(taxSavings)} in Tax
              </span>
              <span className="text-[10px] text-emerald-200/70 block">
                Effective cost: only {formatINR(Math.max(0, effectiveAmount - taxSavings))}
              </span>
            </div>
          </div>

          {/* Finger-First Primary Donation CTA & Secondary Birthday Link */}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleHeroDonate}
              className="focus-ring tap-scale w-full sm:flex-1 py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 text-teal-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-orange-500/30 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 animate-heartbeat"
            >
              <span>FEED 25 BOYS NOW · {formatINR(effectiveAmount)}</span>
              <span>💝 →</span>
            </button>

            <Link
              href="/celebrate-birthday"
              className="focus-ring tap-scale w-full sm:w-auto py-3.5 sm:py-4 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-xs sm:text-sm text-center transition flex items-center justify-center gap-2"
            >
              <span>Celebrate Birthday With Boys</span>
              <span>🎂</span>
            </Link>
          </div>

          {/* Trust Guarantees Footer */}
          <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-white/80 font-medium">
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

