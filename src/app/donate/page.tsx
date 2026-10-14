import type { Metadata } from "next";
import { Suspense } from "react";
import { DonateClientComponent } from "@/components/DonateClientComponent";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Donate to Janaseva Ashrama | 80G Tax Exemption | Orphanage in Bangalore",
  description:
    "Support 25 resident orphaned boys at Janaseva Ashrama, Bengaluru. Sponsor daily hot meals (Annadana), school kits, healthcare, and birthday celebrations. 50% tax deduction under Section 80G Form 10AC.",
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
    title: "Donate to Janaseva Ashrama | 80G Tax Exemption | Bangalore Orphanage",
    description:
      "Support 25 resident boys with nutritious daily meals, school education, and loving shelter. 100% verified allocation under JJ Act KA18CH0242 and 80G tax benefit.",
    url: `${SITE.url}/donate`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Resident Children Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Donate to Janaseva Ashrama Bangalore | 80G Tax Exemption",
    description: "Sponsor meals and education for 25 resident boys at Janaseva Ashrama Bangalore.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-sand/35 py-10 sm:py-16 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center p-12 text-teal-950 font-bold">Loading donation portal...</div>}>
        <DonateClientComponent />
      </Suspense>
    </div>
  );
}
