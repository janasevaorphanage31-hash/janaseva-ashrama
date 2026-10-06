import type { Metadata } from "next";
import { PageHero, Section, Container } from "@/components/ui";
import { GiftImpactWizard } from "@/components/GiftImpactWizard";

export const metadata: Metadata = { title: "Gift an Impact", description: "Choose an occasion and recipient, then make a verified contribution as a meaningful gift." };

export default function GiftImpactPage() {
  return <>
    <PageHero eyebrow="Gift an Impact" title="Make the gift first. Choose the impact next." lead="Add the recipient and occasion before checkout. Your digital impact card becomes available only after the associated contribution is verified." />
    <Section tone="cream"><Container className="max-w-2xl"><GiftImpactWizard /></Container></Section>
  </>;
}
