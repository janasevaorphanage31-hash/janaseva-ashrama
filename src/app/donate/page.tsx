import type { Metadata } from "next";
import { Suspense } from "react";
import { MetaAdsDonateComponent } from "@/components/MetaAdsDonateComponent";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Donate to Janaseva Ashrama | 80G Tax Exemption | 25 Resident Boys Bangalore",
  description:
    "Direct online donation to Janaseva Ashrama, Bengaluru. ₹500 feeds a child for a week. 100% Tax Deductible under Section 80G Form 10AC. Instant UPI & WhatsApp receipt.",
  keywords: [
    "donate to orphanage bangalore",
    "janaseva ashrama donate",
    "annadana donation bangalore",
    "80g donation bangalore",
    "sponsor food orphanage bangalore",
    "children home donation bangalore",
    "turahalli orphanage donation",
  ],
  alternates: {
    canonical: `${SITE.url}/donate`,
  },
  openGraph: {
    title: "Donate to Janaseva Ashrama | 80G Tax Exemption | Bangalore",
    description:
      "Support 25 resident boys with nutritious daily meals, school education, and loving shelter. 100% verified allocation under JJ Act KA18CH0242 and 80G tax benefit.",
    url: `${SITE.url}/donate`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/annadana-hall-hd.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Resident Children Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Donate to Janaseva Ashrama Bangalore | 80G Tax Exemption",
    description: "Sponsor meals and education for 25 resident boys at Janaseva Ashrama Bangalore. ₹500 feeds a child for a week.",
    images: [`${SITE.url}/media/annadana-hall-hd.jpg`],
  },
};

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF7EE] via-[#F6EFE2] to-[#ECE2D0] py-4 sm:py-10 px-2.5 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md p-12 text-center text-teal-950 font-bold">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-900 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold">Loading donation portal...</p>
          </div>
        }
      >
        <MetaAdsDonateComponent />
      </Suspense>
    </div>
  );
}
