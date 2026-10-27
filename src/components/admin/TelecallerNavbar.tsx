"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { SITE } from "@/lib/site";

interface TelecallerNavbarProps {
  callerId?: string;
  callerName?: string;
  onLogout?: () => void;
}

export function TelecallerNavbar({ callerId, callerName, onLogout }: TelecallerNavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-teal-950 text-white shadow-md border-b border-teal-900/60 no-print">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Left: Ashrama Staff Portal Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link href="/portal" className="flex items-center gap-2 focus-ring">
            <LogoMark size={32} className="ring-1 ring-amber-400/40" />
            <div className="leading-tight">
              <span className="font-display text-sm sm:text-base font-black tracking-tight text-white block">
                Janaseva Ashrama
              </span>
              <span className="text-[10px] font-bold text-amber-300 tracking-wider uppercase block">
                Telecaller Workspace
              </span>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Official Internal Staff
          </span>
        </div>

        {/* Center/Right: Helpful Telecaller Links & Staff Context (ZERO public donation solicitations) */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <a
            href={SITE.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-white/80 hover:text-amber-300 transition"
            title="Bangalore Ashrama Location Pin"
          >
            <span>📍 Turahalli Ashrama</span>
          </a>

          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition"
            title="Super Admin CRM"
          >
            <span>🔐 Admin CRM</span>
          </Link>

          <Link
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white transition"
            title="Open Public Website in new tab"
          >
            <span>🌐 View Website</span>
          </Link>

          {callerId && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/15">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-gold text-teal-950 font-black text-xs shadow-xs">
                {callerId}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[11px] text-rose-300 hover:text-rose-100 font-bold cursor-pointer"
                  title="Sign Out"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
