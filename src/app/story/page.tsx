import type { Metadata } from "next";
import { Track } from "@/components/Track";
import { PageHero } from "@/components/ui";
import { LifeSection } from "@/components/sections/LifeSection";
import { StorySection } from "@/components/sections/StorySection";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our Story & Life at Janaseva Ashrama | Children's Home in Bangalore",
  description:
    "Learn about the founding story, mission, and daily life of 25 resident boys at Janaseva Ashrama in Turahalli, Bengaluru. Daily Annadana, schooling, and unconditional love.",
  alternates: {
    canonical: `${SITE.url}/story`,
  },
  openGraph: {
    title: "Our Story & Life at Janaseva Ashrama Bangalore",
    description:
      "A home filled with laughter, learning, and hope. Discover how Janaseva Ashrama nurtures 25 resident boys with daily meals, education, and family warmth.",
    url: `${SITE.url}/story`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Life at Janaseva Ashrama Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story & Life at Janaseva Ashrama Bangalore",
    description: "Discover daily life and education for 25 resident boys at Janaseva Ashrama Bangalore.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function StoryPage() {
  return (
    <>
      <Track event="story_view" />
      <PageHero eyebrow="Stories" title="Our story & life at Janaseva" lead="Who we are, why we exist, and what a real day looks like." />
      <StorySection />
      <LifeSection />
    </>
  );
}
