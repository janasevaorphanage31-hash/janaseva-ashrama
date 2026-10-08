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
        
        {/* Verified Form 10AC Certificate Summary */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-teal-900/15 bg-white shadow-sm ring-1 ring-teal-900/10">
          <div className="bg-teal-950 px-6 py-4 text-white sm:flex sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/30">
                Income Tax Department · Form No. 10AC
              </span>
              <h3 className="mt-1 font-display text-base font-bold text-white">
                Order for Provisional Approval under Section 80G
              </h3>
            </div>
            <div className="mt-2 sm:mt-0 text-xs text-gold font-mono">
              URN: {FORM_10AC.urn}
            </div>
          </div>

          <div className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-cream p-3">
                <span className="text-[10px] font-bold text-teal-900/60 uppercase block">PAN</span>
                <span className="font-mono font-bold text-sm text-teal-950">{FORM_10AC.pan}</span>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <span className="text-[10px] font-bold text-teal-900/60 uppercase block">Document ID (DIN)</span>
                <span className="font-mono font-bold text-xs text-teal-950 break-all">{FORM_10AC.din}</span>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <span className="text-[10px] font-bold text-teal-900/60 uppercase block">Application No.</span>
                <span className="font-mono font-bold text-xs text-teal-950 break-all">{FORM_10AC.applicationNumber}</span>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <span className="text-[10px] font-bold text-teal-900/60 uppercase block">Assessment Years</span>
                <span className="font-bold text-sm text-teal-950">AY 2024-25 to 2026-27</span>
              </div>
            </div>

            <div className="rounded-xl bg-sand/40 p-4 border border-teal-900/10 text-xs leading-relaxed space-y-1">
              <p><strong>Legal Society Name:</strong> {FORM_10AC.legalName}</p>
              <p><strong>Registered Society Address:</strong> {FORM_10AC.registeredAddress.full}</p>
              <p><strong>Operational Children&apos;s Home:</strong> {FORM_10AC.operationalFacility.name}, {FORM_10AC.operationalFacility.address}</p>
              <p><strong>Approval Code:</strong> {FORM_10AC.section}</p>
            </div>

            <p className="text-teal-950/75 leading-relaxed pt-1">
              {TAX_NOTE}
            </p>

            {/* Official Charity Bank Details for Direct Audit & Transfers */}
            <div className="mt-3 rounded-2xl bg-teal-950 text-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-800 pb-2.5">
                <span className="font-display font-bold text-sm text-gold">
                  Official Charity Bank Account (Direct NEFT / IMPS / RTGS)
                </span>
                <span className="rounded bg-teal-800/80 px-2 py-0.5 text-[10px] font-bold text-teal-200">
                  Axis Bank · Banashankari Branch
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/60 block">A/c Holder Name</span>
                  <span className="font-bold text-white leading-snug">{BANK_DETAILS.accountName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/60 block">Bank &amp; Branch</span>
                  <span className="font-bold text-white">{BANK_DETAILS.bankName} ({BANK_DETAILS.branch})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gold block">Account Number</span>
                  <span className="font-mono font-bold text-sm text-white">{BANK_DETAILS.accountNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gold block">IFSC Code</span>
                  <span className="font-mono font-bold text-sm text-white">{BANK_DETAILS.ifscCode}</span>
                </div>
              </div>
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
