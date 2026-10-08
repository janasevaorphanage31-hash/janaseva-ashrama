"use client";

import { useEffect, useState } from "react";

interface ThemeItem {
  id: string;
  shortName: string;
  fullName: string;
  icon: (className?: string) => React.ReactNode;
}

const THEMES: ThemeItem[] = [
  {
    id: "official-tiers",
    shortName: "5 Tiers",
    fullName: "Official Support Tiers",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
  },
  {
    id: "today",
    shortName: "Today",
    fullName: "Live Ashram Feed",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 12m-3.2 0a3.2 3.2 0 106.4 0 3.2 3.2 0 10-6.4 0zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
      </svg>
    ),
  },
  {
    id: "impact",
    shortName: "Needs",
    fullName: "Food & Nutrition Needs",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8.1 13.34l2.83-2.83L3.91 3.5a4.008 4.008 0 000 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41 9.77-9.75z" />
      </svg>
    ),
  },
  {
    id: "celebrate",
    shortName: "Birthday",
    fullName: "Birthday & Special Days",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 6a2 2 0 100-4 2 2 0 000 4zm7 4h-2V9a1 1 0 00-1-1H8a1 1 0 00-1 1v1H5a3 3 0 00-3 3v7a2 2 0 002 2h16a2 2 0 002-2v-7a3 3 0 00-3-3zM9 10h6v1H9v-1zm11 9H4v-5h16v5z" />
      </svg>
    ),
  },
  {
    id: "voices",
    shortName: "Voices",
    fullName: "Caregiver Reflections",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  {
    id: "boys-gallery",
    shortName: "Gallery",
    fullName: "Real Boys Moments",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
      </svg>
    ),
  },
  {
    id: "videos",
    shortName: "Videos",
    fullName: "Documentary Stories",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13l-4 2.5V10.5L14 13z" />
      </svg>
    ),
  },
  {
    id: "transparency",
    shortName: "80G Docs",
    fullName: "Official Certifications",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
    ),
  },
  {
    id: "trust",
    shortName: "Trust",
    fullName: "Trust Pillars & Bank",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2v-4H6v-2h4V7h2v4h4v2h-4v4z" />
      </svg>
    ),
  },
  {
    id: "impact-stats",
    shortName: "Impact",
    fullName: "Verified Results",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
      </svg>
    ),
  },
  {
    id: "activities",
    shortName: "Drives",
    fullName: "NGO Drives & Camps",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    ),
  },
  {
    id: "volunteer",
    shortName: "Volunteer",
    fullName: "Give Your Time",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    id: "faq",
    shortName: "FAQ",
    fullName: "Common Questions",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.65z" />
      </svg>
    ),
  },
  {
    id: "contact",
    shortName: "Contact",
    fullName: "Directions & Map",
    icon: (cls = "h-4 w-4") => (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
];

export function ThemeNavBar() {
  const [activeId, setActiveId] = useState<string>("impact");

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = THEMES.length - 1; i >= 0; i--) {
        const el = document.getElementById(THEMES[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveId(THEMES[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -58; // Offset for sticky top bar
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Quick Themes Navigation"
      className="relative sm:sticky sm:top-14 z-30 w-full border-b border-teal-900/10 bg-white/95 backdrop-blur-md shadow-xs no-print"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5 md:justify-center">
          <span className="hidden lg:inline-flex text-[11px] font-extrabold uppercase tracking-widest text-teal-950/45 pr-2 shrink-0">
            QUICK THEMES:
          </span>
          {THEMES.map((theme) => {
            const isActive = activeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => scrollToSection(theme.id)}
                className={`theme-nav-item focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 lg:px-3.5 py-2 text-xs font-bold shrink-0 cursor-pointer transition-all ${
                  isActive
                    ? "bg-teal-900 text-white shadow-sm ring-1 ring-teal-800"
                    : "bg-cream/80 text-teal-900/80 hover:bg-sand/70 hover:text-teal-950"
                }`}
                title={theme.fullName}
              >
                <span className={isActive ? "text-gold" : "text-teal-800/70"}>
                  {theme.icon("h-3.5 w-3.5")}
                </span>
                <span>{theme.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
