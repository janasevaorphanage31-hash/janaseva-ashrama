"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

interface MoreItem {
  href: string;
  label: string;
  sub?: string;
  icon: string;
  badge?: string;
}

interface MoreSection {
  title: string;
  items: MoreItem[];
}

const MORE_SECTIONS: MoreSection[] = [
  {
    title: "🌟 Direct Seva & Sponsorship",
    items: [
      { href: "/celebrate-birthday", label: "Celebrate Birthday", sub: "Feast with boys + WhatsApp video blessing", icon: "🎂", badge: "Trending" },
      { href: "/make-a-day-matter", label: "Make a Day Matter", sub: "Sponsor 1 day meals for all 25 boys", icon: "🍲", badge: "Popular" },
      { href: "/gift-impact", label: "Gift an Impact", sub: "Dedicate meals in honor of someone", icon: "🎁" },
      { href: "/recurring-giving", label: "Regular Monthly Giving", sub: "Automated monthly recurring seva", icon: "🔄" },
      { href: "/campaigns", label: "Start a Fundraiser", sub: "Create a community giving drive", icon: "📢" },
    ],
  },
  {
    title: "📸 Campus Life & Our 25 Boys",
    items: [
      { href: "/#boys-gallery", label: "Real Boys Visual Gallery", sub: "39 authentic Bangalore ground moments", icon: "👦", badge: "Photos & Videos" },
      { href: "/impact-wall", label: "Live Impact Wall", sub: "Real-time donor wall & community wishes", icon: "🏆" },
      { href: "/#documentary", label: "Documentary Video Chapters", sub: "Real daily life, prayer, school & play", icon: "🎥" },
      { href: "/stories", label: "Stories & Caregiver Voices", sub: "Reflections from ashrama caretakers", icon: "📖" },
    ],
  },
  {
    title: "🛡️ Trust, Legal & Tax Exemption",
    items: [
      { href: "/transparency", label: "Govt Accreditations", sub: "Form 10AC 80G, Form 28, 12AA, CSR-1", icon: "📜", badge: "100% Tax Free" },
      { href: "/my-impact", label: "My Impact / 80G Receipts", sub: "Instant 80G tax certificate download", icon: "🧾" },
      { href: "/#trust", label: "Axis Bank Direct Wire", sub: "Official Banashankari account details", icon: "🏦" },
      { href: "/future", label: "Proposed Future Campus", sub: "Blueprint for expanded boys facility", icon: "🏛️" },
    ],
  },
  {
    title: "🤝 Get Involved & Visit Us",
    items: [
      { href: "/janaseva-crew", label: "Janaseva Crew (Volunteer)", sub: "Weekend teaching, art & meals seva", icon: "🤝" },
      { href: "/corporate", label: "Corporate CSR Partnerships", sub: "Organize employee drives with us", icon: "💼" },
      { href: "/contact", label: "Visit Campus in Bangalore", sub: "#27 Gundu Thopu, Thurahalli, Bangalore", icon: "📍" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-policy", label: "Refund Policy" },
];

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function HomeIcon() {
  return (
    <svg className="h-[22px] w-[22px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}
function StoriesIcon() {
  return (
    <svg className="h-[22px] w-[22px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
    </svg>
  );
}
function OccasionsIcon() {
  return (
    <svg className="h-[22px] w-[22px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" />
    </svg>
  );
}
function ImpactHeartIcon() {
  return (
    <svg className="h-[26px] w-[26px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg className="h-[22px] w-[22px] fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function BottomNav() {
  const path = usePathname();
  const { total, count, openBottomDonate } = useCart();
  const [open, setOpen] = useState(false);
  const [prevTotal, setPrevTotal] = useState(total);
  const [prevPath, setPrevPath] = useState(path);
  const [cartAnimKey, setCartAnimKey] = useState(0);

  // Sync animation key if total changed
  if (total !== prevTotal) {
    setPrevTotal(total);
    setCartAnimKey((k) => k + 1);
  }

  // Close drawer if path changed
  if (path !== prevPath) {
    setPrevPath(path);
    setOpen(false);
  }

  // Keyboard ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (path?.startsWith("/admin") || path === "/checkout") return null;

  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const moreActive = MORE_SECTIONS.some((sec) =>
    sec.items.some((m) => path.startsWith(m.href.split("#")[0]))
  );

  const navItems: NavItem[] = [
    { href: "/", label: "HOME", icon: <HomeIcon /> },
    { href: "/stories", label: "STORIES", icon: <StoriesIcon /> },
    { href: "/make-a-day-matter", label: "OCCASIONS", icon: <OccasionsIcon /> },
  ];

  return (
    <>
      {/* ── MORE SHEET ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden no-print"
          role="dialog"
          aria-modal="true"
          aria-label="More Navigation"
        >
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-teal-950/65 backdrop-blur-sm fade-in"
            onClick={() => setOpen(false)}
          />
          <div className="sheet-in absolute inset-x-0 bottom-0 rounded-t-3xl bg-cream shadow-2xl max-h-[88vh] flex flex-col">
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="h-1.5 w-12 rounded-full bg-teal-900/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-teal-900/10">
              <div>
                <h3 className="font-display text-base font-bold text-teal-900">
                  Explore Janaseva Ashrama
                </h3>
                <p className="text-[11px] text-teal-950/60 font-medium">
                  25 Resident Boys · Thurahalli, South Bangalore
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-900/10 text-teal-900 hover:bg-teal-900/20 transition text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Categorized List */}
            <div className="p-4 space-y-5 overflow-y-auto no-scrollbar pb-10">
              {MORE_SECTIONS.map((sec) => (
                <div key={sec.title} className="space-y-2">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-teal-950/60 px-1">
                    {sec.title}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sec.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white border border-teal-900/10 shadow-2xs hover:border-teal-900/30 transition tap-scale group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0 select-none">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-teal-950 group-hover:text-teal-900 truncate">
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="rounded bg-saffron/15 text-saffron-dark px-1.5 py-0.2 text-[9px] font-black uppercase">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.sub && (
                              <p className="text-[10px] text-teal-950/60 truncate mt-0.5">
                                {item.sub}
                              </p>
                            )}
                          </div>
                        </div>
                        <svg className="h-4 w-4 fill-none stroke-current stroke-2 text-teal-900/30 group-hover:text-teal-900 transition ml-2 shrink-0" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Legal Links Footer */}
              <div className="pt-4 border-t border-teal-900/10 flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-teal-900/60">
                {LEGAL_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="hover:underline"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CART CHECKOUT FLOATING ISLAND (Single Global Source of Truth) ── */}
      {total > 0 && path !== "/checkout" && (
        <div
          key={cartAnimKey}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] inset-x-3 z-40 md:hidden scale-in"
        >
          <Link
            href="/checkout"
            className="flex items-center justify-between rounded-2xl bg-teal-950 p-3.5 text-white shadow-[0_12px_40px_rgba(5,47,44,0.4)] ring-1 ring-gold/40 border border-teal-800 transition tap-scale"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-saffron text-xs font-black text-white shrink-0 shadow-md">
                {count}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gold truncate">
                  Giving Basket: {formatINR(total)}
                </p>
                <p className="text-[10px] text-teal-200/80 truncate">
                  100% Direct Allocation · Instant 80G
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-white bg-saffron hover:bg-saffron-dark px-3.5 py-2 rounded-xl shadow-md shrink-0 ml-2">
              Donate →
            </span>
          </Link>
        </div>
      )}

      {/* ── BOTTOM NAV BAR ── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-teal-900/10 bg-white/97 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_24px_rgba(6,49,47,0.09)] backdrop-blur-xl md:hidden no-print"
      >
        <ul className="mx-auto flex h-16 max-w-md items-center justify-around px-1">

          {/* LEFT NAV ITEMS */}
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? path === "/"
                : active(item.href);
            return (
              <li key={item.href} className="flex-1 text-center">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`focus-ring tap-scale flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
                    isActive ? "text-teal-900" : "text-teal-950/45"
                  }`}
                >
                  <span
                    className={`transition-transform duration-200 ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className={`text-[9px] font-bold tracking-wide ${isActive ? "text-teal-900" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && <span className="h-1 w-3 rounded-full bg-saffron mt-0.5" />}
                </Link>
              </li>
            );
          })}

          {/* CENTER IMPACT BUTTON */}
          <li className="flex-1 text-center">
            <button
              type="button"
              onClick={() => {
                track("cta_make_impact", { where: "bottom_nav" });
                openBottomDonate(101, "meal");
              }}
              aria-label="Open donation options for 25 boys"
              className="focus-ring -mt-5 relative flex flex-col items-center justify-center group tap-scale cursor-pointer"
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white transition animate-heartbeat ${
                  active("/impact")
                    ? "bg-saffron-dark"
                    : "bg-saffron hover:bg-saffron-dark"
                }`}
              >
                <ImpactHeartIcon />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-md bg-teal-950 px-1 text-[10px] font-extrabold text-gold shadow">
                    {count}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[9px] font-extrabold tracking-wide text-saffron-dark">
                DONATE 💝
              </span>
            </button>
          </li>

          {/* MORE */}
          <li className="flex-1 text-center">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open more navigation options"
              aria-expanded={open}
              className={`focus-ring tap-scale flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
                open || moreActive ? "text-teal-900" : "text-teal-950/45"
              }`}
            >
              <span className={`transition-transform duration-200 ${open || moreActive ? "scale-110" : "scale-100"}`}>
                <MenuIcon />
              </span>
              <span className="text-[9px] font-bold tracking-wide">MORE</span>
              {(open || moreActive) && <span className="nav-dot" />}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
