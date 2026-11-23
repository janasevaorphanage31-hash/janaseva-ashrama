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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${SITE.url}/transparency#webpage`,
        url: `${SITE.url}/transparency`,
        name: "Transparency & Financial Governance · Janaseva Ashrama Bangalore",
        description:
          "Official statutory certificates, Form 10AC Section 80G tax approvals, Juvenile Justice Act registration, and financial governance documents for Janaseva Ashrama.",
        publisher: {
          "@type": "NGO",
          name: SITE.name,
          legalName: SITE.legalName,
          url: SITE.url,
          taxID: SITE.pan,
          identifier: [SITE.urn, SITE.jjActNumber, SITE.csrNumber, SITE.pan],
        },
        hasCredential: [
          {
            "@type": "GovernmentPermit",
            name: "Juvenile Justice Act Form 28 Registration (KA18CH0242)",
            identifier: SITE.jjActNumber,
            issuedBy: {
              "@type": "GovernmentOrganization",
              name: "Directorate of Child Protection, Government of Karnataka",
            },
            validThrough: "2030-03-26",
          },
          {
            "@type": "GovernmentPermit",
            name: "Income Tax Act Section 80G Approval Order (Form 10AC)",
            identifier: SITE.urn,
            issuedBy: {
              "@type": "GovernmentOrganization",
              name: "Income Tax Department, Government of India",
            },
            validThrough: "2027-03-31",
          },
          {
            "@type": "GovernmentPermit",
            name: "MCA CSR-1 Registration for Corporate Social Responsibility",
            identifier: SITE.csrNumber,
            issuedBy: {
              "@type": "GovernmentOrganization",
              name: "Ministry of Corporate Affairs, Government of India",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={[{ label: "Transparency & Governance" }]} />
      <PageHero eyebrow="Trust" title="Transparency" lead="Documents, governance, policies and how your donation is handled." />
      <TransparencySection docs={docs} standalone />
    </>
  );
}
