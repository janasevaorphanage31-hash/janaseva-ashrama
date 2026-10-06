import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { ContactSection } from "@/components/sections/ContactSection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us · Janaseva Ashrama Bangalore",
  description:
    "Reach Janaseva Ashrama in Turahalli, Subramanyapura, Bengaluru. Call, WhatsApp, email, or visit our residential children's home. Form 10AC 80G tax exemption support.",
  alternates: {
    canonical: `${SITE.url}/contact`,
  },
};

export default function ContactPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Contact Us" }]} />
      <PageHero eyebrow="Contact" title="Reach Janaseva" lead="Call, message or write - we will get back to you." />
      <ContactSection />
    </>
  );
}
