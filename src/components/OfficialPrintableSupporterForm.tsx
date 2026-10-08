"use client";

import React from "react";
import { formatINR } from "@/lib/site";
import { SUPPORTER_CATEGORIES, OFFICIAL_FORM_META } from "@/lib/supporter-form";
import { numberToIndianWords } from "@/lib/number-words";

interface PrintableFormProps {
  formData?: {
    donorName?: string;
    donorDob?: string;
    donorAddress?: string;
    donorMobile?: string;
    donorEmail?: string;
    selectedTiers?: { categoryId: string; optionId: string }[];
    totalAmount?: number;
    amountInWords?: string;
    collectionMode?: "office" | "residence" | "ashrama" | "online" | "bank_transfer";
    receiptNo?: string;
    refSign?: string;
    date?: string;
  };
  isPrintOnly?: boolean;
}

export function OfficialPrintableSupporterForm({ formData, isPrintOnly = false }: PrintableFormProps) {
  const isFilled = !!formData?.donorName;
  const total = formData?.totalAmount || 0;
  const inWords = formData?.amountInWords || (total > 0 ? numberToIndianWords(total) : "");
  const today = formData?.date || new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const renderBoxes = (text = "", count = 28) => {
    const chars = text.toUpperCase().split("").slice(0, count);
    const boxes = [];
    for (let i = 0; i < count; i++) {
      boxes.push(
        <span
          key={i}
          className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center border border-gray-400 text-xs font-mono font-bold text-gray-900 bg-white"
        >
          {chars[i] || ""}
        </span>
      );
    }
    return <div className="flex flex-wrap gap-1">{boxes}</div>;
  };

  const isOptionSelected = (catId: string, optId: string) => {
    return formData?.selectedTiers?.some((t) => t.categoryId === catId && t.optionId === optId);
  };

  return (
    <div className={`mx-auto bg-white text-black font-sans leading-tight print:p-0 print:border-none print:shadow-none ${isPrintOnly ? "" : "p-6 sm:p-10 rounded-2xl shadow-xl border-4 border-gray-900 max-w-4xl"}`}>
      {/* DOUBLE BORDER WRAPPER TO MATCH ORIGINAL SCANNED PAPER */}
      <div className="border-2 border-black p-4 sm:p-6 print:border-2 print:p-4">
        {/* HEADER BAR */}
        <div className="flex justify-between items-center text-[11px] sm:text-xs font-semibold tracking-wide border-b border-black pb-2 mb-3">
          <span>{OFFICIAL_FORM_META.regd1}</span>
          <span className="text-center font-bold text-teal-900 text-xs sm:text-sm">GOVT REGD NO. KA18CH0242 · 80G FORM 10AC TAX EXEMPT</span>
          <span>{OFFICIAL_FORM_META.regd2}</span>
        </div>

        {/* ORGANIZATION NAME */}
        <div className="text-center my-3">
          <h1 className="font-bold text-base sm:text-xl uppercase tracking-wider text-black">
            {OFFICIAL_FORM_META.societyName}
          </h1>
          <div className="inline-block mt-1.5 px-6 py-1 border-2 border-black rounded-lg">
            <span className="font-extrabold text-sm sm:text-lg uppercase tracking-widest text-black">
              {OFFICIAL_FORM_META.kendraName}
            </span>
          </div>
          <p className="mt-2 text-[11px] sm:text-xs font-medium text-gray-800">
            PHONE: <span className="font-bold font-mono">9945223232, 9980359595</span>
          </p>
          <p className="text-[10px] sm:text-xs font-medium text-gray-700">
            Email: <span className="font-mono">janasevaorphanage@gmail.com</span> | Website: <span className="font-mono font-bold">www.janasevaashrama.org</span>
          </p>
        </div>

        {/* SUPPORTERS FORM BADGE */}
        <div className="text-center my-4">
          <span className="inline-block px-8 py-1.5 border-2 border-black rounded-md font-extrabold text-sm sm:text-base uppercase tracking-widest bg-gray-50">
            {OFFICIAL_FORM_META.formTitle}
          </span>
        </div>

        {/* DATE */}
        <div className="flex justify-end items-center mb-4 text-xs font-bold">
          <span>Date:</span>
          <span className="ml-2 px-3 py-1 border-b-2 border-black font-mono min-w-[120px] text-center">
            {today}
          </span>
        </div>

        {/* DONOR FIELDS WITH BOX GRIDS (EXACT SCAN LAYOUT) */}
        <div className="space-y-3 text-xs font-bold text-black mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="w-44 shrink-0 uppercase tracking-wide">DONOR NAME:</span>
            <div className="flex-1">{renderBoxes(formData?.donorName, 26)}</div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="w-44 shrink-0 uppercase tracking-wide">DONOR DATE OF BIRTH:</span>
            <div className="flex-1">{renderBoxes(formData?.donorDob, 10)}</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3">
            <span className="w-44 shrink-0 uppercase tracking-wide pt-1">RESIDENTIAL / OFFICE ADDRESS:</span>
            <div className="flex-1 space-y-1">
              <div>{renderBoxes(formData?.donorAddress?.slice(0, 26) || "", 26)}</div>
              <div>{renderBoxes(formData?.donorAddress?.slice(26, 52) || "", 26)}</div>
              <div>{renderBoxes(formData?.donorAddress?.slice(52, 78) || "", 26)}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="w-44 shrink-0 uppercase tracking-wide">MOBILE:</span>
            <div className="flex-1">{renderBoxes(formData?.donorMobile, 14)}</div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <span className="w-44 shrink-0 uppercase tracking-wide">EMAIL ID:</span>
            <div className="flex-1">{renderBoxes(formData?.donorEmail, 26)}</div>
          </div>
        </div>

        {/* SECTION: YES/ WOULD LIKE TO SUPPORT FOR A */}
        <div className="mt-6 mb-2">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-black mb-2">
            Yes/ Would like to support for a:
          </h2>

          {/* 5-ROW TABLE EXACT MATCH */}
          <div className="border-2 border-black overflow-x-auto text-[11px] sm:text-xs">
            <table className="w-full border-collapse">
              <tbody>
                {SUPPORTER_CATEGORIES.map((cat) => (
                  <tr key={cat.id} className="border-b border-black last:border-b-0 divide-x divide-black">
                    {/* Category Title Column */}
                    <td className="p-2 sm:p-2.5 font-bold w-5/12 bg-gray-50/50">
                      <span>{cat.index}) {cat.title}</span>
                    </td>

                    {/* 3 Option Columns */}
                    {cat.options.map((opt) => {
                      const selected = isOptionSelected(cat.id, opt.id);
                      return (
                        <td
                          key={opt.id}
                          className={`p-2 sm:p-2.5 text-center font-bold transition ${selected ? "bg-emerald-100 font-extrabold" : ""}`}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`inline-block w-4 h-4 border border-black text-center leading-3 font-bold text-xs ${selected ? "bg-black text-white" : "bg-white"}`}>
                              {selected ? "✓" : ""}
                            </span>
                            <span className="font-mono text-xs sm:text-sm">{opt.amount}</span>
                            <span className="text-[10px] sm:text-xs font-normal text-gray-700 ml-1">
                              ({opt.label.replace(`(${cat.title})`, "").trim()})
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTAL SUM LINE */}
        <div className="my-5 p-3 border-2 border-black bg-gray-50/40 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-bold">
          <div className="flex items-center gap-2">
            <span>And I will pay sum Rs.</span>
            <span className="px-3 py-1 bg-white border-2 border-black font-mono font-extrabold text-base min-w-[100px] text-center">
              {total > 0 ? formatINR(total) : "__________"}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 sm:ml-4">
            <span className="shrink-0">Rupees:</span>
            <span className="border-b border-black flex-1 font-serif italic text-xs sm:text-sm text-gray-900 pb-0.5">
              {inWords || "................................................................................................"}
            </span>
          </div>
        </div>

        {/* COLLECTION PLACE / PAYMENT MODE */}
        <div className="my-4 text-xs font-bold">
          <span className="block mb-2 uppercase tracking-wide">Collection place payment mode:</span>
          <div className="flex flex-wrap gap-4 sm:gap-8 items-center pl-1">
            {[
              { id: "office", label: "Office" },
              { id: "residence", label: "Residence" },
              { id: "ashrama", label: "Ashrama" },
              { id: "online", label: "Online Account" },
            ].map((mode) => {
              const checked = formData?.collectionMode === mode.id || (mode.id === "online" && formData?.collectionMode === "bank_transfer");
              return (
                <div key={mode.id} className="flex items-center gap-2">
                  <span>{mode.label}</span>
                  <span className={`inline-block w-6 h-6 border-2 border-black text-center leading-5 font-bold ${checked ? "bg-black text-white" : "bg-white"}`}>
                    {checked ? "✓" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SIGNATURE ROW */}
        <div className="mt-8 pt-4 border-t border-black grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold text-center">
          <div>
            <div className="h-10 border-b border-black flex items-end justify-center pb-1 font-serif italic">
              {formData?.donorName ? `${formData.donorName.slice(0, 16)}` : ""}
            </div>
            <span className="block mt-1">Donor Signature</span>
          </div>
          <div>
            <div className="h-10 border-b border-black flex items-end justify-center pb-1 font-mono text-[11px]">
              {formData?.receiptNo || ""}
            </div>
            <span className="block mt-1">Receipt No</span>
          </div>
          <div>
            <div className="h-10 border-b border-black flex items-end justify-center pb-1 text-[11px]">
              {formData?.collectionMode || ""}
            </div>
            <span className="block mt-1">Cash / Cheque</span>
          </div>
          <div>
            <div className="h-10 border-b border-black flex items-end justify-center pb-1 font-serif italic">
              {formData?.refSign || "Janaseva Ashrama"}
            </div>
            <span className="block mt-1">Ref. Sign</span>
          </div>
        </div>

        {/* SLOGAN FOOTER */}
        <div className="text-center mt-6 pt-3 border-t-2 border-black">
          <p className="font-extrabold text-xs sm:text-sm tracking-widest uppercase text-black">
            {OFFICIAL_FORM_META.slogan}
          </p>
        </div>
      </div>
    </div>
  );
}
