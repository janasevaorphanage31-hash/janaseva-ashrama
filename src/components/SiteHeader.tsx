"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { useCart } from "./CartProvider";
import { track } from "@/lib/track";

const primaryNavLinks = [
  { href: "/celebrate-special-day", label: "Celebrate Special Day", trending: true },
  { href: "/impact", label: "Verified Needs" },
  { href: "/stories", label: "Stories of Hope" },
  { href: "/transparency", label: "80G Transparency" },
];

const moreMenuLinks = [
  {
    href: "/supporter-form",
    label: "Official Supporter Form",
    desc: "Digital Makkala Ashraya Kendra sponsor form for food, clothes & education",
    icon: "document",
  },
  {
    href: "/make-a-day-matter",
    label: "Make a Day Matter",
    desc: "Dedicate a birthday, anniversary or milestone",
    icon: "gift",
  },
  {
    href: "/story",
    label: "Our Story",
    desc: "History, mission & founding of Janaseva",
    icon: "book",
  },
  {
    href: "/#activities",
    label: "NGO Outreach & Drives",
    desc: "Health camps, food relief, city cleaning & village outreach",
    icon: "heart",
  },
  {
    href: "/janaseva-crew",
    label: "Give Your Time (Volunteers)",
    desc: "Weekend tutoring & social creators",
    icon: "users",
  },
  {
    href: "/campaigns",
    label: "Community Campaigns",
    desc: "Start a group impact fundraiser",
    icon: "bolt",
  },
  {
    href: "/corporate",
    label: "Corporate & CSR",
    desc: "CSR compliance, Form 10AC & employee giving",
    icon: "building",
  },
  {
    href: "/contact",
    label: "Contact & Location",
    desc: "Ashrama directions & visiting timings",
    icon: "pin",
  },
];

const mobileMenuLinks = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/supporter-form", label: "Official Supporter Form", icon: "document", highlight: true },
  { href: "/celebrate-special-day", label: "Celebrate Special Day", icon: "star", highlight: true },
  { href: "/impact", label: "Today's Needs & Basket", icon: "heart", highlight: true },
  { href: "/#activities", label: "NGO Outreach & Drives", icon: "heart" },
  { href: "/make-a-day-matter", label: "Make a Day Matter", icon: "gift" },
  { href: "/stories", label: "Stories of Hope", icon: "book" },
  { href: "/impact-wall", label: "Live Impact Wall", icon: "chart" },
  { href: "/campaigns", label: "Create an Impact", icon: "bolt" },
  { href: "/gift-impact", label: "Gift an Impact", icon: "gift" },
  { href: "/janaseva-crew", label: "Give Your Time (Volunteers)", icon: "users" },
  { href: "/corporate", label: "Corporate / CSR", icon: "building" },
  { href: "/future", label: "Proposed Future Project", icon: "sparkle" },
  { href: "/transparency", label: "Transparency Center", icon: "shield" },
  { href: "/privacy-policy", label: "Privacy Policy", icon: null },
  { href: "/terms-and-conditions", label: "Terms & Conditions", icon: null },
  { href: "/refund-policy", label: "Refund Policy", icon: null },
  { href: "/contact", label: "Contact & Location", icon: "pin" },
];

function NavIcon({ type }: { type: string | null }) {
  if (!type) return null;
  const icons: Record<string, string> = {
    home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
    document: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
    gift: "M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z",
    book: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z",
    chart: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
    bolt: "M7 2v11h3v9l7-12h-4l4-8z",
    users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    building: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z",
    sparkle: "M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z",
    shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
    pin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  };
  const d = icons[type];
  if (!d) return null;
  return (
    <svg className="h-4 w-4 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function SiteHeader() {
  const { count } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const showBack = pathname !== "/";

  // Shrink header on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Body scroll lock when drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // Close drawer & dropdown on navigation
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Swipe-to-close drawer (right swipe closes)
  useEffect(() => {
    const el = drawerRef.current;
    if (!el || !mobileMenuOpen) return;
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -60) setMobileMenuOpen(false);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [mobileMenuOpen]);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back(); return;
    }
    router.push("/");
  };

  return (
    <>
      {/* ── HEADER ── */}
      <header
        className={`sticky top-0 z-40 w-full no-print border-b transition-all duration-300 ${
          scrolled
            ? "h-14 bg-teal-950/98 border-teal-900/60 shadow-lg"
            : "h-14 sm:h-16 bg-teal-950/95 border-teal-900/40"
        } text-white backdrop-blur-md`}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Left group: Logo (strictly shrink-0, impossible to squeeze or overlap) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Hamburger button (Mobile only) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="focus-ring tap-scale md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <span className="sr-only">{mobileMenuOpen ? "Close" : "Menu"}</span>
              <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Back button */}
            {showBack && (
              <button
                onClick={goBack}
                aria-label="Go back"
                className="focus-ring tap-scale flex items-center gap-1 rounded-xl border border-white/30 bg-white/15 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/25 shadow-sm shrink-0"
              >
                <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden xs:inline">Back</span>
              </button>
            )}

            <Link
              href="/"
              aria-label="Janaseva Ashrama home"
              className="focus-ring flex items-center shrink-0 pr-1 lg:pr-3"
            >
              <Logo light />
            </Link>
          </div>

          {/* Desktop Navigation: Curated, Non-colliding & Spacious */}
          <nav
            className="hidden items-center gap-2 lg:gap-3.5 xl:gap-5 text-xs font-bold xl:text-sm md:flex"
            aria-label="Primary navigation"
          >
            {primaryNavLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition hover:text-gold hover:bg-white/5 focus-ring whitespace-nowrap ${
                  pathname === l.href ? "text-gold font-bold bg-white/10" : "text-white/85"
                }`}
              >
                <span>{l.label}</span>
                {l.trending && (
                  <span className="rounded-md bg-gold px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-teal-950 shadow-sm animate-pulse">
                    Hot
                  </span>
                )}
              </Link>
            ))}

            {/* Explore Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition hover:text-gold hover:bg-white/5 focus-ring whitespace-nowrap cursor-pointer ${
                  moreDropdownOpen ? "text-gold bg-white/10" : "text-white/85"
                }`}
              >
                <span>Explore</span>
                <svg
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    moreDropdownOpen ? "rotate-180 text-gold" : "opacity-70"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-teal-950/98 p-2 text-white shadow-2xl ring-1 ring-teal-800/80 border border-teal-800 backdrop-blur-xl z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-gold/80">
                      Explore Ashrama Programs
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {moreMenuLinks.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className="flex items-start gap-2.5 rounded-xl p-2.5 text-left transition hover:bg-white/10 group"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gold group-hover:bg-gold group-hover:text-teal-950 transition">
                            <NavIcon type={item.icon} />
                          </span>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-white group-hover:text-gold transition">
                              {item.label}
                            </span>
                            <span className="block text-[11px] text-white/60 truncate">
                              {item.desc}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action: Cart & Impact CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/impact"
              onClick={() => track("cta_make_impact", { where: "header" })}
              className="focus-ring tap-scale relative flex items-center justify-center gap-1.5 rounded-xl bg-saffron px-4 py-2.5 text-xs font-bold tracking-wide text-white shadow-md transition hover:bg-saffron-dark active:scale-95"
            >
              <span>MAKE AN IMPACT</span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-md bg-gold px-1 text-[10px] font-extrabold text-teal-950 shadow-sm">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Site Navigation"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-teal-950/75 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div
            ref={drawerRef}
            className="drawer-left absolute inset-y-0 left-0 w-[84vw] max-w-sm bg-teal-950 text-white shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div>
              <div className="flex h-14 items-center justify-between border-b border-teal-900/60 px-4">
                <Logo light />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation"
                  className="focus-ring tap-scale flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
                >
                  <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Verified Trust Strip inside Drawer */}
              <div className="bg-teal-900/80 px-4 py-2.5 border-b border-teal-900 text-[11px] space-y-1">
                <p className="font-bold text-gold">100% Direct Ashrama Allocation</p>
                <p className="text-white/70">Bengaluru · Form 10AC 80G Tax Deductible</p>
              </div>

              {/* Scrollable link list */}
              <nav className="max-h-[calc(100vh-220px)] overflow-y-auto px-3 py-3" aria-label="Mobile links">
                <ul className="space-y-1">
                  {mobileMenuLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                          l.highlight
                            ? "bg-saffron text-white shadow"
                            : pathname === l.href
                            ? "bg-white/20 text-gold font-extrabold"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <NavIcon type={l.icon} />
                          <span className="truncate">{l.label}</span>
                        </span>
                        <svg className="h-3.5 w-3.5 fill-none stroke-current stroke-2 opacity-50 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Bottom: Fast Impact CTA */}
            <div className="border-t border-teal-900/60 p-4 space-y-2">
              <Link
                href="/impact"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary block text-center"
              >
                MAKE AN IMPACT
              </Link>
              <div className="text-center text-[10px] text-white/50">
                Official Registered Society · Bengaluru
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
