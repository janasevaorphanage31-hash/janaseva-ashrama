"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { formatINR, BANK_DETAILS, SITE } from "@/lib/site";
import { SUPPORTER_CATEGORIES } from "@/lib/supporter-form";
import { numberToIndianWords } from "@/lib/number-words";
import { track } from "@/lib/track";

const QUICK_AMOUNTS = [
  { amount: 100, label: "1 Warm Meal", subtitle: "Direct meal for 1 boy" },
  { amount: 500, label: "5 Boy Meals", subtitle: "Nourishing 5 boys" },
  { amount: 1500, label: "Day Breakfast", subtitle: "Breakfast for all 25 boys" },
  { amount: 2500, label: "1 Time Annadana", subtitle: "Lunch or dinner for 25 boys" },
  { amount: 4500, label: "Full Day Annadana", subtitle: "All 3 meals for all 25 boys", isPopular: true },
  { amount: 6000, label: "1 Mo. Groceries", subtitle: "Ration for 4 boys" },
  { amount: 9600, label: "1 Yr. Education", subtitle: "Full annual school fees" },
];

export function BottomDonationDrawer() {
  const router = useRouter();
  const {
    isBottomDonateOpen,
    closeBottomDonate,
    donateInitialAmount,
    donateInitialTierId,
    setCustom,
  } = useCart();

  const [selectedAmount, setSelectedAmount] = useState<number>(4500);
  const [customInput, setCustomInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"quick" | "tiers" | "bank">("quick");
  const [selectedTierOption, setSelectedTierOption] = useState<{ categoryId: string; optionId: string }>({
    categoryId: "food_one_day",
    optionId: "all_children",
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const drawerRef = useRef<HTMLDivElement>(null);

  // Sync initial amount if passed
  useEffect(() => {
    if (donateInitialAmount && donateInitialAmount > 0) {
      setSelectedAmount(donateInitialAmount);
      setCustomInput(String(donateInitialAmount));
    }
    if (donateInitialTierId) {
      const cat = SUPPORTER_CATEGORIES.find((c) => c.id === donateInitialTierId);
      if (cat && cat.options[0]) {
        setSelectedTierOption({ categoryId: cat.id, optionId: cat.options[0].id });
        setSelectedAmount(cat.options[0].amount);
        setActiveTab("tiers");
      }
    }
  }, [donateInitialAmount, donateInitialTierId]);

  // Handle ESC key
  useEffect(() => {
    if (!isBottomDonateOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBottomDonate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBottomDonateOpen, closeBottomDonate]);

  if (!isBottomDonateOpen) return null;

  const currentAmount = customInput && Number(customInput) > 0 ? Number(customInput) : selectedAmount;
  const amountInWords = numberToIndianWords(currentAmount);

  const handleSelectQuick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomInput(String(amount));
    track("bottom_donate_quick_select", { amount });
  };

  const handleSelectTier = (categoryId: string, optionId: string, amount: number) => {
    setSelectedTierOption({ categoryId, optionId });
    setSelectedAmount(amount);
    setCustomInput(String(amount));
    track("bottom_donate_tier_select", { categoryId, optionId, amount });
  };

  const handleProceedOnline = () => {
    setCustom(currentAmount);
    closeBottomDonate();
    track("bottom_donate_proceed_online", { amount: currentAmount });
    router.push(`/checkout?amount=${currentAmount}`);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-donate-title"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center no-print"
    >
      {/* Dark backdrop scrim */}
      <div
        onClick={closeBottomDonate}
        className="fixed inset-0 bg-teal-950/75 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Main Drawer Container */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-teal-900/15 overflow-hidden transform transition-all duration-300 ease-out animate-in slide-in-from-bottom"
      >
        {/* Pull Handle & Header */}
        <div className="relative bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 text-white p-5 sm:p-6 pb-4">
          <div className="flex justify-center -mt-2 pb-2 sm:hidden" aria-hidden="true">
            <div className="h-1.5 w-12 rounded-full bg-white/30" />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Direct Sponsorship · 25 Resident Boys
                </span>
              </div>
              <h2 id="bottom-donate-title" className="font-display text-xl sm:text-2xl font-bold leading-tight">
                Empower a Child&apos;s Life Today
              </h2>
              <p className="text-xs text-white/80 mt-1">
                100% Direct Allocation to Janaseva Ashrama (Makkala Ashraya Kendra) · Form 10AC 80G Tax Deductible
              </p>
            </div>

            <button
              type="button"
              onClick={closeBottomDonate}
              aria-label="Close donation panel"
              className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <svg className="h-5 w-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex rounded-xl bg-white/10 p-1 border border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "quick" ? "bg-amber-500 text-teal-950 font-black shadow-sm" : "text-white/85 hover:text-white"
              }`}
            >
              ⚡ Quick Impact
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tiers")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "tiers" ? "bg-amber-500 text-teal-950 font-black shadow-sm" : "text-white/85 hover:text-white"
              }`}
            >
              📋 Official 5 Tiers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bank")}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === "bank" ? "bg-amber-500 text-teal-950 font-black shadow-sm" : "text-white/85 hover:text-white"
              }`}
            >
              🏦 Direct Bank Transfer
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-sand/20">
          {/* TAB 1: QUICK IMPACT */}
          {activeTab === "quick" && (
            <div className="space-y-4">
              {/* Urgent Need Banner */}
              <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-3 flex items-center gap-2.5 text-xs shadow-2xs">
                <span className="text-xl shrink-0">🔥</span>
                <div className="text-[11px] leading-tight text-teal-950 font-medium">
                  <strong className="text-saffron-dark font-black uppercase tracking-wider block text-[10px]">Live Urgent Need:</strong>
                  6 unassigned evening meals for 25 boys in Bangalore · ₹100 feeds 1 child tonight
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-teal-950/70 mb-2">
                  Select Impact Tier or Preset:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {QUICK_AMOUNTS.map((item) => {
                    const isSelected = currentAmount === item.amount;
                    return (
                      <button
                        key={item.amount}
                        type="button"
                        onClick={() => handleSelectQuick(item.amount)}
                        className={`p-3 rounded-2xl text-left border transition tap-scale cursor-pointer relative ${
                          isSelected
                            ? "bg-teal-900 text-white border-teal-900 shadow-md ring-2 ring-amber-400"
                            : "bg-white text-teal-950 border-teal-900/15 hover:border-teal-900/40 hover:bg-white"
                        }`}
                      >
                        {item.isPopular && (
                          <span className="absolute -top-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase text-teal-950 shadow">
                            Popular
                          </span>
                        )}
                        <span className={`block font-display text-base font-black ${isSelected ? "text-amber-300" : "text-teal-900"}`}>
                          {formatINR(item.amount)}
                        </span>
                        <span className="block text-xs font-bold mt-0.5">{item.label}</span>
                        <span className={`block text-[10px] mt-0.5 line-clamp-1 ${isSelected ? "text-white/75" : "text-teal-950/60"}`}>
                          {item.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Input */}
              <div className="rounded-2xl bg-white p-4 border border-teal-900/15 shadow-xs">
                <label htmlFor="drawer-custom-amount" className="block text-xs font-bold uppercase tracking-wider text-teal-900/70 mb-1">
                  Or Enter Your Custom Amount (₹10 – ₹5,00,000):
                </label>
                <div className="flex items-center rounded-xl border-2 border-teal-900/20 bg-sand/30 px-3.5 focus-within:border-teal-800 transition">
                  <span className="font-display text-xl font-black text-teal-900">₹</span>
                  <input
                    id="drawer-custom-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={customInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setCustomInput(val);
                      if (val) setSelectedAmount(Number(val));
                    }}
                    className="w-full bg-transparent px-3 py-2.5 text-lg font-bold text-teal-900 outline-none"
                  />
                  {customInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInput("");
                        setSelectedAmount(4500);
                      }}
                      className="text-xs font-bold text-teal-900/50 hover:text-teal-900 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                {currentAmount > 0 && (
                  <p className="mt-2 text-xs font-semibold text-teal-800 italic">
                    Amount in words: <span className="font-bold">{amountInWords}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: OFFICIAL 5 SUPPORT TIERS */}
          {activeTab === "tiers" && (
            <div className="space-y-3">
              <p className="text-xs text-teal-950/75">
                Exact sponsorship tiers approved under trust resolution for Janaseva Samruddi Ashrama:
              </p>
              {SUPPORTER_CATEGORIES.map((cat) => {
                const isCatActive = selectedTierOption.categoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`rounded-2xl border p-4 transition ${
                      isCatActive
                        ? "bg-white border-teal-900 shadow-md ring-1 ring-teal-900/20"
                        : "bg-white/80 border-teal-900/15 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-teal-950/10 px-1.5 py-0.5 text-[10px] font-black text-teal-900">
                              Tier {cat.index}
                            </span>
                            <h4 className="font-display text-sm font-bold text-teal-900">
                              {cat.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-amber-700 font-medium">{cat.kannadaTitle}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-teal-950/70">{cat.desc}</p>

                    {/* Options inside category */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {cat.options.map((opt) => {
                        const isOptSelected =
                          selectedTierOption.categoryId === cat.id &&
                          selectedTierOption.optionId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectTier(cat.id, opt.id, opt.amount)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${
                              isOptSelected
                                ? "bg-teal-900 text-white border-teal-900 font-bold shadow-sm"
                                : "bg-sand/30 text-teal-950 border-teal-900/10 hover:bg-sand/60"
                            }`}
                          >
                            <span className={`block font-display font-black text-sm ${isOptSelected ? "text-amber-300" : "text-teal-900"}`}>
                              {formatINR(opt.amount)}
                            </span>
                            <span className="block font-bold text-[11px] leading-tight mt-0.5">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: DIRECT BANK TRANSFER */}
          {activeTab === "bank" && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-teal-950 text-white p-5 shadow-md border border-amber-400/30">
                <div className="flex items-center justify-between pb-3 border-b border-white/15">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Official Axis Bank Account
                  </span>
                  <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    0% Commission
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-white/60 uppercase">Beneficiary Name</span>
                    <p className="font-bold text-sm text-white">{BANK_DETAILS.accountName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/10 p-3">
                      <span className="text-[10px] text-white/60 uppercase block">Account Number</span>
                      <p className="font-mono text-base font-black text-amber-300 tracking-wider">
                        {BANK_DETAILS.accountNumber}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.accountNumber, "acc")}
                        className="mt-2 text-[11px] font-bold text-amber-300 underline hover:text-white cursor-pointer"
                      >
                        {copiedField === "acc" ? "✓ Copied!" : "Copy A/C No"}
                      </button>
                    </div>

                    <div className="rounded-xl bg-white/10 p-3">
                      <span className="text-[10px] text-white/60 uppercase block">IFSC Code</span>
                      <p className="font-mono text-base font-black text-amber-300 tracking-wider">
                        {BANK_DETAILS.ifscCode}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(BANK_DETAILS.ifscCode, "ifsc")}
                        className="mt-2 text-[11px] font-bold text-amber-300 underline hover:text-white cursor-pointer"
                      >
                        {copiedField === "ifsc" ? "✓ Copied!" : "Copy IFSC"}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-white/80 pt-1">
                    <div>
                      <span className="text-[10px] text-white/60 uppercase block">Bank & Branch</span>
                      <p className="font-medium">{BANK_DETAILS.bankName}, {BANK_DETAILS.branch}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/60 uppercase block">Account Type</span>
                      <p className="font-medium">{BANK_DETAILS.accountType}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
                <p className="font-bold">After transferring via NetBanking, NEFT or UPI:</p>
                <p>
                  Please WhatsApp your transaction reference / UTR receipt to{" "}
                  <a
                    href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Namaste Janaseva Ashrama, I have made a direct bank transfer of donation.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline text-teal-900"
                  >
                    +91 99452 23232
                  </a>{" "}
                  along with your PAN for official 80G tax receipt issuance.
                </p>
              </div>
            </div>
          )}

          {/* Trust Footnote */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-teal-950/70 pt-2 border-t border-teal-900/10">
            <span className="flex items-center gap-1 text-emerald-800">
              <span>✓</span> Form 10AC Section 80G Tax Exemption
            </span>
            <span className="flex items-center gap-1 text-teal-800">
              <span>✓</span> JJ Act Reg: KA18CH0242
            </span>
            <span className="flex items-center gap-1 text-teal-800">
              <span>✓</span> 100% Direct Allocation to 25 Boys
            </span>
          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="bg-white p-4 sm:p-5 border-t border-teal-900/15 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-950/60 block">
              Total Contribution Amount:
            </span>
            <span className="font-display text-2xl font-black text-teal-900">
              {formatINR(currentAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={closeBottomDonate}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-900 hover:bg-sand/30 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceedOnline}
              className="flex-2 sm:flex-none btn-primary px-6 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider cursor-pointer shadow-lg animate-heartbeat"
            >
              DONATE ONLINE (UPI / CARDS) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
