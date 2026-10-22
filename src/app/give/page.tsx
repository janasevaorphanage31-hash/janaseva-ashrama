import type { Metadata } from "next";
import { Suspense } from "react";
import { UnifiedDonationFlow } from "@/components/UnifiedDonationFlow";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Support 25 Resident Boys | Janaseva Ashrama Bangalore | 80G Tax Exemption",
  description:
    "Direct donation for 25 orphaned boys at Janaseva Ashrama, Bengaluru. ₹500 feeds a child for a week. 100% Tax Deductible under Section 80G Form 10AC. Instant UPI & WhatsApp receipt.",
  keywords: [
    "donate to orphanage bangalore",
    "janaseva ashrama donate",
    "sponsor child food bangalore",
    "annadana donation bangalore",
    "80g donation bangalore",
    "children home donation bangalore",
  ],
  alternates: {
    canonical: `${SITE.url}/give`,
  },
  openGraph: {
    title: "Support 25 Resident Boys | Janaseva Ashrama Bangalore",
    description:
      "₹500 feeds a child for a week. Wholesome hot satvik meals, school kits, and loving care for 25 orphaned boys in Bengaluru. 100% Tax Deductible under 80G.",
    url: `${SITE.url}/give`,
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
    title: "Support 25 Resident Boys | Janaseva Ashrama Bangalore",
    description: "₹500 feeds a child for a week. 100% Tax Exemption under Section 80G Form 10AC.",
    images: [`${SITE.url}/media/annadana-hall-hd.jpg`],
  },
};

export default function GivePage() {
  return (
    <div className="min-h-screen bg-sand/35 py-6 sm:py-12 px-3 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md px-5 py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-900 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-teal-900/70">Connecting secure donation portal…</p>
          </div>
        }
      >
        <UnifiedDonationFlow />
      </Suspense>
    </div>
  );
}
