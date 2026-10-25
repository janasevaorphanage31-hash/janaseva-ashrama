import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BANGALORE_LOCALITIES } from "@/lib/locations-data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Orphanage in Bangalore | Janaseva Ashrama (Turahalli, South Bangalore)",
  description:
    "Verified government-registered orphanage and children's home in Bangalore (JJ Act KA18CH0242). Nurturing 25 resident boys with meals, schooling, shelter & 80G tax exemption. Serving all South Bangalore localities.",
  keywords: [
    "orphanage in bangalore",
    "orphanage near me bangalore",
    "children home in bangalore",
    "donate to orphanage bangalore",
    "annadana in bangalore",
    "celebrate birthday in orphanage bangalore",
    "south bangalore orphanage",
    "turahalli orphanage",
    "subramanyapura children home",
    "uttarahalli ngo bangalore",
    "banashankari orphanage",
    "kanakapura road children home",
  ],
  alternates: {
    canonical: `${SITE.url}/orphanage-bangalore`,
  },
  openGraph: {
    title: "Orphanage in Bangalore · Janaseva Ashrama",
    description:
      "Licensed children's home nurturing 25 resident boys in South Bangalore. Sponsor hot meals, education kits, and celebrate family milestones. 80G tax exemption.",
    url: `${SITE.url}/orphanage-bangalore`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Orphanage Bangalore",
      },
    ],
  },
};

export default function OrphanageBangaloreIndexPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: BANGALORE_LOCALITIES.map((loc, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: `Orphanage near ${loc.name}, Bangalore`,
      url: `${SITE.url}/orphanage-bangalore/${loc.slug}`,
    })),
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Orphanage in Bangalore Localities" }]} />
      <PageHero
        eyebrow="Government-Registered Child Care Institution · JJ Act KA18CH0242"
        title="Orphanage & Children's Home in Bangalore"
        lead="Located in the tranquil surroundings of Turahalli, Bangalore South, Janaseva Ashrama provides loving residential care, hot daily Annadana meals, and quality schooling for 25 orphaned boys. Discover how to visit, celebrate milestones, and sponsor meals from your neighborhood."
      />

      <Section tone="cream" className="py-12">
        <Container className="max-w-6xl">
          {/* Quick Institutional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm text-center">
              <span className="block text-3xl font-extrabold text-stone-900 font-serif">25</span>
              <span className="text-xs text-stone-600 font-medium">Resident Boys Under Care</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm text-center">
              <span className="block text-3xl font-extrabold text-emerald-800 font-serif">100%</span>
              <span className="text-xs text-stone-600 font-medium">Direct Meal & School Allocation</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm text-center">
              <span className="block text-3xl font-extrabold text-amber-700 font-serif">50%</span>
              <span className="text-xs text-stone-600 font-medium">Section 80G Tax Exemption</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm text-center">
              <span className="block text-3xl font-extrabold text-stone-900 font-serif">13+</span>
              <span className="text-xs text-stone-600 font-medium">Years Serving Bangalore (Est. 2013)</span>
            </div>
          </div>

          {/* Locality Grid */}
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-2">
              Browse by Bangalore Neighborhood
            </h2>
            <p className="text-stone-600 text-sm max-w-2xl mb-8">
              Find travel directions, BMTC bus routes, metro connectivity, and localized seva opportunities from your part of Bengaluru to Janaseva Ashrama.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BANGALORE_LOCALITIES.map((locality) => (
                <Link
                  key={locality.slug}
                  href={`/orphanage-bangalore/${locality.slug}`}
                  className="group bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold font-serif text-stone-900 group-hover:text-emerald-900 transition">
                        {locality.name}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded-full text-stone-700">
                        {locality.distanceKm}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-3">{locality.kannadaName}</p>
                    <p className="text-sm text-stone-600 line-clamp-3 mb-4">
                      {locality.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-emerald-800">
                    <span>{locality.travelTimeMin}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition">
                      View Local Guide & Directions &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Action CTA Box */}
          <div className="mt-12 rounded-3xl bg-gradient-to-br from-[#042825] to-[#0A4D46] text-white p-8 md:p-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="inline-block px-3 py-1 bg-amber-400 text-stone-900 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                Open All 7 Days · 10 AM to 6 PM
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-bold mb-2">
                Visit Janaseva Ashrama in Turahalli
              </h3>
              <p className="text-white/80 text-sm max-w-xl">
                Come celebrate your birthday, wedding anniversary, or sacred memorial day with 25 smiling boys. Call us at +91 99803 59595 to coordinate your visit.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/donate"
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition text-center shadow-lg"
              >
                Sponsor a Meal (₹100)
              </Link>
              <Link
                href="/celebrate-birthday"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition border border-white/20 text-center"
              >
                Book Birthday Visit
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
