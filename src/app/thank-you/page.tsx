import type { Metadata } from "next";
import { Suspense } from "react";
import { ThankYouClient } from "@/components/ThankYouClient";

export const metadata: Metadata = {
  title: "Dhanyavadagalu! Thank You for Your Support | Janaseva Ashrama Bangalore",
  description:
    "Official confirmation of your generous contribution to 25 resident orphaned boys at Janaseva Ashrama, Turahalli, Bengaluru. 100% Tax Deductible under Form 10AC Section 80G.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-sand/35 py-10 sm:py-16 px-4 sm:px-6">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md p-12 text-center text-teal-950 font-bold">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-900 border-t-transparent" />
            <p className="mt-4 text-sm font-semibold">Confirming your auspicious contribution...</p>
          </div>
        }
      >
        <ThankYouClient />
      </Suspense>
    </div>
  );
}
