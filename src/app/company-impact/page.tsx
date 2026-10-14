import type { Metadata } from "next";
import { PageHero, Section, Container } from "@/components/ui";
import { CorporateFormClient } from "@/components/CorporateFormClient";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate Giving & Company Impact Hub | Janaseva Ashrama",
  description:
    "Register your corporate organization, launch employee matching campaigns, plan volunteering days, and receive audited CSR impact reports.",
  alternates: {
    canonical: `${SITE.url}/company-impact`,
  },
  openGraph: {
    title: "Corporate Giving & CSR Impact Hub · Janaseva Ashrama Bangalore",
    description: "Launch employee giving campaigns, team volunteering, and compliant CSR contributions for child welfare.",
    url: `${SITE.url}/company-impact`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Corporate CSR Impact with Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CSR & Company Impact · Janaseva Ashrama Bangalore",
    description: "Audited CSR programs with Form 10AC and CSR-1 registration.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
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
