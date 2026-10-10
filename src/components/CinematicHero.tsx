"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteContentMap } from "@/lib/site-content";
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
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  const posterSrc = content?.heroPosterUrl || "/media/poster-desktop.jpg";
  const videoSrc = content?.heroVideoUrl || "/media/video-chant-prayer.mp4";

  useEffect(() => {
    track("hero_view", { type: "cinematic_video_hero" });
  }, []);

  useEffect(() => {
    setVideoReady(false);
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

  return (
    <section
      aria-label="Janaseva Ashrama Introduction and Video"
      className="relative w-full max-w-full overflow-hidden bg-teal-950 flex flex-col text-white"
    >
      {/* ── 1. FULL-WIDTH 100% UNOBSTRUCTED CINEMATIC VIDEO VIEWPORT ── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:h-[62svh] lg:h-[70svh] min-h-[260px] max-h-[760px] overflow-hidden bg-black select-none flex items-center justify-center">
        {/* Background poster (LCP-critical, authentic Ashrama 25 boys in orange prayer) */}
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

        {/* Autoplay edge-to-edge looping video of real Janaseva Ashrama prayer hall */}
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

      {/* ── 2. DYNAMIC MISSION HEADLINE & AWARENESS STRIP ── */}
      <div className="w-full bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 border-b border-teal-800/60 py-3.5 px-4 text-center">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-base sm:text-lg md:text-xl font-black tracking-tight text-white leading-snug">
            {content?.heroHeadline || "Pure Love, Wholesome Food & Education for 25 Boys"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-teal-100/85 max-w-3xl mx-auto leading-relaxed">
            {content?.heroSubheadline || "See what today looks like at Janaseva Ashrama — and choose how you want to be part of tomorrow."}
          </p>
        </div>
      </div>
    </section>
  );
}
