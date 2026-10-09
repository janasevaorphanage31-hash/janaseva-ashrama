"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track";

export interface VerticalNavTarget {
  id: string;
  label: string;
  icon: string;
  mode?: string;
}

const VERTICAL_TARGETS: VerticalNavTarget[] = [
  { id: "official-tiers", label: "5 Tiers", icon: "🏛️", mode: "tiers" },
  { id: "celebrate", label: "Birthday", icon: "🎂", mode: "celebrate" },
  { id: "impact", label: "Basket", icon: "🛒", mode: "annadana" },
  { id: "boys-gallery", label: "Gallery", icon: "📸", mode: "life" },
  { id: "activities", label: "Seva", icon: "🤝", mode: "life" },
  { id: "volunteer", label: "Volunteer", icon: "🙋", mode: "life" },
  { id: "transparency", label: "80G Docs", icon: "📜", mode: "trust" },
  { id: "trust", label: "Bank", icon: "🏦", mode: "trust" },
  { id: "faq", label: "FAQ", icon: "❓", mode: "trust" },
];

export function VerticalSectionRail({
  currentMode,
  onSelectMode,
}: {
  currentMode?: string;
  onSelectMode?: (mode: string, targetId?: string) => void;
}) {
  const [activeTarget, setActiveTarget] = useState<string>("official-tiers");
  const [expandedMobile, setExpandedMobile] = useState(false);

  // Monitor active target on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (let i = VERTICAL_TARGETS.length - 1; i >= 0; i--) {
        const el = document.getElementById(VERTICAL_TARGETS[i].id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveTarget(VERTICAL_TARGETS[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleJump = (target: VerticalNavTarget) => {
    track("vertical_rail_jump", { targetId: target.id, mode: target.mode || "" });

    // If a mode switcher callback exists and we are not in 'all', switch or jump
    if (onSelectMode && target.mode && currentMode && currentMode !== "all" && currentMode !== target.mode) {
      onSelectMode(target.mode, target.id);
      return;
    }

    const el = document.getElementById(target.id);
    if (el) {
      const yOffset = -110;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveTarget(target.id);
    } else if (onSelectMode && target.mode) {
      onSelectMode(target.mode, target.id);
    }

    setExpandedMobile(false);
  };

  return (
    <>
      {/* ── DESKTOP & TABLET VERTICAL FLOATING RAIL ── */}
      <aside
        aria-label="Vertical Section Quick Jump"
        className="fixed right-3.5 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-1.5 rounded-full bg-teal-950/85 backdrop-blur-md p-1.5 shadow-[0_10px_35px_rgba(5,47,44,0.35)] border border-white/20 text-white transition-all hover:bg-teal-950"
      >
        <span className="text-[9px] font-black uppercase tracking-widest text-gold rotate-180 [writing-mode:vertical-lr] py-1 select-none">
          SECTIONS
        </span>

        <div className="h-px w-4 bg-white/20 my-0.5" />

        {VERTICAL_TARGETS.map((target) => {
          const isActive = activeTarget === target.id;
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => handleJump(target)}
              title={`Jump to ${target.label}`}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-full text-base transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-saffron text-white scale-110 shadow-md ring-2 ring-white/50"
                  : "hover:bg-white/15 text-white/80 hover:text-white"
              }`}
            >
              <span>{target.icon}</span>

              {/* Hover Flyout Tooltip on Desktop */}
              <span className="pointer-events-none absolute right-11 rounded-xl bg-teal-900 text-white px-2.5 py-1 text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-teal-800">
                {target.label}
              </span>
            </button>
          );
        })}

        <div className="h-px w-4 bg-white/20 my-0.5" />

        {/* Quick Top Button on Vertical Rail */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Scroll to Top"
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-amber-300 hover:bg-white/15 transition cursor-pointer"
        >
          ▲
        </button>
      </aside>

      {/* ── MOBILE VERTICAL QUICK-JUMP THUMB STRIP ── */}
      <div className="fixed right-2 top-1/3 z-40 lg:hidden flex flex-col items-end">
        {/* Toggleable Drawer Trigger Button */}
        <button
          type="button"
          onClick={() => setExpandedMobile((prev) => !prev)}
          aria-label="Toggle vertical sections fast navigation"
          className="flex items-center gap-1 rounded-l-full bg-teal-950/90 text-white pl-2.5 pr-2 py-1.5 shadow-lg border-l border-y border-white/20 backdrop-blur-md text-[11px] font-black tracking-wider cursor-pointer active:scale-95 transition-all"
        >
          <span className="text-gold text-xs">⚡</span>
          <span>{expandedMobile ? "✕" : "Jump"}</span>
        </button>

        {/* Expanded Vertical Section Menu for Mobile */}
        {expandedMobile && (
          <div className="mt-1.5 flex flex-col gap-1 rounded-2xl bg-teal-950/95 backdrop-blur-xl p-2 shadow-2xl border border-white/25 text-white animate-fadeIn max-h-[60vh] overflow-y-auto no-scrollbar">
            <span className="text-[10px] font-black uppercase text-gold px-1 text-center tracking-wider border-b border-white/15 pb-1 mb-0.5">
              Instant Jump
            </span>
            {VERTICAL_TARGETS.map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => handleJump(target)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold transition text-left active:scale-95 ${
                  activeTarget === target.id
                    ? "bg-saffron text-white shadow-sm"
                    : "bg-white/10 text-white/90 hover:bg-white/20"
                }`}
              >
                <span className="text-sm">{target.icon}</span>
                <span className="text-[11px] whitespace-nowrap">{target.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
