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
