import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, PageHero, Section } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE, FORM_10AC, JJ_ACT_REGISTRATION, BANK_DETAILS } from "@/lib/site";

export const metadata: Metadata = {
  title: "How to Sponsor Meals & Donate to Orphanages in Bangalore (2026 Guide) · 80G Tax Exemption",
  description:
    "Comprehensive guide to sponsoring hot meals (Annadana) and supporting verified orphanages in Bangalore. Learn about JJ Act KA18CH0242 registration, 80G Form 10AC tax benefits, visiting guidelines, and cost breakdowns.",
  keywords: [
    "sponsor meals orphanage bangalore",
    "annadana donation bangalore",
    "donate to orphanage bangalore",
    "celebrate birthday in orphanage bangalore",
    "orphanage near me bangalore",
    "80g tax exemption donation bangalore",
    "janaseva ashrama bangalore guide",
    "how to feed orphanage children bangalore",
    "juvenile justice act registered orphanage karnataka",
  ],
  alternates: {
    canonical: `${SITE.url}/stories/sponsor-meals-orphanage-bangalore-guide`,
  },
  openGraph: {
    title: "Guide: Sponsoring Meals & Donating to Orphanages in Bangalore (80G Exemption)",
    description:
      "A complete guide to verified charitable giving in Bengaluru. Discover costs, government registration checks, celebration visits, and tax deductions.",
    url: `${SITE.url}/stories/sponsor-meals-orphanage-bangalore-guide`,
    siteName: SITE.name,
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        width: 1200,
        height: 675,
        alt: "Annadana Meal Feast at Janaseva Ashrama Bangalore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Sponsor Meals & Donate to Orphanages in Bangalore (2026 Guide)",
    description: "Verified costs, legal checks, visiting tips, and 80G tax exemption for Bangalore donors.",
    images: [`${SITE.url}/media/janaseva-ashrama-original.jpg`],
  },
};

const ARTICLE_FAQS = [
  {
    q: "How much does it cost to sponsor food for an orphanage in Bangalore?",
    a: "At Janaseva Ashrama in Bangalore, sponsoring a nutritious morning breakfast for all 25 resident boys costs ₹1,000. Sponsoring a festive lunch with sweets is ₹1,500. Sponsoring a complete day's nourishment (breakfast, lunch, evening snacks with milk, and dinner) for all 25 boys costs ₹4,500. Individual meal contributions start at just ₹100.",
  },
  {
    q: "How can I verify if an orphanage in Karnataka is legally registered?",
    a: "Every authentic children's home in Karnataka must hold a Form 28 Registration Certificate issued by the Directorate of Child Protection under Section 41(1) of the Juvenile Justice (JJ) Act, 2015. Additionally, donors should verify Section 80G approval via Form 10AC on the Income Tax portal and MCA CSR-1 registration for corporate contributions.",
  },
  {
    q: "Can I celebrate my birthday or anniversary at an orphanage in Bangalore?",
    a: "Yes. Donors and families can visit Janaseva Ashrama in Turahalli, Subramanyapura, South Bangalore to cut a cake, serve hot meals, and spend meaningful time with the children. We offer two daily celebration slots: Lunch (11:30 AM to 1:30 PM) and Evening Snacks (4:30 PM to 6:30 PM). Prior appointment is recommended.",
  },
  {
    q: "What tax benefits are available for donating to orphanages in India?",
    a: "Under Section 80G(5)(iv) of the Income Tax Act, 1961, donors can claim a 50% deduction on qualifying donations made to registered charitable institutions like Janaseva Ashrama (Form 10AC URN: AABTJ7431MF20231). Digital receipts with 80G certificate numbers are issued immediately upon donation.",
  },
  {
    q: "What items can be donated besides cooked meals?",
    a: "In addition to cooked food, Janaseva Ashrama welcomes dry ration kits (sona masoori rice, toor dal, cooking oil), school kits (uniforms, notebooks, stationery, school backpacks), and toiletries (soaps, toothpaste, coconut oil).",
  },
];

export default function SponsorMealsGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${SITE.url}/stories/sponsor-meals-orphanage-bangalore-guide#article`,
        headline: "How to Sponsor Meals (Annadana) & Donate to Orphanages in Bangalore: A Complete 2026 Guide",
        description:
          "Authoritative guide for Bangalore donors on sponsoring hot meals, checking government licensing under the Juvenile Justice Act, claiming Section 80G tax benefits, and celebrating birthdays with children.",
        image: `${SITE.url}/media/janaseva-ashrama-original.jpg`,
        datePublished: "2026-01-15T08:00:00+05:30",
        dateModified: "2026-10-25T12:00:00+05:30",
        author: {
          "@type": "Person",
          name: "Sunita Bai",
          jobTitle: "Head Caregiver & Matron",
          worksFor: {
            "@type": "Organization",
            name: SITE.name,
            url: SITE.url,
          },
        },
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
          logo: {
            "@type": "ImageObject",
            url: `${SITE.url}/logo/janaseva-logo.png`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE.url}/stories/sponsor-meals-orphanage-bangalore-guide`,
        },
        speakable: {
          "@type": "SpeakableSpecification",
          cssSelector: [".key-summary", ".ai-answer-block"],
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Stories & Journal",
            item: `${SITE.url}/stories`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Bangalore Orphanage Annadana Guide",
            item: `${SITE.url}/stories/sponsor-meals-orphanage-bangalore-guide`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: ARTICLE_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Stories & Journal", href: "/stories" },
          { label: "Bangalore Orphanage Donation Guide" },
        ]}
      />

      <PageHero
        eyebrow="Donor Guide · Updated October 2026 · E-E-A-T Verified"
        title="How to Sponsor Meals & Donate to Orphanages in Bangalore"
        lead="Everything you need to know about sponsoring hot meals (Annadana), verifying government licenses, claiming 80G tax exemptions, and organizing memorable celebration visits for children in Bengaluru."
      />

      <Section tone="cream" className="py-12">
        <Container className="max-w-4xl">
          {/* Key Summary Box / AI Overviews Snippet */}
          <div className="key-summary bg-emerald-950 text-white p-6 md:p-8 rounded-3xl mb-10 shadow-lg border border-emerald-800">
            <span className="inline-block px-3 py-1 bg-amber-400 text-stone-900 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
              Executive Summary & Direct Answers
            </span>
            <div className="space-y-3 text-sm md:text-base text-stone-200">
              <p>
                <strong>Meal Sponsorship Costs:</strong> Sponsoring breakfast for 25 boys in Bangalore is <strong>₹1,000</strong>, a special festive lunch with sweets is <strong>₹1,500</strong>, and complete full-day Annadana (3 meals + evening snacks) is <strong>₹4,500</strong>.
              </p>
              <p>
                <strong>Government Verification:</strong> Always ensure the orphanage holds a valid <strong>Form 28 Registration under Section 41(1) of the Juvenile Justice Act 2015</strong> (Karnataka Directorate of Child Protection) and <strong>Section 80G Form 10AC</strong> approval from the Income Tax Department.
              </p>
              <p>
                <strong>Visiting Hours:</strong> Janaseva Ashrama is open <strong>7 days a week from 10:00 AM to 6:00 PM</strong> in Turahalli, Bangalore South. Donors are welcome to celebrate birthdays, anniversaries, or memorial days by serving meals in person.
              </p>
            </div>
          </div>

          {/* Article Main Body */}
          <article className="bg-white rounded-3xl p-6 md:p-10 border border-stone-200 shadow-sm space-y-8 text-stone-800 leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
                1. The Sacred Tradition of Annadana in Bengaluru
              </h2>
              <p className="mb-4">
                In Indian culture, <em>Annadana</em> (the sacred sharing of food) is revered as <em>Maha Dana</em>—the greatest gift. In a bustling metropolitan city like Bengaluru, thousands of families, professionals, and entrepreneurs celebrate birthdays, wedding anniversaries, job promotions, and memorial days (<em>Pitru Smarana</em>) by nourishing children in need.
              </p>
              <p>
                At <strong>Janaseva Ashrama</strong>, located in Turahalli near Subramanyapura in South Bangalore, 25 young boys (aged 7 to 18) are cared for in a warm, family-style environment. Providing these children with wholesome, hygienic, home-style vegetarian food ensures they possess the physical energy, focus, and emotional security to excel in school and pursue their dreams.
              </p>
            </section>

            {/* Section 2 */}
            <section className="border-t border-stone-100 pt-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
                2. How to Verify a Legitimate Orphanage in Karnataka: 4-Point Checklist
              </h2>
              <p className="mb-4">
                With growing awareness about charitable giving, donors must ensure their contributions reach genuine, government-monitored child care facilities. Before making a donation or booking a visit, verify the following four statutory credentials:
              </p>

              <div className="space-y-4 my-6">
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-stone-900 text-sm md:text-base mb-1">
                    ✓ 1. Juvenile Justice (JJ) Act Registration (Form 28)
                  </h3>
                  <p className="text-xs md:text-sm text-stone-600">
                    Under Indian law, every children's home caring for orphans or vulnerable children must be registered under <strong>Section 41(1) of the Juvenile Justice (Care and Protection of Children) Act, 2015</strong>. Janaseva Ashrama holds official Form 28 Certificate No. <strong>KA18CH0242</strong> issued by the Directorate of Child Protection, Government of Karnataka.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-stone-900 text-sm md:text-base mb-1">
                    ✓ 2. Income Tax Department Section 80G Approval (Form 10AC)
                  </h3>
                  <p className="text-xs md:text-sm text-stone-600">
                    Verify the Unique Registration Number (URN) issued by the Central Board of Direct Taxes. Janaseva Ashrama holds Form 10AC approval with URN <strong>AABTJ7431MF20231</strong>, granting 50% tax deductions on all qualifying donations.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-stone-900 text-sm md:text-base mb-1">
                    ✓ 3. Permanent Account Number (PAN) & Section 12AA Permanent Exemption
                  </h3>
                  <p className="text-xs md:text-sm text-stone-600">
                    The non-profit society must operate with a dedicated PAN card (Janaseva PAN: <strong>AABTJ7431M</strong>) and permanent charitable trust registration under Section 12AA.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <h3 className="font-bold text-stone-900 text-sm md:text-base mb-1">
                    ✓ 4. Ministry of Corporate Affairs CSR-1 Certification
                  </h3>
                  <p className="text-xs md:text-sm text-stone-600">
                    For corporate donors, verify registration on the MCA portal. Janaseva Ashrama holds CSR-1 Certificate No. <strong>CSR00078800</strong> (SRN: SRN-F98737448).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Cost Breakdown */}
            <section className="border-t border-stone-100 pt-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
                3. Cost Breakdown: What Does It Cost to Feed 25 Children in Bangalore?
              </h2>
              <p className="mb-4">
                Transparency is at the heart of our mission. Every rupee donated is directed toward fresh vegetables, grains, milk, lentils, and cooking gas. Here is our transparent donation tier:
              </p>

              <div className="overflow-x-auto my-6">
                <table className="w-full text-left text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-900 font-bold border-b border-stone-300">
                      <th className="p-3">Seva Option</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">What It Covers</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    <tr>
                      <td className="p-3 font-semibold">Single Meal Sponsorship</td>
                      <td className="p-3 text-emerald-800 font-bold">₹100</td>
                      <td className="p-3 text-stone-600">Nutritious meal for 1 child</td>
                      <td className="p-3">
                        <Link href="/donate?amount=100" className="text-emerald-700 font-bold hover:underline">Donate</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Morning Breakfast for 25 Boys</td>
                      <td className="p-3 text-emerald-800 font-bold">₹1,000</td>
                      <td className="p-3 text-stone-600">Hot idli/upma/dosa, sambar, chutney & milk</td>
                      <td className="p-3">
                        <Link href="/donate?amount=1000" className="text-emerald-700 font-bold hover:underline">Donate</Link>
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="p-3 font-semibold">Special Festive Lunch (Payasam Feast)</td>
                      <td className="p-3 text-emerald-800 font-bold">₹1,500</td>
                      <td className="p-3 text-stone-600">Rice, sambar, rasam, curries, papad, sweet Payasam</td>
                      <td className="p-3">
                        <Link href="/donate?amount=1500" className="text-emerald-700 font-bold hover:underline">Donate</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">One Child Full Month Upbringing</td>
                      <td className="p-3 text-emerald-800 font-bold">₹2,500</td>
                      <td className="p-3 text-stone-600">Food, shelter, schooling & medical support for 30 days</td>
                      <td className="p-3">
                        <Link href="/donate?amount=2500" className="text-emerald-700 font-bold hover:underline">Donate</Link>
                      </td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="p-3 font-semibold">Grand Full-Day Annadana (3 Meals + Snacks)</td>
                      <td className="p-3 text-amber-900 font-bold">₹4,500</td>
                      <td className="p-3 text-stone-600">Complete day's nutrition for all 25 boys</td>
                      <td className="p-3">
                        <Link href="/donate?amount=4500" className="text-amber-800 font-bold hover:underline">Donate</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold">Annual School Uniform & Book Kit</td>
                      <td className="p-3 text-stone-900 font-bold">₹3,500</td>
                      <td className="p-3 text-stone-600">Uniforms, textbooks, stationery, school bag & shoes</td>
                      <td className="p-3">
                        <Link href="/donate?amount=3500" className="text-stone-700 font-bold hover:underline">Donate</Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 4: Birthday Celebrations */}
            <section className="border-t border-stone-100 pt-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
                4. Celebrating Birthdays & Anniversaries in Person
              </h2>
              <p className="mb-4">
                Rather than hosting a fleeting restaurant party, hundreds of families across Bangalore visit Janaseva Ashrama to celebrate their milestones. The experience of seeing 25 children sing the birthday song, cut cake together, and chant blessings creates memories that last a lifetime.
              </p>

              <h3 className="text-lg font-bold text-stone-900 mb-2">Visiting Schedule & Protocols:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-stone-700 mb-6">
                <li><strong>Morning Lunch Slot:</strong> 11:30 AM to 1:30 PM (ideal for serving hot lunch).</li>
                <li><strong>Evening Celebration Slot:</strong> 4:30 PM to 6:30 PM (ideal for cake cutting, playtime snacks, and evening prayer).</li>
                <li><strong>What You Can Bring:</strong> Commercially baked cakes (eggless preferred), fresh fruits (bananas, apples, oranges), stationery kits, or drawing books.</li>
                <li><strong>Child Safeguarding:</strong> Respectful family photos cutting the cake and serving food are welcomed. Exploitative filming or photography of distressed personal histories is strictly prohibited.</li>
              </ul>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                <strong>Outstation Donors:</strong> If you reside outside Bangalore or overseas, you can sponsor a feast online. Our caregivers will take photos and record a personalized WhatsApp video of the 25 boys reciting your name and offering prayers on your special day.
              </div>
            </section>

            {/* Section 5: Direct Bank Transfer Details */}
            <section className="border-t border-stone-100 pt-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
                5. Official Charity Bank Account & Payment Methods
              </h2>
              <p className="mb-4">
                Donations can be made securely online via our RBI-authorized Razorpay gateway using UPI (Google Pay, PhonePe, Paytm, Cred) or Debit/Credit cards. For direct NEFT/RTGS/IMPS bank transfers, use the official society account:
              </p>

              <div className="p-6 rounded-2xl bg-stone-900 text-white font-mono text-xs md:text-sm space-y-2">
                <div><span className="text-stone-400">Account Name:</span> {BANK_DETAILS.accountName}</div>
                <div><span className="text-stone-400">Bank:</span> {BANK_DETAILS.bankName}</div>
                <div><span className="text-stone-400">Branch:</span> {BANK_DETAILS.branch} Branch, Bengaluru</div>
                <div><span className="text-stone-400">Account Number:</span> <span className="text-amber-400 font-bold">{BANK_DETAILS.accountNumber}</span></div>
                <div><span className="text-stone-400">IFSC Code:</span> <span className="text-amber-400 font-bold">{BANK_DETAILS.ifscCode}</span></div>
                <div><span className="text-stone-400">Account Type:</span> {BANK_DETAILS.accountType}</div>
              </div>
            </section>

            {/* Section 6: FAQs */}
            <section className="border-t border-stone-100 pt-8">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-6">
                6. Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {ARTICLE_FAQS.map((faq, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                    <h3 className="font-bold text-stone-900 text-sm md:text-base mb-2">{faq.q}</h3>
                    <p className="text-xs md:text-sm text-stone-700 leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Author Credential Card */}
            <div className="border-t border-stone-200 pt-8 mt-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-900 text-white flex items-center justify-center font-serif text-xl font-bold shrink-0">
                SB
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Authored by Sunita Bai</h4>
                <p className="text-xs text-stone-500">
                  Head Caregiver & Matron, Janaseva Ashrama · Over 10 years of dedicated residential child care in Bengaluru.
                </p>
              </div>
            </div>
          </article>

          {/* Bottom Floating CTA */}
          <div className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h3 className="font-bold text-lg font-serif">Ready to sponsor a warm meal?</h3>
              <p className="text-xs text-white/80">Every rupee is accounted for with an instant 80G digital receipt.</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link
                href="/donate"
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold rounded-xl transition text-sm shadow"
              >
                Donate Online
              </Link>
              <Link
                href="/celebrate-birthday"
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition text-sm border border-white/20"
              >
                Book Birthday Visit
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
