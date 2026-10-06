import { CinematicHero } from "@/components/CinematicHero";
import { ThemeNavBar } from "@/components/ThemeNavBar";
import { ImpactCart } from "@/components/ImpactCart";
import { TrendingBirthdaySection } from "@/components/sections/TrendingBirthdaySection";
import { TodaySection } from "@/components/sections/TodaySection";
import { DocumentaryVideoSection } from "@/components/sections/DocumentaryVideoSection";
import { VerifiedImpactSection } from "@/components/sections/VerifiedImpactSection";
import { InvolvedSection } from "@/components/sections/InvolvedSection";
import { DonationFAQ } from "@/components/DonationFAQ";
import { TransparencySection } from "@/components/sections/TransparencySection";
import { FutureSection } from "@/components/sections/FutureSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Container } from "@/components/ui";
import { Track } from "@/components/Track";

import {
  getDocuments,
  getMetrics,
  getTodayUpdates,
  getVerifiedPlatformTotals,
} from "@/lib/content";
import { getSiteContentMap } from "@/lib/site-content";

export default async function Home() {
  const [updates, docs, metrics, totals, siteContent] = await Promise.all([
    getTodayUpdates(),
    getDocuments(),
    getMetrics(),
    getVerifiedPlatformTotals(),
    getSiteContentMap(),
  ]);

  return (
    <>
      <Track event="visit" meta={{ page: "home" }} />

      {/* 1. Cinematic Opening */}
      <CinematicHero content={siteContent} />

      {/* 2. Top Theme Quick Navigation (Instant Anchor Jump with Icons & Short Names) */}
      <ThemeNavBar />

      {/* 3. Verified Needs Catalogue & Giving Basket */}
      <Track event="need_view" onView />
      <ImpactCart />

      {/* 4. Celebrate Milestone with 48+ Children */}
      <TrendingBirthdaySection wishVideos={siteContent?.wishVideos} />

      {/* 5. Today at Janaseva (Real Daily Visual Moments & Kitchen Updates) */}
      <TodaySection updates={updates} />

      {/* 6. Life in Motion: Documentary Video Chapters */}
      <DocumentaryVideoSection />

      {/* 7. Verified Impact Platform Metrics */}
      <VerifiedImpactSection metrics={metrics} totals={totals} />

      {/* 8. Give Your Time: Volunteers & Social Media Influencers */}
      <InvolvedSection />

      {/* 9. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="scroll-mt-14 py-12 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
        <Container>
          <DonationFAQ />
        </Container>
      </section>

      {/* 10. Transparency Center & Audit Documents */}
      <TransparencySection docs={docs} />

      {/* 11. Our Future (Proposed Future Project) */}
      <FutureSection />

      {/* 12. Bengaluru Location & Contact Details */}
      <ContactSection />
    </>
  );
}
