import type { Metadata } from "next";
import { PageHero, Section, Container } from "@/components/ui";
import { CorporateFormClient } from "@/components/CorporateFormClient";

import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Corporate Giving & Company Impact Hub | Janaseva Ashrama",
  description:
    "Register your corporate organization, launch employee matching campaigns, plan volunteering days, and receive audited CSR impact reports.",
};

export default function CompanyImpactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Company Impact" }]} />
      <PageHero
        eyebrow="Corporate Partnerships"
        title="Company Impact Hub"
        lead="Register your company, create team campaigns, volunteer as teams, and request CSR reporting based on verified data."
      />
      <Section tone="cream">
        <Container className="max-w-4xl">
          <CorporateFormClient />
        </Container>
      </Section>
    </>
  );
}
