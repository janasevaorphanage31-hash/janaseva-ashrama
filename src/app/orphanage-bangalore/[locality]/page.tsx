import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BANGALORE_LOCALITIES, LocalityData } from "@/lib/locations-data";
import { SITE } from "@/lib/site";

interface PageProps {
  params: Promise<{ locality: string }>;
}

export async function generateStaticParams() {
  return BANGALORE_LOCALITIES.map((loc) => ({
    locality: loc.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locality: slug } = await params;
  const loc = BANGALORE_LOCALITIES.find((l) => l.slug === slug);

  if (!loc) {
    return {
      title: "Orphanage in Bangalore | Janaseva Ashrama",
      description: "Government-registered orphanage in Bangalore supporting 25 resident boys.",
    };
  }

  const title = `Orphanage near ${loc.name}, Bangalore (${loc.distanceKm}) · Janaseva Ashrama`;
  const description = `Looking for an orphanage or children's home near ${loc.name}, Bangalore? Janaseva Ashrama in Turahalli is ${loc.distanceKm} away (${loc.travelTimeMin}). Sponsor hot meals (Annadana), celebrate birthdays with 25 boys, and claim 50% 80G tax benefits.`;

  return {
    title,
    description,
    keywords: [
      `orphanage near ${loc.name.toLowerCase()}`,
      `orphanage in ${loc.name.toLowerCase()} bangalore`,
      `children home near ${loc.name.toLowerCase()}`,
      `donate to orphanage ${loc.name.toLowerCase()}`,
      `annadana near ${loc.name.toLowerCase()}`,
      `celebrate birthday orphanage ${loc.name.toLowerCase()}`,
      "janaseva ashrama bangalore",
      "orphanage in bangalore",
      "80g tax exemption ngo bangalore",
    ],
    alternates: {
      canonical: `${SITE.url}/orphanage-bangalore/${loc.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/orphanage-bangalore/${loc.slug}`,
      siteName: SITE.name,
      locale: "en_IN",
      type: "article",
      images: [
        {
          url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
          width: 1200,
          height: 675,
          alt: `Janaseva Ashrama Orphanage near ${loc.name} Bangalore`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
    },
  };
}

export default async function LocalityPage({ params }: PageProps) {
  const { locality: slug } = await params;
  const loc = BANGALORE_LOCALITIES.find((l) => l.slug === slug);

  if (!loc) {
    notFound();
  }

  const otherLocalities = BANGALORE_LOCALITIES.filter((l) => l.slug !== loc.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["NGO", "ChildCare", "LocalBusiness"],
        "@id": `${SITE.url}/orphanage-bangalore/${loc.slug}#localbusiness`,
        name: `Janaseva Ashrama Orphanage & Children's Home (Serving ${loc.name})`,
        legalName: SITE.legalName,
        url: `${SITE.url}/orphanage-bangalore/${loc.slug}`,
        telephone: SITE.phoneIntl,
        email: SITE.email,
        description: loc.description,
        taxID: SITE.pan,
        hasCredential: [
          {
            "@type": "GovernmentPermit",
            name: "Child Care Institution Registration under JJ Act 2015",
            identifier: SITE.jjActNumber,
            issuedBy: {
              "@type": "GovernmentOrganization",
              name: "Directorate of Child Protection, Government of Karnataka",
            },
          },
          {
            "@type": "GovernmentPermit",
            name: "Section 80G Tax Exemption (Form 10AC)",
            identifier: SITE.urn,
            issuedBy: {
              "@type": "GovernmentOrganization",
              name: "Income Tax Department, Government of India",
            },
          },
        ],
        address: {
          "@type": "PostalAddress",
          streetAddress: "#27, Gundu Thopu Turahalli, Near Govt School, Jayanagar housing Society Layout, Subramanyapura",
          addressLocality: "Bengaluru",
          addressRegion: "Karnataka",
          postalCode: "560061",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE.geo.latitude,
          longitude: SITE.geo.longitude,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ],
            opens: "10:00",
            closes: "18:00",
          },
        ],
        hasMap: SITE.mapsUrl,
        areaServed: [
          {
            "@type": "AdministrativeArea",
            name: loc.name,
          },
          {
            "@type": "City",
            name: "Bengaluru",
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Orphanages in Bangalore",
            item: `${SITE.url}/orphanage-bangalore`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `Orphanage near ${loc.name}`,
            item: `${SITE.url}/orphanage-bangalore/${loc.slug}`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: loc.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Bangalore Localities", href: "/orphanage-bangalore" },
          { label: `Near ${loc.name}` },
        ]}
      />

      <PageHero
        eyebrow={`Bengaluru South · Distance: ${loc.distanceKm} · Travel: ${loc.travelTimeMin}`}
        title={`Orphanage & Children's Home near ${loc.name}, Bangalore`}
        lead={`Located just ${loc.distanceKm} away in Turahalli, Janaseva Ashrama is the closest verified government-registered children's home (JJ Act KA18CH0242) for residents of ${loc.name}. We care for 25 resident boys with wholesome daily food, education, and shelter.`}
      />

      <Section tone="cream" className="py-12">
        <Container className="max-w-5xl">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
              <span className="text-xs text-stone-500 font-medium block">Distance</span>
              <span className="text-lg font-bold text-stone-900">{loc.distanceKm}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
              <span className="text-xs text-stone-500 font-medium block">Drive Time</span>
              <span className="text-lg font-bold text-emerald-800">{loc.travelTimeMin}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
              <span className="text-xs text-stone-500 font-medium block">Resident Children</span>
              <span className="text-lg font-bold text-stone-900">25 Boys</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-200 text-center">
              <span className="text-xs text-stone-500 font-medium block">Tax Exemption</span>
              <span className="text-lg font-bold text-amber-700">50% under 80G</span>
            </div>
          </div>

          {/* Local Context & About */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200 shadow-sm mb-8 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-3">
                Serving the Community of {loc.name} ({loc.kannadaName})
              </h2>
              <p className="text-stone-700 text-base leading-relaxed mb-4">
                {loc.description}
              </p>
              <p className="text-stone-700 text-base leading-relaxed">
                {loc.localContext}
              </p>
            </div>

            {/* Travel Directions & Connectivity */}
            <div className="border-t border-stone-100 pt-6">
              <h3 className="text-lg font-bold text-stone-900 font-serif mb-4 flex items-center gap-2">
                <span>📍</span> How to Reach Janaseva Ashrama from {loc.name}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <span className="text-xs font-bold text-stone-900 uppercase block mb-1">
                    🚗 Driving Route
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {loc.drivingRoute}
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <span className="text-xs font-bold text-stone-900 uppercase block mb-1">
                    🚇 Metro Access
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {loc.metroConnectivity}
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  <span className="text-xs font-bold text-stone-900 uppercase block mb-1">
                    🚌 BMTC Bus Routes
                  </span>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {loc.busRoutes}
                  </p>
                </div>
              </div>
            </div>

            {/* Nearby Landmarks */}
            <div className="border-t border-stone-100 pt-6">
              <h3 className="text-sm font-bold text-stone-900 mb-2 uppercase tracking-wide">
                Key Local Landmarks in / near {loc.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {loc.landmarks.map((landmark, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 bg-stone-100 text-stone-700 rounded-full font-medium"
                  >
                    • {landmark}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ways to Support from Locality */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200 shadow-sm mb-8">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
              Ways to Support from {loc.name}
            </h2>
            <p className="text-sm text-stone-600 mb-6">
              Whether you wish to sponsor a meal online with instant 80G tax benefit or visit in person to cut a cake with the children, we welcome you.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">Individual Meal</span>
                  <h4 className="font-bold text-stone-900 text-lg mb-1">₹100</h4>
                  <p className="text-xs text-stone-600">Sponsor one child's warm nutritious lunch or dinner.</p>
                </div>
                <Link
                  href="/donate?amount=100"
                  className="mt-4 text-xs font-bold text-emerald-900 hover:underline inline-block"
                >
                  Sponsor Meal &rarr;
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">Breakfast Feast</span>
                  <h4 className="font-bold text-stone-900 text-lg mb-1">₹1,000</h4>
                  <p className="text-xs text-stone-600">Warm idlis, upma, sambar, and hot milk for all 25 boys.</p>
                </div>
                <Link
                  href="/donate?amount=1000"
                  className="mt-4 text-xs font-bold text-emerald-900 hover:underline inline-block"
                >
                  Sponsor Breakfast &rarr;
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-xs font-bold text-emerald-900 uppercase block mb-1">Lunch Celebration</span>
                  <h4 className="font-bold text-emerald-950 text-lg mb-1">₹1,500</h4>
                  <p className="text-xs text-emerald-900/80">Special lunch feast with sweet Payasam for all 25 boys.</p>
                </div>
                <Link
                  href="/donate?amount=1500"
                  className="mt-4 text-xs font-bold text-emerald-900 hover:underline inline-block"
                >
                  Sponsor Lunch &rarr;
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase block mb-1">Full Day Annadana</span>
                  <h4 className="font-bold text-stone-900 text-lg mb-1">₹4,500</h4>
                  <p className="text-xs text-stone-600">All 3 meals (breakfast, lunch, snacks, dinner) for all 25 boys.</p>
                </div>
                <Link
                  href="/donate?amount=4500"
                  className="mt-4 text-xs font-bold text-amber-900 hover:underline inline-block"
                >
                  Sponsor Full Day &rarr;
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/donate"
                className="flex-1 text-center py-3 px-4 bg-[#042825] hover:bg-[#073F3A] text-white font-bold rounded-xl transition shadow"
              >
                Donate Online with 80G Tax Exemption
              </Link>
              <Link
                href="/celebrate-birthday"
                className="flex-1 text-center py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded-xl transition shadow"
              >
                Book a Birthday Celebration Visit
              </Link>
            </div>
          </div>

          {/* Local Frequently Asked Questions */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200 shadow-sm mb-12">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">
              Frequently Asked Questions from {loc.name} Donors
            </h2>
            <div className="space-y-4">
              {loc.faqs.map((faq, index) => (
                <div key={index} className="p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <h4 className="font-bold text-stone-900 text-sm mb-2">{faq.q}</h4>
                  <p className="text-xs text-stone-700 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Explore Other South Bangalore Localities */}
          <div className="border-t border-stone-200 pt-8">
            <h3 className="text-base font-bold font-serif text-stone-900 mb-4">
              Explore Janaseva Ashrama Seva in Other Bangalore Areas:
            </h3>
            <div className="flex flex-wrap gap-2">
              {otherLocalities.map((item) => (
                <Link
                  key={item.slug}
                  href={`/orphanage-bangalore/${item.slug}`}
                  className="text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-700 hover:border-emerald-700 hover:text-emerald-900 transition"
                >
                  Orphanage near {item.name} ({item.distanceKm})
                </Link>
              ))}
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
