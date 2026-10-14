import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { CommunityV2Section } from "@/components/sections/CommunityV2Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Volunteer in Bangalore - Give 2.5 Hours a Week | Janaseva Ashrama",
  description:
    "Give 2.5 hours a week on weekends to teach, mentor, or coach 25 orphaned boys at Janaseva Ashrama in Turahalli, Bangalore South. Earn a verified NGO certificate.",
  keywords: [
    "volunteer bangalore",
    "volunteer in orphanage bangalore",
    "weekend volunteering bangalore",
    "teach kids bangalore ngo",
    "janaseva ashrama volunteer",
    "2.5 hours week volunteer",
  ],
  alternates: {
    canonical: `${SITE.url}/get-involved`,
  },
  openGraph: {
    title: "Volunteer in Bangalore · Janaseva Ashrama",
    description: "Give 2.5 hours a week on weekends to teach, mentor, or coach 25 boys in Bangalore South.",
    url: `${SITE.url}/get-involved`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Volunteer with Janaseva Ashrama Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Volunteer with Children · Janaseva Ashrama Bangalore",
    description: "Weekend mentorship and teaching opportunities in Bangalore.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function GetInvolvedPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Volunteer & Mentor" }]} />
      <PageHero
        eyebrow="Weekend Mentorship · 2.5 Hours / Week"
        title="Give 2.5 hours a week. Change a child's story forever."
        lead="Love, mentorship, and brotherhood cannot be bought. Join us on weekends to teach Spoken English, coach sports, guide art, or partner through corporate CSR at Janaseva Ashrama in Turahalli, Bangalore South."
      />
      <CommunityV2Section standalone />
    </>
  );
}
