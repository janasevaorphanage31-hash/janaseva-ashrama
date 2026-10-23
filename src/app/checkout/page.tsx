import type { Metadata } from "next";
import { Suspense } from "react";
import { MetaAdsDonateComponent } from "@/components/MetaAdsDonateComponent";

export const metadata: Metadata = {
  title: "Complete Your Donation | Janaseva Ashrama Bangalore | 80G Tax Exemption",
  description: "Direct online donation for 25 resident boys at Janaseva Ashrama Bengaluru. 100% Tax Deductible under Section 80G Form 10AC. Instant UPI & WhatsApp receipt.",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-sand/35 py-4 sm:py-10 px-2.5 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md p-12 text-center text-teal-950 font-bold">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-900 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold">Loading secure donation checkout...</p>
          </div>
        }
      >
        <MetaAdsDonateComponent />
      </Suspense>
    </div>
  );
}
