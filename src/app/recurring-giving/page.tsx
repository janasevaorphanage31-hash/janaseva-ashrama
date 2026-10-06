import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { RecurringGivingClient } from "@/components/RecurringGivingClient";

import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Monthly Regular Giving & Annadana Pledge | Janaseva Ashrama",
  description:
    "Pledge a small monthly contribution (₹250, ₹500, or ₹1,000) to support daily meals and education for 48+ children at Janaseva Ashrama Bangalore.",
};

export default function RecurringGivingPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Regular Giving" }]} />
      <PageHero
        eyebrow="Regular giving"
        title="A small, steady contribution can become a steady part of the work."
        lead="Choose a monthly amount and tell us what you would like to support. Automatic recurring payment activation will only be offered after the payment-provider subscription flow is configured and verified."
      />
      <Section tone="cream">
        <Container className="max-w-xl">
          <RecurringGivingClient />
        </Container>
      </Section>
    </>
  );
}
