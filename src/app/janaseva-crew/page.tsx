import type { Metadata } from "next";
import { VolunteerForm } from "@/components/forms";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { INTERESTS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Janaseva Crew · Volunteer Your Skills · Janaseva Ashrama Bangalore",
  description:
    "Join the Janaseva Crew. Contribute your teaching, technology, design, photography, or event skills to enrich the lives of 48+ children in Bengaluru.",
  alternates: {
    canonical: `${SITE.url}/janaseva-crew`,
  },
};

export default function CrewPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Janaseva Crew" }]} />
      <PageHero
        eyebrow="Janaseva Crew"
        title="Your time can become part of someone's ordinary day."
        lead="Teaching, technology, design, photography, events, marketing and many other skills can help. Applications are reviewed before participation."
      />
      <Section tone="cream">
        <Container className="max-w-xl">
          <VolunteerForm interests={INTERESTS.map((i) => ({ key: i.key, t: i.t }))} initial="Teaching" />
        </Container>
      </Section>
    </>
  );
}
