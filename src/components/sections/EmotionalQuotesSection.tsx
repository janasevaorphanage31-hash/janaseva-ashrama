"use client";

import Link from "next/link";
import { Container, Section, Chip } from "../ui";
import { EMOTIONAL_QUOTES } from "@/lib/site";
import { BlinkingDonateTrigger } from "../BlinkingDonationButton";

export function EmotionalQuotesSection({
  quotes,
}: {
  quotes?: Array<{
    quote: string;
    author: string;
    role: string;
    context: string;
    tag: string;
  }>;
} = {}) {
  const activeQuotes = quotes && quotes.length > 0 ? quotes : EMOTIONAL_QUOTES;
  // Duplicate for seamless infinite horizontal marquee loop
  const marqueeQuotes = [...activeQuotes, ...activeQuotes];

  return (
    <Section id="voices" tone="sand" className="py-12 md:py-16 overflow-hidden">
      <Container>
        {/* Section Header */}
        <div className="mb-8 max-w-3xl">
          <p className="inline-block rounded-lg bg-saffron/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-saffron-dark mb-3">
            Voices of Janaseva · Dignity &amp; Love
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight text-teal-900 sm:text-4xl md:text-5xl">
            &ldquo;Every child deserves a warm plate and a tomorrow they can believe in.&rdquo;
          </h2>
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-teal-950/75">
            Real reflections from the caregivers who wake up before dawn, the volunteer teachers who mentor late into the evening, and the young dreamers whose lives are shaped by your generosity.
          </p>
        </div>
      </Container>

      {/* ── CONTINUOUS HORIZONTAL MOVING QUOTES CAROUSEL ── */}
      <div className="relative w-full overflow-hidden py-3">
        {/* Subtle Edge Vignettes for Seamless Fade */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 sm:w-24 bg-gradient-to-r from-[var(--color-sand)] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 sm:w-24 bg-gradient-to-l from-[var(--color-sand)] to-transparent" />

        {/* Horizontal Marquee Track with Pause on Hover */}
        <div className="animate-marquee-slow flex gap-5 w-max hover:cursor-grab active:cursor-grabbing">
          {marqueeQuotes.map((item, idx) => (
            <div
              key={`${item.author}-${idx}`}
              className="w-[300px] sm:w-[360px] shrink-0 rounded-3xl bg-white/95 backdrop-blur-md p-6 shadow-sm ring-1 ring-teal-900/10 transition-all duration-300 hover:shadow-lg hover:ring-saffron/50 flex flex-col justify-between"
            >
              <div>
                {/* Quotation Mark & Tag */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif text-3xl leading-none text-saffron select-none opacity-85" aria-hidden>
                    “
                  </span>
                  <span className="rounded-md bg-sand/70 px-2.5 py-0.5 text-[10px] font-bold text-teal-900 ring-1 ring-teal-900/10">
                    {item.tag}
                  </span>
                </div>

                {/* Quote Body */}
                <p className="font-serif text-sm sm:text-base italic leading-relaxed text-teal-950/90 mb-4">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author Attribution */}
              <div className="pt-3 border-t border-teal-900/10">
                <p className="font-display text-xs sm:text-sm font-bold text-teal-900">
                  {item.author}
                </p>
                <p className="text-[11px] font-medium text-saffron-dark">
                  {item.role}
                </p>
                <p className="text-[10px] text-teal-950/60 mt-0.5">
                  {item.context}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Container>
        {/* Psychological Action Callout */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 p-6 sm:p-8 text-white shadow-lg border border-teal-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-gold block mb-1">
              Micro-Giving · Pure Impact
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-bold">
              You do not need to change the entire world to change one child&apos;s entire world.
            </h3>
            <p className="text-xs sm:text-sm text-teal-100/80 mt-1">
              Start with a single Shagun meal for ₹101 or sponsor full-day Annadana for all 25 boys for ₹4,500. 100% of your gift reaches the children.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <BlinkingDonateTrigger
              amount={4500}
              tierId="food_one_day"
              label="SPONSOR 25 BOYS (₹4,500) 💝"
              size="md"
            />
            <Link
              href="#official-tiers"
              className="focus-ring inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-white/20 transition cursor-pointer"
            >
              View 5 Support Tiers →
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
