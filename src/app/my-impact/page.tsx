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
