import type { Metadata } from "next";
import { PageHero } from "@/components/ui";
import { TransparencySection } from "@/components/sections/TransparencySection";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getDocuments } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Transparency & Financial Governance · Janaseva Ashrama Bangalore",
  description:
    "Explore official registration certificates, Form 10AC 80G tax approvals, trust deeds, annual reports, and transparent financial governance policies of Janaseva Ashrama.",
  alternates: {
    canonical: `${SITE.url}/transparency`,
  },
  openGraph: {
    title: "Transparency & Governance · Janaseva Ashrama Bangalore",
    description:
      "Verify statutory registrations, 80G Form 10AC tax approvals, and financial audits for Janaseva Ashrama.",
    url: `${SITE.url}/transparency`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Janaseva Ashrama Legal & Financial Governance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Transparency & Governance · Janaseva Ashrama Bangalore",
    description: "Official registration certificates and Form 10AC 80G tax exemptions.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

export default async function TransparencyPage() {
  const docs = await getDocuments();
  return (
    <>
      <Breadcrumbs items={[{ label: "Transparency & Governance" }]} />
      <PageHero eyebrow="Trust" title="Transparency" lead="Documents, governance, policies and how your donation is handled." />
      <TransparencySection docs={docs} standalone />
    </>
  );
}
