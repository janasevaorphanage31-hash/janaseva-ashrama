import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { ContactSection } from "@/components/sections/ContactSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSiteContentMap } from "@/lib/site-content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us · Janaseva Ashrama Bangalore",
  description:
    "Reach Janaseva Ashrama in Turahalli, Subramanyapura, Bengaluru. Call, WhatsApp, email, or visit our residential children's home. Form 10AC 80G tax exemption support.",
  alternates: {
    canonical: `${SITE.url}/contact`,
  },
  openGraph: {
    title: "Contact Janaseva Ashrama · Bangalore Children's Home",
    description:
      "Reach out to Janaseva Ashrama in Turahalli, Bengaluru. Call or WhatsApp to visit, dedicate meals, or inquire about 80G tax receipts.",
    url: `${SITE.url}/contact`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Contact Janaseva Ashrama Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Janaseva Ashrama Bangalore",
    description: "Call or message us on WhatsApp to schedule visits or dedicate meals.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default async function ContactPage() {
  const siteContent = await getSiteContentMap();
  return (
    <>
      <Breadcrumbs items={[{ label: "Contact Us" }]} />
      <PageHero eyebrow="Contact" title="Reach Janaseva" lead="Call, message or write - we will get back to you." />
      <ContactSection content={siteContent} />
    </>
  );
}
