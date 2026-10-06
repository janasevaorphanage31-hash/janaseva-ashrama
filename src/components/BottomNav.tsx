"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";
import { formatINR } from "@/lib/site";
import { track } from "@/lib/track";

const more = [
  { href: "/celebrate-birthday", label: "Celebrate Birthday (Trending)" },
  { href: "/make-a-day-matter", label: "Make a Day Matter" },
  { href: "/impact-wall", label: "Live Impact Wall" },
  { href: "/campaigns", label: "Create a Campaign" },
  { href: "/gift-impact", label: "Gift an Impact" },
  { href: "/janaseva-crew", label: "Janaseva Crew (Volunteer)" },
  { href: "/skill-giving", label: "Give Your Skill" },
  { href: "/team-impact", label: "Team Impact" },
  { href: "/corporate", label: "Corporate / CSR" },
  { href: "/ngo-network", label: "NGO Network" },
  { href: "/my-impact", label: "My Impact / Receipt" },
  { href: "/recurring-giving", label: "Regular Giving" },
  { href: "/future", label: "Proposed Future Project" },
  { href: "/transparency", label: "Transparency" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/refund-policy", label: "Refund Policy" },
  { href: "/contact", label: "Contact & Location" },
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
  const { total, count } = useCart();
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

  if (path?.startsWith("/admin")) return null;

  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href);
  const moreActive = more.some((m) => path.startsWith(m.href.split("#")[0]));

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
          <div className="sheet-in absolute inset-x-0 bottom-0 rounded-t-3xl bg-cream shadow-2xl max-h-[82vh] flex flex-col">
            {/* Pull handle */}
            <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-teal-900/20" />
            </div>
            <h3 className="font-display text-base font-bold text-teal-900 px-5 pb-3">
              Explore Janaseva Ashrama
            </h3>
            <ul className="grid grid-cols-2 gap-2.5 px-4 pb-8 overflow-y-auto no-scrollbar">
              {more.map((m, i) => (
                <li key={m.href} style={{ animationDelay: `${i * 20}ms` }} className="fade-up">
                  <Link
                    href={m.href}
                    onClick={() => setOpen(false)}
                    className="card focus-ring tap-scale flex items-center justify-between p-3.5 text-xs font-bold text-teal-900 min-h-[52px]"
                  >
                    <span className="leading-tight flex-1">{m.label}</span>
                    <svg className="h-3 w-3 fill-none stroke-current stroke-2 opacity-40 ml-1 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
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
            <Link
              href="/impact"
              onClick={() => track("cta_make_impact", { where: "bottom_nav" })}
              aria-current={active("/impact") ? "page" : undefined}
              className="focus-ring -mt-5 relative flex flex-col items-center justify-center group tap-scale"
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white transition ${
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
                IMPACT
              </span>
              {active("/impact") && <span className="h-1 w-3 rounded-full bg-saffron mt-0.5" />}
            </Link>
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
