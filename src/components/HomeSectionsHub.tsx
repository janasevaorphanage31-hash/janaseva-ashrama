"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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

export type HomeMode = "tiers" | "celebrate" | "annadana" | "life" | "community" | "trust" | "all";

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
    id: "tiers",
    label: "Sponsor 25 Boys",
    icon: "🏛️",
    badge: "90% Focus",
    targetId: "section-tiers",
    description: "90% Primary NGO Focus · Form 28 JJ Act registered 5 official sponsorship tiers",
  },
  {
    id: "celebrate",
    label: "Birthdays",
    icon: "🎂",
    badge: "Trending",
    targetId: "section-celebrate",
    description: "Celebrate birthday with 25 boys, cake & WhatsApp video wish",
  },
  {
    id: "annadana",
    label: "Daily Needs",
    icon: "🍲",
    badge: "₹11+",
    targetId: "section-annadana",
    description: "Live daily meals tracker, categorized needs & Giving Basket",
  },
  {
    id: "life",
    label: "Campus Life",
    icon: "📸",
    badge: "Moments",
    targetId: "section-life",
    description: "Real photos, abacus classes & daily documentary moments",
  },
  {
    id: "community",
    label: "Volunteer",
    icon: "🤝",
    badge: "2.5h/Wk",
    targetId: "section-community",
    description: "Give 2.5 hrs/week mentoring, coaching & life skills",
  },
  {
    id: "trust",
    label: "80G Trust",
    icon: "🛡️",
    badge: "Verified",
    targetId: "section-trust",
    description: "Form 10AC, CSR-1, Axis Bank wire & FAQs",
  },
  {
    id: "all",
    label: "All Stories",
    icon: "🌟",
    badge: "Overview",
    targetId: "hub-top",
    description: "Complete continuous journey of Janaseva Ashrama",
  },
];

const MODE_TARGET_MAP: Record<HomeMode, string> = {
  tiers: "section-tiers",
  celebrate: "section-celebrate",
  annadana: "section-annadana",
  life: "section-life",
  community: "section-community",
  trust: "section-trust",
  all: "hub-top",
};

const HASH_MODE_MAP: Record<string, HomeMode> = {
  "section-tiers": "tiers",
  "official-tiers": "tiers",
  tiers: "tiers",
  sponsor: "tiers",
  sponsorship: "tiers",
  "section-celebrate": "celebrate",
  celebrate: "celebrate",
  birthday: "celebrate",
  birthdays: "celebrate",
  feast: "celebrate",
  "section-annadana": "annadana",
  catalog: "annadana",
  needs: "annadana",
  today: "annadana",
  "today-meals": "annadana",
  meals: "annadana",
  impact: "annadana",
  annadana: "annadana",
  basket: "annadana",
  "section-life": "life",
  "boys-gallery": "life",
  "life-in-motion": "life",
  "ashrama-life": "life",
  life: "life",
  gallery: "life",
  photos: "life",
  documentary: "life",
  "section-community": "community",
  community: "community",
  volunteer: "community",
  activities: "community",
  crew: "community",
  "section-trust": "trust",
  transparency: "trust",
  trust: "trust",
  "80g": "trust",
  bank: "trust",
  faq: "trust",
  contact: "trust",
  "hub-top": "all",
  top: "all",
  all: "all",
  stories: "all",
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
  // Default to 'tiers' (Sponsor 25 Boys) as 90% of NGO telecaller focus is on this campaign
  const [activeMode, setActiveMode] = useState<HomeMode>("tiers");
  const hubRef = useRef<HTMLDivElement>(null);
  const activeModeRef = useRef<HomeMode>(activeMode);
  const isScrollingProgrammatically = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Center the active pill in the horizontal sticky bar
  const centerPill = useCallback((mode: HomeMode) => {
    if (typeof document === "undefined") return;
    const activeBtn = document.getElementById(`mode-pill-${mode}`);
    const containerTrack = activeBtn?.parentElement;
    if (containerTrack && activeBtn) {
      const targetLeft =
        activeBtn.offsetLeft - containerTrack.clientWidth / 2 + activeBtn.clientWidth / 2;
      containerTrack.scrollTo({ left: targetLeft, behavior: "smooth" });
    }
  }, []);

  // Switch between Themes, Catalog, or All Stories
  const switchMode = useCallback(
    (mode: HomeMode, targetAnchor?: string) => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      isScrollingProgrammatically.current = true;

      setActiveMode(mode);
      centerPill(mode);
      track("home_mode_select", { mode });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("janaseva:home-mode-changed", { detail: { mode } }));

        const targetId = targetAnchor || MODE_TARGET_MAP[mode] || "hub-top";
        if (mode !== "all") {
          window.history.replaceState(null, "", `#${targetId}`);
        } else {
          window.history.replaceState(null, "", window.location.pathname);
        }

        const targetEl =
          document.getElementById(targetId) ||
          document.getElementById(`section-${mode}`) ||
          (mode === "all" ? hubRef.current : null);

        if (targetEl) {
          const yOffset = -115;
          const y = targetEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
        }

        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingProgrammatically.current = false;
        }, 850);
      }
    },
    [centerPill]
  );

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
  }, [switchMode]);

  // Listen to mount URL and hashchange event so any link to /#theme triggers smooth theme switch
  useEffect(() => {
    const syncFromLocation = () => {
      if (typeof window === "undefined") return;

      // 1. Check URL query params e.g. ?theme=tiers or ?theme=celebrate
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get("theme") as HomeMode | null;
      if (themeParam && MODES.some((m) => m.id === themeParam)) {
        switchMode(themeParam);
        return;
      }

      // 2. Check URL hash e.g. #official-tiers, #celebrate, #catalog
      const rawHash = window.location.hash.replace(/^#/, "");
      if (rawHash) {
        const mappedMode = HASH_MODE_MAP[rawHash];
        if (mappedMode) {
          switchMode(mappedMode, rawHash);
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
  }, [switchMode]);

  // Real-time 60fps Scroll Spy: dynamically highlights active pill, auto-centers horizontal track & updates BottomNav
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (isScrollingProgrammatically.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isBottom =
            window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 70;

          // Ordered list of sections from bottom to top for viewport collision detection
          const sections: { mode: HomeMode; id: string; fallbackId: string }[] = [
            { mode: "trust", id: "section-trust", fallbackId: "transparency" },
            { mode: "community", id: "section-community", fallbackId: "volunteer" },
            { mode: "life", id: "section-life", fallbackId: "boys-gallery" },
            { mode: "annadana", id: "section-annadana", fallbackId: "catalog" },
            { mode: "celebrate", id: "section-celebrate", fallbackId: "celebrate" },
            { mode: "tiers", id: "section-tiers", fallbackId: "official-tiers" },
          ];

          let detected: HomeMode = "tiers";

          if (isBottom) {
            detected = "trust";
          } else {
            // Trigger activation line: below the sticky headers (top bar + hub nav ~120px)
            const triggerY = 170;
            for (const s of sections) {
              const el = document.getElementById(s.id) || document.getElementById(s.fallbackId);
              if (el) {
                const rect = el.getBoundingClientRect();
                if (rect.top <= triggerY) {
                  detected = s.mode;
                  break;
                }
              }
            }
          }

          if (detected !== activeModeRef.current) {
            setActiveMode(detected);
            centerPill(detected);
            window.dispatchEvent(
              new CustomEvent("janaseva:home-mode-changed", { detail: { mode: detected } })
            );
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount after brief layout calculation
    const initTimer = setTimeout(handleScroll, 200);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(initTimer);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [centerPill]);

  return (
    <div ref={hubRef} className="relative w-full">
      {/* Target anchor for top of hub */}
      <div id="hub-top" className="scroll-mt-28" />

      {/* ── STICKY TOP SECTION SWITCHER (Segmented Controller) ── */}
      <nav
        aria-label="Home Section Switcher"
        className="sticky top-14 sm:top-16 z-30 w-full border-b border-teal-900/10 bg-white/95 backdrop-blur-md shadow-xs no-print transition-colors"
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          {/* iOS Style Segmented Control Track */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 justify-start md:justify-center scroll-smooth">
            {MODES.map((m) => {
              const isSelected = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  id={`mode-pill-${m.id}`}
                  type="button"
                  onClick={() => switchMode(m.id, m.targetId)}
                  className={`focus-ring tap-scale inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold shrink-0 cursor-pointer transition-all duration-200 ${
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

          {/* Dynamic Real-time Status Indicator - visible on tablet/desktop, hidden on mobile for clean screen */}
          <div className="hidden sm:flex mt-1 items-center justify-between text-[10px] text-teal-950/70 font-semibold px-1">
            <span className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                {activeMode === "tiers"
                  ? "🏛️ Viewing: Sponsor 25 Boys · 90% Primary NGO Focus · Form 28 JJ Act 5 Official Tiers"
                  : `Currently viewing: ${MODES.find((m) => m.id === activeMode)?.label} · ${MODES.find((m) => m.id === activeMode)?.description}`}
              </span>
            </span>
            <span className="hidden sm:inline-block text-[10px] text-teal-900 font-bold shrink-0 ml-2">
              25 Resident Boys · Form 10AC 80G Certified
            </span>
          </div>
        </div>
      </nav>

      {/* ── ALL 6 THEMATIC CHAPTERS RENDERED CONTINUOUSLY (NO DUPLICATE STACKED HEADERS) ── */}
      <div className="space-y-0">
        {/* ── CHAPTER 1: SPONSOR 25 BOYS (OFFICIAL 5 SUPPORT TIERS - 90% FOCUS) ── */}
        <section id="section-tiers" className="scroll-mt-24 sm:scroll-mt-28">
          <OfficialSupportTiersSection
            tiers={siteContent?.supportTiers}
            bankDetails={siteContent?.bankDetails}
          />
        </section>

        {/* ── CHAPTER 2: CELEBRATE BIRTHDAYS & MILESTONES ── */}
        <section id="section-celebrate" className="scroll-mt-24 sm:scroll-mt-28">
          <TrendingBirthdaySection
            packages={siteContent?.celebrationPackages}
            wishVideos={siteContent?.wishVideos}
            content={siteContent}
          />
        </section>

        {/* ── CHAPTER 3: DAILY NEEDS & GIVING CATALOG (ANNADANA) ── */}
        <section id="section-annadana" className="scroll-mt-24 sm:scroll-mt-28">
          <div id="catalog" className="scroll-mt-24 sm:scroll-mt-28" />
          <div id="today-meals" className="scroll-mt-24 sm:scroll-mt-28" />
          <TodaySection updates={updates} mealsStatus={siteContent?.todayMealsStatus} mode="meals-only" />
          <ImpactCart />
        </section>

        {/* ── CHAPTER 4: CAMPUS LIFE & DOCUMENTARY ── */}
        <section id="section-life" className="scroll-mt-24 sm:scroll-mt-28">
          <div id="ashrama-life" className="scroll-mt-24 sm:scroll-mt-28" />
          <RealBoysGallerySection customMedia={approvedMedia} />
          <TodaySection updates={updates} mode="updates-only" />
          <div id="documentary" className="scroll-mt-24 sm:scroll-mt-28" />
          <DocumentaryVideoSection chapters={siteContent?.docChapters} />
          <EmotionalQuotesSection quotes={siteContent?.quotes} />
        </section>

        {/* ── CHAPTER 5: VOLUNTEER & COMMUNITY OUTREACH ── */}
        <section id="section-community" className="scroll-mt-24 sm:scroll-mt-28">
          <CommunityV2Section />
          <CommunityActivitiesSection activities={siteContent?.ngoActivities} />
        </section>

        {/* ── CHAPTER 6: 80G TRUST, LEGAL ACCREDITATIONS & BANKING ── */}
        <section id="section-trust" className="scroll-mt-24 sm:scroll-mt-28">
          <TransparencySection docs={docs} />
          <TrustSection content={siteContent} />
          <VerifiedImpactSection metrics={metrics} totals={totals} />
          <section id="faq" className="scroll-mt-14 py-10 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
            <Container>
              <DonationFAQ faqs={siteContent?.faqs} />
            </Container>
          </section>
          <ContactSection content={siteContent} />
        </section>

        {/* ── QUICK JUMP NAVIGATION FOOTER ── */}
        <div className="py-8 px-4 bg-gradient-to-b from-cream to-sand/40 border-t border-teal-900/10 text-center">
          <Container>
            <p className="text-[11px] font-black uppercase tracking-wider text-teal-950/60 mb-3">
              Explore All 6 Giving Themes or Jump Directly
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => switchMode("tiers")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm cursor-pointer"
              >
                <span>🏛️ Sponsor 25 Boys</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("celebrate")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🎂 Birthdays</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("annadana")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🍲 Daily Needs Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("life")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>📸 Campus Life</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("community")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🤝 Volunteer</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("trust")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🛡️ 80G Trust</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("all")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white border border-teal-900/15 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-cream transition shadow-2xs cursor-pointer"
              >
                <span>🌟 All Stories Overview</span>
              </button>
            </div>
          </Container>
        </div>
      </div>
    </div>
  );
}
