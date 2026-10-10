import Link from "next/link";
import { Chip, Container, Head, Section } from "../ui";
import { BANK_DETAILS, SITE } from "@/lib/site";

const TRUST_PILLARS = [
  {
    icon: (
      <svg className="h-6 w-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    badge: "Bank Security",
    title: "256-Bit Bank-Grade Encryption",
    desc: "Payments are processed securely via RBI-authorized Razorpay. Zero card numbers, UPI PINs, or banking credentials are ever stored on our servers.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    badge: "Govt Licensed",
    title: "JJ Act Registered Orphanage (KA18CH0242)",
    desc: "Officially registered Child Care Institution under Directorate of Child Protection, Govt of Karnataka (Form 28, capacity 25 boys, age 07-18).",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    badge: "Official Record",
    title: "Instant Digital Receipts (80G)",
    desc: "Automated server-generated receipts with a unique public verification reference are issued immediately. Download anytime or receive via WhatsApp.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
      </svg>
    ),
    badge: "Privacy Guaranteed",
    title: "Anonymous Giving Respected",
    desc: "Support silently with a single checkbox. Your personal name and contact details remain strictly confidential and will never appear on public impact walls.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    badge: "Child Ethics",
    title: "Child Safeguarding & Dignity",
    desc: "We strictly observe child safeguarding policies. Children are never used as emotional conversion tokens or promotional objects. Consent is paramount.",
  },
  {
    icon: (
      <svg className="h-6 w-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    badge: "Accountability",
    title: "100% Verified Needs Allocation",
    desc: "Donations directly fund concrete items: nutritious meals, textbooks, healthcare, and hygiene. No artificial inflation or unverified administrative overhead.",
  },
];

export function TrustSection() {
  const marqueePillars = [...TRUST_PILLARS, ...TRUST_PILLARS];

  return (
    <Section id="trust" tone="white" className="overflow-hidden py-12 md:py-16">
      <Container>
        <div className="mb-3">
          <Chip tone="teal">Before You Give</Chip>
        </div>
        <Head
          eyebrow="Trust & Accountability"
          title="Your contribution is protected, verified and spent with dignity"
          lead="Giving should be effortless, clear, and founded on genuine accountability. Here is how your generosity is safeguarded from checkout to real impact."
        />
      </Container>

      {/* ── 6 TRUST PILLARS IN CONTINUOUS HORIZONTAL MOVING MOVEMENT ── */}
      <div className="relative w-full overflow-hidden py-4 mt-4">
        {/* Subtle Edge Gradients */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 sm:w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 sm:w-24 bg-gradient-to-l from-white to-transparent" />

        {/* Horizontal Marquee Track with Pause on Hover */}
        <div className="animate-marquee-slow flex gap-5 w-max hover:cursor-grab active:cursor-grabbing">
          {marqueePillars.map((pillar, idx) => (
            <div
              key={`${pillar.title}-${idx}`}
              className="w-[290px] sm:w-[350px] shrink-0 rounded-3xl border border-teal-900/10 bg-sand/30 p-6 transition-all duration-300 hover:bg-white hover:shadow-lg hover:border-teal-900/25 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800/10 text-teal-900 shadow-2xs">
                    {pillar.icon}
                  </div>
                  <span className="rounded-md bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-900 ring-1 ring-teal-900/10">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base sm:text-lg font-bold text-teal-900 leading-snug">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-teal-950/75">
                  {pillar.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-teal-900/10 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
                <span>✓ Verified Commitment</span>
                <span>Janaseva Trust</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Container>
        {/* Quick Question / Direct Contact Strip */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-3xl bg-teal-900 p-6 text-white sm:flex-row sm:p-7 shadow-md">
          <div>
            <h4 className="font-display text-lg font-bold text-gold">
              Have questions or want to meet the boys in person?
            </h4>
            <p className="mt-1 text-xs sm:text-sm text-white/80">
              Speak directly with an Ashrama caregiver or trustee before making your contribution.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <a
              href={`tel:${SITE.phone}`}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-gold transition shadow-xs"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 15.5c-1.2 0-2.4-.2-3.6-.6-.3-.1-.7 0-1 .2l-2.2 2.2c-2.8-1.4-5.1-3.8-6.6-6.6l2.2-2.2c.3-.3.4-.7.2-1-.4-1.1-.6-2.3-.6-3.5 0-.6-.4-1-1-1H4c-.6 0-1 .4-1 1 0 9.4 7.6 17 17 17 .6 0 1-.4 1-1v-3.5c0-.6-.4-1-1-1z" />
              </svg>
              <span>Call {SITE.phone}</span>
            </a>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.821 2.791.821 3.182 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.807-5.77-5.807zm3.364 8.205c-.14.398-.711.758-1.02.801-.309.041-.699.072-2.02-.452-1.631-.647-2.69-2.311-2.772-2.421-.08-.11-.659-.877-.659-1.673 0-.796.419-1.189.569-1.35.15-.16.329-.201.439-.201.11 0 .22.001.319.006.11.006.25-.041.389.299.15.361.509 1.24.559 1.341.05.101.08.22.01.361-.07.14-.11.23-.22.361-.11.13-.23.29-.329.39-.11.11-.22.23-.09.45.13.22.579.957 1.25 1.551.86.769 1.58.1.009 1.8.889.22.12.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.5-.11.2.07 1.27.6 1.49.71.22.11.37.16.42.25.05.1.05.58-.09.98z" />
              </svg>
              <span>WhatsApp</span>
            </a>
            <Link
              href="/transparency"
              className="focus-ring inline-flex items-center gap-1 rounded-xl border border-white/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              Transparency Center →
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}

