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
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE.url}/donate#webpage`,
        url: `${SITE.url}/donate`,
        name: "Donate to Janaseva Ashrama | 80G Tax Exemption | 25 Resident Boys Bangalore",
        description:
          "Direct online donation portal for Janaseva Ashrama, Bengaluru. 100% Tax Deductible under Section 80G Form 10AC. Instant digital receipts.",
        potentialAction: {
          "@type": "DonateAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE.url}/donate`,
            inLanguage: "en-IN",
            actionPlatform: [
              "http://schema.org/DesktopWebPlatform",
              "http://schema.org/MobileWebPlatform",
            ],
          },
          recipient: {
            "@type": "NGO",
            name: SITE.name,
            legalName: SITE.legalName,
            url: SITE.url,
            taxID: SITE.pan,
            telephone: SITE.phoneIntl,
            identifier: [SITE.urn, SITE.jjActNumber, SITE.csrNumber, SITE.pan],
          },
        },
      },
      {
        "@type": "FinancialService",
        "@id": `${SITE.url}/donate#bank-transfer`,
        name: "Janaseva Ashrama Official Bank & UPI Transfer",
        provider: {
          "@type": "NGO",
          name: SITE.name,
        },
        description: `Official charity bank account for NEFT/RTGS/IMPS contributions: ${SITE.bankDetails.bankName}, Account: ${SITE.bankDetails.accountNumber}, IFSC: ${SITE.bankDetails.ifscCode}, UPI ID: ${SITE.bankDetails.upiId}. Eligible for 80G tax rebate.`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FBF7EE] via-[#F6EFE2] to-[#ECE2D0] py-4 sm:py-10 px-2.5 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
