import Link from "next/link";
import { Chip, Container, Head, Section } from "../ui";
import { BANK_DETAILS, FORM_10AC, TAX_NOTE } from "@/lib/site";

type Doc = {
  id: number;
  title: string;
  category: string;
  version: string | null;
  publishedOn: string | null;
  fileUrl: string | null;
  note: string | null;
  status: string;
};

export function TransparencySection({ docs, standalone = false }: { docs: Doc[]; standalone?: boolean }) {
  const categories = Array.from(new Set(docs.map((d) => d.category)));
  return (
    <Section id="transparency" tone="white">
      <Container>
        <Head
          eyebrow="Transparency"
          title="Trust should be visible"
          lead="Registration, governance, policies and reports are listed clearly. Each document includes name, publication date and version."
        />
        
        {/* 5-Pillar Government Registration & Credential Verification Hub */}
        <div className="mb-10 space-y-6">
          <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-800">Verified Legal Framework</span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-teal-950 mt-1">
                Official Government Accreditations &amp; Registrations
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-600/20">
              ✓ 100% Verified &amp; Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. JJ Act Child Care Institution Registration */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-emerald-700/20 bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md bg-emerald-600/15 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-600/30">
                    Govt of Karnataka
                  </span>
                  <span className="font-mono text-[11px] font-bold text-teal-900">Form 28</span>
                </div>
                <h4 className="font-display text-base font-bold text-teal-950 leading-snug">
                  Child Care Institution Registration (JJ Act 2015)
                </h4>
                <p className="mt-1 text-xs text-teal-900/60 font-semibold">
                  Directorate of Child Protection, Karnataka
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl bg-cream p-3 text-xs">
                  <p><strong>Reg No:</strong> <span className="font-mono font-bold text-teal-950">KA18CH0242</span></p>
                  <p><strong>Capacity:</strong> <span className="font-bold text-emerald-800">25 Children</span> (Boys, Age 07-18)</p>
                  <p><strong>Validity:</strong> 5 Years (From 27/03/2025 to 2030)</p>
                  <p><strong>Facility:</strong> Children Home for Boys, Thurahalli, Bangalore South</p>
                </div>
              </div>
              <a
                href="/documents/jj-act-child-care-institution-registration-form-28.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
              >
                <span>View Form 28 PDF (JJ Act)</span>
                <span>↗</span>
              </a>
            </div>

            {/* 2. Form 10AC Section 80G Approval */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-gold/40 bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md bg-gold/25 px-2.5 py-1 text-[11px] font-bold text-amber-900 ring-1 ring-amber-600/30">
                    Income Tax Dept
                  </span>
                  <span className="font-mono text-[11px] font-bold text-teal-900">Form 10AC</span>
                </div>
                <h4 className="font-display text-base font-bold text-teal-950 leading-snug">
                  Section 80G Tax Exemption Approval
                </h4>
                <p className="mt-1 text-xs text-teal-900/60 font-semibold">
                  Principal Commissioner of Income Tax
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl bg-cream p-3 text-xs">
                  <p><strong>URN:</strong> <span className="font-mono font-bold text-teal-950 break-all">{FORM_10AC.urn}</span></p>
                  <p><strong>DIN:</strong> <span className="font-mono text-[11px] text-teal-950 break-all">{FORM_10AC.din}</span></p>
                  <p><strong>Valid Assessment Years:</strong> AY 2024-25 to 2026-27</p>
                  <p><strong>Donor Benefit:</strong> <span className="font-bold text-emerald-800">50% Tax Deduction</span> on all contributions</p>
                </div>
              </div>
              <a
                href="/documents/form-10ac-80g-approval.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
              >
                <span>View Form 10AC PDF (80G)</span>
                <span>↗</span>
              </a>
            </div>

            {/* 3. Ministry of Corporate Affairs CSR-1 Approval */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-teal-800/20 bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md bg-blue-600/15 px-2.5 py-1 text-[11px] font-bold text-blue-900 ring-1 ring-blue-600/30">
                    Ministry of Corporate Affairs
                  </span>
                  <span className="font-mono text-[11px] font-bold text-teal-900">Form CSR-1</span>
                </div>
                <h4 className="font-display text-base font-bold text-teal-950 leading-snug">
                  CSR Registration Approval for Entities
                </h4>
                <p className="mt-1 text-xs text-teal-900/60 font-semibold">
                  Office of Registrar of Companies (ROC-Delhi)
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl bg-cream p-3 text-xs">
                  <p><strong>CSR Reg No:</strong> <span className="font-mono font-bold text-teal-950">CSR00078800</span></p>
                  <p><strong>Application Ref:</strong> <span className="font-mono text-[11px] text-teal-950">SRN-F98737448</span></p>
                  <p><strong>Approval Date:</strong> 17-09-2024</p>
                  <p><strong>Corporate Scope:</strong> Qualified under Section 135 Companies Act 2013</p>
                </div>
              </div>
              <a
                href="/documents/mca-csr-1-registration-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
              >
                <span>View MCA CSR-1 PDF</span>
                <span>↗</span>
              </a>
            </div>

            {/* 4. Section 12AA Registration Order */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-teal-800/20 bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md bg-purple-600/15 px-2.5 py-1 text-[11px] font-bold text-purple-900 ring-1 ring-purple-600/30">
                    CIT (Exemptions) Bangalore
                  </span>
                  <span className="font-mono text-[11px] font-bold text-teal-900">Section 12AA</span>
                </div>
                <h4 className="font-display text-base font-bold text-teal-950 leading-snug">
                  12AA Income Tax Registration Order
                </h4>
                <p className="mt-1 text-xs text-teal-900/60 font-semibold">
                  Ministry of Finance, Govt of India
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl bg-cream p-3 text-xs">
                  <p><strong>Order No:</strong> <span className="font-mono text-[11px] text-teal-950 break-all">ITBA/EXM/S/12AA/2018-19/1012296034(1)</span></p>
                  <p><strong>Reg No:</strong> <span className="font-mono text-[11px] text-teal-950">CIT(EXEMPTIONS) BANGALORE/12AA/2018-19/A/10403</span></p>
                  <p><strong>Order Date:</strong> 18/09/2018 (AY 2018-19 onwards)</p>
                  <p><strong>Status:</strong> 100% Tax-Exempt Charitable Trust u/s 11 &amp; 12</p>
                </div>
              </div>
              <a
                href="/documents/section-12aa-registration-certificate.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
              >
                <span>View Section 12AA PDF</span>
                <span>↗</span>
              </a>
            </div>

            {/* 5. Income Tax Permanent Account Number (PAN Card) */}
            <div className="flex flex-col justify-between rounded-3xl border-2 border-teal-800/20 bg-white p-5 shadow-sm ring-1 ring-teal-900/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md bg-emerald-600/15 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-600/30">
                    Govt of India
                  </span>
                  <span className="font-mono text-[11px] font-bold text-teal-900">PAN Card</span>
                </div>
                <h4 className="font-display text-base font-bold text-teal-950 leading-snug">
                  Income Tax Permanent Account Number
                </h4>
                <p className="mt-1 text-xs text-teal-900/60 font-semibold">
                  Income Tax PAN Services Unit, NSDL
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl bg-cream p-3 text-xs">
                  <p><strong>PAN:</strong> <span className="font-mono font-bold text-base text-teal-950">{FORM_10AC.pan}</span></p>
                  <p><strong>Constituted:</strong> 02/04/2013 (Over 13 years active)</p>
                  <p><strong>Entity:</strong> JANA SEVA SAMRUDDI EDUCATION &amp; RURAL DEV SOC R</p>
                  <p><strong>Jurisdiction:</strong> Bangalore, Karnataka</p>
                </div>
              </div>
              <a
                href="/documents/society-pan-card.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-sm"
              >
                <span>View PAN Card PDF</span>
                <span>↗</span>
              </a>
            </div>

            {/* 6. Official Society Bank Account (Direct Transfers) */}
            <div className="flex flex-col justify-between rounded-3xl bg-teal-950 p-5 text-white shadow-sm ring-1 ring-teal-900/10">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md bg-gold/25 px-2.5 py-1 text-[11px] font-bold text-gold ring-1 ring-gold/40">
                    Axis Bank Verified
                  </span>
                  <span className="text-[11px] text-teal-300">Banashankari</span>
                </div>
                <h4 className="font-display text-base font-bold text-white leading-snug">
                  Charity Bank Account (NEFT / IMPS / RTGS)
                </h4>
                <p className="mt-1 text-xs text-teal-200">
                  Direct Bank Contributions &amp; CSR Allocations
                </p>
                <div className="mt-3 space-y-1.5 rounded-xl bg-white/10 p-3 text-xs backdrop-blur">
                  <p><span className="text-white/60">A/c Name:</span> <span className="font-bold text-white">{BANK_DETAILS.accountName}</span></p>
                  <p><span className="text-gold">A/c No:</span> <span className="font-mono font-bold text-sm text-white">{BANK_DETAILS.accountNumber}</span></p>
                  <p><span className="text-gold">IFSC:</span> <span className="font-mono font-bold text-sm text-white">{BANK_DETAILS.ifscCode}</span></p>
                  <p><span className="text-white/60">Branch:</span> <span className="text-white">{BANK_DETAILS.branch}, Bangalore</span></p>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-white/70 leading-relaxed">
                Direct transfers generate verified 80G tax receipts upon sharing receipt to WhatsApp or email.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 font-display text-lg font-bold text-teal-900">{cat}</h3>
              <ul className="divide-y divide-teal-900/10 overflow-hidden rounded-2xl bg-cream ring-1 ring-teal-900/10">
                {docs.filter((d) => d.category === cat).map((d) => {
                  const published = d.status === "published";
                  return (
                    <li key={d.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-teal-900">{d.title}</p>
                        <p className="mt-0.5 text-xs text-teal-950/60">
                          Published: {d.publishedOn ? new Date(d.publishedOn).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "date to be confirmed"}
                          {" · "}Version: {d.version ?? "-"}
                        </p>
                        {d.note && !published && <p className="mt-1 text-xs text-teal-950/55">{d.note}</p>}
                      </div>
                      {published && d.fileUrl ? (
                        <a href={d.fileUrl} className="focus-ring shrink-0 rounded-xl bg-teal-800 px-4 py-2 text-center text-xs font-bold text-white" target="_blank" rel="noopener">View PDF</a>
                      ) : (
                        <Chip tone="orange">Pending publication</Chip>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 w-full min-w-0">
          {[
            {
              title: "Payments",
              desc: "Verified on our server with the gateway, including amount. Duplicate payments are blocked.",
              icon: (
                <svg className="w-6 h-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
            },
            {
              title: "Donor privacy",
              desc: "Donor details are never shown publicly. Campaigns show only supporter counts.",
              icon: (
                <svg className="w-6 h-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
            {
              title: "Safeguarding",
              desc: "Child media is published only with documented consent and review, and can be taken down.",
              icon: (
                <svg className="w-6 h-6 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-teal-100 p-4">
              <div className="mb-2">{item.icon}</div>
              <p className="font-display font-bold text-teal-900">{item.title}</p>
              <p className="mt-1 text-xs text-teal-950/70">{item.desc}</p>
            </div>
          ))}
        </div>
        {!standalone && <Link href="/transparency" className="mt-5 inline-block text-sm font-semibold text-teal-800 underline">Full transparency page</Link>}
      </Container>
    </Section>
  );
}
