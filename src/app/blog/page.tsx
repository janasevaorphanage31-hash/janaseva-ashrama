import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog & Donor Insights · Janaseva Ashrama Bangalore",
  description:
    "Authoritative articles, donor guides, and community impact reports on child care, 80G tax benefits, Annadana meal sponsorship, and charity transparency in Bengaluru.",
  alternates: {
    canonical: `${SITE.url}/blog`,
  },
  openGraph: {
    title: "Blog & Donor Insights · Janaseva Ashrama",
    description: "Insights into child welfare, 80G tax exemptions, and meal sponsorship in Bangalore.",
    url: `${SITE.url}/blog`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
  },
};

export default function BlogIndexPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Blog & Guides" }]} />
      <PageHero
        eyebrow="Donor Resources & Knowledge Base"
        title="Janaseva Ashrama Blog & Guides"
        lead="Clear, verified guides for donors in Bangalore. Learn how to verify government licensing under the JJ Act, claim 50% tax deductions under Section 80G, and celebrate life milestones with children."
      />

      <Section tone="cream" className="py-12">
        <Container className="max-w-5xl">
          {/* Featured Article Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm mb-10">
            <span className="inline-block px-3 py-1 bg-amber-400 text-stone-900 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
              Featured 2026 Comprehensive Guide
            </span>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-3">
              <Link
                href="/stories/sponsor-meals-orphanage-bangalore-guide"
                className="hover:text-emerald-800 transition"
              >
                How to Sponsor Meals (Annadana) & Donate to Orphanages in Bangalore (80G Tax Exemption Guide)
              </Link>
            </h2>
            <p className="text-stone-600 text-sm md:text-base leading-relaxed mb-6">
              A comprehensive guide for donors across Bengaluru covering Karnataka Directorate of Child Protection registration (JJ Act KA18CH0242), Form 10AC Section 80G tax exemptions, meal cost breakdowns, visiting hours, and in-person birthday celebration bookings.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-stone-100 text-xs text-stone-500">
              <span>By Sunita Bai, Head Caregiver · 6 min read</span>
              <Link
                href="/stories/sponsor-meals-orphanage-bangalore-guide"
                className="font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                Read Complete Guide &rarr;
              </Link>
            </div>
          </div>

          {/* Documentary Journal Section */}
          <div className="bg-emerald-950 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Documentary Journal</span>
              <h3 className="text-xl md:text-2xl font-serif font-bold mt-1 mb-2">
                Stories from Daily Life at Janaseva
              </h3>
              <p className="text-stone-300 text-sm max-w-xl">
                Read authentic, grounded chapters on how morning nutrition, evening study hours, and playful afternoons shape the lives of 25 resident boys.
              </p>
            </div>
            <Link
              href="/stories"
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold rounded-xl text-sm transition shadow shrink-0"
            >
              Explore All Stories &rarr;
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
