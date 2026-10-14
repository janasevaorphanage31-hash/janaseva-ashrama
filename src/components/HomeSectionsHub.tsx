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
    label: "Annadana & Meals",
    icon: "🍲",
    badge: "Live Feed",
    targetId: "today",
    description: "Live daily meals tracker & provisions for 25 resident boys",
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
  annadana: "today",
  life: "boys-gallery",
  community: "volunteer",
  trust: "transparency",
};

const HASH_MODE_MAP: Record<string, HomeMode> = {
  "hub-top": "all",
  top: "all",
  all: "all",
  "official-tiers": "tiers",
  tiers: "tiers",
  sponsor: "tiers",
  celebrate: "celebrate",
  birthday: "celebrate",
  birthdays: "celebrate",
  feast: "celebrate",
  today: "annadana",
  "today-meals": "annadana",
  meals: "annadana",
  impact: "annadana",
  annadana: "annadana",
  needs: "annadana",
  basket: "annadana",
  "boys-gallery": "life",
  "life-in-motion": "life",
  "ashrama-life": "life",
  life: "life",
  gallery: "life",
  photos: "life",
  community: "community",
  volunteer: "community",
  activities: "community",
  transparency: "trust",
  trust: "trust",
  "80g": "trust",
  faq: "trust",
};

import type {
  getDocuments,
  getMetrics,
  getTodayUpdates,
  getVerifiedPlatformTotals,
  getApprovedMedia,
} from "@/lib/content";

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

  // Smooth jump to section
  const jumpToSection = (mode: HomeMode, targetAnchor?: string) => {
    setActiveMode(mode);
    const targetId = targetAnchor || MODE_TARGET_MAP[mode] || "hub-top";
    track("home_section_jump", { mode, targetId });

    if (mode !== "all") {
      window.history.replaceState(null, "", `#${targetId}`);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }

    const el = document.getElementById(targetId);
    if (el) {
      const yOffset = -110;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    } else if (hubRef.current && mode === "all") {
      const yOffset = -90;
      const y = hubRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const activeModeRef = useRef<HomeMode>(activeMode);
  useEffect(() => {
    activeModeRef.current = activeMode;
  }, [activeMode]);

  // Sync activeMode with scroll position as user reads naturally down the page (throttled with rAF)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY + 220;
          const hubEl = hubRef.current;
          const tierEl = document.getElementById("official-tiers");
          const celEl = document.getElementById("celebrate");
          const todayEl = document.getElementById("today");
          const impEl = document.getElementById("impact");
          const galEl = document.getElementById("boys-gallery");
          const volEl = document.getElementById("volunteer") || document.getElementById("community");
          const trEl = document.getElementById("transparency") || document.getElementById("trust");

          // Default mode when above the hub sections is "all"
          let detectedMode: HomeMode = "all";

          if (hubEl && scrollPos >= hubEl.offsetTop - 80) {
            if (trEl && trEl.offsetTop <= scrollPos) {
              detectedMode = "trust";
            } else if (volEl && volEl.offsetTop <= scrollPos) {
              detectedMode = "community";
            } else if (galEl && galEl.offsetTop <= scrollPos) {
              detectedMode = "life";
            } else if ((impEl && impEl.offsetTop <= scrollPos) || (todayEl && todayEl.offsetTop <= scrollPos)) {
              detectedMode = "annadana";
            } else if (celEl && celEl.offsetTop <= scrollPos) {
              detectedMode = "celebrate";
            } else if (tierEl && tierEl.offsetTop <= scrollPos) {
              detectedMode = "tiers";
            }
          }

          if (detectedMode !== activeModeRef.current) {
            setActiveMode(detectedMode);
            // Center the active pill ONLY within its horizontal container track, NEVER scroll the window!
            const activeBtn = document.getElementById(`mode-pill-${detectedMode}`);
            const containerTrack = activeBtn?.parentElement;
            if (containerTrack && activeBtn) {
              const targetLeft = activeBtn.offsetLeft - containerTrack.clientWidth / 2 + activeBtn.clientWidth / 2;
              containerTrack.scrollTo({ left: targetLeft, behavior: "smooth" });
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to mount URL and hashchange event so any link to /#theme triggers smooth scroll and pill activation
  useEffect(() => {
    const syncFromLocation = () => {
      if (typeof window === "undefined") return;

      // 1. Check URL query params e.g. ?theme=celebrate
      const params = new URLSearchParams(window.location.search);
      const themeParam = params.get("theme") as HomeMode | null;
      if (themeParam && MODE_TARGET_MAP[themeParam]) {
        jumpToSection(themeParam, MODE_TARGET_MAP[themeParam]);
        return;
      }

      // 2. Check URL hash e.g. #celebrate, #official-tiers
      const rawHash = window.location.hash.replace(/^#/, "");
      if (rawHash) {
        const mappedMode = HASH_MODE_MAP[rawHash];
        if (mappedMode) {
          jumpToSection(mappedMode, MODE_TARGET_MAP[mappedMode] || rawHash);
        } else {
          const el = document.getElementById(rawHash);
          if (el) {
            const yOffset = -110;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }
      }
    };

    const timer = setTimeout(syncFromLocation, 150);

    window.addEventListener("hashchange", syncFromLocation);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", syncFromLocation);
    };
  }, []);

  return (
    <div ref={hubRef} className="relative w-full">
      {/* Target anchor for top of hub */}
      <div id="hub-top" className="scroll-mt-28" />



      {/* ── STICKY TOP SECTION JUMP BAR (Segmented Controller) ── */}
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
                  onClick={() => jumpToSection(m.id, m.targetId)}
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
              <span>Tap any section to jump</span>
            </span>
            <span className="text-[10px] text-teal-900 font-bold">
              25 Resident Boys · Form 10AC 80G Certified
            </span>
          </div>
        </div>
      </nav>

      {/* ── UNIFIED FULL-LENGTH COMPREHENSIVE STORY (NEVER UNMOUNTS) ── */}
      <div className="space-y-0">
        {/* 1. Sponsor 25 Boys: Exact 5 Official Support Tiers & Pricing (Form 28 JJ Act Registered) */}
        <OfficialSupportTiersSection tiers={siteContent?.supportTiers} />

        {/* 2. Celebrate Your Birthday with 25 Orphaned Boys in Bengaluru (WhatsApp Wish, Cakes & Feasts) */}
        <TrendingBirthdaySection
          packages={siteContent?.celebrationPackages}
          wishVideos={siteContent?.wishVideos}
          content={siteContent}
        />

        {/* 3. Real-Time Daily Updates & Live Meals Tracker (Kitchen Feed) */}
        <TodaySection updates={updates} mealsStatus={siteContent?.todayMealsStatus} />

        {/* 4. Categorized Daily Needs & Direct Giving Basket */}
        <ImpactCart />

        {/* 5. Real Boys Visual Gallery (Curated 60 Photos & Videos) */}
        <RealBoysGallerySection customMedia={approvedMedia} />

        {/* 6. Weekend Mentorship & Volunteer Network (U&I Concept: 2.5 hrs/week) */}
        <CommunityV2Section />

        {/* 7. On-Ground NGO Activities & Community Outreach (Field Initiatives) */}
        <CommunityActivitiesSection activities={siteContent?.ngoActivities} />

        {/* 8. Documentary Video Chapters */}
        <DocumentaryVideoSection chapters={siteContent?.docChapters} />

        {/* 10. Emotional Voices & Reflections ("Every child deserves a warm plate...") */}
        <EmotionalQuotesSection quotes={siteContent?.quotes} />

        {/* 11. Transparency Center & 5 Official Govt Accreditations (Carousel / Grid) */}
        <TransparencySection docs={docs} />

        {/* 12. Trust & Axis Bank Direct Details (6 Trust Pillars in Horizontal Motion) */}
        <TrustSection />

        {/* 13. Verified Platform Impact Numbers */}
        <VerifiedImpactSection metrics={metrics} totals={totals} />

        {/* 14. Frequently Asked Questions (FAQ) */}
        <section id="faq" className="scroll-mt-14 py-10 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
          <Container>
            <DonationFAQ faqs={siteContent?.faqs} />
          </Container>
        </section>

        {/* 15. Bengaluru Location, Map & Contact */}
        <ContactSection content={siteContent} />
      </div>
    </div>
  );
}
