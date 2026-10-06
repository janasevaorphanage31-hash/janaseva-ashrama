import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHero } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy · Janaseva Ashrama Bangalore",
  description:
    "Official Refund, Return and Cancellation Policy for Janaseva Ashrama Charitable Trust. Clear guidelines on donations, accidental duplicate transactions, and payment resolution.",
  alternates: {
    canonical: `${SITE.url}/refund-policy`,
  },
};

export default function RefundPolicyPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Refund Policy" }]} />
      <PageHero
        eyebrow="Financial Governance & Integrity"
        title="Refund & Cancellation Policy"
        lead="Our clear, transparent policy regarding voluntary contributions, payment processing, and accidental transaction corrections."
      />

      <Section tone="white" className="py-12 md:py-16">
        <Container className="max-w-4xl">
          <div className="prose prose-teal max-w-none space-y-8 text-teal-950/85 text-sm sm:text-base leading-relaxed">
            <div className="rounded-2xl bg-cream p-5 ring-1 ring-teal-900/10">
              <p className="font-bold text-teal-900">
                Entity: <span className="font-normal">{SITE.legalName} ({SITE.entityType})</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Resolution Desk: <span className="font-mono text-xs">{SITE.email}</span> · <span className="font-mono text-xs">+91 {SITE.phone}</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Policy Jurisdiction: <span className="font-normal">Bengaluru, Karnataka, India</span>
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                1. General Policy on Donations
              </h2>
              <p>
                Janaseva Ashrama Charitable Trust is a registered non-profit organization providing daily nutrition, education, health care, and residential shelter for orphaned and destitute children.
              </p>
              <p>
                Because donations are deployed immediately to purchase daily perishable essentials (groceries, fresh fruits, vegetables, medical supplies, and school materials), contributions once completed are normally treated as non-refundable charitable gifts under Indian law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                2. Conditions for Refund Requests
              </h2>
              <p>
                We acknowledge that genuine technical glitches or human errors can occur during digital checkout. We review and process refund requests under the following specific circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Duplicate Transactions:</strong> If your bank account or card was billed more than once for the same donation intent due to a network timeout or multiple button taps.
                </li>
                <li>
                  <strong>Incorrect Donation Amount:</strong> If an unintended amount was entered due to a typographical error (for example, ₹10,000 entered instead of ₹1,000) and reported immediately.
                </li>
                <li>
                  <strong>Unauthorized Transactions:</strong> If a transaction was processed fraudulently or without authorization and substantiated with bank notification.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                3. Timeline and Request Process
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  <strong>Reporting Window:</strong> Any refund claim must be submitted within <strong>7 calendar days</strong> from the date of the transaction.
                </li>
                <li>
                  <strong>Documentation Required:</strong> Email your request to <span className="font-mono font-semibold text-teal-900">{SITE.email}</span> with:
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-xs sm:text-sm">
                    <li>Full Name and Contact Number of the donor</li>
                    <li>Date and Time of Transaction</li>
                    <li>Donation Amount</li>
                    <li>Payment Reference ID / Razorpay Payment ID</li>
                    <li>Screenshot or copy of the bank debit confirmation</li>
                  </ul>
                </li>
                <li>
                  <strong>Investigation and Verification:</strong> Our finance team will verify the payment against bank settlement reports within 2 business days.
                </li>
                <li>
                  <strong>Processing Timeline:</strong> Once approved, the refund will be credited back directly to the original bank account, credit card, debit card, or UPI VPA from which the donation originated within <strong>5 to 7 working days</strong>.
                </li>
              </ol>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                4. Impact on Section 80G Tax Receipts
              </h2>
              <p>
                If a donation is refunded, any provisional digital receipt issued for the refunded amount becomes automatically void and will be revoked in our system. The refunded contribution will not be reported under your PAN in the annual Form 10BD submission to the Income Tax Department. Claiming tax deductions on refunded contributions is strictly prohibited by law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                5. Contact for Finance &amp; Accounts
              </h2>
              <div className="rounded-2xl bg-teal-900 text-white p-6 space-y-2">
                <p className="font-display text-lg font-bold text-gold">
                  Accounts Desk · Janaseva Ashrama
                </p>
                <p className="text-xs sm:text-sm text-white/85">
                  Email: <a href={`mailto:${SITE.email}`} className="text-gold underline">{SITE.email}</a>
                </p>
                <p className="text-xs sm:text-sm text-white/85">
                  Phone: <a href={`tel:${SITE.phoneIntl}`} className="text-gold underline">+91 {SITE.phone}</a>
                </p>
                <p className="text-xs sm:text-sm text-white/85">
                  Physical Location: {SITE.address}
                </p>
              </div>
            </section>

            <div className="pt-6 flex flex-wrap gap-3">
              <Link
                href="/privacy-policy"
                className="focus-ring inline-block rounded-xl border border-teal-900/20 bg-cream px-5 py-2.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
              >
                View Privacy Policy
              </Link>
              <Link
                href="/terms-and-conditions"
                className="focus-ring inline-block rounded-xl border border-teal-900/20 bg-cream px-5 py-2.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
              >
                View Terms and Conditions
              </Link>
              <Link
                href="/"
                className="focus-ring inline-block rounded-xl bg-saffron px-5 py-2.5 text-xs font-bold text-white hover:bg-saffron-dark transition"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
