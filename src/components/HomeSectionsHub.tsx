"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { track } from "@/lib/track";
import { VerticalSectionRail } from "./VerticalSectionRail";
import { OfficialSupportTiersSection } from "./sections/OfficialSupportTiersSection";
import { HorizontalMovingReel } from "./HorizontalMovingReel";
import { TodaySection } from "./sections/TodaySection";
import { ImpactCart } from "./ImpactCart";
import { TrendingBirthdaySection } from "./sections/TrendingBirthdaySection";
import { EmotionalQuotesSection } from "./sections/EmotionalQuotesSection";
import { RealBoysGallerySection } from "./sections/RealBoysGallerySection";
import { DocumentaryVideoSection } from "./sections/DocumentaryVideoSection";
import { TransparencySection } from "./sections/TransparencySection";
import { TrustSection } from "./sections/TrustSection";
import { VerifiedImpactSection } from "./sections/VerifiedImpactSection";
import { CommunityActivitiesSection } from "./sections/CommunityActivitiesSection";
import { DonationFAQ } from "./DonationFAQ";
import { InvolvedSection } from "./sections/InvolvedSection";
import { FutureSection } from "./sections/FutureSection";
import { ContactSection } from "./sections/ContactSection";
import { Container } from "./ui";
import { BANK_DETAILS } from "@/lib/site";

export type HomeMode = "all" | "annadana" | "tiers" | "celebrate" | "life" | "trust";

interface ModeItem {
  id: HomeMode;
  label: string;
  icon: string;
  badge: string;
  description: string;
}

const MODES: ModeItem[] = [
  {
    id: "all",
    label: "All Highlights",
    icon: "🌟",
    badge: "Smart View",
    description: "Compact complete overview of Janaseva Ashrama",
  },
  {
    id: "annadana",
    label: "Annadana & Meals",
    icon: "🍲",
    badge: "₹11+ Shagun",
    description: "Daily breakfast, lunch & dinner for 25 boys",
  },
  {
    id: "tiers",
    label: "5 Support Tiers",
    icon: "🏛️",
    badge: "Official",
    description: "Form 28 JJ Act registered sponsorship tiers",
  },
  {
    id: "celebrate",
    label: "Birthday & Feasts",
    icon: "🎂",
    badge: "Video Song",
    description: "Sponsor cake, sweets & get a video song blessing",
  },
  {
    id: "life",
    label: "Boys' Life & Gallery",
    icon: "📸",
    badge: "60 Moments",
    description: "Documentary chapters, photos & daily prayers",
  },
  {
    id: "trust",
    label: "Trust & 80G Tax",
    icon: "🛡️",
    badge: "100% Verified",
    description: "Form 10AC, CSR-1, Axis Bank wire & FAQs",
  },
];

interface HomeSectionsHubProps {
  updates: any[];
  docs: any[];
  metrics: any[];
  totals: { total: number; donations: number };
  siteContent: any;
}

export function HomeSectionsHub({
  updates,
  docs,
  metrics,
  totals,
  siteContent,
}: HomeSectionsHubProps) {
  const [activeMode, setActiveMode] = useState<HomeMode>("all");
  const [showCommunityDrawer, setShowCommunityDrawer] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);

  // Sync mode with window location hash if user navigates with direct links
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "annadana" || hash === "today" || hash === "impact") {
        setActiveMode("annadana");
      } else if (hash === "tiers" || hash === "official-tiers" || hash === "support") {
        setActiveMode("tiers");
      } else if (hash === "celebrate" || hash === "birthday") {
        setActiveMode("celebrate");
      } else if (hash === "life" || hash === "gallery" || hash === "boys-gallery" || hash === "videos") {
        setActiveMode("life");
      } else if (hash === "trust" || hash === "transparency" || hash === "faq" || hash === "contact") {
        setActiveMode("trust");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchMode = (mode: HomeMode, targetAnchor?: string) => {
    setActiveMode(mode);
    track("home_mode_switched", { mode, targetAnchor: targetAnchor || "" });

    if (mode !== "all") {
      window.history.replaceState(null, "", `#${mode}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }

    // Smooth scroll to hub top
    if (hubRef.current) {
      const yOffset = -90;
      const y = hubRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }

    if (targetAnchor) {
      setTimeout(() => {
        const el = document.getElementById(targetAnchor);
        if (el) {
          const yOffset = -110;
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 150);
    }
  };

  return (
    <div ref={hubRef} className="relative w-full">
      {/* ── VERTICAL QUICK-JUMP FLOATING RAIL (Side Thumb Index) ── */}
      <VerticalSectionRail
        currentMode={activeMode}
        onSelectMode={(mode, targetId) => switchMode(mode as HomeMode, targetId)}
      />

      {/* ── STICKY TOP VERTICAL SECTION SWITCHER (Segmented Controller) ── */}
      <nav
        aria-label="Home Vertical Section Modes"
        className="sticky top-14 z-30 w-full border-b border-teal-900/10 bg-white/95 backdrop-blur-md shadow-xs no-print"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2">
          {/* iOS Style Segmented Control Track */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 justify-start md:justify-center">
            {MODES.map((m) => {
              const isSelected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => switchMode(m.id)}
                  className={`focus-ring tap-scale inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 sm:px-3.5 py-2 text-xs font-bold shrink-0 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-teal-900 text-white shadow-sm ring-1 ring-teal-800 scale-[1.02]"
                      : "bg-cream/80 text-teal-950/75 hover:bg-sand/70 hover:text-teal-950"
                  }`}
                >
                  <span className="text-sm select-none">{m.icon}</span>
                  <span>{m.label}</span>
                  <span
                    className={`rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase ${
                      isSelected
                        ? "bg-gold text-teal-950"
                        : "bg-teal-900/10 text-teal-900"
                    }`}
                  >
                    {m.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Helper Subtext on Mobile to reduce scrolling fatigue */}
          <div className="mt-1 flex items-center justify-between text-[10px] text-teal-950/60 font-semibold px-1">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {activeMode === "all"
                  ? "Showing All Highlights (Tap any section above to filter & reduce scroll)"
                  : `Viewing: ${MODES.find((m) => m.id === activeMode)?.label}`}
              </span>
            </span>

            {activeMode !== "all" && (
              <button
                type="button"
                onClick={() => switchMode("all")}
                className="text-saffron-dark font-extrabold hover:underline"
              >
                ← Back to All Highlights
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ============================================================== */}
      {/* ── MODE 1: ANNADANA & DAILY MEALS HUB ── */}
      {/* ============================================================== */}
      {activeMode === "annadana" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Section Breadcrumb & Header Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-cream to-amber-50/50 border-b border-amber-200/60 py-6 px-4 text-center">
            <Container>
              <span className="inline-block rounded-full bg-saffron/15 text-saffron-dark px-3 py-1 text-xs font-black uppercase tracking-wider mb-2">
                🍛 Daily Kitchen &amp; Auspicious Shagun Annadana
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-teal-950">
                Feed 25 Resident Boys Today
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-teal-950/75 max-w-2xl mx-auto">
                Select Shagun amounts (₹11, ₹21, ₹51, ₹101, ₹251, ₹501) for 1-tap direct giving. Every rupee provides hot, nutritious, satvik meals prepared before dawn.
              </p>
            </Container>
          </div>

          {/* Today's Ground Updates & Real Meals Status */}
          <TodaySection updates={updates} />

          {/* Giving Basket Catalogue */}
          <ImpactCart />

          {/* Axis Bank Direct UPI Seva Card for Annadana */}
          <section className="py-8 bg-sand/30 border-t border-teal-900/10">
            <Container>
              <div className="rounded-3xl bg-teal-950 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="rounded-md bg-gold/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
                    Direct Bank Seva
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-bold mt-2">
                    Prefer Direct Bank / UPI Annadana?
                  </h3>
                  <p className="text-xs text-white/70 mt-1 max-w-xl">
                    Transfer directly to Janaseva Ashrama Axis Bank Banashankari account:{" "}
                    <span className="font-mono text-gold font-bold">{BANK_DETAILS.accountNumber}</span> (IFSC:{" "}
                    <span className="font-mono text-gold font-bold">{BANK_DETAILS.ifscCode}</span>). Instant 80G receipt provided.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => switchMode("all")}
                  className="rounded-xl bg-saffron px-5 py-3 text-xs font-bold text-white hover:bg-saffron-dark transition shrink-0"
                >
                  Explore Other Ashrama Pillars →
                </button>
              </div>
            </Container>
          </section>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── MODE 2: 5 OFFICIAL SUPPORT TIERS HUB ── */}
      {/* ============================================================== */}
      {activeMode === "tiers" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-teal-900 via-teal-950 to-teal-900 text-white py-8 px-4 text-center">
            <Container>
              <span className="inline-block rounded-full bg-gold/20 text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2">
                🏛️ Official Trust Sponsorship Program
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                5 Official Support Tiers &amp; Pricing
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-2xl mx-auto">
                Governed under Juvenile Justice Act Form 28 (KA18CH0242). Choose from full-day Annadana, monthly nutrition, clothing sets, or schooling for 25 boys.
              </p>
            </Container>
          </div>

          <OfficialSupportTiersSection />

          {/* Quick Back Switcher */}
          <div className="py-6 text-center">
            <button
              type="button"
              onClick={() => switchMode("all")}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-900 px-6 py-3 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
            >
              ← Back to All Highlights
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── MODE 3: CELEBRATION & BIRTHDAY HUB ── */}
      {/* ============================================================== */}
      {activeMode === "celebrate" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50 border-b border-rose-200/50 py-8 px-4 text-center">
            <Container>
              <span className="inline-block rounded-full bg-rose-500/15 text-rose-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2">
                🎂 Auspicious Milestones &amp; Birthday Feasts
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-teal-950">
                Celebrate Your Special Day with 25 Boys
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-teal-950/75 max-w-2xl mx-auto">
                Sponsor a joyous birthday sweet feast with payasam, pooris, and cake cutting. The 25 boys will record a personalized singing video blessing delivered to your WhatsApp.
              </p>
            </Container>
          </div>

          <TrendingBirthdaySection wishVideos={siteContent?.wishVideos} />

          {/* Back Switcher */}
          <div className="py-6 text-center">
            <button
              type="button"
              onClick={() => switchMode("all")}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-900 px-6 py-3 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
            >
              ← Back to All Highlights
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── MODE 4: REAL BOYS & ASHRAMA LIFE HUB ── */}
      {/* ============================================================== */}
      {activeMode === "life" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-teal-950 text-white py-8 px-4 text-center">
            <Container>
              <span className="inline-block rounded-full bg-gold/20 text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2">
                📸 Authentic Visual Moments &amp; Documentary
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Life Inside Janaseva Ashrama
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-2xl mx-auto">
                Explore 60 authentic photographs, daily prayer videos, abacus classes, courtyard games, and reflections from the caretakers who guide our 25 boys.
              </p>
            </Container>
          </div>

          {/* Moving Reel */}
          <HorizontalMovingReel />

          {/* Full Interactive 60 Photos Gallery */}
          <RealBoysGallerySection />

          {/* Documentary Chapters */}
          <DocumentaryVideoSection />

          {/* Voices of Caregivers */}
          <EmotionalQuotesSection />

          {/* Back Switcher */}
          <div className="py-6 text-center">
            <button
              type="button"
              onClick={() => switchMode("all")}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-900 px-6 py-3 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
            >
              ← Back to All Highlights
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── MODE 5: TRUST, 80G TAX EXEMPTION & BANK HUB ── */}
      {/* ============================================================== */}
      {activeMode === "trust" && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="bg-emerald-950 text-white py-8 px-4 text-center">
            <Container>
              <span className="inline-block rounded-full bg-emerald-500/20 text-emerald-300 px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2">
                🛡️ Verified Legal Accreditations &amp; 80G Tax Exemption
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Complete Transparency &amp; Official Banking
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 max-w-2xl mx-auto">
                Inspect official Form 10AC, Form 28 (JJ Act), MCA CSR-1, 12AA certificate, and Banashankari Axis Bank transfer details. 100% direct allocation.
              </p>
            </Container>
          </div>

          {/* 5 Legal Documents */}
          <TransparencySection docs={docs} />

          {/* Trust Pillars & Bank */}
          <TrustSection />

          {/* Platform Verified Counters */}
          <VerifiedImpactSection metrics={metrics} totals={totals} />

          {/* Frequently Asked Questions */}
          <section id="faq" className="scroll-mt-14 py-8 bg-sand/35">
            <Container>
              <DonationFAQ />
            </Container>
          </section>

          {/* Location & Directions */}
          <ContactSection />

          {/* Back Switcher */}
          <div className="py-6 text-center">
            <button
              type="button"
              onClick={() => switchMode("all")}
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-900 px-6 py-3 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
            >
              ← Back to All Highlights
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ── MODE 6: ALL HIGHLIGHTS (SMART COMPACT CONSOLIDATED VIEW) ── */}
      {/* ============================================================== */}
      {activeMode === "all" && (
        <div className="space-y-0 animate-fadeIn">
          {/* 1. Exact 5 Official Support Tiers & Pricing */}
          <OfficialSupportTiersSection />

          {/* 2. Horizontal Moving Reel */}
          <HorizontalMovingReel />

          {/* 3. Today at Janaseva */}
          <TodaySection updates={updates} />

          {/* 4. Verified Needs Catalogue & Direct Giving Basket */}
          <ImpactCart />

          {/* 5. Birthday & Milestone Feasts */}
          <TrendingBirthdaySection wishVideos={siteContent?.wishVideos} />

          {/* 6. Emotional Voices & Reflections */}
          <EmotionalQuotesSection />

          {/* 7. Real Boys Visual Gallery */}
          <RealBoysGallerySection />

          {/* 8. Documentary Video Chapters */}
          <DocumentaryVideoSection />

          {/* 9. Transparency Center & 5 Official Govt Accreditations */}
          <TransparencySection docs={docs} />

          {/* 10. Trust & Axis Bank Direct Details */}
          <TrustSection />

          {/* 11. Verified Platform Impact Numbers */}
          <VerifiedImpactSection metrics={metrics} totals={totals} />

          {/* 12. SMART COLLAPSIBLE DRAWER FOR COMMUNITY, VOLUNTEERS & VISION */}
          {/* This dramatically reduces scrolling fatigue by collapsing 4,000px of forms */}
          <section className="py-8 bg-gradient-to-b from-cream to-sand/40 border-y border-teal-900/10">
            <Container>
              <div className="rounded-3xl bg-white p-6 sm:p-8 border border-teal-900/15 shadow-sm text-center">
                <span className="text-3xl select-none" aria-hidden="true">🤝</span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-teal-950 mt-2">
                  Community Outreach, Volunteer Crew &amp; Campus Expansion Vision
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-teal-950/75 max-w-2xl mx-auto leading-relaxed">
                  Looking to teach children on weekends, participate in medical camps, or support our CSR campus blueprint? Explore our community programs below.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowCommunityDrawer((prev) => !prev)}
                    className="focus-ring inline-flex items-center gap-2 rounded-2xl bg-teal-900 px-6 py-3.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>
                      {showCommunityDrawer
                        ? "▲ Collapse Community & Campus Vision"
                        : "▼ Explore Community Outreach & Campus Blueprint (Tap to Expand)"}
                    </span>
                  </button>
                </div>

                {/* Expanded Content */}
                {showCommunityDrawer && (
                  <div className="mt-8 pt-8 border-t border-teal-900/10 text-left space-y-12 animate-fadeIn">
                    <CommunityActivitiesSection />
                    <InvolvedSection />
                    <FutureSection />
                  </div>
                )}
              </div>
            </Container>
          </section>

          {/* 13. Frequently Asked Questions */}
          <section id="faq" className="scroll-mt-14 py-10 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
            <Container>
              <DonationFAQ />
            </Container>
          </section>

          {/* 14. Bengaluru Location, Map & Contact */}
          <ContactSection />
        </div>
      )}
    </div>
  );
}
