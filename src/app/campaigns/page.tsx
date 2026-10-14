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
  openGraph: {
    title: "Community Fundraising Campaigns · Janaseva Ashrama Bangalore",
    description:
      "Support verified campaigns or create your own cause to feed, educate, and care for 25 boys at Janaseva Ashrama.",
    url: `${SITE.url}/campaigns`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Community Campaigns for Janaseva Ashrama",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Campaigns · Janaseva Ashrama Bangalore",
    description: "Start or back a verified child welfare campaign with 80G tax benefit.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
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
