import type { Metadata } from "next";
import { Track } from "@/components/Track";
import { PageHero } from "@/components/ui";
import { TodaySection } from "@/components/sections/TodaySection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getTodayUpdates } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Today at Janaseva · Daily Needs & Live Updates · Janaseva Ashrama",
  description:
    "Real-time daily updates, immediate shelter needs, and today's urgent grocery and care requirements at Janaseva Ashrama Bangalore.",
  alternates: {
    canonical: `${SITE.url}/today`,
  },
  openGraph: {
    title: "Today at Janaseva · Daily Life & Real-time Updates",
    description: "See what 25 boys are doing today at Janaseva Ashrama Bangalore.",
    url: `${SITE.url}/today`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Today at Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Today at Janaseva · Janaseva Ashrama Bangalore",
    description: "Daily moments and urgent care needs for 25 boys in Bangalore.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default async function TodayPage() {
  const updates = await getTodayUpdates();
  return (
    <>
      <Breadcrumbs items={[{ label: "Today at Janaseva" }]} />
      <Track event="need_view" />
      <PageHero eyebrow="Needs" title="Today at Janaseva" lead="Daily updates, real moments and what the home needs right now." />
      <TodaySection updates={updates} standalone />
    </>
  );
}
