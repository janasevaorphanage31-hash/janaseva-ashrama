import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHero } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and Conditions · Janaseva Ashrama Bangalore",
  description:
    "Official Terms and Conditions for Janaseva Ashrama Charitable Trust. Understand our voluntary donation policies, 80G tax receipt rules, refund policy, and child safeguarding standards.",
  alternates: {
    canonical: `${SITE.url}/terms-and-conditions`,
  },
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Terms & Conditions" }]} />
      <PageHero
        eyebrow="Legal & Ethical Framework"
        title="Terms and Conditions"
        lead="These terms govern your use of the Janaseva Ashrama website, voluntary contributions, and interactions with our charitable organization."
      />

      <Section tone="white" className="py-12 md:py-16">
        <Container className="max-w-4xl">
          <div className="prose prose-teal max-w-none space-y-8 text-teal-950/85 text-sm sm:text-base leading-relaxed">
            {/* Entity Summary Card */}
            <div className="rounded-2xl bg-cream p-5 ring-1 ring-teal-900/10">
              <p className="font-bold text-teal-900">
                Operating Entity: <span className="font-normal">{SITE.legalName}</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Legal Status: <span className="font-normal">{SITE.entityType}</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Tax Recognition: <span className="font-normal">Provisional 80G Approval (Form 10AC) under Income Tax Act, 1961</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Registered Office: <span className="font-normal">{SITE.address}</span>
              </p>
            </div>

            {/* 1. Acceptance of Terms */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or donating through the Janaseva Ashrama platform ({SITE.url}), you agree to be bound by these Terms and Conditions, our Privacy Policy, and our Refund Policy. If you do not agree with any part of these terms, please refrain from using our services.
              </p>
            </section>

            {/* 2. Nature of Contributions */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                2. Nature of Voluntary Contributions
              </h2>
              <p>
                All financial transfers made through this platform are voluntary public charitable donations intended exclusively for the care, nutrition, education, health, and residential shelter of orphaned and vulnerable children residing at Janaseva Ashrama.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Donations do not constitute commercial purchases, investments, or exchanges for commercial goods or services.</li>
                <li>Impact items listed on our platform (such as Warm Meal, Fruit Basket, School Kit, Uniform, or Birthday Feast) represent programmatic operational units used by the Ashrama to allocate resources effectively.</li>
                <li>In circumstances where specific items exceed immediate capacity or demand, the Trust reserves the right to deploy surplus funds toward the most urgent daily welfare needs of the children.</li>
              </ul>
            </section>

            {/* 3. Section 80G Tax Exemption Certificates */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                3. Section 80G Tax Exemption and PAN Disclosure
              </h2>
              <p>
                Janaseva Ashrama holds a provisional Section 80G approval (Form 10AC) issued under the Income Tax Act, 1961. Eligible donors in India are entitled to claim 50% deduction on qualifying donations subject to statutory limits.
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Statutory PAN Requirement:</strong> In accordance with Central Board of Direct Taxes (CBDT) notifications and Form 10BD annual reporting, donors must provide a valid 10-digit Indian Permanent Account Number (PAN) at the time of donation to have their tax exemption credited directly in their Annual Information Statement (AIS) / Form 26AS.
                </li>
                <li>
                  <strong>Receipt Issuance:</strong> Digital receipts are generated instantly upon confirmation of payment. Formal Form 10BE tax certificates are filed annually following the close of the financial year in compliance with IT department filing deadlines.
                </li>
              </ul>
            </section>

            {/* 4. Refund and Cancellation Policy */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                4. Refund and Cancellation Policy
              </h2>
              <p>
                As a charitable organization providing immediate perishable daily supplies (such as fresh vegetables, groceries, and school materials), donations once processed are normally non-refundable.
              </p>
              <div className="rounded-xl bg-sand/60 p-4 ring-1 ring-teal-900/10">
                <p className="font-bold text-teal-900">Exceptions for Accidental Transactions:</p>
                <p className="mt-1 text-xs sm:text-sm text-teal-950/80">
                  If an error occurred during checkout (such as an accidental duplicate charge or an incorrect amount entered in error), please notify us in writing within 7 calendar days of the transaction by emailing <span className="font-mono font-semibold text-teal-900">{SITE.email}</span> with your payment reference ID, date, and bank statement proof.
                </p>
                <p className="mt-2 text-xs sm:text-sm text-teal-950/80">
                  Upon verification by our finance desk, legitimate accidental duplicate payments will be refunded to the original payment method within 5 to 7 business days, minus standard payment gateway transaction fees where applicable.
                </p>
              </div>
            </section>

            {/* 5. Child Safeguarding and Media Rights */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                5. Child Safeguarding and Intellectual Property
              </h2>
              <p>
                The dignity, safety, and psychological well-being of the children under our care is paramount:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All text, photographs, audio, and video recordings published on this platform are the exclusive intellectual property of Janaseva Ashrama Charitable Trust or used under explicit consent.</li>
                <li>Users may not download, scrape, republish, alter, or commercially exploit any photograph or narrative featuring resident children.</li>
                <li>Any unauthorized publication or commercial misuse of Ashrama media will be prosecuted under the Copyright Act and the Protection of Children from Sexual Offences (POCSO) / Juvenile Justice Act guidelines.</li>
              </ul>
            </section>

            {/* 6. Campus Visits and Volunteer Protocols */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                6. Campus Visits and In-Person Interactions
              </h2>
              <p>
                To maintain a safe, orderly, and nurturing environment for the children:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Campus visits are permitted exclusively between 10:00 AM and 6:00 PM (IST) with prior telephone coordination.</li>
                <li>Unscheduled or unannounced walk-ins cannot be accommodated during study hours, meal times, or rest periods.</li>
                <li>All visitors must present valid government photo identification upon arrival and adhere to our visitor safety policy.</li>
              </ul>
            </section>

            {/* 7. Governing Law and Jurisdiction */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                7. Governing Law and Jurisdiction
              </h2>
              <p>
                These Terms and Conditions shall be governed by, interpreted, and construed in accordance with the laws of the Republic of India. Any dispute, claim, or controversy arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts of Bengaluru (Bangalore), Karnataka, India.
              </p>
            </section>

            {/* 8. Contact Information */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                8. Contact for Legal Notices
              </h2>
              <div className="rounded-2xl bg-teal-900 text-white p-6 space-y-2">
                <p className="font-display text-lg font-bold text-gold">
                  Janaseva Ashrama Charitable Trust
                </p>
                <p className="text-xs sm:text-sm text-white/90">
                  Address: {SITE.address}
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Email: <a href={`mailto:${SITE.email}`} className="text-gold underline">{SITE.email}</a>
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Phone: <a href={`tel:${SITE.phoneIntl}`} className="text-gold underline">+91 {SITE.phone}</a>
                </p>
              </div>
            </section>

            {/* Action Links */}
            <div className="pt-6 flex flex-wrap gap-3">
              <Link
                href="/privacy-policy"
                className="focus-ring inline-block rounded-xl border border-teal-900/20 bg-cream px-5 py-2.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
              >
                View Privacy Policy
              </Link>
              <Link
                href="/refund-policy"
                className="focus-ring inline-block rounded-xl border border-teal-900/20 bg-cream px-5 py-2.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
              >
                View Refund Policy
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
