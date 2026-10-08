"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CINEMATIC, SITE, formatINR } from "@/lib/site";
import type { SiteContentMap } from "@/lib/site-content";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

const HERO_PRESETS = [
  { slug: "meal", label: "Warm Meal", amount: 100 },
  { slug: "fruits", label: "Fruit & Milk", amount: 150 },
  { slug: "school-kit", label: "School Kit", amount: 250 },
  { slug: "uniform", label: "Uniform", amount: 400 },
  { slug: "birthday-feast", label: "Birthday Feast", amount: 1500 },
];

export function CinematicHero({ content }: { content?: Partial<SiteContentMap> }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [addedSlug, setAddedSlug] = useState<string | null>(null);
  const cart = useCart();

  useEffect(() => {
    track("hero_view", { type: "cinematic_hero" });
  }, []);

  const handleQuickAdd = (slug: string) => {
    const current = cart.qty[slug] || 0;
    cart.setQty(slug, current + 1);
    setAddedSlug(slug);
    track("hero_preset_add", { slug });
    setTimeout(() => setAddedSlug(null), 2200);
  };

  const toggleSound = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const posterSrc = content?.heroPosterUrl || CINEMATIC.posterDesktop;
  const videoSrc = content?.heroVideoUrl || CINEMATIC.videoDesktop;
  const headline = content?.heroHeadline || "A HOME TODAY.\nA FUTURE WE BUILD TOGETHER.";
  const subheadline =
    content?.heroSubheadline ||
    `Janaseva Ashrama is a licensed children's home & orphanage in Bengaluru providing daily nutritious meals (Annadana), school education, medical care, and safe shelter for 25 young boys (ages 07–18) under Juvenile Justice Act Form 28 (KA18CH0242). 100% direct allocation with Form 10AC 80G tax exemption.`;

  return (
    <section
      aria-label="Janaseva Ashrama Introduction"
      className="relative min-h-[88svh] max-h-[860px] w-full max-w-full overflow-hidden bg-teal-950 flex flex-col justify-between"
    >
      {/* Background poster (LCP-critical, fetchPriority=high) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={posterSrc}
        alt="Children smiling at Janaseva Ashrama"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* Autoplay ambient video (fades in over poster) */}
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
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1200 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Multi-layer scrim: natural gradient, darker at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-950/55 to-teal-950/40" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-teal-950 to-transparent" />

      {/* ── SOUND TOGGLE ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 flex justify-end">
        <button
          type="button"
          onClick={toggleSound}
          aria-label={isMuted ? "Unmute ambient sound" : "Mute ambient sound"}
          className="focus-ring tap-scale flex items-center gap-2 rounded-xl border border-white/25 bg-teal-950/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-teal-900/70 shadow transition cursor-pointer"
        >
          {isMuted ? (
            <svg className="h-4 w-4 fill-current text-white/70" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27l4.73 4.73H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 fill-current text-gold" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
          <span className="hidden sm:inline">{isMuted ? "Sound Off" : "Sound On"}</span>
        </button>
      </div>

      {/* ── MAIN HERO CONTENT ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 flex-1 flex flex-col justify-end pb-4 sm:pb-6">
        <div className="w-full lg:grid lg:grid-cols-[1.3fr_0.9fr] lg:gap-10 xl:gap-14 lg:items-end">
          {/* Left Column */}
          <div className="max-w-2xl">
            {/* Trust badges row */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-teal-900/80 border border-gold/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold backdrop-blur">
                Bangalore · Registered Public Trust
              </span>
              <span className="rounded-lg bg-white/15 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur">
                Form 10AC 80G Tax Exemption
              </span>
              <span className="rounded-lg bg-white/15 px-3 py-1 text-[11px] font-bold text-white/90 backdrop-blur">
                JJ Act Reg: KA18CH0242
              </span>
              <span className="rounded-lg bg-emerald-500/25 border border-emerald-400/30 px-3 py-1 text-[11px] font-bold text-emerald-200 backdrop-blur">
                MCA CSR-1: CSR00078800
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.07] text-white tracking-tight">
              {headline.split("\n").map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>

            {/* Sub-headline */}
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-white/85 max-w-xl">
              {subheadline}
            </p>

            {/* Quick-add impact chips */}
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-200/80 mb-2.5">
                Select an Immediate Need:
              </p>
              <div className="flex flex-wrap gap-2">
                {HERO_PRESETS.map((p) => {
                  const inCart = (cart.qty[p.slug] || 0) > 0;
                  const justAdded = addedSlug === p.slug;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => handleQuickAdd(p.slug)}
                      className={`focus-ring tap-scale inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer ${
                        justAdded
                          ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                          : inCart
                          ? "bg-gold text-teal-950 font-extrabold ring-2 ring-white/50"
                          : "bg-white/18 text-white backdrop-blur hover:bg-white/28 border border-white/20"
                      }`}
                    >
                      <span>{p.label}</span>
                      <span className="opacity-75 font-normal">({formatINR(p.amount)})</span>
                      <span className="font-bold">
                        {justAdded ? "✓" : inCart ? `(${cart.qty[p.slug]})+` : "+"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary CTA pair */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleQuickAdd("meal")}
                className="btn-primary cursor-pointer"
              >
                FEED A CHILD TODAY (₹100)
              </button>

              <Link
                href="/celebrate-special-day"
                className="btn-outline-gold cursor-pointer"
              >
                CELEBRATE AN OCCASION
              </Link>

              <a
                href="#impact"
                className="focus-ring px-3 py-2 text-xs font-bold text-white/75 hover:text-white transition underline underline-offset-4 cursor-pointer"
              >
                Explore all needs ↓
              </a>
            </div>
          </div>

          {/* Right Column: Desktop Interactive Impact Snapshot Card */}
          <div className="hidden lg:flex flex-col rounded-3xl bg-teal-950/80 p-6 xl:p-7 backdrop-blur-xl border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Live Ashram Snapshot
                </span>
              </div>
              <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold uppercase tracking-wider">
                Bengaluru Campus
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-2xl bg-white/10 p-2.5 border border-white/10">
                <span className="block font-display text-2xl font-black text-gold">25</span>
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Resident Boys (07–18 Yrs)</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-2.5 border border-white/10">
                <span className="block font-display text-2xl font-black text-white">3</span>
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Hot Meals Daily</span>
              </div>
              <div className="rounded-2xl bg-white/10 p-2.5 border border-white/10">
                <span className="block font-display text-2xl font-black text-emerald-400">100%</span>
                <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Direct To Plate</span>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Instant Annadana Seva
                </span>
                <span className="text-[11px] text-gold font-semibold">
                  Kitchen Allocation
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { title: "1 Child Meal", cost: 100, slug: "meal" },
                  { title: "5 Child Meals", cost: 500, slug: "meal", qty: 5 },
                  { title: "Day Breakfast", cost: 1500, slug: "meal", qty: 15 },
                  { title: "Birthday Feast", cost: 3500, slug: "birthday-feast" },
                ].map((tier) => (
                  <button
                    key={tier.title}
                    type="button"
                    onClick={() => {
                      if (tier.qty) cart.setQty("meal", (cart.qty["meal"] || 0) + tier.qty);
                      else handleQuickAdd(tier.slug);
                    }}
                    className="focus-ring rounded-xl bg-white/10 hover:bg-white/20 p-2 text-left border border-white/15 transition cursor-pointer"
                  >
                    <span className="block text-xs font-bold text-white">{tier.title}</span>
                    <span className="block font-display text-sm font-black text-gold">{formatINR(tier.cost)}</span>
                  </button>
                ))}
              </div>

              <Link
                href="/checkout"
                onClick={() => {
                  if (cart.total === 0) handleQuickAdd("meal");
                }}
                className="focus-ring block w-full rounded-xl bg-saffron py-3 text-center text-xs font-extrabold uppercase tracking-wider text-white shadow-lg hover:bg-saffron-dark transition cursor-pointer"
              >
                SPONSOR ANNADANA ONLINE →
              </Link>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-white/75">
              <span className="flex items-center gap-1 font-semibold text-emerald-300">
                <span>✓</span> Form 10AC 80G Tax Deductible
              </span>
              <span className="text-white/60">
                UPI (GPay / PhonePe)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CLEAN TRUST ROW (Zero lag) ── */}
      <div className="relative z-10 border-t border-white/10 bg-teal-950/85 backdrop-blur-sm py-2 px-4">
        <div className="mx-auto flex max-w-7xl px-4 sm:px-6 lg:px-8 flex-wrap items-center justify-between gap-2 text-xs font-semibold text-white/80">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>25 Children Sheltered &amp; Educated</span>
          </span>
          <span className="hidden sm:inline">·</span>
          <span>JJ Act Reg: KA18CH0242</span>
          <span className="hidden sm:inline">·</span>
          <span>MCA CSR-1: CSR00078800</span>
          <span className="hidden sm:inline">·</span>
          <span>Form 10AC 80G Tax Exemption</span>
          <span className="hidden sm:inline">·</span>
          <span>100% Direct Allocation</span>
        </div>
      </div>
    </section>
  );
}
