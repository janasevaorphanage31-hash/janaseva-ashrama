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
