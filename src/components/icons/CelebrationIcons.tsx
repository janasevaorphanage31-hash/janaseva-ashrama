import type { SVGProps } from "react";

export function BirthdayCakeIcon({ className = "w-6 h-6", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Candle Flame */}
      <path d="M12 2c-.5 1-1.5 1.5-1.5 2.5a1.5 1.5 0 003 0C13.5 3.5 12.5 3 12 2z" fill="currentColor" stroke="none" />
      {/* Candle */}
      <line x1="12" y1="5.5" x2="12" y2="8" />
      {/* Top Tier */}
      <path d="M7 8h10a1 1 0 011 1v3H6V9a1 1 0 011-1z" />
      {/* Middle Icing Drops */}
      <path d="M6 12c.8 0 1.2.6 2 .6s1.2-.6 2-.6 1.2.6 2 .6 1.2-.6 2-.6 1.2.6 2 .6 1.2-.6 2-.6" />
      {/* Bottom Tier */}
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
      {/* Plate */}
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  );
}

export function BlessingsHeartIcon({ className = "w-6 h-6", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Heart */}
      <path d="M12 7.5c-1.5-2.5-4.5-2.8-6.2-1-1.8 1.8-1.5 4.8.5 6.8L12 19l5.7-5.7c2-2 2.3-5 .5-6.8-1.7-1.8-4.7-1.5-6.2 1z" />
      {/* Radiating blessing rays */}
      <path d="M12 2v2M4.9 4.9l1.4 1.4M19.1 4.9l-1.4 1.4M2 12h2M20 12h2" />
    </svg>
  );
}

export function FeastPlatterIcon({ className = "w-6 h-6", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Main Thali Plate */}
      <circle cx="12" cy="12" r="9" />
      {/* Inner Rim */}
      <circle cx="12" cy="12" r="6.5" strokeDasharray="1 2" />
      {/* Katori Bowls */}
      <circle cx="9" cy="9.5" r="1.8" />
      <circle cx="15" cy="9.5" r="1.8" />
      <circle cx="12" cy="15" r="2" />
      {/* Festive Spoon */}
      <path d="M19 4l-3 3" />
    </svg>
  );
}

export function VisitAshramaIcon({ className = "w-6 h-6", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Ashrama Roof */}
      <path d="M3 10L12 3l9 7" />
      {/* Building walls */}
      <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
      {/* Welcoming Doorway */}
      <path d="M10 21v-6a2 2 0 014 0v6" />
      {/* Sunlight/Flag on roof */}
      <path d="M12 3V1m0 0l2 1-2 1" />
    </svg>
  );
}

export function TrendingSparkIcon({ className = "w-5 h-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Trending flame spark */}
      <path d="M12 2c.8 3.5 4 5 4 8.5a6 6 0 11-12 0c0-2.8 1.5-5 3.5-6.5.5 2 1.5 3 2.5 3 1.5 0 1.2-3 2-5z" />
    </svg>
  );
}

export function CalendarSlotIcon({ className = "w-5 h-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="12" cy="15" r="2" />
      <path d="M12 14v1.5l1 .5" />
    </svg>
  );
}

export function InstagramStoryIcon({ className = "w-5 h-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppStatusIcon({ className = "w-5 h-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      <path d="M9.5 8.5c-.2-.5-.5-.5-.8-.5s-.6 0-.9.3-.9 1-.9 2.3 1 2.7 1.2 2.9 2 3.1 4.8 4.3c2.4 1 2.8.7 3.3.6.5-.1 1.6-.7 1.8-1.3.2-.7.2-1.3.1-1.4s-.3-.2-.8-.4-2.8-1.4-3.2-1.5-.7-.2-1 .2-1.2 1.5-1.5 1.8-.6.3-1.1.1a13.3 13.3 0 01-3.9-2.4 14.8 14.8 0 01-2.7-3.4c-.3-.5 0-.8.2-1 .2-.2.5-.5.7-.8s.3-.5.4-.8.1-.6 0-.8-.9-2.2-1.3-3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function MapPinIcon({ className = "w-5 h-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function TaxShieldIcon({ className = "w-5 h-5", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
