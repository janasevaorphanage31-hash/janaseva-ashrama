"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { SITE } from "@/lib/site";
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
      { href: "/celebrate-birthday", label: "Celebrate Birthday", sub: "Feast with 25 boys + WhatsApp video blessing", icon: "🎂", badge: "Trending" },
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
      { href: "/transparency", label: "Govt Accreditations", sub: "Form 10AC 80G, JJ Act KA18CH0242, CSR-1", icon: "📜", badge: "100% Tax Free" },
      { href: "/my-impact", label: "My Impact / 80G Receipts", sub: "Instant 80G tax certificate download", icon: "🧾" },
      { href: "/#trust", label: "Axis Bank Direct Wire", sub: "Official Banashankari account details", icon: "🏦" },
      { href: "/future", label: "Proposed Future Campus", sub: "Blueprint for expanded boys facility", icon: "🏛️" },
    ],
  },
  {
    title: "🤝 Get Involved & Visit Us",
    items: [
      { href: "/contact", label: "Visit Campus in Bangalore", sub: "#27 Gundu Thopu, Thurahalli, Bangalore", icon: "📍" },
      { href: "/janaseva-crew", label: "Janaseva Crew (Volunteer)", sub: "Weekend teaching, art & meals seva", icon: "🤝" },
      { href: "/corporate", label: "Corporate CSR Partnerships", sub: "Form CSR-1 verified partner drives", icon: "💼" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-policy", label: "Refund Policy" },
];

function HomeIcon() {
  return (
    <svg className="h-[21px] w-[21px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
    </svg>
  );
}

function BirthdayCakeIcon() {
  return (
    <svg className="h-[21px] w-[21px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6a2 2 0 0 0 2-2c0-.38-.1-.73-.29-1.03l-1.42-2.26a.35.35 0 0 0-.58 0L10.29 2.97c-.19.3-.29.65-.29 1.03a2 2 0 0 0 2 2zm7 3h-1V8a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1h-4V8a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v1H5a3 3 0 0 0-3 3v1a2 2 0 0 0 2 2h.08A4.98 4.98 0 0 0 8 18.83V20H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2h-4v-1.17A4.98 4.98 0 0 0 19.92 15H20a2 2 0 0 0 2-2v-1a3 3 0 0 0-3-3zm1 4h-1.09A4.99 4.99 0 0 0 14 11.08V10h1v1h2v-1h1a1 1 0 0 1 1 1v1h1z" />
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

function VisitPinIcon() {
  return (
    <svg className="h-[21px] w-[21px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg className="h-[21px] w-[21px] fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function BottomNav() {
  const path = usePathname();
  const { count, openBottomDonate } = useCart();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(path);

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

  const isHomeActive = path === "/";
  const isBirthdayActive = path.startsWith("/celebrate-birthday") || path.startsWith("/celebrate-special-day");
  const isContactActive = path.startsWith("/contact");
  const isMoreActive = MORE_SECTIONS.some((sec) =>
    sec.items.some((m) => path.startsWith(m.href.split("#")[0]))
  );

  return (
    <>
      {/* ── MORE / EXPLORE SHEET ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden no-print"
          role="dialog"
          aria-modal="true"
          aria-label="Explore Janaseva Ashrama"
        >
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-teal-950/70 backdrop-blur-xs fade-in"
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
                  25 Resident Boys · Turahalli, South Bangalore
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

            {/* Content List */}
            <div className="p-4 space-y-4 overflow-y-auto no-scrollbar pb-10">
              {/* Caretaker & Social Channels Fast Banner */}
              <div className="p-3.5 rounded-2xl bg-teal-950 text-white border border-amber-400/30 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                      Live Caretaker Line
                    </span>
                  </div>
                  <span className="text-[10px] text-white/60">Sri Janardhana</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
                  <a
                    href={`tel:${SITE.phoneIntl}`}
                    onClick={() => track("menu_call_click")}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5"
                  >
                    <span>📞 Call Ashrama</span>
                  </a>
                  <a
                    href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hello Janaseva Ashrama, I would like to visit and support the 25 boys.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("menu_wa_click")}
                    className="py-2 px-3 rounded-xl bg-[#25D366] text-teal-950 flex items-center justify-center gap-1.5 font-black"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Categorized Sections */}
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

      {/* ── EXPORT-GRADE MOBILE BOTTOM NAVIGATION BAR ── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-teal-900/10 bg-white/96 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(6,49,47,0.08)] backdrop-blur-2xl md:hidden no-print"
      >
        <ul className="mx-auto grid grid-cols-5 h-16 max-w-md items-center px-1">
          {/* 1. HOME */}
          <li className="text-center">
            <Link
              href="/"
              aria-current={isHomeActive ? "page" : undefined}
              className={`focus-ring tap-scale flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
                isHomeActive ? "text-teal-900" : "text-teal-950/45 hover:text-teal-950/70"
              }`}
            >
              <span className={`transition-transform duration-200 ${isHomeActive ? "scale-110" : "scale-100"}`}>
                <HomeIcon />
              </span>
              <span className={`text-[9px] font-bold tracking-tight ${isHomeActive ? "text-teal-900 font-extrabold" : ""}`}>
                HOME
              </span>
              {isHomeActive && <span className="h-1 w-3 rounded-full bg-saffron mt-0.5" />}
            </Link>
          </li>

          {/* 2. BIRTHDAYS (Top emotional seva) */}
          <li className="text-center">
            <Link
              href="/celebrate-birthday"
              aria-current={isBirthdayActive ? "page" : undefined}
              className={`focus-ring tap-scale flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
                isBirthdayActive ? "text-teal-900" : "text-teal-950/45 hover:text-teal-950/70"
              }`}
            >
              <span className={`transition-transform duration-200 ${isBirthdayActive ? "scale-110" : "scale-100"}`}>
                <BirthdayCakeIcon />
              </span>
              <span className={`text-[9px] font-bold tracking-tight ${isBirthdayActive ? "text-teal-900 font-extrabold" : ""}`}>
                BIRTHDAY
              </span>
              {isBirthdayActive && <span className="h-1 w-3 rounded-full bg-saffron mt-0.5" />}
            </Link>
          </li>

          {/* 3. TRUE CENTER HERO DONATE BUTTON */}
          <li className="text-center">
            <button
              type="button"
              onClick={() => {
                track("cta_make_impact", { where: "bottom_nav" });
                openBottomDonate(101, "meal");
              }}
              aria-label="Open donation options for 25 boys"
              className="focus-ring -mt-5 relative flex flex-col items-center justify-center group tap-scale cursor-pointer mx-auto"
            >
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_8px_25px_rgba(230,126,34,0.45)] ring-4 ring-white transition-transform duration-300 bg-gradient-to-tr from-saffron via-amber-500 to-amber-600 active:scale-95 animate-heartbeat"
              >
                <ImpactHeartIcon />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-teal-950 px-1 text-[10px] font-extrabold text-amber-300 ring-2 ring-white shadow">
                    {count}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[9px] font-black tracking-wide text-saffron-dark">
                DONATE 💝
              </span>
            </button>
          </li>

          {/* 4. VISIT & CAMPUS */}
          <li className="text-center">
            <Link
              href="/contact"
              aria-current={isContactActive ? "page" : undefined}
              className={`focus-ring tap-scale flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 ${
                isContactActive ? "text-teal-900" : "text-teal-950/45 hover:text-teal-950/70"
              }`}
            >
              <span className={`transition-transform duration-200 ${isContactActive ? "scale-110" : "scale-100"}`}>
                <VisitPinIcon />
              </span>
              <span className={`text-[9px] font-bold tracking-tight ${isContactActive ? "text-teal-900 font-extrabold" : ""}`}>
                VISIT US
              </span>
              {isContactActive && <span className="h-1 w-3 rounded-full bg-saffron mt-0.5" />}
            </Link>
          </li>

          {/* 5. EXPLORE / MORE */}
          <li className="text-center">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open more navigation options"
              aria-expanded={open}
              className={`focus-ring tap-scale flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 py-1 transition-colors duration-200 cursor-pointer ${
                open || isMoreActive ? "text-teal-900" : "text-teal-950/45 hover:text-teal-950/70"
              }`}
            >
              <span className={`transition-transform duration-200 ${open || isMoreActive ? "scale-110" : "scale-100"}`}>
                <MenuIcon />
              </span>
              <span className={`text-[9px] font-bold tracking-tight ${open || isMoreActive ? "text-teal-900 font-extrabold" : ""}`}>
                EXPLORE
              </span>
              {(open || isMoreActive) && <span className="h-1 w-3 rounded-full bg-saffron mt-0.5" />}
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
