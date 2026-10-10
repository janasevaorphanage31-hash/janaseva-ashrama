import { CinematicHero } from "@/components/CinematicHero";
import { HomeSectionsHub } from "@/components/HomeSectionsHub";
import { Track } from "@/components/Track";
import {
  getDocuments,
  getMetrics,
  getTodayUpdates,
  getVerifiedPlatformTotals,
  getApprovedMedia,
} from "@/lib/content";
import { getSiteContentMap } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [updates, docs, metrics, totals, siteContent, approvedMedia] = await Promise.all([
    getTodayUpdates(),
    getDocuments(),
    getMetrics(),
    getVerifiedPlatformTotals(),
    getSiteContentMap(),
    getApprovedMedia(),
  ]);

  return (
    <>
      <Track event="visit" meta={{ page: "home" }} />

      {/* 1. Cinematic Opening (Awareness & Emotional Hook: 25 Boys Residential Orphanage) */}
      <CinematicHero content={siteContent} />

      {/* 2. Organized Vertical Sections Hub (Drastically Cuts Mobile Scrolling Time & Gives App-Like Multi-Section Navigation) */}
      <HomeSectionsHub
        updates={updates}
        docs={docs}
        metrics={metrics}
        totals={totals}
        siteContent={siteContent}
        approvedMedia={approvedMedia}
      />
    </>
  );
}
