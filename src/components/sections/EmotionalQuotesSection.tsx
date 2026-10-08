"use client";

import Link from "next/link";
import { Container, Section, Chip } from "../ui";
import { EMOTIONAL_QUOTES } from "@/lib/site";
import { BlinkingDonateTrigger } from "../BlinkingDonationButton";

export function EmotionalQuotesSection() {
  return (
    <Section id="voices" tone="sand" className="py-12 md:py-16">
      <Container>
        {/* Section Header */}
        <div className="mb-10 max-w-3xl">
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

        {/* 4 Emotional Quotes Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
          {EMOTIONAL_QUOTES.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-3xl bg-white/90 backdrop-blur p-6 shadow-sm ring-1 ring-teal-900/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:ring-saffron/40 min-w-0"
            >
              <div>
                {/* Decorative Quotation Mark & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-serif text-4xl leading-none text-saffron select-none opacity-80" aria-hidden>
                    “
                  </span>
                  <span className="rounded-md bg-sand px-2.5 py-0.5 text-[10px] font-bold text-teal-900 ring-1 ring-teal-900/10">
                    {item.tag}
                  </span>
                </div>

                {/* Quote Text */}
                <p className="font-serif text-base sm:text-lg italic leading-relaxed text-teal-950/90 mb-5">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Author & Context Attribution */}
              <div className="pt-4 border-t border-teal-900/10">
                <p className="font-display text-sm font-bold text-teal-900">{item.author}</p>
                <p className="text-xs font-medium text-saffron-dark">{item.role}</p>
                <p className="text-[11px] text-teal-950/60 mt-0.5">{item.context}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Psychological Action Callout */}
        <div className="mt-8 rounded-3xl bg-gradient-to-r from-teal-900 to-teal-800 p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-gold block mb-1">
              Micro-Giving · Pure Impact
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-bold">
              You do not need to change the entire world to change one child&apos;s entire world.
            </h3>
            <p className="text-sm text-teal-100/80 mt-1">
              Start with a single meal for ₹100 or sponsor full-day food for all 25 boys for ₹4,500. 100% of your gift reaches the children.
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
