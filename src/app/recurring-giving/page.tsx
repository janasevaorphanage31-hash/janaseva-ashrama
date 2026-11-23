import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { RecurringGivingClient } from "@/components/RecurringGivingClient";
import { Breadcrumbs } from "@/components/Breadcrumbs";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Monthly Regular Giving & Auto-Pay Pledge | Janaseva Ashrama",
  description:
    "Set up monthly auto-pay recurring contribution (₹100, ₹300, ₹500, or ₹1,000) to support daily meals, milk, healthcare and education for 25 boys residing at Janaseva Ashrama Bangalore.",
  alternates: {
    canonical: `${SITE.url}/recurring-giving`,
  },
  openGraph: {
    title: "Monthly Regular Giving & Auto-Pay · Janaseva Ashrama Bangalore",
    description: "Support daily meals and education for 25 boys with recurring monthly auto-pay.",
    url: `${SITE.url}/recurring-giving`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Monthly Giving",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monthly Regular Giving · Janaseva Ashrama Bangalore",
    description: "Support 25 resident boys with automatic monthly giving.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function RecurringGivingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/recurring-giving#webpage`,
        url: `${SITE.url}/recurring-giving`,
        name: "Monthly Regular Giving & Auto-Pay Pledge | Janaseva Ashrama",
        description:
          "Set up monthly auto-pay recurring contribution (₹100, ₹300, ₹500, or ₹1,000) to support daily meals, milk, healthcare and education for 25 boys residing at Janaseva Ashrama Bangalore.",
        potentialAction: {
          "@type": "DonateAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}/recurring-giving`,
            inLanguage: "en-IN",
            actionPlatform: [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform",
            ],
          },
          recipient: {
            "@type": "NGO",
            name: SITE.name,
            legalName: SITE.legalName,
            url: SITE.url,
            taxID: SITE.pan,
            telephone: SITE.phoneIntl,
          },
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={[{ label: "Regular Giving" }]} />
      <PageHero
        eyebrow="Regular giving"
        title="A small, steady contribution becomes an anchor of care."
        lead="Choose a monthly amount and set up automatic recurring payment via Razorpay UPI AutoPay, Cards, or NetBanking with instant Section 80G tax deduction receipts."
      />
      <Section tone="cream">
        <Container className="max-w-xl">
          <RecurringGivingClient />
        </Container>
      </Section>
    </>
  );
}
