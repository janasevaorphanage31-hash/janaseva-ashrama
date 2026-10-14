import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { CreatorsClient } from "@/components/CreatorsClient";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Creator & Influencer Impact Campaigns | Janaseva Ashrama",
  description:
    "Launch an approved Janaseva fundraising campaign for your audience with one shareable page, UPI QR code, and transparent contribution progress.",
  alternates: {
    canonical: `${SITE.url}/creators`,
  },
  openGraph: {
    title: "Creator Impact Campaigns · Janaseva Ashrama Bangalore",
    description: "Launch an approved fundraising campaign for your audience with real-time UPI tracking and 80G tax receipts.",
    url: `${SITE.url}/creators`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Creator Impact Campaigns for Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator Impact Campaigns · Janaseva Ashrama Bangalore",
    description: "Verified community campaigns powered by content creators.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function CreatorsPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Creator Campaigns" }]} />
      <PageHero
        eyebrow="Creator campaigns"
        title="Use your audience to create measurable good."
        lead="Creators can launch an approved Janaseva campaign with one shareable page, a QR code and verified contribution progress. This is a campaign tool - not a social network."
      />
      <Section tone="cream">
        <Container className="max-w-4xl">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Create", "Choose an impact goal and tell your audience why it matters."],
              ["Share", "Use one campaign URL and QR code across your content."],
              ["Measure", "See verified contributions and impact units rather than vanity metrics."],
            ].map(([a, b]) => (
              <div key={a} className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
                <h2 className="font-display text-2xl font-bold text-teal-900">{a}</h2>
                <p className="mt-2 text-sm leading-6 text-teal-950/70">{b}</p>
              </div>
            ))}
          </div>
          <CreatorsClient />
        </Container>
      </Section>
    </>
  );
}
