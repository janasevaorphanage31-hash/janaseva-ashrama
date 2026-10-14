import type { Metadata } from "next";
import { ImpactCart } from "@/components/ImpactCart";
import { DonationFAQ } from "@/components/DonationFAQ";
import { Container, PageHero } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Direct Giving & Impact Areas · Janaseva Ashrama Bangalore",
  description:
    "Select essential meal kits, nutritious milk, school books, or medical support for 25 resident boys at Janaseva Ashrama. Form 10AC 80G tax benefit.",
  alternates: {
    canonical: `${SITE.url}/impact`,
  },
  openGraph: {
    title: "Direct Giving & Impact Areas · Janaseva Ashrama Bangalore",
    description:
      "Sponsor essential meal kits, nutritious milk, books, and healthcare for 25 resident boys in Bengaluru with 80G tax benefit.",
    url: `${SITE.url}/impact`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Impact Areas Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Direct Giving & Impact Areas · Janaseva Ashrama Bangalore",
    description: "Sponsor meals and education for 25 resident boys in Bangalore.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function ImpactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Direct Impact" }]} />
      <PageHero eyebrow="Your Impact" title="Choose what you want to make possible." lead="Build your contribution from current impact areas, review the total, then continue to secure checkout." />
      <ImpactCart page />
      <section className="bg-cream px-5 pb-16"><Container><DonationFAQ /></Container></section>
    </>
  );
}
