import type { Metadata } from "next";
import { CheckoutClient } from "@/components/CheckoutClient";
import { PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <>
      <PageHero eyebrow="Checkout" title="Review & give securely" />
      <CheckoutClient />
    </>
  );
}
