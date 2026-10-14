import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { NgoNetworkClient } from "@/components/NgoNetworkClient";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "NGO & Institutional Collaboration Network | Janaseva Ashrama",
  description:
    "Collaborate with Janaseva Ashrama on resource sharing, skill volunteering, and joint grassroots community welfare initiatives across Karnataka.",
  alternates: {
    canonical: `${SITE.url}/ngo-network`,
  },
  openGraph: {
    title: "NGO Collaboration Network · Janaseva Ashrama Bangalore",
    description: "Verified organisations can explore resource, skill, volunteer, and joint-project collaboration with Janaseva Ashrama.",
    url: `${SITE.url}/ngo-network`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "NGO Collaboration Network · Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NGO Collaboration Network · Janaseva Ashrama",
    description: "Grassroot NGO partnerships and institutional collaboration in Karnataka.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function NgoNetworkPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "NGO Network" }]} />
      <PageHero
        eyebrow="NGO Network"
        title="Good work can travel further when organisations collaborate."
        lead="Verified organisations can explore resource, skill, volunteer, goods and joint-project collaboration with Janaseva."
      />
      <Section tone="cream">
        <Container className="max-w-3xl">
          <NgoNetworkClient />
        </Container>
      </Section>
    </>
  );
}
