import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { CelebrateBirthdayClient } from "@/components/CelebrateBirthdayClient";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Special Day Celebration in Ashrama - Birthday, Anniversary & Memorial Seva | Bangalore",
  description:
    "Celebrate your special day with 25 resident children at Janaseva Ashrama, Turahalli, Subramanyapura, Bengaluru. Sponsor a birthday feast, wedding anniversary meal, or memorial payasam seva. Form 10AC 80G tax benefit.",
  keywords: [
    "special day celebration in ashrama bangalore",
    "celebrate birthday in ashrama bangalore",
    "celebrate wedding anniversary at orphanage bangalore",
    "memorial meal seva bangalore orphanage",
    "shraddha punyatithi annadana bangalore",
    "sponsor meal on birthday bangalore",
    "janaseva ashrama celebration booking",
  ],
  alternates: {
    canonical: `${SITE.url}/celebrate-special-day`,
  },
  openGraph: {
    title: "Special Day Celebration at Janaseva Ashrama Bangalore",
    description:
      "Share your joyful milestones or sacred memories by feeding 25 resident children. Sponsor an Annadana feast or book an in-person visit slot today.",
    url: `${SITE.url}/celebrate-special-day`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
  },
};

export default function CelebrateSpecialDayPage() {
  return (
    <div className="w-full">
      <Breadcrumbs items={[{ label: "Special Day Seva" }]} />
      <PageHero
        eyebrow="Special Day Seva"
        title="Celebrate Your Special Day with 25 Children"
        lead="Turn your Birthday, Wedding Anniversary, Memorial Day, or Family Milestone into an unforgettable day of nourishment and blessings at Janaseva Ashrama, Bengaluru."
      />

      <Section className="py-10">
        <Container>
          <CelebrateBirthdayClient />
        </Container>
      </Section>
    </div>
  );
}
