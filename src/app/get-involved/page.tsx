import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { CommunityV2Section } from "@/components/sections/CommunityV2Section";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Get Involved & Community Network | Janaseva Ashrama",
  description:
    "Join the Janaseva family as a weekend volunteer mentor, content creator/influencer, corporate CSR partner, or official WhatsApp network member.",
};

export default function GetInvolvedPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Get Involved" }]} />
      <PageHero
        eyebrow="Community & Volunteer Network"
        title="Give your time, voice, or corporate partnership."
        lead="Love, mentorship, and guidance cannot be bought. Join as a volunteer tutor, visit as a content creator, partner through company CSR, or stay connected via WhatsApp."
      />
      <CommunityV2Section />
    </>
  );
}
