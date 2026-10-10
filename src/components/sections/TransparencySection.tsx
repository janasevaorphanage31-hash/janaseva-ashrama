"use client";

import { useRef, useState } from "react";
import { Chip, Container, Section } from "../ui";
import { FORM_10AC } from "@/lib/site";

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

interface OfficialAccreditation {
  id: string;
  formName: string;
  authority: string;
  authorityBadge: string;
  title: string;
  emblem: string;
  regNumber: string;
  regLabel: string;
  validity: string;
  benefit: string;
  pdfUrl: string;
  pdfBtnText: string;
  accentColor: string;
  tagColor: string;
}

const OFFICIAL_ACCREDITATIONS: OfficialAccreditation[] = [
  {
    id: "form-28",
    formName: "Form 28 (JJ Act)",
    authority: "Directorate of Child Protection, Karnataka",
    authorityBadge: "Govt of Karnataka",
    title: "Child Care Institution Registration",
    emblem: "🏛️",
    regLabel: "Registration No",
    regNumber: "KA18CH0242",
    validity: "5 Years (2025 to 2030) · Form 28 Verified",
    benefit: "Legal residential home license for 25 boys",
    pdfUrl: "/documents/jj-act-child-care-institution-registration-form-28.pdf",
    pdfBtnText: "View Form 28 PDF (JJ Act)",
    accentColor: "border-emerald-600/30 bg-emerald-50/60 text-emerald-950",
    tagColor: "bg-emerald-600 text-white",
  },
  {
    id: "form-10ac",
    formName: "Form 10AC (Section 80G)",
    authority: "Principal Commissioner of Income Tax",
    authorityBadge: "Income Tax Dept · Govt of India",
    title: "Section 80G Tax Exemption Approval",
    emblem: "📜",
    regLabel: "Provisional URN",
    regNumber: FORM_10AC.urn,
    validity: `AY 2024-25 to 2026-27 · DIN: ${FORM_10AC.din}`,
    benefit: "50% Tax Deduction on all donor gifts under IT Act",
    pdfUrl: "/documents/form-10ac-80g-approval.pdf",
    pdfBtnText: "View Form 10AC PDF (80G)",
    accentColor: "border-amber-500/40 bg-amber-50/60 text-amber-950",
    tagColor: "bg-saffron text-white",
  },
  {
    id: "csr-1",
    formName: "Form CSR-1 (MCA)",
    authority: "Ministry of Corporate Affairs (ROC-Delhi)",
    authorityBadge: "MCA Govt of India",
    title: "Corporate CSR Registration Approval",
    emblem: "⚖️",
    regLabel: "CSR Reg Number",
    regNumber: "CSR00078800",
    validity: "Approved 17-09-2024 · SRN-F98737448",
    benefit: "Eligible for Corporate CSR grants (Sec 135)",
    pdfUrl: "/documents/mca-csr-1-registration-certificate.pdf",
    pdfBtnText: "View MCA CSR-1 PDF",
    accentColor: "border-blue-600/30 bg-blue-50/60 text-blue-950",
    tagColor: "bg-blue-600 text-white",
  },
  {
    id: "section-12aa",
    formName: "Section 12AA",
    authority: "CIT (Exemptions) Bangalore",
    authorityBadge: "Ministry of Finance",
    title: "12AA Income Tax Registration Order",
    emblem: "🛡️",
    regLabel: "Registration Order",
    regNumber: "ITBA/EXM/S/12AA/2018-19",
    validity: "Registered AY 2018-19 onwards (Permanent)",
    benefit: "100% Tax-Exempt Charitable Trust Status",
    pdfUrl: "/documents/section-12aa-registration-certificate.pdf",
    pdfBtnText: "View Section 12AA PDF",
    accentColor: "border-purple-600/30 bg-purple-50/60 text-purple-950",
    tagColor: "bg-purple-700 text-white",
  },
  {
    id: "pan-card",
    formName: "Society PAN",
    authority: "Income Tax PAN Services Unit, NSDL",
    authorityBadge: "Govt of India",
    title: "Income Tax PAN Card Registration",
    emblem: "💳",
    regLabel: "Society PAN",
    regNumber: FORM_10AC.pan,
    validity: "Constituted 02/04/2013 (13+ Years Active)",
    benefit: "Verified Public Charitable Entity",
    pdfUrl: "/documents/society-pan-card.pdf",
    pdfBtnText: "View Society PAN Card",
    accentColor: "border-teal-700/30 bg-teal-50/60 text-teal-950",
    tagColor: "bg-teal-800 text-white",
  },
];

export function TransparencySection({
  docs,
  standalone = false,
}: {
  docs: Doc[];
  standalone?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [activeIdx, setActiveIdx] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const dynamicAccreditations = OFFICIAL_ACCREDITATIONS.map((acc) => {
    const matchingDoc = docs?.find((d) => {
      const t = (d.title || "").toLowerCase();
      if (acc.id === "form-10ac" && (t.includes("10ac") || t.includes("80g"))) return true;
      if (acc.id === "form-28" && (t.includes("form 28") || t.includes("jj act") || t.includes("child care"))) return true;
      if (acc.id === "csr-1" && (t.includes("csr-1") || t.includes("csr"))) return true;
      if (acc.id === "section-12aa" && t.includes("12aa")) return true;
      if (acc.id === "pan-card" && (t.includes("pan") || t.includes("account number"))) return true;
      return false;
    });
    if (matchingDoc && matchingDoc.fileUrl) {
      return {
        ...acc,
        pdfUrl: matchingDoc.fileUrl,
      };
    }
    return acc;
  });

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 320;
      const scrollAmount = direction === "left" ? -(cardWidth + 20) : (cardWidth + 20);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const scrollToIndex = (idx: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 320;
      scrollRef.current.scrollTo({ left: idx * (cardWidth + 20), behavior: "smooth" });
      setActiveIdx(idx);
    }
  };

  const handleTrackScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 320;
      const newIdx = Math.round(scrollLeft / (cardWidth + 20));
      setActiveIdx(Math.min(Math.max(newIdx, 0), OFFICIAL_ACCREDITATIONS.length - 1));
    }
  };

  const copyRegNumber = (id: string, num: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <Section id="transparency" tone="white" className="py-12 md:py-16 overflow-hidden">
      <Container>
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-2">
          <Chip tone="teal">Verified Legal Accreditations</Chip>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-teal-950 leading-tight">
              Trust Should Be Visible
            </h2>
            <p className="mt-2 text-sm sm:text-base text-teal-950/75 leading-relaxed">
              Every registration, government order, and tax exemption is open for public inspection. Inspect authentic government certificates and statutory credentials below.
            </p>
          </div>

          {/* Navigation Controls & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-end shrink-0">
            {/* View Switcher: Carousel vs Grid */}
            <div className="inline-flex rounded-2xl bg-sand/60 p-1 border border-teal-900/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode("carousel")}
                className={`rounded-xl px-3 py-1.5 transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "carousel"
                    ? "bg-teal-900 text-white shadow-xs"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                <span>↔</span>
                <span>Horizontal Swipe</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`rounded-xl px-3 py-1.5 transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-teal-900 text-white shadow-xs"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
              >
                <span>⊞</span>
                <span>Grid View</span>
              </button>
            </div>

            {/* Carousel Arrow Buttons */}
            {viewMode === "carousel" && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  aria-label="Scroll left"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/70 text-teal-950 hover:bg-teal-900 hover:text-white transition shadow-xs cursor-pointer"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  aria-label="Scroll right"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/70 text-teal-950 hover:bg-teal-900 hover:text-white transition shadow-xs cursor-pointer"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── HIGH-TRUST ACCREDITATION DISPLAY (WITHOUT UNWANTED IMAGES) ── */}
        <div className="relative w-full">
          {viewMode === "carousel" ? (
            <>
              {/* Horizontal Moving Track: Touch-friendly swipe with kinetic snap */}
              <div
                ref={scrollRef}
                onScroll={handleTrackScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar scrollbar-none items-stretch"
              >
                {dynamicAccreditations.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="snap-center shrink-0 w-[88vw] max-w-[360px] md:w-[350px] rounded-3xl bg-white border border-teal-900/15 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* OFFICIAL GOVERNMENT CERTIFICATE EMBLEM HEADER */}
                      <div className="p-5 pb-4 bg-gradient-to-br from-sand/50 via-cream to-white border-b border-teal-900/10">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl select-none" aria-hidden="true">{doc.emblem}</span>
                            <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${doc.tagColor}`}>
                              {doc.formName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300/60 px-2 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Verified</span>
                          </div>
                        </div>

                        <h3 className="font-display text-lg font-bold text-teal-950 leading-tight">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-teal-900/70 font-semibold mt-1">
                          {doc.authority}
                        </p>
                      </div>

                      {/* STATUTORY REGISTRATION CREDENTIALS */}
                      <div className="p-5 space-y-3.5">
                        {/* Number Display Box with Copy Button */}
                        <div className="rounded-2xl bg-cream/70 p-3.5 border border-teal-900/10">
                          <div className="flex items-center justify-between text-[10px] font-bold text-teal-950/60 uppercase tracking-wider mb-1">
                            <span>{doc.regLabel}:</span>
                            <button
                              type="button"
                              onClick={() => copyRegNumber(doc.id, doc.regNumber)}
                              className="text-saffron-dark font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                              title="Copy Registration Number"
                            >
                              <span>{copiedId === doc.id ? "✓ Copied" : "📋 Copy"}</span>
                            </button>
                          </div>
                          <p className="font-mono text-sm sm:text-base font-black text-teal-950 tracking-wider break-all select-all">
                            {doc.regNumber}
                          </p>
                        </div>

                        {/* Validity & Legal Scope */}
                        <div className="text-xs space-y-1.5 text-teal-950/80">
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-teal-900 shrink-0">Validity:</span>
                            <span className="text-teal-950/90">{doc.validity}</span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="font-bold text-teal-900 shrink-0">Authority:</span>
                            <span className="text-teal-950/90">{doc.authorityBadge}</span>
                          </div>
                        </div>

                        {/* Legal Benefit Tag */}
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 text-xs font-bold text-amber-950 flex items-center gap-2">
                          <span className="text-amber-600 text-sm">★</span>
                          <span className="leading-snug">{doc.benefit}</span>
                        </div>
                      </div>
                    </div>

                    {/* DIRECT PDF VIEW ACTION */}
                    <div className="p-5 pt-0">
                      <a
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-950 transition cursor-pointer"
                      >
                        <span aria-hidden="true">📄</span>
                        <span>{doc.pdfBtnText}</span>
                        <span>↗</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Pagination Dots for Horizontal Carousel */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {OFFICIAL_ACCREDITATIONS.map((doc, idx) => (
                  <button
                    key={`dot-${doc.id}`}
                    type="button"
                    onClick={() => scrollToIndex(idx)}
                    aria-label={`Jump to ${doc.formName}`}
                    className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                      activeIdx === idx
                        ? "w-7 bg-teal-900"
                        : "w-2.5 bg-teal-900/20 hover:bg-teal-900/40"
                    }`}
                  />
                ))}
              </div>

              <p className="text-center text-[11px] text-teal-950/60 mt-1.5">
                Swipe horizontally ↔ or tap dots to inspect all 5 statutory government accreditations
              </p>
            </>
          ) : (
            /* Responsive Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch animate-fadeIn">
              {dynamicAccreditations.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-3xl bg-white border border-teal-900/15 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* OFFICIAL GOVERNMENT CERTIFICATE EMBLEM HEADER */}
                    <div className="p-5 pb-4 bg-gradient-to-br from-sand/50 via-cream to-white border-b border-teal-900/10">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl select-none" aria-hidden="true">{doc.emblem}</span>
                          <span className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${doc.tagColor}`}>
                            {doc.formName}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300/60 px-2 py-0.5 rounded-full">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Verified</span>
                        </div>
                      </div>

                      <h3 className="font-display text-lg font-bold text-teal-950 leading-tight">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-teal-900/70 font-semibold mt-1">
                        {doc.authority}
                      </p>
                    </div>

                    {/* STATUTORY REGISTRATION CREDENTIALS */}
                    <div className="p-5 space-y-3.5">
                      {/* Number Display Box with Copy Button */}
                      <div className="rounded-2xl bg-cream/70 p-3.5 border border-teal-900/10">
                        <div className="flex items-center justify-between text-[10px] font-bold text-teal-950/60 uppercase tracking-wider mb-1">
                          <span>{doc.regLabel}:</span>
                          <button
                            type="button"
                            onClick={() => copyRegNumber(doc.id, doc.regNumber)}
                            className="text-saffron-dark font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                            title="Copy Registration Number"
                          >
                            <span>{copiedId === doc.id ? "✓ Copied" : "📋 Copy"}</span>
                          </button>
                        </div>
                        <p className="font-mono text-sm sm:text-base font-black text-teal-950 tracking-wider break-all select-all">
                          {doc.regNumber}
                        </p>
                      </div>

                      {/* Validity & Legal Scope */}
                      <div className="text-xs space-y-1.5 text-teal-950/80">
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-teal-900 shrink-0">Validity:</span>
                          <span className="text-teal-950/90">{doc.validity}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="font-bold text-teal-900 shrink-0">Authority:</span>
                          <span className="text-teal-950/90">{doc.authorityBadge}</span>
                        </div>
                      </div>

                      {/* Legal Benefit Tag */}
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-2.5 text-xs font-bold text-amber-950 flex items-center gap-2">
                        <span className="text-amber-600 text-sm">★</span>
                        <span className="leading-snug">{doc.benefit}</span>
                      </div>
                    </div>
                  </div>

                  {/* DIRECT PDF VIEW ACTION */}
                  <div className="p-5 pt-0">
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring tap-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-950 transition cursor-pointer"
                    >
                      <span aria-hidden="true">📄</span>
                      <span>{doc.pdfBtnText}</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ALL PUBLISHED AUDIT & POLICY DOCUMENTS FROM DATABASE ── */}
        {docs && docs.length > 0 && (
          <div className="mt-10 rounded-3xl bg-sand/35 border border-teal-900/10 p-6 sm:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-teal-900/10 pb-4">
              <div>
                <span className="inline-block rounded-md bg-teal-900/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-teal-900 tracking-wider">
                  Live Public Registry
                </span>
                <h3 className="font-display text-xl font-bold text-teal-950 mt-1">
                  Official Documents, Policies &amp; Audit Records ({docs.length})
                </h3>
                <p className="text-xs text-teal-950/70">
                  Direct official copies filed with regulatory authorities and registered under the Public Trusts Act.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {docs.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl bg-white p-4 border border-teal-900/10 shadow-xs flex flex-col justify-between hover:shadow-md transition gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-cream px-2 py-0.5 text-[10px] font-bold text-teal-900 uppercase">
                        {d.category || "Governance"}
                      </span>
                      {d.version && (
                        <span className="text-[10px] text-teal-900/60 font-mono">
                          {d.version}
                        </span>
                      )}
                    </div>
                    <h4 className="font-display text-sm font-bold text-teal-950 leading-snug">
                      {d.title}
                    </h4>
                    {d.note && (
                      <p className="text-xs text-teal-900/70 leading-relaxed">
                        {d.note}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-teal-900/5 flex items-center justify-between">
                    <span className="text-[10px] text-teal-900/50">
                      {d.publishedOn ? `Date: ${d.publishedOn}` : "Verified Document"}
                    </span>
                    {d.fileUrl ? (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-teal-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-950 transition shadow-xs"
                      >
                        <span>View Document PDF</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-[11px] font-semibold text-teal-900/60">
                        Available on Campus
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trust Summary Banner */}
        <div className="mt-8 rounded-3xl bg-teal-950 p-5 sm:p-6 text-white shadow-md border border-teal-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none" aria-hidden="true">📜</span>
            <div>
              <p className="font-display text-base font-bold text-gold">
                100% Tax Deductible Under Section 80G
              </p>
              <p className="text-xs text-white/80">
                All Indian taxpayers are eligible for a 50% deduction under Section 80G of the Income Tax Act (URN: {FORM_10AC.urn}). Instant certificate receipt issued upon donation.
              </p>
            </div>
          </div>
          <a
            href="/documents/form-10ac-80g-approval.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-teal-950 hover:bg-gold/90 transition shrink-0"
          >
            Download 80G Certificate PDF →
          </a>
        </div>
      </Container>
    </Section>
  );
}
