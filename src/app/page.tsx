import { CinematicHero } from "@/components/CinematicHero";
import { HorizontalMovingReel } from "@/components/HorizontalMovingReel";
import { OfficialSupportTiersSection } from "@/components/sections/OfficialSupportTiersSection";
import { ThemeNavBar } from "@/components/ThemeNavBar";
import { TodaySection } from "@/components/sections/TodaySection";
import { ImpactCart } from "@/components/ImpactCart";
import { TrendingBirthdaySection } from "@/components/sections/TrendingBirthdaySection";
import { CommunityActivitiesSection } from "@/components/sections/CommunityActivitiesSection";
import { RealBoysGallerySection } from "@/components/sections/RealBoysGallerySection";
import { DocumentaryVideoSection } from "@/components/sections/DocumentaryVideoSection";
import { EmotionalQuotesSection } from "@/components/sections/EmotionalQuotesSection";
import { TransparencySection } from "@/components/sections/TransparencySection";
import { TrustSection } from "@/components/sections/TrustSection";
import { VerifiedImpactSection } from "@/components/sections/VerifiedImpactSection";
import { InvolvedSection } from "@/components/sections/InvolvedSection";
import { DonationFAQ } from "@/components/DonationFAQ";
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

      {/* 1. Cinematic Opening (Awareness & Emotional Hook: 25 Boys Residential Orphanage) */}
      <CinematicHero content={siteContent} />

      {/* 2. Exact 5 Official Support Tiers & Pricing (Official Trust Sponsorship Section at Top) */}
      <OfficialSupportTiersSection />

      {/* 3. Horizontal Moving Reel (Video Clips & Photographs Moving Horizontally) */}
      <HorizontalMovingReel />

      {/* 4. Top Theme Quick Navigation (Instant Anchor Jump with Icons & Short Names) */}
      <ThemeNavBar />

      {/* 5. Today at Janaseva (Real Daily Visual Moments, Kitchen Updates & Daily Annadana Status) */}
      <TodaySection updates={updates} />

      {/* 6. Verified Needs Catalogue & Direct Giving Basket (Categorized Food, Vidya, Health, Shelter) */}
      <Track event="need_view" onView />
      <ImpactCart />

      {/* 7. Deep Emotional Voices & Caregiver Reflections (Donor Psychology & Empathy) */}
      <EmotionalQuotesSection />

      {/* 8. Celebrate Milestones with 25 Boys (Occasion, Birthday Feast & WhatsApp Video Delivery) */}
      <TrendingBirthdaySection wishVideos={siteContent?.wishVideos} />

      {/* 9. On-Ground NGO Activities & Community Outreach Campaigns (2-col grid mobile) */}
      <CommunityActivitiesSection />

      {/* 10. Real Boys Interactive Visual Gallery (39 Curated Ground Moments, Prayers, Classes & Sports) */}
      <RealBoysGallerySection />

      {/* 11. Life in Motion: Documentary Video Chapters (Unstaged Daily Boy Life) */}
      <DocumentaryVideoSection />

      {/* 8. Transparency Center & 5 Official Govt Accreditations (Form 28, Form 10AC, CSR-1, 12AA, PAN) */}
      <TransparencySection docs={docs} />

      {/* 9. Trust & Accountability Pillars, 256-Bit Security & Axis Bank Direct Transfer Details */}
      <TrustSection />

      {/* 10. Verified Impact Platform Metrics */}
      <VerifiedImpactSection metrics={metrics} totals={totals} />

      {/* 11. Give Your Time: Volunteers & Social Media Influencers */}
      <InvolvedSection />

      {/* 12. Frequently Asked Questions (FAQ) */}
      <section id="faq" className="scroll-mt-14 py-12 md:py-16 bg-sand/35 w-full max-w-full overflow-hidden">
        <Container>
          <DonationFAQ />
        </Container>
      </section>

      {/* 13. Our Future (Proposed Future Project) */}
      <FutureSection />

      {/* 14. Bengaluru Location, Map & Direct Bank Details */}
      <ContactSection />
    </>
  );
}
