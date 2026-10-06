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
