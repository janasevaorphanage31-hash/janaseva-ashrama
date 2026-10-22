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
    <div className="min-h-screen bg-sand/35 py-6 sm:py-12 px-3 sm:px-6">
      <Suspense fallback={<div className="text-center py-20 font-bold text-teal-900">Loading donation checkout...</div>}>
        <MetaAdsDonateComponent />
      </Suspense>
    </div>
  );
}
