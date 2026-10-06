import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { CampaignsSection } from "@/components/sections/CampaignsSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getApprovedCampaigns } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Community Fundraising Campaigns · Janaseva Ashrama Bangalore",
  description:
    "Start or support verified community fundraising campaigns for Janaseva Ashrama. Transparent allocation for child nourishment, education, and healthcare with 80G tax benefit.",
  alternates: {
    canonical: `${SITE.url}/campaigns`,
  },
};

export default async function CampaignsPage() {
  const campaigns = await getApprovedCampaigns();
  return (
    <>
      <Breadcrumbs items={[{ label: "Campaigns" }]} />
      <PageHero eyebrow="Community" title="Create an Impact" lead="Fundraise for an occasion that matters to you, with verified progress anyone can trust." />
      <CampaignsSection campaigns={campaigns} standalone />
    </>
  );
}
