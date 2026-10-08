import type { Metadata } from "next";
import { Container, PageHero, Section } from "@/components/ui";
import { CorporateFormClient } from "@/components/CorporateFormClient";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Corporate & CSR Partnerships · Janaseva Ashrama Bangalore",
  description:
    "CSR partnerships, employee volunteering days, payroll giving, and verified impact reporting with Janaseva Ashrama. Form 10AC 80G tax benefit.",
  alternates: {
    canonical: `${SITE.url}/corporate`,
  },
};

export default function CorporatePage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Corporate & CSR" }]} />
      <PageHero
        eyebrow="Corporate impact"
        title="Bring your team. Build something measurable."
        lead="CSR can be a project, a volunteering day, a team campaign or a combination. Tell us what your organisation wants to make possible."
      />
      <Section tone="cream">
        <Container className="max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["CSR projects", "Sponsor a defined programme or approved project."],
              ["Employee volunteering", "Create a volunteering day around teaching, skills, events or approved media work."],
              ["Team Impact", "Set a shared goal and let employees contribute through one campaign."],
              ["Impact reporting", "Receive reporting based on verified platform and project records."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl bg-white p-6 ring-1 ring-teal-900/10">
                <h2 className="font-display text-2xl font-bold text-teal-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-teal-950/70">{body}</p>
              </div>
            ))}
          </div>

          {/* Official MCA CSR-1 & Regulatory Compliance Credentials */}
          <div className="mt-8 rounded-3xl border-2 border-emerald-800/20 bg-white p-6 shadow-sm ring-1 ring-teal-900/10">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
              <div>
                <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-600/30">
                  Ministry of Corporate Affairs · Government of India
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-teal-950">
                  CSR Compliance &amp; Statutory Accreditations
                </h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                ✓ Ready for CSR Section 135 Grants
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-2xl bg-cream p-3 border border-teal-900/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60 block">MCA Form CSR-1</span>
                <span className="font-mono font-bold text-sm text-teal-950 block mt-0.5">CSR00078800</span>
                <span className="text-[10px] text-teal-950/60">ROC-Delhi Approved</span>
              </div>

              <div className="rounded-2xl bg-cream p-3 border border-teal-900/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60 block">Section 80G (10AC)</span>
                <span className="font-mono font-bold text-xs text-teal-950 block mt-0.5 break-all">AABTJ7431MF20231</span>
                <span className="text-[10px] text-teal-950/60">50% Tax Deduction</span>
              </div>

              <div className="rounded-2xl bg-cream p-3 border border-teal-900/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60 block">JJ Act Registration</span>
                <span className="font-mono font-bold text-sm text-teal-950 block mt-0.5">KA18CH0242</span>
                <span className="text-[10px] text-teal-950/60">Capacity: 25 Children</span>
              </div>

              <div className="rounded-2xl bg-cream p-3 border border-teal-900/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900/60 block">Society PAN</span>
                <span className="font-mono font-bold text-sm text-teal-950 block mt-0.5">AABTJ7431M</span>
                <span className="text-[10px] text-teal-950/60">Est. 02/04/2013</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-teal-900/10">
              <span className="text-[11px] font-bold text-teal-900/70 uppercase block mb-2">
                Download Official Due Diligence Documents (PDF):
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href="/documents/mca-csr-1-registration-certificate.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-3.5 py-2 font-bold text-white hover:bg-teal-950 transition shadow-xs"
                >
                  <span>📄 MCA CSR-1 Certificate (CSR00078800)</span>
                  <span>↗</span>
                </a>
                <a
                  href="/documents/form-10ac-80g-approval.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-900/20 bg-white px-3.5 py-2 font-bold text-teal-900 hover:bg-gold/20 transition shadow-xs"
                >
                  <span>📄 Form 10AC Section 80G Order</span>
                  <span>↗</span>
                </a>
                <a
                  href="/documents/jj-act-child-care-institution-registration-form-28.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-900/20 bg-white px-3.5 py-2 font-bold text-teal-900 hover:bg-gold/20 transition shadow-xs"
                >
                  <span>📄 Govt JJ Act Form 28 (KA18CH0242)</span>
                  <span>↗</span>
                </a>
                <a
                  href="/documents/section-12aa-registration-certificate.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-900/20 bg-white px-3.5 py-2 font-bold text-teal-900 hover:bg-gold/20 transition shadow-xs"
                >
                  <span>📄 Section 12AA Exemption Order</span>
                  <span>↗</span>
                </a>
                <a
                  href="/documents/society-pan-card.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-900/20 bg-white px-3.5 py-2 font-bold text-teal-900 hover:bg-gold/20 transition shadow-xs"
                >
                  <span>📄 Society PAN Card</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          <CorporateFormClient />
        </Container>
      </Section>
    </>
  );
}
