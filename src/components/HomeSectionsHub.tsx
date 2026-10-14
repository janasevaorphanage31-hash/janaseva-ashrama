"use client";

import { useEffect, useState, useRef } from "react";
import { track } from "@/lib/track";

import { OfficialSupportTiersSection } from "./sections/OfficialSupportTiersSection";
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
import { CommunityV2Section } from "./sections/CommunityV2Section";
import { TodaySection } from "./sections/TodaySection";
import { ContactSection } from "./sections/ContactSection";
import { Container } from "./ui";
import type { SiteContentMap } from "@/lib/site-content";
import type {
  getDocuments,
  getMetrics,
  getTodayUpdates,
  getVerifiedPlatformTotals,
  getApprovedMedia,
} from "@/lib/content";

export type HomeMode = "all" | "tiers" | "celebrate" | "annadana" | "life" | "community" | "trust";

interface ModeItem {
  id: HomeMode;
  label: string;
  icon: string;
  badge: string;
  targetId: string;
  description: string;
}

const MODES: ModeItem[] = [
  {
    id: "all",
    label: "All Stories",
    icon: "🌟",
    badge: "All",
    targetId: "hub-top",
    description: "Complete continuous journey of Janaseva Ashrama",
  },
  {
    id: "tiers",
    label: "Sponsor 25 Boys",
    icon: "🏛️",
    badge: "Form 28",
    targetId: "official-tiers",
    description: "Form 28 JJ Act registered 5 official sponsorship tiers",
  },
  {
    id: "celebrate",
    label: "Birthdays",
    icon: "🎂",
    badge: "Trending",
    targetId: "celebrate",
    description: "Celebrate birthday with 25 boys, cake & WhatsApp video wish",
  },
  {
    id: "annadana",
    label: "Daily Needs & Catalog",
    icon: "🍲",
    badge: "₹11+",
    targetId: "impact",
    description: "Live daily meals tracker, categorized needs & Giving Basket",
  },
  {
    id: "life",
    label: "Campus Life",
    icon: "📸",
    badge: "Moments",
    targetId: "boys-gallery",
    description: "Real photos, abacus classes & daily documentary moments",
  },
  {
    id: "community",
    label: "Volunteer",
    icon: "🤝",
    badge: "2.5h/Wk",
    targetId: "volunteer",
    description: "Give 2.5 hrs/week mentoring, coaching & life skills",
  },
  {
    id: "trust",
    label: "80G Trust",
    icon: "🛡️",
    badge: "Verified",
    targetId: "transparency",
    description: "Form 10AC, CSR-1, Axis Bank wire & FAQs",
  },
];

const MODE_TARGET_MAP: Record<HomeMode, string> = {
  all: "hub-top",
  tiers: "official-tiers",
  celebrate: "celebrate",
  annadana: "impact",
  life: "boys-gallery",
  community: "volunteer",
  trust: "transparency",
};

const HASH_MODE_MAP: Record<string, HomeMode> = {
  "hub-top": "all",
  top: "all",
  all: "all",
  stories: "all",
  "official-tiers": "tiers",
  tiers: "tiers",
  sponsor: "tiers",
  sponsorship: "tiers",
  celebrate: "celebrate",
  birthday: "celebrate",
  birthdays: "celebrate",
  feast: "celebrate",
  catalog: "annadana",
  needs: "annadana",
  today: "annadana",
  "today-meals": "annadana",
  meals: "annadana",
  impact: "annadana",
  annadana: "annadana",
  basket: "annadana",
  "boys-gallery": "life",
  "life-in-motion": "life",
  "ashrama-life": "life",
  life: "life",
  gallery: "life",
  photos: "life",
  documentary: "life",
  community: "community",
  volunteer: "community",
  activities: "community",
  crew: "community",
  transparency: "trust",
  trust: "trust",
  "80g": "trust",
  bank: "trust",
  faq: "trust",
  contact: "trust",
};

export interface HomeSectionsHubProps {
  updates: Awaited<ReturnType<typeof getTodayUpdates>>;
  docs: Awaited<ReturnType<typeof getDocuments>>;
  metrics: Awaited<ReturnType<typeof getMetrics>>;
  totals: Awaited<ReturnType<typeof getVerifiedPlatformTotals>>;
  siteContent: Partial<SiteContentMap> & Record<string, any>;
  approvedMedia?: Awaited<ReturnType<typeof getApprovedMedia>>;
}

export function HomeSectionsHub({
  updates,
  docs,
  metrics,
  totals,
  siteContent,
  approvedMedia,
}: HomeSectionsHubProps) {
  const [activeMode, setActiveMode] = useState<HomeMode>("all");
  const hubRef = useRef<HTMLDivElement>(null);
  const activeModeRef = useRef<HomeMode>(activeMode);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Switch between Themes, Catalog, or All Stories
  const switchMode = (mode: HomeMode, targetAnchor?: string) => {
    setActiveMode(mode);
    track("home_mode_select", { mode });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("janaseva:home-mode-changed", { detail: { mode } }));

      const targetId = targetAnchor || MODE_TARGET_MAP[mode] || "hub-top";
      if (mode !== "all") {
        window.history.replaceState(null, "", `#${targetId}`);
      } else {
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Center the active pill in the horizontal sticky bar
      const activeBtn = document.getElementById(`mode-pill-${mode}`);
      const containerTrack = activeBtn?.parentElement;
      if (containerTrack && activeBtn) {
        const targetLeft = activeBtn.offsetLeft - containerTrack.clientWidth / 2 + activeBtn.clientWidth / 2;
        containerTrack.scrollTo({ left: targetLeft, behavior: "smooth" });
      }

      // Smooth scroll to top of the Hub so the theme starts right below the sticky navigation
      if (hubRef.current) {
        const yOffset = -70;
        const y = hubRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  // Listen to custom event dispatched by BottomNav or other components
  useEffect(() => {
    const handleSetMode = (e: any) => {
      const mode = e.detail?.mode as HomeMode | undefined;
      if (mode && MODES.some((m) => m.id === mode)) {
        switchMode(mode);
      }
    };
    window.addEventListener("janaseva:set-home-mode", handleSetMode);
    return () => window.removeEventListener("janaseva:set-home-mode", handleSetMode);
  }, []);

  // Listen to mount URL and hashchange event so any link to /#theme triggers smooth theme switch
  useEffect(() => {
    const syncFromLocation = () => {
      if (typeof window === "undefined") return;

      // 1. Check URL query params e.g. ?theme=celebrate
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get("theme") as HomeMode | null;
      if (themeParam && MODES.some((m) => m.id === themeParam)) {
        switchMode(themeParam);
        return;
      }

      // 2. Check URL hash e.g. #celebrate, #official-tiers, #catalog
      const rawHash = window.location.hash.replace(/^#/, "");
      if (rawHash) {
        const mappedMode = HASH_MODE_MAP[rawHash];
        if (mappedMode) {
          switchMode(mappedMode);
        }
      }
    };

    // Global click listener to intercept any link with a mapped hash
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;

      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      const targetPath = href.substring(0, hashIndex);
      const isCurrentPage =
        !targetPath ||
        targetPath === "/" ||
        (typeof window !== "undefined" && targetPath === window.location.pathname);
      if (!isCurrentPage) return;

      const hash = href.substring(hashIndex + 1);
      const mappedMode = HASH_MODE_MAP[hash];
      if (mappedMode) {
        e.preventDefault();
        switchMode(mappedMode, hash);
      }
    };

    const timer = setTimeout(syncFromLocation, 150);
    window.addEventListener("hashchange", syncFromLocation);
    document.addEventListener("click", handleDocumentClick, { capture: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", syncFromLocation);
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  // In 'all' mode only: monitor scroll to highlight bottom navigation accurately
  useEffect(() => {
    if (activeMode !== "all") return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 240;
          const trEl = document.getElementById("transparency") || document.getElementById("trust");
          const volEl = document.getElementById("volunteer") || document.getElementById("community");
          const galEl = document.getElementById("boys-gallery");
          const impEl = document.getElementById("impact") || document.getElementById("today");
          const celEl = document.getElementById("celebrate");

          let detected: string = "home";
          if (trEl && trEl.offsetTop <= scrollPos) {
            detected = "trust";
          } else if (volEl && volEl.offsetTop <= scrollPos) {
            detected = "volunteer";
          } else if (galEl && galEl.offsetTop <= scrollPos) {
            detected = "life";
          } else if (impEl && impEl.offsetTop <= scrollPos) {
            detected = "catalog";
          } else if (celEl && celEl.offsetTop <= scrollPos) {
            detected = "celebrate";
          }

          window.dispatchEvent(new CustomEvent("janaseva:home-mode-changed", { detail: { mode: detected } }));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeMode]);

  // Reusable theme bottom switcher
  function renderThemeFooter(currentMode: HomeMode) {
    return (
      <div className="py-10 px-4 bg-gradient-to-b from-cream to-sand/40 border-t border-teal-900/10 text-center">
        <Container>
          <p className="text-[11px] font-black uppercase tracking-wider text-teal-950/60 mb-3">
            Explore Another Giving Theme or Return to All Stories
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => switchMode("all")}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm cursor-pointer"
            >
              <span>🌟 View All Stories</span>
            </button>
            {currentMode !== "tiers" && (
              <button
                type="button"
                onClick={() => switchMode("tiers")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🏛️ Sponsor 25 Boys</span>
              </button>
            )}
            {currentMode !== "celebrate" && (
              <button
                type="button"
                onClick={() => switchMode("celebrate")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🎂 Birthdays</span>
              </button>
            )}
            {currentMode !== "annadana" && (
              <button
                type="button"
                onClick={() => switchMode("annadana")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🍲 Daily Needs Catalog</span>
              </button>
            )}
            {currentMode !== "life" && (
              <button
                type="button"
                onClick={() => switchMode("life")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>📸 Campus Life</span>
              </button>
            )}
            {currentMode !== "community" && (
              <button
                type="button"
                onClick={() => switchMode("community")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🤝 Volunteer</span>
              </button>
            )}
            {currentMode !== "trust" && (
              <button
                type="button"
                onClick={() => switchMode("trust")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🛡️ 80G Trust</span>
              </button>
            )}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div ref={hubRef} className="relative w-full">
      {/* Target anchor for top of hub */}
      <div id="hub-top" className="scroll-mt-28" />

      {/* ── STICKY TOP SECTION SWITCHER (Segmented Controller) ── */}
      <nav
        aria-label="Home Section Switcher"
        className="sticky top-14 sm:top-16 z-30 w-full border-b border-teal-900/10 bg-white/95 backdrop-blur-md shadow-xs no-print"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-2">
          {/* iOS Style Segmented Control Track */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 justify-start md:justify-center">
            {MODES.map((m) => {
              const isSelected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  id={`mode-pill-${m.id}`}
                  type="button"
                  onClick={() => switchMode(m.id, m.targetId)}
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

          {/* Clean minimal indicator (hidden on mobile to save vertical viewport space) */}
          <div className="hidden sm:flex mt-1 items-center justify-between text-[10px] text-teal-950/60 font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {activeMode === "all"
                  ? "Showing All Stories · Tap any theme or catalog pill to view dedicated section"
                  : `Currently viewing: ${MODES.find((m) => m.id === activeMode)?.label} · Tap 'All Stories' to see full overview`}
              </span>
            </span>
            <span className="text-[10px] text-teal-900 font-bold">
              25 Resident Boys · Form 10AC 80G Certified
            </span>
          </div>
        </div>
      </nav>

      {/* ── THEME 1: SPONSOR 25 BOYS (OFFICIAL 5 SUPPORT TIERS) ── */}
      {activeMode === "tiers" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 text-white py-8 sm:py-10 px-4 text-center border-b border-amber-400/20">
            <Container>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2 ring-1 ring-gold/30">
                <span>🏛️</span> Form 28 JJ Act Registered Support Tiers
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Official Sponsorship Tiers for 25 Resident Boys
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
                Audited fixed-price sponsorship for daily food, monthly grocery staples, clothing sets, and annual schooling under Section 80G tax exemption.
              </p>
            </Container>
          </div>

          <OfficialSupportTiersSection tiers={siteContent?.supportTiers} />
          {renderThemeFooter("tiers")}
        </div>
      )}

      {/* ── THEME 2: CELEBRATE BIRTHDAYS & MILESTONES ── */}
      {activeMode === "celebrate" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-amber-950 via-teal-950 to-amber-950 text-white py-8 sm:py-10 px-4 text-center border-b border-amber-400/20">
            <Container>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron/20 text-saffron-light px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2 ring-1 ring-saffron/30">
                <span>🎂</span> Celebrate Life Milestones in Bengaluru
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Celebrate Your Birthday with 25 Orphaned Boys
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-amber-100/80 max-w-2xl mx-auto leading-relaxed">
                Sponsor a traditional banana leaf feast, cut an eggless cake, or receive a live WhatsApp video blessing from 25 boys chanting your name.
              </p>
            </Container>
          </div>

          <TrendingBirthdaySection
            packages={siteContent?.celebrationPackages}
            wishVideos={siteContent?.wishVideos}
            content={siteContent}
          />
          {renderThemeFooter("celebrate")}
        </div>
      )}

      {/* ── THEME 3: DAILY NEEDS & GIVING CATALOG (ANNADANA) ── */}
      {activeMode === "annadana" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-teal-950 via-emerald-950 to-teal-950 text-white py-8 sm:py-10 px-4 text-center border-b border-emerald-400/20">
            <Container>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2 ring-1 ring-emerald-400/30">
                <span>🍲</span> Itemized Giving Store &amp; Kitchen Tracker
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Categorized Daily Needs &amp; Giving Basket
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
                Directly fund individual daily items from ₹11 morning cow milk and ₹101 hot lunch to ₹251 school bags and ₹2,501 wholesale pantry staples. Instant 80G receipt.
              </p>
            </Container>
          </div>

          <TodaySection updates={updates} mealsStatus={siteContent?.todayMealsStatus} mode="meals-only" />
          <ImpactCart />
          {renderThemeFooter("annadana")}
        </div>
      )}

      {/* ── THEME 4: CAMPUS LIFE & DOCUMENTARY ── */}
      {activeMode === "life" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 text-white py-8 sm:py-10 px-4 text-center border-b border-white/10">
            <Container>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2 ring-1 ring-gold/30">
                <span>📸</span> Authentic On-Ground Documentation
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Real Daily Life Inside Janaseva Ashrama
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
                No actors, no staged models. 60 authentic photos, documentary video chapters, abacus classes, and caregiver reflections from Thurahalli, Bangalore.
              </p>
            </Container>
          </div>

          <RealBoysGallerySection customMedia={approvedMedia} />
          <TodaySection updates={updates} mode="updates-only" />
          <DocumentaryVideoSection chapters={siteContent?.docChapters} />
          <EmotionalQuotesSection quotes={siteContent?.quotes} />
          {renderThemeFooter("life")}
        </div>
      )}

      {/* ── THEME 5: VOLUNTEER & COMMUNITY OUTREACH ── */}
      {activeMode === "community" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-950 text-white py-8 sm:py-10 px-4 text-center border-b border-emerald-400/20">
            <Container>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2 ring-1 ring-emerald-400/30">
                <span>🤝</span> U&amp;I Concept · 2.5 Hours / Week
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Janaseva Volunteer Crew &amp; Field Outreach
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
                Give 2.5 hours on a weekend to teach English, mentor younger boys, or join medical camps and cleanliness drives in Bengaluru.
              </p>
            </Container>
          </div>

          <CommunityV2Section />
          <CommunityActivitiesSection activities={siteContent?.ngoActivities} />
          {renderThemeFooter("community")}
        </div>
      )}

      {/* ── THEME 6: 80G TRUST, LEGAL ACCREDITATIONS & BANKING ── */}
      {activeMode === "trust" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-teal-950 via-slate-950 to-teal-950 text-white py-8 sm:py-10 px-4 text-center border-b border-amber-400/20">
            <Container>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/20 text-gold px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-2 ring-1 ring-gold/30">
                <span>🛡️</span> 100% Tax Deductible · Form 10AC Section 80G
              </span>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                Legal Transparency, Axis Bank Wire &amp; Trust Pillars
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-2xl mx-auto leading-relaxed">
                Inspect official government accreditations, verified platform statistics, direct Axis Bank Banashankari account details, and donor FAQs.
              </p>
            </Container>
          </div>

          <TransparencySection docs={docs} />
          <TrustSection />
          <VerifiedImpactSection metrics={metrics} totals={totals} />
          <section id="faq" className="scroll-mt-14 py-10 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
            <Container>
              <DonationFAQ faqs={siteContent?.faqs} />
            </Container>
          </section>
          <ContactSection content={siteContent} />
          {renderThemeFooter("trust")}
        </div>
      )}

      {/* ── MODE 7: ALL STORIES (CONTINUOUS COMPREHENSIVE OVERVIEW) ── */}
      {activeMode === "all" && (
        <div className="space-y-0 animate-in fade-in duration-300">
          {/* 1. Sponsor 25 Boys: Exact 5 Official Support Tiers & Pricing */}
          <OfficialSupportTiersSection tiers={siteContent?.supportTiers} />

          {/* 2. Celebrate Your Birthday with 25 Orphaned Boys in Bengaluru */}
          <TrendingBirthdaySection
            packages={siteContent?.celebrationPackages}
            wishVideos={siteContent?.wishVideos}
            content={siteContent}
          />

          {/* 3. Real-Time Daily Updates & Live Meals Tracker */}
          <TodaySection updates={updates} mealsStatus={siteContent?.todayMealsStatus} mode="all" />

          {/* 4. Categorized Daily Needs & Direct Giving Basket */}
          <ImpactCart />

          {/* 5. Real Boys Visual Gallery */}
          <RealBoysGallerySection customMedia={approvedMedia} />

          {/* 6. Weekend Mentorship & Volunteer Network */}
          <CommunityV2Section />

          {/* 7. On-Ground NGO Activities & Community Outreach */}
          <CommunityActivitiesSection activities={siteContent?.ngoActivities} />

          {/* 8. Documentary Video Chapters */}
          <DocumentaryVideoSection chapters={siteContent?.docChapters} />

          {/* 9. Emotional Voices & Reflections */}
          <EmotionalQuotesSection quotes={siteContent?.quotes} />

          {/* 10. Transparency Center & 5 Official Govt Accreditations */}
          <TransparencySection docs={docs} />

          {/* 11. Trust & Axis Bank Direct Details */}
          <TrustSection />

          {/* 12. Verified Platform Impact Numbers */}
          <VerifiedImpactSection metrics={metrics} totals={totals} />

          {/* 13. Frequently Asked Questions (FAQ) */}
          <section id="faq" className="scroll-mt-14 py-10 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
            <Container>
              <DonationFAQ faqs={siteContent?.faqs} />
            </Container>
          </section>

          {/* 14. Bengaluru Location, Map & Contact */}
          <ContactSection content={siteContent} />
        </div>
      )}
    </div>
  );
}
