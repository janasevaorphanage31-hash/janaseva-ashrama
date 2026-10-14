import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team Impact Campaigns · Group Giving · Janaseva Ashrama",
  description:
    "Rally your friends, colleagues, college alumni, or community around a shared goal to sponsor education, meals, or shelter for resident boys.",
  alternates: {
    canonical: `${SITE.url}/team-impact`,
  },
  openGraph: {
    title: "Team Impact Campaigns · Group Giving · Janaseva Ashrama Bangalore",
    description: "One team. One shared goal. One verified result for 25 boys in Bangalore South.",
    url: `${SITE.url}/team-impact`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Team Impact at Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Team Impact Campaigns · Janaseva Ashrama Bangalore",
    description: "Group fundraising and community campaigns with transparent live tracking.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function TeamImpactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Team Impact" }]} />
      <PageHero
        eyebrow="Team Impact"
        title="One team. One shared goal. One verified result."
        lead="Friends, colleges, offices, schools and communities can rally around a single campaign."
      />
      <Section tone="cream">
        <Container className="max-w-4xl">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Choose a goal", "Pick an impact target and a contribution goal."],
              ["Invite your people", "Share one page, one link and one QR code."],
              ["See verified progress", "Only verified, non-refunded contributions count."],
            ].map(([a, b]) => (
              <div key={a} className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
                <h2 className="font-display text-xl font-bold text-teal-900">{a}</h2>
                <p className="mt-2 text-sm leading-6 text-teal-950/70">{b}</p>
              </div>
            ))}
          </div>
          <Link
            href="/campaigns/new?type=Team"
            className="mt-7 inline-block rounded-xl bg-saffron px-6 py-3 text-sm font-bold text-white transition hover:bg-saffron/90"
          >
            Create a team campaign
          </Link>
        </Container>
      </Section>
    </>
  );
}

