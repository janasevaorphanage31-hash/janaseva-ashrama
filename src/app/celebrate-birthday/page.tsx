import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { CelebrateBirthdayClient } from "@/components/CelebrateBirthdayClient";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Celebrate Birthday at Orphanage in Bangalore - Janaseva Ashrama",
  description:
    "Make your birthday unforgettable. Sponsor a wholesome feast for 25 children or visit Janaseva Ashrama orphanage in Turahalli, Subramanyapura, Bangalore to celebrate in person. Form 10AC 80G tax benefit.",
  keywords: [
    "celebrate birthday at orphanage bangalore",
    "birthday celebration with orphanage children near me",
    "orphanage visit for birthday bangalore",
    "sponsor food on birthday bangalore",
    "janaseva ashrama birthday celebration",
    "birthday feast donation bangalore",
    "orphanage birthday meal cost bangalore",
    "ngo birthday celebration bangalore subramanyapura",
  ],
  alternates: {
    canonical: `${SITE.url}/celebrate-birthday`,
  },
  openGraph: {
    title: "Celebrate Birthday with 25 Children at Janaseva Ashrama Bangalore",
    description:
      "A birthday party lasts an evening. Feeding 25 children creates warmth that lasts a lifetime. Sponsor a feast or book an in-person visit slot today.",
    url: `${SITE.url}/celebrate-birthday`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
  },
};

const BIRTHDAY_FAQS = [
  {
    q: "Can I visit Janaseva Ashrama to celebrate my birthday in person?",
    a: "Yes! We warmly welcome donors and their families to visit Janaseva Ashrama in Turahalli, Subramanyapura, Bangalore. You can cut a cake with the children, share sweets or snacks, and serve meals directly in our dining hall. Please coordinate with us 24 to 48 hours in advance so our staff can prepare the schedule without overlapping multiple celebrations.",
  },
  {
    q: "Can we bring a birthday cake from outside?",
    a: "Yes. Fresh, commercially prepared eggless cakes or traditional bakery cakes from verified bakeries are welcomed. You may also bring fresh seasonal fruits (such as apples, bananas, or mangoes) or sweets from recognized sweet shops.",
  },
  {
    q: "How many children live at Janaseva Ashrama?",
    a: "Janaseva Ashrama is an orphanage currently home to 25 resident children who are provided with full-time shelter, nutritious daily meals, primary and secondary school education, healthcare, and emotional mentorship.",
  },
  {
    q: "How much does it cost to sponsor a birthday meal for all children?",
    a: "A wholesome morning breakfast package is ₹1,500. A grand festive birthday lunch with traditional sweet payasam, pooris, and vegetable curries is ₹3,500. Evening snacks with fresh fruit platters is ₹2,500. Full-day nourishment covering breakfast, lunch, snacks, and dinner is ₹7,500.",
  },
  {
    q: "What are the recommended visiting slots for birthday celebrations?",
    a: "We offer two convenient visiting slots daily: Morning Slot (10:30 AM to 1:00 PM) for lunch celebrations, and Evening Slot (4:30 PM to 6:30 PM) for evening cake cutting, games, and snack distribution.",
  },
  {
    q: "Will I get an 80G tax exemption receipt for sponsoring a birthday feast?",
    a: "Yes. All contributions made to Janaseva Ashrama Charitable Trust are eligible for 50% tax deduction under Section 80G of the Income Tax Act (Provisional Approval Form 10AC). An official receipt is issued immediately upon online confirmation.",
  },
  {
    q: "Can I bring gifts, storybooks, or school stationery instead of cooked food?",
    a: "Absolutely. Along with or in place of food, donors frequently gift notebooks, drawing books, crayons, geometry boxes, storybooks in English and Kannada, or indoor games like carrom boards and chess sets. Please call us in advance to check current requirements.",
  },
  {
    q: "What are the rules regarding taking photos or videos during birthday visits?",
    a: "Janaseva Ashrama maintains strict child safeguarding standards. You and your family may take dignified, heartwarming group photos cutting cake and serving meals for your personal album or social media. However, filming individual children for sensational, commercial, or intrusive content is strictly prohibited to protect their self-respect and dignity.",
  },
];

import { getSiteContentMap } from "@/lib/site-content";

export default async function CelebrateBirthdayPage() {
  const siteContent = await getSiteContentMap();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NGO",
        "@id": `${SITE.url}/#ngo`,
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        telephone: SITE.phoneIntl,
        email: SITE.email,
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
      },
      {
        "@type": "Service",
        name: "Birthday Feast Sponsorship & Celebration Visits",
        provider: { "@id": `${SITE.url}/#ngo` },
        description:
          "Sponsor wholesome festive meals and organize heartwarming in-person birthday celebration visits for 25 children at Janaseva Ashrama Bangalore.",
        areaServed: {
          "@type": "City",
          name: "Bengaluru",
        },
        offers: [
          {
            "@type": "Offer",
            name: "Morning Energy Breakfast",
            price: "1500",
            priceCurrency: "INR",
          },
          {
            "@type": "Offer",
            name: "Festive Birthday Lunch with Payasam",
            price: "3500",
            priceCurrency: "INR",
          },
          {
            "@type": "Offer",
            name: "Evening Celebration & Fruit Basket",
            price: "2500",
            priceCurrency: "INR",
          },
          {
            "@type": "Offer",
            name: "Grand Full-Day Nourishment & Care",
            price: "7500",
            priceCurrency: "INR",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: BIRTHDAY_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <Breadcrumbs items={[{ label: "Celebrate Birthday" }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="Trending in Bengaluru"
        title="Celebrate Your Birthday with Purpose"
        lead="Make your special day unforgettable by feeding 25 resident children at Janaseva Ashrama. Sponsor a freshly cooked feast online or visit our Bengaluru campus in Turahalli, Subramanyapura to celebrate in person."
      />

      <Section tone="cream" className="py-12 md:py-16">
        <Container className="max-w-6xl">
          <CelebrateBirthdayClient wishVideos={siteContent.wishVideos} />

          {/* Deep SEO / AEO Answer Engine FAQ Section */}
          <div className="mt-16 rounded-3xl bg-white p-6 sm:p-10 shadow-sm ring-1 ring-teal-900/10">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="rounded-md bg-teal-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-900">
                Frequently Asked Questions
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold text-teal-900 sm:text-3xl">
                Everything You Need to Know About Birthday Celebrations
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-teal-950/70">
                Clear, transparent answers to help you plan a joyful, hassle-free birthday visit to Janaseva Ashrama.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {BIRTHDAY_FAQS.map((faq) => (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-cream/50 p-5 border border-teal-900/10 flex flex-col justify-between"
                >
                  <h3 className="font-display text-sm font-bold text-teal-900 leading-snug">
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-xs text-teal-950/75 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
