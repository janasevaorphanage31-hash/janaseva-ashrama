import type { Metadata } from "next";
import { Suspense } from "react";
import { UnifiedDonationFlow } from "@/components/UnifiedDonationFlow";

export const metadata: Metadata = {
  title: "Donate to 25 Resident Boys | Official Secure Checkout | Janaseva Ashrama",
  description: "Secure, direct online contribution to Janaseva Ashrama, Bangalore. 100% Tax Deductible under Section 80G Form 10AC. Instant UPI & WhatsApp receipt.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-sand/30 py-4 sm:py-10">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md px-5 py-24 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-900 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold text-teal-900/70">Connecting secure giving portal…</p>
          </div>
        }
      >
        <UnifiedDonationFlow />
      </Suspense>
    </div>
  );
}
