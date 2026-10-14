import type { Metadata } from "next";
import { CampaignForm } from "@/components/forms";
import { CAMPAIGN_TYPES, OCCASIONS, SITE } from "@/lib/site";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Start a Fundraising Campaign · Janaseva Ashrama Bangalore",
  description:
    "Launch your own verified campaign for meals, education, or healthcare support for 25 boys at Janaseva Ashrama with custom QR code and tracking.",
  alternates: {
    canonical: `${SITE.url}/campaigns/new`,
  },
  openGraph: {
    title: "Start a Campaign · Janaseva Ashrama Bangalore",
    description: "Create an approved peer-to-peer campaign with custom UPI QR code and 80G tax receipts.",
    url: `${SITE.url}/campaigns/new`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Start a Campaign for Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Start a Campaign · Janaseva Ashrama Bangalore",
    description: "Launch a community campaign with verified contribution tracking.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ occasion?: string; type?: string }> }) {
  const sp = await searchParams;
  const initialOccasion = (OCCASIONS as readonly string[]).includes(sp.occasion ?? "") ? (sp.occasion as string) : OCCASIONS[0];
  const initialType = (CAMPAIGN_TYPES as readonly string[]).includes(sp.type ?? "") ? (sp.type as string) : CAMPAIGN_TYPES[0];

  return (
    <>
      <Breadcrumbs items={[{ label: "Campaigns", href: "/campaigns" }, { label: "New Campaign" }]} />
      <PageHero eyebrow="Create an Impact" title="Start your campaign" lead="Tell your story, set a goal and get a link and QR code to share. We review every campaign first." />
      <Section tone="cream">
        <Container className="max-w-xl">
          <CampaignForm occasions={[...OCCASIONS]} types={[...CAMPAIGN_TYPES]} initialOccasion={initialOccasion} initialType={initialType} />
        </Container>
      </Section>
    </>
  );
}
