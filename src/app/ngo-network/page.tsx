import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { NgoNetworkClient } from "@/components/NgoNetworkClient";

import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "NGO & Institutional Collaboration Network | Janaseva Ashrama",
  description:
    "Collaborate with Janaseva Ashrama on resource sharing, skill volunteering, and joint grassroots community welfare initiatives across Karnataka.",
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
