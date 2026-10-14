import type { Metadata } from "next";
import { PageHero, Section, Container } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "NGO & Community Partners · Janaseva Ashrama Bangalore",
  description:
    "Explore NGO collaborations, institutional partners, and verified community networks working alongside Janaseva Ashrama.",
  alternates: {
    canonical: `${SITE.url}/partners`,
  },
  openGraph: {
    title: "NGO & Community Partners · Janaseva Ashrama Bangalore",
    description: "Explore NGO collaborations, institutional partners, and community networks working alongside Janaseva Ashrama.",
    url: `${SITE.url}/partners`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Community Partners",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community & NGO Partners · Janaseva Ashrama Bangalore",
    description: "Collaborative grassroot partnerships for child welfare in Bangalore South.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function PartnersPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Partners" }]} />
      <PageHero eyebrow="V2 Foundation" title="NGO Partners" lead="Moderated partner onboarding for collaboration requests and joint impact projects." />
      <Section tone="cream">
        <Container className="max-w-2xl">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-teal-900/10 text-sm text-teal-950/70">
            Partner onboarding APIs are live at <code>/api/partners</code>. Submitted profiles remain moderated before publication.
          </div>
        </Container>
      </Section>
    </>
  );
}
