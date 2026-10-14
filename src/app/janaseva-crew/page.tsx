import type { Metadata } from "next";
import { VolunteerForm } from "@/components/forms";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { INTERESTS, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Janaseva Crew · Volunteer Your Skills · Janaseva Ashrama Bangalore",
  description:
    "Join the Janaseva Crew. Contribute your teaching, technology, design, photography, or mentoring skills to enrich the lives of 25 resident boys in Bengaluru.",
  alternates: {
    canonical: `${SITE.url}/janaseva-crew`,
  },
  openGraph: {
    title: "Volunteer with Janaseva Crew · Janaseva Ashrama Bangalore",
    description: "Contribute teaching, mentorship, or arts to empower 25 boys in Bangalore.",
    url: `${SITE.url}/janaseva-crew`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Crew Volunteers Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Volunteer with Janaseva Crew · Janaseva Ashrama Bangalore",
    description: "Join weekend mentoring and skill giving for 25 resident boys in Bangalore.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
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
