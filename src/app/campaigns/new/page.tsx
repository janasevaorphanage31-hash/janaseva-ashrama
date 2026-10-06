import type { Metadata } from "next";
import { CampaignForm } from "@/components/forms";
import { CAMPAIGN_TYPES, OCCASIONS } from "@/lib/site";
import { Container, PageHero, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Start a Campaign" };

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ occasion?: string; type?: string }> }) {
  const sp = await searchParams;
  const initialOccasion = (OCCASIONS as readonly string[]).includes(sp.occasion ?? "") ? (sp.occasion as string) : OCCASIONS[0];
  const initialType = (CAMPAIGN_TYPES as readonly string[]).includes(sp.type ?? "") ? (sp.type as string) : CAMPAIGN_TYPES[0];

  return (
    <>
      <PageHero eyebrow="Create an Impact" title="Start your campaign" lead="Tell your story, set a goal and get a link and QR code to share. We review every campaign first." />
      <Section tone="cream">
        <Container className="max-w-xl">
          <CampaignForm occasions={[...OCCASIONS]} types={[...CAMPAIGN_TYPES]} initialOccasion={initialOccasion} initialType={initialType} />
        </Container>
      </Section>
    </>
  );
}
