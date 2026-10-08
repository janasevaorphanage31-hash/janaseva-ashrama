"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR, BANK_DETAILS, SITE } from "@/lib/site";
import { SUPPORTER_CATEGORIES, OFFICIAL_FORM_META } from "@/lib/supporter-form";
import { numberToIndianWords } from "@/lib/number-words";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePan,
  sanitizePan,
  NAME_REGEX,
  PAN_REGEX,
} from "@/lib/validation";
import { OfficialPrintableSupporterForm } from "./OfficialPrintableSupporterForm";

function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if ((window as any).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function SupporterFormClient() {
  const router = useRouter();

  // Selected tiers: array of { categoryId, optionId }
  const [selectedTiers, setSelectedTiers] = useState<{ categoryId: string; optionId: string }[]>([
    { categoryId: "food_one_day", optionId: "all_children" }, // Default selection: 4500 (One Day Food for all)
  ]);
  const [customAmount, setCustomAmount] = useState<string>("");

  // Donor Details
  const [donor, setDonor] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    address: "",
    pan: "",
  });

  // Collection Mode
  const [collectionMode, setCollectionMode] = useState<"online" | "bank_transfer" | "residence" | "office" | "ashrama">("online");
  const [refSign, setRefSign] = useState("");
  const [notes, setNotes] = useState("");

  // UI States
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showBlankPrintModal, setShowBlankPrintModal] = useState(false);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // Success Confirmation State (for offline / bank transfer pledges)
  const [pledgeResult, setPledgeResult] = useState<{
    referenceNo: string;
    publicId: string;
    amount: number;
    amountInWords: string;
    donorName: string;
    donorPhone: string;
    collectionMode: string;
  } | null>(null);

  const formUrl = typeof window !== "undefined"
    ? `${window.location.origin}/supporter-form`
    : `${SITE.url || "https://www.janasevaashrama.org"}/supporter-form`;

  // Calculate Total
  const calculateTotal = () => {
    let sum = 0;
    for (const sel of selectedTiers) {
      const cat = SUPPORTER_CATEGORIES.find((c) => c.id === sel.categoryId);
      const opt = cat?.options.find((o) => o.id === sel.optionId);
      if (opt) sum += opt.amount;
    }
    const custom = Math.floor(Number(customAmount) || 0);
    if (custom > 0) sum += custom;
    return sum;
  };

  const totalAmount = calculateTotal();
  const totalAmountWords = numberToIndianWords(totalAmount);

  // Toggle or select option in a category
  const handleSelectOption = (categoryId: string, optionId: string) => {
    setSelectedTiers((prev) => {
      const existingIndex = prev.findIndex((t) => t.categoryId === categoryId);
      if (existingIndex >= 0) {
        // If clicking same option, allow unchecking only if more than 1 total selection or custom amount
        if (prev[existingIndex].optionId === optionId) {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
        // Replace with new option in this category
        const updated = [...prev];
        updated[existingIndex] = { categoryId, optionId };
        return updated;
      }
      return [...prev, { categoryId, optionId }];
    });
  };

  const isOptionSelected = (categoryId: string, optionId: string) => {
    return selectedTiers.some((t) => t.categoryId === categoryId && t.optionId === optionId);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(formUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyBank = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedBankField(field);
      setTimeout(() => setCopiedBankField(null), 2500);
    }
  };

  // WhatsApp share link to send to donors
  const shareWhatsAppMessage = `Namaste! Janaseva Ashrama (Makkala Ashraya Kendra) invites your kind support for our 25 resident children. You can sponsor daily meals, clothes, or schooling with 80G tax exemption.

Please fill our official Supporter Form online here:
${formUrl}

Bank Account: Axis Bank Banashankari, A/c: 913020019616990, IFSC: UTIB0000102.
For queries, call: 9980359595 / 9945223232.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Validate Donor Name
    const nameRes = validateName(donor.name);
    if (!nameRes.valid) {
      setErrorMessage(nameRes.error || "Please enter a valid donor name.");
      return;
    }

    // Validate Phone
    const phoneRes = validatePhone(donor.phone);
    if (!phoneRes.valid) {
      setErrorMessage(phoneRes.error || "Please enter a valid phone number.");
      return;
    }

    // Validate Email if provided
    if (donor.email) {
      const emailRes = validateEmail(donor.email, false);
      if (!emailRes.valid) {
        setErrorMessage(emailRes.error || "Please enter a valid email address.");
        return;
      }
    }

    // Validate PAN if provided
    if (donor.pan) {
      const panRes = validatePan(donor.pan, false);
      if (!panRes.valid) {
        setErrorMessage(panRes.error || "Please enter a valid PAN card number.");
        return;
      }
    }

    // Validate Amount
    if (totalAmount < 10) {
      setErrorMessage("Please select at least one support tier or enter a contribution amount (minimum ₹10).");
      return;
    }

    setBusy(true);

    try {
      const idempotencyKey = `sup_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await fetch("/api/supporter-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donor: {
            name: donor.name.trim(),
            phone: donor.phone.trim(),
            email: donor.email.trim(),
            dob: donor.dob,
            address: donor.address.trim(),
            pan: sanitizePan(donor.pan),
          },
          selectedTiers,
          customAmount: Math.floor(Number(customAmount) || 0),
          collectionMode,
          refSign: refSign.trim(),
          notes: notes.trim(),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Unable to submit supporter form. Please try again.");
      }

      // If offline / bank transfer / cash collection pledge:
      if (data.status === "pledged" || data.collectionMode !== "online") {
        setPledgeResult({
          referenceNo: data.referenceNo,
          publicId: data.publicId,
          amount: data.amount,
          amountInWords: data.amountInWords,
          donorName: data.donorName,
          donorPhone: data.donorPhone,
          collectionMode: data.collectionMode,
        });
        setBusy(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // If Demo mode (local or Razorpay not configured)
      if (data.mode === "demo") {
        router.push(`/receipt/${data.publicId}`);
        return;
      }

      // If Online Payment via Razorpay
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        throw new Error("Unable to load secure payment window. Please check your internet connection.");
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount * 100,
        currency: "INR",
        name: "Janaseva Ashrama",
        description: `Supporter Form: ${totalAmountWords}`,
        image: "/logo/janaseva-logo.png",
        order_id: data.orderId,
        prefill: {
          name: donor.name,
          email: donor.email || "donor@janasevaashrama.org",
          contact: donor.phone,
        },
        theme: { color: "#06312f" },
        handler: async function (paymentResponse: any) {
          try {
            const verifyRes = await fetch("/api/donations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                publicId: data.publicId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });
            const vData = await verifyRes.json();
            if (verifyRes.ok && vData.ok) {
              router.push(`/receipt/${data.publicId}`);
            } else {
              router.push(`/receipt/${data.publicId}`);
            }
          } catch {
            router.push(`/receipt/${data.publicId}`);
          }
        },
        modal: {
          ondismiss: function () {
            setBusy(false);
          },
        },
      });

      rzp.open();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* TOP HERO & SHARING TOOLBAR */}
        <div className="mb-6 rounded-3xl bg-teal-950 p-6 text-white shadow-xl ring-1 ring-white/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3.5 py-1 text-xs font-bold text-gold ring-1 ring-gold/30">
                <span>📋 Official Janaseva NGO Form</span>
                <span>·</span>
                <span>Form 10AC 80G Tax Exempt</span>
              </div>
              <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-white">
                Official Supporter Form
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-teal-200/90 max-w-2xl">
                Send this link directly to donors, patrons, and well-wishers to support food, clothes, or schooling for 25 children at Makkala Ashraya Kendra.
              </p>
            </div>

            {/* QUICK ACTIONS BUTTONS */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* WhatsApp Share Button */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareWhatsAppMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition active:scale-95"
              >
                <span>💬 Send to Donor on WhatsApp</span>
              </a>

              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2.5 text-xs font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition active:scale-95"
              >
                <span>{copiedLink ? "✓ Link Copied!" : "🔗 Copy Form Link"}</span>
              </button>

              {/* Show QR Code */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2.5 text-xs font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition active:scale-95"
              >
                <span>📱 Scan QR Code</span>
              </button>

              {/* Print Blank Form */}
              <button
                type="button"
                onClick={() => setShowBlankPrintModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-teal-950 shadow-md hover:bg-gold-light transition active:scale-95"
              >
                <span>🖨️ Print Blank Paper Form</span>
              </button>
            </div>
          </div>
        </div>

        {/* PLEDGE CONFIRMATION BANNER (IF JUST SUBMITTED OFFLINE) */}
        {pledgeResult && (
          <div className="mb-8 rounded-3xl bg-emerald-900 text-white p-6 sm:p-8 shadow-2xl ring-2 ring-emerald-500/50 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white text-2xl">
                ✓
              </div>
              <div className="flex-1">
                <span className="inline-block rounded-md bg-emerald-800 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Supporter Form Pledge Confirmed
                </span>
                <h2 className="mt-2 text-2xl font-bold font-display text-white">
                  Thank You, {pledgeResult.donorName}!
                </h2>
                <p className="mt-1 text-sm text-emerald-100">
                  Your pledge of <strong className="text-gold font-mono">{formatINR(pledgeResult.amount)}</strong> ({pledgeResult.amountInWords}) has been successfully recorded in our Ashrama donor register.
                </p>

                <div className="mt-4 rounded-2xl bg-emerald-950/70 p-4 border border-emerald-700/50 text-xs sm:text-sm space-y-1.5 font-mono">
                  <div><strong>Reference No:</strong> <span className="text-gold font-bold">{pledgeResult.referenceNo}</span></div>
                  <div><strong>Collection Mode:</strong> <span className="uppercase text-emerald-300 font-bold">{pledgeResult.collectionMode}</span></div>
                  <div><strong>Helpline:</strong> +91 9980359595 / +91 9945223232</div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`https://wa.me/919980359595?text=${encodeURIComponent(
                      `Namaste Janaseva Ashrama! I have submitted the official Supporter Form with Reference: ${pledgeResult.referenceNo} for Rs.${pledgeResult.amount} (${pledgeResult.donorName}, Phone: ${pledgeResult.donorPhone}, Mode: ${pledgeResult.collectionMode}). Kindly confirm receipt.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-emerald-900 shadow hover:bg-emerald-50 transition"
                  >
                    <span>💬 Notify Ashrama on WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white ring-1 ring-white/20 hover:bg-emerald-700 transition"
                  >
                    <span>🖨️ Print Official Supporter Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPledgeResult(null)}
                    className="inline-flex items-center gap-2 rounded-xl bg-transparent px-4 py-2.5 text-xs font-bold text-emerald-200 hover:text-white transition"
                  >
                    <span>Fill Another Form</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MAIN DIGITAL SUPPORTER FORM CONTAINER */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. AUTHENTIC FORM HEADER CARD */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
            <div className="flex flex-wrap justify-between items-center text-[11px] font-bold text-teal-900/70 pb-3 border-b border-teal-900/10 gap-2">
              <span>{OFFICIAL_FORM_META.regd1}</span>
              <span className="text-center font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-900/10">
                GOVT REGD: KA18CH0242 · SECTION 80G APPROVAL: AABTJ7431MF20231
              </span>
              <span>{OFFICIAL_FORM_META.regd2}</span>
            </div>

            <div className="text-center my-4">
              <h2 className="font-extrabold text-lg sm:text-2xl uppercase tracking-wider text-teal-950 font-display">
                {OFFICIAL_FORM_META.societyName}
              </h2>
              <div className="inline-block mt-2 px-5 py-1 bg-teal-900 text-white rounded-xl shadow-xs">
                <span className="font-bold text-sm sm:text-base uppercase tracking-widest">
                  {OFFICIAL_FORM_META.kendraName}
                </span>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-teal-900/80">
                Phone: <strong className="font-mono">9945223232, 9980359595</strong> · Email: <strong className="font-mono">janasevaorphanage@gmail.com</strong>
              </p>
              <p className="text-xs text-teal-900/70">
                Facility Address: #27, Gundu Thopu Turahalli, Subramanyapura, Bangalore - 560061
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-center justify-between">
              <div>
                <strong>✨ 100% Verified Allocation:</strong> All donations are eligible for a <strong>50% Income Tax Exemption under Section 80G</strong> (Form 10AC). Instant digital receipts are issued immediately.
              </div>
              <div className="hidden sm:block font-bold text-amber-950 shrink-0 ml-4">
                25 Children
              </div>
            </div>
          </div>

          {/* 2. CHOOSE SUPPORT / SPONSORSHIP TIERS (THE 5 OFFICIAL CATEGORIES) */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Step 1 of 3</span>
                <h2 className="text-xl sm:text-2xl font-bold font-display text-teal-950">
                  Yes / Would like to support for a:
                </h2>
                <p className="text-xs sm:text-sm text-teal-950/70">
                  Select one or more sponsorship areas from our official Supporter Form:
                </p>
              </div>
            </div>

            {/* 5 CATEGORIES GRID */}
            <div className="space-y-4">
              {SUPPORTER_CATEGORIES.map((cat) => {
                const hasSelectedInCat = selectedTiers.some((t) => t.categoryId === cat.id);

                return (
                  <div
                    key={cat.id}
                    className={`rounded-2xl p-4 sm:p-5 transition border-2 ${
                      hasSelectedInCat
                        ? "border-teal-900 bg-teal-50/40 shadow-sm"
                        : "border-teal-900/10 bg-cream/30 hover:border-teal-900/25"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-900 text-white text-xl">
                          {cat.icon}
                        </span>
                        <div>
                          <h3 className="font-bold text-base sm:text-lg text-teal-950">
                            {cat.index}) {cat.title}
                          </h3>
                          <p className="text-xs text-teal-900/60 font-medium">
                            {cat.kannadaTitle} · {cat.desc}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3 OPTION PILL BUTTONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      {cat.options.map((opt) => {
                        const selected = isOptionSelected(cat.id, opt.id);

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(cat.id, opt.id)}
                            className={`flex flex-col p-3 rounded-xl text-left border-2 transition active:scale-98 ${
                              selected
                                ? "border-teal-900 bg-teal-900 text-white shadow-md ring-2 ring-teal-900/20"
                                : "border-teal-900/15 bg-white text-teal-950 hover:bg-cream hover:border-teal-900/30"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-bold ${selected ? "text-teal-100" : "text-teal-900"}`}>
                                {opt.label}
                              </span>
                              <span className={`font-mono text-sm sm:text-base font-extrabold ${selected ? "text-gold" : "text-teal-950"}`}>
                                {formatINR(opt.amount)}
                              </span>
                            </div>
                            {opt.subLabel && (
                              <span className={`text-[11px] mt-1 ${selected ? "text-teal-200" : "text-teal-950/60"}`}>
                                {opt.subLabel}
                              </span>
                            )}
                            {opt.isPopular && (
                              <span className={`inline-block mt-2 self-start rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                selected ? "bg-gold text-teal-950" : "bg-teal-100 text-teal-900"
                              }`}>
                                Form Standard
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CUSTOM AMOUNT OPTION */}
            <div className="mt-4 rounded-2xl border-2 border-dashed border-teal-900/20 bg-cream/40 p-4 sm:p-5">
              <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1.5">
                Or Enter Custom Supporter Contribution (₹):
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-teal-900">₹</span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="e.g. 5000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/20 bg-white py-2.5 pl-8 pr-4 text-sm font-bold text-teal-950 outline-none focus:border-teal-900"
                />
              </div>
            </div>

            {/* REAL-TIME TOTAL SUM BANNER (MIRRORING PHYSICAL FORM) */}
            <div className="mt-6 rounded-2xl bg-teal-950 p-5 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  And I will pay sum Rs. (Total Selected)
                </span>
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-gold">
                  {formatINR(totalAmount)}
                </span>
              </div>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-teal-100">
                <span className="font-bold text-white shrink-0">In Words (Rupees):</span>
                <span className="italic font-serif text-teal-200">
                  {totalAmountWords}
                </span>
              </div>
            </div>
          </div>

          {/* 3. DONOR INFORMATION */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Step 2 of 3</span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-teal-950 mb-1">
              Donor Information
            </h2>
            <p className="text-xs sm:text-sm text-teal-950/70 mb-6">
              Enter your details to generate your official receipt and 80G tax certificate:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Donor Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  Donor Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={donor.name}
                  onChange={(e) => setDonor({ ...donor, name: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white"
                />
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  Mobile Number (10 Digits) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={donor.phone}
                  onChange={(e) => setDonor({ ...donor, phone: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white font-mono"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  Email ID (For Digital 80G Receipt)
                </label>
                <input
                  type="email"
                  placeholder="e.g. donor@example.com"
                  value={donor.email}
                  onChange={(e) => setDonor({ ...donor, email: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white"
                />
              </div>

              {/* Date of Birth / Special Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  Donor Date of Birth / Special Occasion Date
                </label>
                <input
                  type="date"
                  value={donor.dob}
                  onChange={(e) => setDonor({ ...donor, dob: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white"
                />
                <span className="block mt-1 text-[11px] text-teal-950/60">
                  Optional: Birthday, Anniversary, or Remembrance date.
                </span>
              </div>

              {/* PAN Card */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  PAN Card Number (For 80G Tax Exemption)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={donor.pan}
                  onChange={(e) => setDonor({ ...donor, pan: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white uppercase font-mono"
                />
                <span className="block mt-1 text-[11px] text-teal-950/60">
                  Required for Form 10BE filing with Income Tax Department.
                </span>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  Residential / Office Address
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Flat 302, Green Glen Layout, Bellandur, Bangalore - 560103"
                  value={donor.address}
                  onChange={(e) => setDonor({ ...donor, address: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white"
                />
              </div>

              {/* Reference / Introduced By */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-teal-900 mb-1">
                  Introduced By / Ref. Sign (Volunteer / Staff Name)
                </label>
                <input
                  type="text"
                  placeholder="Optional: Volunteer or coordinator who introduced Janaseva"
                  value={refSign}
                  onChange={(e) => setRefSign(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/20 bg-cream/30 p-3 text-sm font-semibold text-teal-950 outline-none focus:border-teal-900 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 4. PAYMENT MODE & COLLECTION PLACE */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-teal-900/10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">Step 3 of 3</span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-teal-950 mb-1">
              Collection Place & Payment Mode
            </h2>
            <p className="text-xs sm:text-sm text-teal-950/70 mb-4">
              Choose how you would like to complete your contribution:
            </p>

            {/* PAYMENT MODE TABS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[
                {
                  id: "online",
                  title: "Online Account (Instant)",
                  badge: "Fastest · Instant 80G",
                  desc: "UPI, GPay, PhonePe, Paytm, Debit/Credit Card, Net Banking",
                  icon: "💳",
                },
                {
                  id: "bank_transfer",
                  title: "Direct Bank Transfer",
                  badge: "Axis Bank NEFT / IMPS",
                  desc: "Direct charity account transfer with instant reference",
                  icon: "🏦",
                },
                {
                  id: "residence",
                  title: "Cash / Cheque Collection",
                  badge: "Pickup / At Ashrama",
                  desc: "Schedule doorstep collection or hand over at Ashrama",
                  icon: "💵",
                },
              ].map((tab) => {
                const active = collectionMode === tab.id || (tab.id === "residence" && ["office", "ashrama"].includes(collectionMode));

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCollectionMode(tab.id as any)}
                    className={`flex flex-col p-4 rounded-2xl text-left border-2 transition ${
                      active
                        ? "border-teal-900 bg-teal-50 shadow-md ring-2 ring-teal-900/20"
                        : "border-teal-900/15 bg-white hover:bg-cream hover:border-teal-900/30"
                    }`}
                  >
                    <span className="text-2xl mb-2">{tab.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      {tab.title}
                    </span>
                    <span className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-max">
                      {tab.badge}
                    </span>
                    <span className="mt-2 text-xs text-teal-950/70">
                      {tab.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* DETAIL VIEW BASED ON PAYMENT MODE */}
            {collectionMode === "online" && (
              <div className="rounded-2xl bg-teal-900 text-white p-5 border border-teal-800">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      Instant 128-bit Encrypted Payment
                    </h3>
                    <p className="text-xs text-teal-200 mt-0.5">
                      Clicking &ldquo;Proceed to Pay Online&rdquo; opens the secure checkout window supporting Google Pay, PhonePe, Paytm, all UPI apps, Cards & NetBanking. Your 80G tax receipt is issued automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {collectionMode === "bank_transfer" && (
              <div className="rounded-2xl bg-teal-950 text-white p-5 sm:p-6 border border-teal-800 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-800 pb-3">
                  <div>
                    <h3 className="font-bold text-gold text-sm sm:text-base">
                      Official Charity Axis Bank Account
                    </h3>
                    <p className="text-xs text-teal-200">
                      Transfer directly via your banking app (NEFT / IMPS / RTGS):
                    </p>
                  </div>
                  <span className="rounded bg-teal-800 px-2.5 py-1 text-[11px] font-bold text-teal-200">
                    Axis Bank
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-teal-900/80 border border-teal-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-white/60 block">A/c Holder Name</span>
                      <span className="font-bold text-white text-xs">{BANK_DETAILS.accountName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyBank(BANK_DETAILS.accountName, "name")}
                      className="text-[10px] font-bold px-2 py-1 bg-teal-800 text-teal-200 rounded hover:bg-teal-700"
                    >
                      {copiedBankField === "name" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-900/80 border border-teal-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gold block">Account Number</span>
                      <span className="font-mono font-bold text-sm text-white">{BANK_DETAILS.accountNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyBank(BANK_DETAILS.accountNumber, "acc")}
                      className="text-[10px] font-bold px-2 py-1 bg-teal-800 text-teal-200 rounded hover:bg-teal-700"
                    >
                      {copiedBankField === "acc" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-900/80 border border-teal-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gold block">IFSC Code</span>
                      <span className="font-mono font-bold text-sm text-white">{BANK_DETAILS.ifscCode}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyBank(BANK_DETAILS.ifscCode, "ifsc")}
                      className="text-[10px] font-bold px-2 py-1 bg-teal-800 text-teal-200 rounded hover:bg-teal-700"
                    >
                      {copiedBankField === "ifsc" ? "✓ Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-900/80 border border-teal-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-white/60 block">Branch</span>
                      <span className="font-bold text-white">{BANK_DETAILS.branch}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-teal-200/80 italic">
                  Note: After transferring, you can notify our staff on WhatsApp at 9980359595 with your transaction reference (UTR) to instantly receive your stamped 80G receipt.
                </p>
              </div>
            )}

            {["residence", "office", "ashrama"].includes(collectionMode) && (
              <div className="rounded-2xl bg-cream p-5 border border-teal-900/15 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wide text-teal-900 block">
                  Select Collection Place:
                </span>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "residence", label: "🏡 Pickup at Residence" },
                    { id: "office", label: "🏢 Pickup at Office" },
                    { id: "ashrama", label: "🛕 Hand-over directly at Ashrama (Turahalli)" },
                  ].map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => setCollectionMode(place.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        collectionMode === place.id
                          ? "bg-teal-900 text-white border-teal-900 shadow-sm"
                          : "bg-white text-teal-900 border-teal-900/20 hover:bg-sand"
                      }`}
                    >
                      {place.label}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-900 mb-1">
                    Cheque Details / Preferred Collection Timing (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cheque in favor of 'Janaseva Samruddi Education & Rural Development Society', evening pickup"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-teal-900/20 bg-white p-3 text-xs font-semibold text-teal-950 outline-none focus:border-teal-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-300 p-4 text-xs sm:text-sm font-bold text-rose-800">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* SUBMIT BUTTON ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-xl border border-teal-900/10">
            <div>
              <span className="text-xs text-teal-900/60 uppercase font-bold tracking-wide block">Total Contribution</span>
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-teal-950">
                {formatINR(totalAmount)}
              </span>
              <span className="block text-xs text-teal-700 font-medium">
                ({totalAmountWords})
              </span>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-8 py-4 text-sm sm:text-base font-extrabold text-teal-950 shadow-xl hover:bg-gold-light transition active:scale-98 disabled:opacity-50"
            >
              {busy ? (
                <>
                  <span className="animate-spin text-lg">⏳</span>
                  <span>Processing Supporter Form...</span>
                </>
              ) : collectionMode === "online" ? (
                <>
                  <span>💳 Proceed to Pay Online {formatINR(totalAmount)}</span>
                  <span>→</span>
                </>
              ) : (
                <>
                  <span>📝 Submit Supporter Form Pledge {formatINR(totalAmount)}</span>
                  <span>✓</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* QR CODE MODAL FOR IN-PERSON SCANNING */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
              <h3 className="text-lg font-bold font-display text-teal-950">
                Scan to Open Supporter Form
              </h3>
              <p className="text-xs text-teal-950/70 mt-1 mb-4">
                Point your phone camera to open this official supporter form instantly:
              </p>

              {/* QR Code SVG */}
              <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-2xl bg-cream p-4 border-2 border-teal-900/20 shadow-inner">
                {/* Visual QR Code Representation using clean SVG */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`}
                  alt="QR Code for Supporter Form"
                  className="h-44 w-44 rounded-lg"
                />
              </div>

              <p className="mt-3 text-xs font-mono font-bold text-teal-900 break-all">
                {formUrl}
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 rounded-xl bg-teal-900 py-2.5 text-xs font-bold text-white hover:bg-teal-950"
                >
                  {copiedLink ? "✓ Copied" : "Copy Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="rounded-xl border border-teal-900/20 px-4 py-2.5 text-xs font-bold text-teal-900 hover:bg-cream"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TO PRINT BLANK PAPER FORM (EXACT PHYSICAL SCAN) */}
        {showBlankPrintModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-xs">
            <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4 no-print">
                <div>
                  <h3 className="text-lg font-bold text-teal-950">
                    Official Blank Supporter Form (Print Preview)
                  </h3>
                  <p className="text-xs text-gray-600">
                    Exact replica of physical paper form. Ready for A4 printing.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-xl bg-gold px-4 py-2 text-xs font-extrabold text-teal-950 hover:bg-gold-light shadow"
                  >
                    🖨️ Print Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBlankPrintModal(false)}
                    className="rounded-xl border border-gray-300 px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Render the printable component */}
              <OfficialPrintableSupporterForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
