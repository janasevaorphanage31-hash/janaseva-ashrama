import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { FutureSection } from "@/components/sections/FutureSection";

import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Proposed Future Campus Project | Janaseva Ashrama Bangalore",
  description:
    "Learn about our proposed future children's home campus and educational facilities expansion for Janaseva Ashrama.",
  alternates: {
    canonical: `${SITE.url}/future`,
  },
  openGraph: {
    title: "Proposed Future Campus Project · Janaseva Ashrama Bangalore",
    description: "Proposed long-term campus expansion vision for resident children's care and learning facilities.",
    url: `${SITE.url}/future`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Future Campus Vision · Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Future Campus Vision · Janaseva Ashrama Bangalore",
    description: "Proposed infrastructure plans for future capacity expansion.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function FuturePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Future Project" }]} />
      <PageHero eyebrow="Proposed future project" title="Our Future" lead="A proposed campus. Not an existing one." />
      <FutureSection standalone />
    </>
  );
}
