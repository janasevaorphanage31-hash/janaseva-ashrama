import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, PageHero } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy · Janaseva Ashrama Bangalore",
  description:
    "Official Privacy Policy of Janaseva Ashrama Charitable Trust. Learn how we collect, process, and protect donor data in compliance with Indian IT Act, DPDPA 2023, and payment security standards.",
  alternates: {
    canonical: `${SITE.url}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Privacy Policy" }]} />
      <PageHero
        eyebrow="Donor Data Protection & Trust"
        title="Privacy Policy"
        lead="Janaseva Ashrama Charitable Trust is committed to safeguarding your personal information, maintaining absolute confidentiality, and adhering to the highest standards of data security and regulatory compliance."
      />

      <Section tone="white" className="py-12 md:py-16">
        <Container className="max-w-4xl">
          <div className="prose prose-teal max-w-none space-y-8 text-teal-950/85 text-sm sm:text-base leading-relaxed">
            {/* Trust & Effective Date Notice */}
            <div className="rounded-2xl bg-cream p-5 ring-1 ring-teal-900/10">
              <p className="font-bold text-teal-900">
                Entity: <span className="font-normal">{SITE.legalName} ({SITE.entityType})</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Registered Location: <span className="font-normal">{SITE.address}</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Effective Date: <span className="font-normal">October 1, 2024 (Last Updated: October 2024)</span>
              </p>
              <p className="font-bold text-teal-900 mt-1">
                Tax Registration: <span className="font-normal">Form 10AC Provisional 80G Approval and Section 12A Registration</span>
              </p>
            </div>

            {/* 1. Overview */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                1. Overview and Scope
              </h2>
              <p>
                This Privacy Policy applies to all donors, volunteers, visitors, and partners interacting with Janaseva Ashrama through our official website ({SITE.url}) or direct communications. As a registered public charitable trust under the Indian Trusts Act, we hold ourselves to strict standards of transparency, integrity, and ethical conduct.
              </p>
              <p>
                We do not sell, rent, trade, or monetize donor data under any circumstances. All donor details are processed solely to facilitate verified charitable giving, issue legal tax receipts under Section 80G of the Income Tax Act 1961, and provide transparent operational reports.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                2. Information We Collect
              </h2>
              <p>
                We collect only the information necessary to fulfill our legal, accounting, and communication obligations:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Donor Identity Information:</strong> Full legal name, email address, mobile phone number, and postal address.
                </li>
                <li>
                  <strong>Tax Exemption Compliance (PAN):</strong> Under Indian Income Tax Department rules (Form 10BD annual reporting), donors claiming 80G tax deductions must provide their Permanent Account Number (PAN). PAN data is encrypted and used exclusively for statutory tax compliance.
                </li>
                <li>
                  <strong>Transaction Records:</strong> Donation amounts, program designations (such as Annadana meal sponsorship or school kits), transaction timestamps, and payment gateway reference IDs.
                </li>
                <li>
                  <strong>Technical and Usage Data:</strong> Standard server logs, IP addresses, browser types, device information, and interaction data used for website security, performance optimization, and fraud prevention.
                </li>
              </ul>
            </section>

            {/* 3. Payment Processing & Banking Security */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                3. Payment Gateway Security (PCI-DSS Compliance)
              </h2>
              <p>
                All online monetary transactions on our platform are processed through accredited, Reserve Bank of India (RBI) authorized payment gateways (including Razorpay) operating under strict PCI-DSS Level 1 compliance.
              </p>
              <div className="rounded-xl bg-teal-900/5 p-4 border-l-4 border-teal-800">
                <p className="font-semibold text-teal-900">Important Banking Data Notice:</p>
                <p className="mt-1 text-xs sm:text-sm text-teal-950/80">
                  Janaseva Ashrama never stores, handles, or has access to your confidential payment credentials, including credit card numbers, debit card PINs, CVV codes, net banking passwords, or UPI MPINs. All credentials are encrypted end-to-end directly by the authorized payment gateway and banking networks.
                </p>
              </div>
            </section>

            {/* 4. Purpose and Use of Data */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                4. Purpose and Legal Basis for Processing
              </h2>
              <p>We use your personal data strictly for:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Processing voluntary charitable contributions and allocating funds to verified child welfare programs.</li>
                <li>Issuing instant verified donation receipts and annual Section 80G tax certificates (Form 10BD).</li>
                <li>Transmitting operational impact reports, meal delivery confirmations, and Ashrama updates via WhatsApp or email upon donor request.</li>
                <li>Complying with statutory audits, accounting laws, and legal requests from Indian tax authorities.</li>
                <li>Detecting, preventing, and addressing fraudulent transactions or security violations.</li>
              </ul>
            </section>

            {/* 5. Advertising & Analytics Transparency (Google & Meta Ads) */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                5. Analytics, Advertising Pixels, and Cookies
              </h2>
              <p>
                To measure outreach efficiency and ensure advertising funds are spent responsibly, we use privacy-conscious analytics and conversion tags, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Google Analytics 4 &amp; Google Ads:</strong> To monitor website traffic, aggregate user paths, and verify ad engagement without profiling personally identifiable records.
                </li>
                <li>
                  <strong>Meta Pixel (Facebook/Instagram):</strong> To evaluate campaign effectiveness for educational and fundraising announcements.
                </li>
                <li>
                  <strong>Cookies:</strong> Small text files that store session preferences, such as your Giving Basket items, without tracking personal browsing across third-party websites.
                </li>
              </ul>
              <p>
                You may disable cookies or opt out of personalized advertising at any time through your browser settings or via Google and Meta ad preferences.
              </p>
            </section>

            {/* 6. Child Protection and Media Safeguarding */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                6. Child Protection and Media Safeguarding Policy
              </h2>
              <p>
                Janaseva Ashrama strictly complies with the Juvenile Justice (Care and Protection of Children) Act and national child protection frameworks:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>No full legal names, sensitive backgrounds, or case histories of resident children are ever published online.</li>
                <li>All media representations depict children with dignity, focusing on learning, activities, and nutritious nourishment.</li>
                <li>Visitors, volunteers, and donors are strictly prohibited from photographing or recording children without written authorization from the Ashrama management.</li>
              </ul>
            </section>

            {/* 7. Data Retention & Donor Rights */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                7. Data Retention and Your Rights
              </h2>
              <p>
                Under applicable Indian laws and the Digital Personal Data Protection Act (DPDPA), you retain the right to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Review the contact information held in our records.</li>
                <li>Request corrections or updates to your details for tax receipt accuracy.</li>
                <li>Opt out of non-statutory communication channels (such as newsletter updates or WhatsApp announcements) at any time.</li>
                <li>
                  Statutory accounting records and 80G tax submission logs must be maintained for the statutory duration mandated by the Income Tax Department (typically 7 financial years).
                </li>
              </ul>
            </section>

            {/* 8. Grievance Redressal Officer */}
            <section className="space-y-3">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-teal-900">
                8. Grievance Redressal and Contact Details
              </h2>
              <p>
                If you have questions, feedback, or concerns regarding your privacy or data handling, please contact our designated Trust Administrator:
              </p>
              <div className="rounded-2xl bg-teal-900 text-white p-6 space-y-2">
                <p className="font-display text-lg font-bold text-gold">
                  Janaseva Ashrama Charitable Trust
                </p>
                <p className="text-xs sm:text-sm text-white/90">
                  Attention: Grievance Officer and Data Administrator
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Address: {SITE.address}
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Email: <a href={`mailto:${SITE.email}`} className="text-gold underline">{SITE.email}</a>
                </p>
                <p className="text-xs sm:text-sm text-white/80">
                  Telephone: <a href={`tel:${SITE.phoneIntl}`} className="text-gold underline">+91 {SITE.phone}</a>
                </p>
                <p className="text-xs text-white/60 pt-2 border-t border-white/10">
                  Official Visiting Hours: 10:00 AM to 6:00 PM (IST) by prior appointment.
                </p>
              </div>
            </section>

            {/* Back to Home / Impact */}
            <div className="pt-6 flex flex-wrap gap-3">
              <Link
                href="/terms-and-conditions"
                className="focus-ring inline-block rounded-xl border border-teal-900/20 bg-cream px-5 py-2.5 text-xs font-bold text-teal-900 hover:bg-sand transition"
              >
                View Terms and Conditions
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
