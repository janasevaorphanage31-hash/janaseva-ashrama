"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Chip, Container, Head, Section } from "../ui";
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
  previewImage: string;
  regNumber: string;
  regLabel: string;
  validity: string;
  benefit: string;
  pdfUrl: string;
  pdfBtnText: string;
  colorScheme: string;
}

const OFFICIAL_ACCREDITATIONS: OfficialAccreditation[] = [
  {
    id: "form-28",
    formName: "Form 28 (JJ Act)",
    authority: "Directorate of Child Protection, Karnataka",
    authorityBadge: "Govt of Karnataka",
    title: "Child Care Institution Registration",
    previewImage: "/media/excellence-certificates.jpg",
    regLabel: "Registration No",
    regNumber: "KA18CH0242",
    validity: "5 Years (2025 to 2030) · Form 28 Verified",
    benefit: "Legal residential home license for 25 boys",
    pdfUrl: "/documents/jj-act-child-care-institution-registration-form-28.pdf",
    pdfBtnText: "View Form 28 PDF (JJ Act)",
    colorScheme: "border-emerald-600/30 text-emerald-800 bg-emerald-50/50",
  },
  {
    id: "form-10ac",
    formName: "Form 10AC (Section 80G)",
    authority: "Principal Commissioner of Income Tax",
    authorityBadge: "Income Tax Dept",
    title: "Section 80G Tax Exemption Approval",
    previewImage: "/media/documents-preview.jpg",
    regLabel: "Provisional URN",
    regNumber: FORM_10AC.urn,
    validity: `AY 2024-25 to 2026-27 · DIN: ${FORM_10AC.din}`,
    benefit: "50% Tax Deduction on all donor gifts",
    pdfUrl: "/documents/form-10ac-80g-approval.pdf",
    pdfBtnText: "View Form 10AC PDF (80G)",
    colorScheme: "border-amber-500/40 text-amber-900 bg-amber-50/50",
  },
  {
    id: "csr-1",
    formName: "Form CSR-1 (MCA)",
    authority: "Ministry of Corporate Affairs (ROC-Delhi)",
    authorityBadge: "MCA Govt of India",
    title: "Corporate CSR Registration Approval",
    previewImage: "/media/poster.jpg",
    regLabel: "CSR Reg Number",
    regNumber: "CSR00078800",
    validity: "Approved 17-09-2024 · SRN-F98737448",
    benefit: "Eligible for Corporate CSR grants (Sec 135)",
    pdfUrl: "/documents/mca-csr-1-registration-certificate.pdf",
    pdfBtnText: "View MCA CSR-1 PDF",
    colorScheme: "border-blue-600/30 text-blue-900 bg-blue-50/50",
  },
  {
    id: "section-12aa",
    formName: "Section 12AA",
    authority: "CIT (Exemptions) Bangalore",
    authorityBadge: "Ministry of Finance",
    title: "12AA Income Tax Registration Order",
    previewImage: "/media/learning.jpg",
    regLabel: "Registration Order",
    regNumber: "ITBA/EXM/S/12AA/2018-19",
    validity: "Registered AY 2018-19 onwards (Permanent)",
    benefit: "100% Tax-Exempt Charitable Trust Status",
    pdfUrl: "/documents/section-12aa-registration-certificate.pdf",
    pdfBtnText: "View Section 12AA PDF",
    colorScheme: "border-purple-600/30 text-purple-900 bg-purple-50/50",
  },
  {
    id: "pan-card",
    formName: "Permanent A/c Number",
    authority: "Income Tax PAN Services Unit, NSDL",
    authorityBadge: "Govt of India",
    title: "Income Tax PAN Card Registration",
    previewImage: "/media/hero.jpg",
    regLabel: "Society PAN",
    regNumber: FORM_10AC.pan,
    validity: "Constituted 02/04/2013 (13+ Years Active)",
    benefit: "Verified Public Charitable Entity",
    pdfUrl: "/documents/society-pan-card.pdf",
    pdfBtnText: "View Society PAN Card",
    colorScheme: "border-teal-700/30 text-teal-900 bg-teal-50/50",
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
              Every registration, government order, and tax exemption is open for public inspection. Inspect authentic government certificates below.
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

        {/* ── USER-FRIENDLY ACCREDITATION DISPLAY (CAROUSEL OR GRID) ── */}
        <div className="relative w-full">
          {viewMode === "carousel" ? (
            <>
              {/* Horizontal Moving Track: Touch-friendly swipe with kinetic snap */}
              <div
                ref={scrollRef}
                onScroll={handleTrackScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 no-scrollbar scrollbar-none items-stretch"
              >
                {OFFICIAL_ACCREDITATIONS.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="snap-center shrink-0 w-[86vw] max-w-[340px] md:w-[340px] rounded-3xl bg-white border border-teal-900/15 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                  >
                    <div>
                      {/* VISUAL AT TOP: Document Seal / Thumbnail Header */}
                      <div className="relative aspect-[16/10] w-full bg-teal-950 overflow-hidden">
                        <Image
                          src={doc.previewImage}
                          alt={doc.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500 opacity-90"
                          sizes="(max-width: 640px) 85vw, 340px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-black/25 to-transparent" />

                        {/* Government Seal Badge */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                          <span className="rounded-lg bg-teal-950/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gold shadow-xs">
                            Doc 0{idx + 1}
                          </span>
                          <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase text-teal-900 shadow-xs">
                            {doc.formName}
                          </span>
                        </div>

                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 z-10 font-bold">
                          <span className="truncate">{doc.authorityBadge}</span>
                          <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[9px] text-emerald-300">✓ Verified</span>
                        </div>
                      </div>

                      {/* TEXT DETAILS DOWN BELOW (Donor Psychology) */}
                      <div className="p-5">
                        <h3 className="font-display text-base sm:text-lg font-bold text-teal-950 leading-snug">
                          {doc.title}
                        </h3>
                        <p className="text-xs text-teal-900/60 font-semibold mt-0.5">
                          {doc.authority}
                        </p>

                        {/* Certificate Credentials Box */}
                        <div className="mt-3.5 space-y-1.5 rounded-2xl bg-cream/70 p-3.5 border border-teal-900/10 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-950/60 uppercase">{doc.regLabel}:</span>
                            <span className="font-mono font-bold text-teal-900 truncate max-w-[170px]">{doc.regNumber}</span>
                          </div>
                          <div className="text-[11px] text-teal-950/75">
                            <strong>Validity:</strong> {doc.validity}
                          </div>
                          <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 pt-1 border-t border-teal-900/5">
                            <span>★</span>
                            <span>{doc.benefit}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PDF ACTION DOWN BELOW */}
                    <div className="p-5 pt-0">
                      <a
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring tap-scale flex w-full items-center justify-center gap-1.5 rounded-2xl bg-teal-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-950 transition cursor-pointer"
                      >
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
                Swipe horizontally ↔ or tap dots to inspect all 5 official government accreditations
              </p>
            </>
          ) : (
            /* Responsive Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch animate-fadeIn">
              {OFFICIAL_ACCREDITATIONS.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="rounded-3xl bg-white border border-teal-900/15 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* VISUAL AT TOP: Document Seal / Thumbnail Header */}
                    <div className="relative aspect-[16/10] w-full bg-teal-950 overflow-hidden">
                      <Image
                        src={doc.previewImage}
                        alt={doc.title}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500 opacity-90"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-teal-950/90 via-black/25 to-transparent" />

                      {/* Government Seal Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <span className="rounded-lg bg-teal-950/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gold shadow-xs">
                          Doc 0{idx + 1}
                        </span>
                        <span className="rounded-lg bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase text-teal-900 shadow-xs">
                          {doc.formName}
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 z-10 font-bold">
                        <span className="truncate">{doc.authorityBadge}</span>
                        <span className="rounded bg-emerald-500/30 px-1.5 py-0.5 text-[9px] text-emerald-300">✓ Verified</span>
                      </div>
                    </div>

                    {/* TEXT DETAILS DOWN BELOW */}
                    <div className="p-5">
                      <h3 className="font-display text-base sm:text-lg font-bold text-teal-950 leading-snug">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-teal-900/60 font-semibold mt-0.5">
                        {doc.authority}
                      </p>

                      {/* Certificate Credentials Box */}
                      <div className="mt-3.5 space-y-1.5 rounded-2xl bg-cream/70 p-3.5 border border-teal-900/10 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-teal-950/60 uppercase">{doc.regLabel}:</span>
                          <span className="font-mono font-bold text-teal-900 truncate max-w-[170px]">{doc.regNumber}</span>
                        </div>
                        <div className="text-[11px] text-teal-950/75">
                          <strong>Validity:</strong> {doc.validity}
                        </div>
                        <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 pt-1 border-t border-teal-900/5">
                          <span>★</span>
                          <span>{doc.benefit}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF ACTION DOWN BELOW */}
                  <div className="p-5 pt-0">
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring tap-scale flex w-full items-center justify-center gap-1.5 rounded-2xl bg-teal-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-teal-950 transition cursor-pointer"
                    >
                      <span>{doc.pdfBtnText}</span>
                      <span>↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trust Summary Banner */}
        <div className="mt-8 rounded-3xl bg-teal-950 p-5 sm:p-6 text-white shadow-md border border-teal-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none" aria-hidden="true">📜</span>
            <div>
              <p className="font-display text-base font-bold text-gold">
                100% Tax Deductible Under Section 80G
              </p>
              <p className="text-xs text-white/80">
                All Indian taxpayers are eligible for a 50% deduction under Section 80G of the Income Tax Act. Instant receipt issued upon payment.
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
