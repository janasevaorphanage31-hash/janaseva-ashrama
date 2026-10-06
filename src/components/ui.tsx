import type { ReactNode } from "react";

export function Section({
  id,
  tone = "cream",
  children,
  className = "",
}: {
  id?: string;
  tone?: "cream" | "white" | "sand" | "teal";
  children: ReactNode;
  className?: string;
}) {
  const bg = {
    cream: "bg-cream",
    white: "bg-white",
    sand: "bg-sand",
    teal: "bg-teal-900 text-white",
  }[tone];
  return (
    <section
      id={id}
      className={`${bg} scroll-mt-14 py-12 md:py-20 w-full max-w-full overflow-hidden ${className}`}
    >
      {children}
    </section>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Head({
  eyebrow,
  title,
  lead,
  light = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-7 max-w-2xl md:mb-10">
      <p
        className={`mb-2 text-xs font-bold uppercase tracking-[0.25em] ${
          light ? "text-gold" : "text-saffron-dark"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`font-display text-3xl font-bold leading-tight md:text-4xl ${
          light ? "text-white" : "text-teal-900"
        }`}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={`mt-3 text-base leading-relaxed md:text-lg ${
            light ? "text-white/80" : "text-teal-950/70"
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}

export function Chip({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: "teal" | "orange" | "gold" | "plain";
}) {
  const c = {
    teal: "bg-teal-100 text-teal-800",
    orange: "bg-saffron/15 text-saffron-dark",
    gold: "bg-gold text-teal-950",
    plain: "bg-white/90 text-teal-900",
  }[tone];
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${c}`}
    >
      {children}
    </span>
  );
}

/** Full-bleed page hero banner (for sub-pages like /stories, /impact, etc.) */
export function PageHero({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
}) {
  return (
    <div className="bg-teal-900 px-5 pb-10 pt-10 text-white md:pb-14 md:pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-base text-white/80 md:text-lg">{lead}</p>}
      </div>
    </div>
  );
}

/**
 * AnimCard — a card that lifts on hover and reveals on scroll via CSS classes.
 * Use in sections that render a grid of cards.
 */
export function AnimCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`card ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
