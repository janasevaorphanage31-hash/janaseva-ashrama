"use client";

import { useState } from "react";

export function LogoMark({ size = 44 }: { size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <svg width={size} height={size} viewBox="0 0 128 128" fill="none" className="shrink-0 rounded-full shadow-xs" aria-hidden="true">
        <circle cx="64" cy="64" r="60" fill="#FBF6EC" />
        <circle cx="64" cy="64" r="58" stroke="#F2B544" strokeWidth="4" />
        <path d="M20 72C38 61 48 61 64 72C80 61 90 61 108 72" fill="#F3EAD9" />
        <path d="M18 76C38 64 50 64 64 76C78 64 90 64 110 76" fill="#0F524E" />
        <path d="M64 74L44 38H84L64 74Z" fill="#0F524E" />
        <circle cx="74" cy="32" r="7" fill="#0F524E" />
        <path d="M64 58C66 45 74 39 86 34C76 49 72 58 64 74" fill="#0F524E" />
        <circle cx="56" cy="42" r="5" fill="#E8892B" />
        <path d="M51 52C54 46 57 44 61 41C59 48 58 53 56 58C54 56 53 55 51 52Z" fill="#E8892B" />
        <circle cx="64" cy="42" r="19" fill="#F2C35B" fillOpacity="0.35" />
        <path d="M90 22L94 18L98 22L94 26L90 22Z" fill="#F2B544" />
      </svg>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo/janaseva-mark.png"
      alt="Janaseva Ashrama Logo"
      width={size}
      height={size}
      onError={() => setImgError(true)}
      className="shrink-0 rounded-full object-contain shadow-xs aspect-square"
      loading="eager"
      // @ts-expect-error fetchpriority is standard in modern HTML
      fetchpriority="high"
    />
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 shrink-0 select-none">
      <LogoMark />
      <span className={`leading-none tracking-wide shrink-0 ${light ? "text-white" : "text-teal-900"}`}>
        <span className="block text-[15px] sm:text-[16px] font-extrabold tracking-wide">JANASEVA</span>
        <span className={`block text-[9px] sm:text-[10px] font-bold tracking-[0.32em] ${light ? "text-gold" : "text-saffron-dark"}`}>ASHRAMA</span>
      </span>
    </span>
  );
}
