import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Documentary Stories & Journal · Janaseva Ashrama",
  description:
    "Grounded documentary storytelling from daily life at Janaseva Ashrama. Discover how nourishment, education, and community shape each day.",
  alternates: {
    canonical: `${SITE.url}/stories`,
  },
};

const CHAPTERS = [
  {
    title: "The Morning Kitchen: Fueling 100 Days of Growth",
    category: "Nutrition & Care",
    readTime: "2 min read",
    image: "/media/food.jpg",
    glance: "Fresh vegetables, lentils, and warm breakfast prepared daily by 7:30 AM.",
    fullStory:
      "Every morning begins before dawn in the Ashrama kitchen. Fresh vegetables procured from local vendors, steaming pots of sambar, and hot idlis or upma ensure that no child heads to school on an empty stomach. Wholesome nutrition is not just food-it is the foundation of energy, focus, and emotional security.",
    impactSlug: "meal",
    impactName: "Meal Support (₹100/meal)",
  },
  {
    title: "Quiet Corners: The Evening Study Hour",
    category: "Education & Mentorship",
    readTime: "3 min read",
    image: "/media/education.jpg",
    glance: "Daily 6:00 PM study tables where homework is tackled with volunteer tutors.",
    fullStory:
      "When the school bell rings and evening descends, the Ashrama dining hall transforms into a quiet study sanctuary. Volunteer tutors and resident mentors guide students through science equations, English reading, and mathematics. Having their own notebooks, textbooks, and encouragement gives these learners the confidence to excel.",
    impactSlug: "education",
    impactName: "Education Support (₹250/unit)",
  },
  {
    title: "Laughter on the Field: Childhood Protected",
    category: "Recreation & Play",
    readTime: "2 min read",
    image: "/media/play.jpg",
    glance: "Afternoons filled with cricket, carrom, drawing, and joyful games.",
    fullStory:
      "Childhood is sacred. Beyond academics, Janaseva Ashrama fiercely protects a child's right to run, play, and imagine. Weekend sports matches, arts and crafts sessions, and music workshops allow children to express themselves, form lifelong friendships, and simply be children without the burden of adult worries.",
    impactSlug: "activities",
    impactName: "Sports & Creative Learning (₹250/unit)",
  },
  {
    title: "Gentle Care: Health Checks & Preventive Care",
    category: "Health & Wellbeing",
    readTime: "2 min read",
    image: "/media/health.jpg",
    glance: "Periodic pediatric screenings, first-aid readiness, and dental hygiene.",
    fullStory:
      "Growing up healthy requires attentive care. Visiting doctors conduct routine health checks, track growth milestones, and ensure first-aid kits are fully stocked. When a child falls sick, resident caretakers provide warm broth, medicines, and the reassurance that they are cherished and safe.",
    impactSlug: "health",
    impactName: "Health Support (₹500/unit)",
  },
];

export default function StoriesPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Stories & Journal" }]} />
      <PageHero
        eyebrow="Documentary Journal"
        title="Stories from Janaseva"
        lead="Grounded, dignified glimpses into daily life. Understand how your support translates directly into warmth, education, and hope."
      />

      <Section tone="cream" className="py-12">
        <Container className="max-w-6xl">
          {/* Safeguarding Commitment Banner */}
          <div className="mb-10 rounded-2xl bg-teal-900/10 p-4 border border-teal-900/15 text-xs text-teal-950/80 flex items-start gap-3">
            <svg className="h-5 w-5 text-teal-800 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <strong>Child Safeguarding & Dignity First:</strong> We never display children as objects of pity or distress. Our documentary stories respect the dignity, privacy, and identity of all residents.
            </div>
          </div>

          {/* Chapters List */}
          <div className="space-y-10">
            {CHAPTERS.map((ch, idx) => (
              <article
                key={ch.title}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-teal-900/10 grid md:grid-cols-2 gap-0 transition hover:shadow-md"
              >
                {/* Visual */}
                <div className={`relative h-64 md:h-full min-h-[260px] bg-teal-900 ${idx % 2 === 1 ? "md:order-2" : ""}`}>
                  <Image
                    src={ch.image}
                    alt={ch.title}
                    fill
                    className="object-cover opacity-90"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-teal-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="inline-block rounded-xl bg-black/50 px-3 py-1 text-xs font-semibold backdrop-blur">
                      {ch.category}
                    </span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-teal-900/50 mb-2">
                      <span>Chapter {idx + 1}</span>
                      <span>{ch.readTime}</span>
                    </div>

                    <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900 leading-snug">
                      {ch.title}
                    </h2>

                    {/* Quick Glance for Rapid Mobile Readers */}
                    <div className="mt-3 rounded-xl bg-sand/70 p-3 text-xs font-semibold text-teal-900">
                      <strong>Quick Glance:</strong> {ch.glance}
                    </div>

                    <p className="mt-3 text-sm text-teal-950/75 leading-relaxed">
                      {ch.fullStory}
                    </p>
                  </div>

                  {/* Direct Impact Action */}
                  <div className="mt-6 pt-4 border-t border-teal-900/10 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-teal-900/60">
                      Supports: <strong className="text-teal-900">{ch.impactName}</strong>
                    </span>
                    <Link
                      href={`/impact/${ch.impactSlug}`}
                      className="focus-ring inline-block rounded-xl bg-saffron px-5 py-2 text-xs font-bold text-white shadow hover:bg-saffron-dark transition"
                    >
                      SUPPORT THIS NEED →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Bottom Journey Callout */}
          <div className="mt-16 text-center rounded-3xl bg-teal-900 p-8 text-white shadow-lg">
            <h2 className="font-display text-2xl font-bold text-white">
              Every Day Matters at Janaseva Ashrama
            </h2>
            <p className="mt-2 text-sm text-teal-100/80 max-w-xl mx-auto">
              Behind every meal served, every schoolbook opened, and every smile shared is a community of people who decided to stand with these children.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/impact"
                className="rounded-xl bg-saffron px-7 py-3 text-sm font-bold text-white shadow-md hover:bg-saffron-dark transition"
              >
                BROWSE TODAY&apos;S NEEDS
              </Link>
              <Link
                href="/make-a-day-matter"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
              >
                MAKE A DAY MATTER
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
