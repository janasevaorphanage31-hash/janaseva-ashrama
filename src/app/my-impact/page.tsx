import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MyImpactClient } from "@/components/MyImpactClient";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Donor Impact & Recurring Giving Dashboard · Janaseva Ashrama",
  description:
    "View your active monthly recurring donations, payment debit history, 80G tax exemption receipts, and manage your Auto-Pay mandates securely.",
  alternates: {
    canonical: `${SITE.url}/my-impact`,
  },
  openGraph: {
    title: "Donor Impact & Subscriptions · Janaseva Ashrama Bangalore",
    description: "Manage monthly sponsorships, download 80G tax receipts, and view contribution history.",
    url: `${SITE.url}/my-impact`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Donor Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Donor Impact Dashboard · Janaseva Ashrama",
    description: "Secure donor portal for Auto-Pay and Form 10AC Section 80G receipts.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default async function MyImpactPage({ searchParams }: { searchParams: Promise<{ publicId?: string }> }) {
  const sp = await searchParams;

  return (
    <>
      <Breadcrumbs items={[{ label: "Donor Impact & Subscriptions" }]} />
      <PageHero
        eyebrow="Donor Impact & Subscriptions"
        title="Manage Your Monthly Auto-Pay & 80G Receipts"
        lead="Track your monthly child sponsorships, view upcoming debit dates, manage your mandates, and access official Form 10AC Section 80G tax receipts."
      />
      <Section tone="cream">
        <Container className="max-w-3xl">
          <MyImpactClient initialPublicId={sp.publicId} />
        </Container>
      </Section>
    </>
  );
}
