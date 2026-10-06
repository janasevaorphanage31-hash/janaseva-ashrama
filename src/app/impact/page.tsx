import type { Metadata } from "next";
import { ImpactCart } from "@/components/ImpactCart";
import { DonationFAQ } from "@/components/DonationFAQ";
import { Container, PageHero } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Direct Giving & Impact Areas · Janaseva Ashrama Bangalore",
  description:
    "Select essential meal kits, nutritious milk, school books, or medical support for 48+ children at Janaseva Ashrama. Form 10AC 80G tax benefit.",
  alternates: {
    canonical: `${SITE.url}/impact`,
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
