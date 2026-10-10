import type { Metadata } from "next";
import { SupporterFormClient } from "@/components/SupporterFormClient";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Official Supporter Form | Sponsor Food, Clothes & Education",
  description:
    "Official Supporter Form of Janaseva Ashrama (Makkala Ashraya Kendra). Sponsor one-day food for all 25 children, one month meals, clothing sets, or schooling. 100% verified allocation with Form 10AC 80G tax exemption (AABTJ7431MF20231) and JJ Act registration.",
  keywords: [
    "supporter form janaseva ashrama",
    "makkala ashraya kendra bangalore",
    "sponsor food orphanage bangalore",
    "annadana donation bangalore",
    "sponsor child clothes bangalore",
    "sponsor education 25 children bangalore",
    "80g tax exemption donation bangalore",
    "jana seva samruddi education society",
  ],
  alternates: {
    canonical: `${SITE.url}/supporter-form`,
  },
  openGraph: {
    title: "Official Supporter Form · Janaseva Ashrama Bangalore",
    description:
      "Support 25 resident boys with daily meals, clothes, and education. Official Supporter Form of Makkala Ashraya Kendra with instant 80G tax exemption.",
    url: `${SITE.url}/supporter-form`,
    images: [{ url: `${SITE.url}/media/janaseva-ashrama-original.jpg`, width: 1200, height: 675, alt: "Children at Janaseva Ashrama" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Official Supporter Form · Janaseva Ashrama Bangalore",
    description: "Support 25 resident boys with daily meals, clothes, and education.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default function SupporterFormPage() {
  return <SupporterFormClient />;
}
