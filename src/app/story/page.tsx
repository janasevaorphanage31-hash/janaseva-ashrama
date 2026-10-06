import type { Metadata } from "next";
import { Track } from "@/components/Track";
import { PageHero } from "@/components/ui";
import { LifeSection } from "@/components/sections/LifeSection";
import { StorySection } from "@/components/sections/StorySection";

export const metadata: Metadata = { title: "Our Story" };

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
