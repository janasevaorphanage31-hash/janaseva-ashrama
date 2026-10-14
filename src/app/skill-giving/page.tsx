import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Give Your Skill · Skill-Based Volunteering · Janaseva Ashrama Bangalore",
  description:
    "Share your professional expertise with resident children at Janaseva Ashrama. Teaching, coding, arts, photography, healthcare, and mentoring.",
  alternates: {
    canonical: `${SITE.url}/skill-giving`,
  },
  openGraph: {
    title: "Give Your Skill · Skill Volunteering · Janaseva Ashrama Bangalore",
    description: "Share your professional expertise with 25 resident boys at Janaseva Ashrama. Teaching, technology, arts, and mentoring.",
    url: `${SITE.url}/skill-giving`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Skill Volunteering with Children at Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Volunteering · Janaseva Ashrama Bangalore",
    description: "Teach, mentor, or guide resident children in Bangalore using your skills.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

const skills = [
  "Teaching",
  "Design",
  "Photography",
  "Video",
  "Technology",
  "Marketing",
  "Healthcare support",
  "Events",
  "Fundraising",
  "Operations",
];

export default function SkillGivingPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Skill Giving" }]} />
      <PageHero
        eyebrow="Give your skill"
        title="Sometimes the most useful thing you can give is what you already know."
        lead="Tell Janaseva what you can do. The team can review your skill, timing and safeguarding requirements before matching it to an activity."
      />
      <Section tone="cream">
        <Container className="max-w-4xl">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {skills.map((s) => (
              <div
                key={s}
                className="rounded-2xl bg-white p-4 text-sm font-semibold text-teal-900 ring-1 ring-teal-900/10"
              >
                {s}
              </div>
            ))}
          </div>
          <Link
            href="/get-involved?interest=Other#join"
            className="mt-7 inline-block rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white hover:bg-saffron-dark transition"
          >
            Tell us your skill
          </Link>
        </Container>
      </Section>
    </>
  );
}
