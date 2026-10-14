import type { Metadata } from "next";
import { PageHero, Section, Container } from "@/components/ui";
import { GiftImpactWizard } from "@/components/GiftImpactWizard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gift an Impact · Dedicate Contributions as Gifts · Janaseva Ashrama",
  description:
    "Gift wholesome meals, education kits, or healthcare support to children in the name of a loved one with personalized digital impact cards.",
  alternates: {
    canonical: `${SITE.url}/gift-impact`,
  },
  openGraph: {
    title: "Gift an Impact · Dedicate Contributions · Janaseva Ashrama",
    description: "Choose an occasion and recipient, then dedicate verified meals or school support in their honor.",
    url: `${SITE.url}/gift-impact`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Gift an Impact with Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gift an Impact · Janaseva Ashrama Bangalore",
    description: "Dedicate meals or education support as a gift with verified impact cards.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function GiftImpactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Gift Impact" }]} />
      <PageHero
        eyebrow="Gift an Impact"
        title="Make the gift first. Choose the impact next."
        lead="Add the recipient and occasion before checkout. Your digital impact card becomes available only after the associated contribution is verified."
      />
      <Section tone="cream">
        <Container className="max-w-2xl">
          <GiftImpactWizard />
        </Container>
      </Section>
    </>
  );
}

