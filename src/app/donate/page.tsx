import type { Metadata } from "next";
import { Suspense } from "react";
import { DonateClientComponent } from "@/components/DonateClientComponent";

export const metadata: Metadata = {
  title: "Birthday Blessings Donation | Janaseva Ashrama Bangalore",
  description: "Dedicating a warm meal or birthday cake to 25 resident boys in Turahalli Bangalore. 100% Tax Deductible under Form 10AC Section 80G.",
};

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-sand/35 py-10 sm:py-16 px-4 sm:px-6">
      <Suspense fallback={<div className="text-center p-12 text-teal-950 font-bold">Loading donation portal...</div>}>
        <DonateClientComponent />
      </Suspense>
    </div>
  );
}
