"use client";

import { useState, useEffect } from "react";
import type { AntiBanLanguage, OutreachAngle, MediaAsset } from "@/lib/whatsapp-antiban";
import { generateAntiBanMessage, CURATED_OUTREACH_MEDIA } from "@/lib/whatsapp-antiban";
import { SITE, formatINR } from "@/lib/site";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";

export interface AntiBanLeadData {
  leadId: number;
  name: string;
  phone: string;
  status?: string;
  dobDay?: number;
  dobMonth?: number;
  assignedCallerId?: string | null;
  parentName?: string | null;
  childName?: string | null;
  stream?: string | null;
  sourceSheet?: string | null;
  advanceCallingDate?: string | null;
}

interface AntiBanWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: AntiBanLeadData | null;
  callerId: string;
  callerName?: string;
  callerWhatsAppNumber?: string;
  masterWhatsAppNumber?: string;
  initialSenderMode?: "central" | "individual";
  onDispositionLogged?: (leadId: number, disposition: string, notes?: string, callbackTime?: string) => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function AntiBanWhatsAppModal({
  isOpen,
  onClose,
  lead,
  callerId,
  callerName = "Janaseva Ashrama Volunteer",
  callerWhatsAppNumber,
  masterWhatsAppNumber = "+91 99803 59595",
  initialSenderMode = "individual",
  onDispositionLogged,
}: AntiBanWhatsAppModalProps) {
  // Simple state: Kanglish (default) or English
  const [language, setLanguage] = useState<AntiBanLanguage>("kanglish");
  const [suggestedAmount, setSuggestedAmount] = useState<number>(1500);

  // Message & Status state
  const [messageText, setMessageText] = useState<string>("");
  const [saltToken, setSaltToken] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [qrCopied, setQrCopied] = useState<boolean>(false);

  // Inline disposition logging
  const [disposition, setDisposition] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [callbackTime, setCallbackTime] = useState<string>("");
  const [loggingDisp, setLoggingDisp] = useState<boolean>(false);
  const [inlineFeedback, setInlineFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Parse lead phone
  const phoneInfo = lead ? parseCustomerPhone(lead.phone) : { waNumber: "", display: "" };
  const formattedPhone = phoneInfo.waNumber;
  const displayPhone = phoneInfo.display;

  // Generate concise message personalized to telecaller & lead
  const generateMessage = (overrides?: { lang?: AntiBanLanguage; amt?: number }) => {
    if (!lead) return;
    const activeLang = overrides?.lang ?? language;
    const activeAmt = overrides?.amt ?? suggestedAmount;

    const isLeadBirthday =
      lead.dobDay &&
      lead.dobMonth &&
      lead.dobDay === new Date().getDate() &&
      lead.dobMonth === new Date().getMonth() + 1;

    const angle: OutreachAngle = isLeadBirthday ? "birthday" : "annadana";

    const local = generateAntiBanMessage({
      leadId: lead.leadId,
      leadName: lead.stream === "PARENTS" ? (lead.parentName || lead.name) : lead.name,
      donorName: lead.stream === "PARENTS" ? (lead.parentName || lead.name) : lead.name,
      parentName: lead.parentName || lead.name,
      childName: lead.childName || undefined,
      stream: (lead.stream as any) || undefined,
      callerId,
      callerName: callerName || "Janaseva Ashrama Volunteer",
      language: activeLang,
      angle,
      mediaId: "payment_qr_scanner",
      amount: activeAmt,
      mode: "concise",
      baseUrl: typeof window !== "undefined" ? window.location.origin : SITE.url,
      masterWhatsAppNumber: masterWhatsAppNumber || SITE.phoneIntl,
      senderMode: "individual",
    });

    setMessageText(local.messageText);
    setSaltToken(local.saltToken);
  };

  // Reset & generate on open
  useEffect(() => {
    if (isOpen && lead) {
      setDisposition(lead.status || "");
      setNotes("");
      setCallbackTime("");
      setInlineFeedback(null);
      setCopied(false);
      setQrCopied(false);
      setLanguage("kanglish");
      setSuggestedAmount(1500);

      generateMessage({ lang: "kanglish", amt: 1500 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lead?.leadId]);

  if (!isOpen || !lead) return null;

  const handleLanguageChange = (l: AntiBanLanguage) => {
    setLanguage(l);
    generateMessage({ lang: l });
  };

  const handleAmountChange = (amt: number) => {
    setSuggestedAmount(amt);
    generateMessage({ amt });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setInlineFeedback({ type: "info", text: "✓ Message copied to clipboard!" });
    setTimeout(() => {
      setCopied(false);
      setInlineFeedback(null);
    }, 3000);
  };

  // 1-Tap Save Disposition (No ugly alert popups!)
  const handleSaveDisposition = async (chosenDisposition?: string) => {
    const dispToSave = chosenDisposition || disposition;
    if (!dispToSave) {
      setInlineFeedback({ type: "error", text: "Please select a disposition (e.g. Interested, Reschedule, etc.)" });
      return;
    }
    setLoggingDisp(true);
    setInlineFeedback(null);
    try {
      const res = await fetch(`/api/v1/leads/${lead.leadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition: dispToSave,
          notes: notes.trim() || undefined,
          callbackTime: callbackTime ? new Date(callbackTime).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDisposition(dispToSave);
        setInlineFeedback({ type: "success", text: `✓ Saved lead status: ${dispToSave}` });
        if (onDispositionLogged) {
          onDispositionLogged(lead.leadId, dispToSave, notes, callbackTime);
        }
        setTimeout(() => setInlineFeedback(null), 4000);
      } else {
        setInlineFeedback({ type: "error", text: `Failed to save: ${data.error || "Unknown error"}` });
      }
    } catch (err: any) {
      setInlineFeedback({ type: "error", text: `Error saving disposition: ${err.message}` });
    } finally {
      setLoggingDisp(false);
    }
  };

  // 1-Tap Open WhatsApp Directly from Telecaller Device
  const handleLaunchWhatsApp = () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }

    // Copy Axis Bank UPI text for easy clipboard paste
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(
        `Axis Bank UPI: MAB.037349050110044@axisbank (Janaseva Ashrama) - ₹${formatINR(suggestedAmount)}`
      ).catch(() => {});
    }

    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    setInlineFeedback({ type: "success", text: `✓ Opened WhatsApp directly to ${displayPhone}!` });
  };

  // 1-Tap Call Lead
  const handleLaunchCall = () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    window.location.href = `tel:${lead.phone.replace(/\s+/g, "")}`;
  };

  // 1-Tap Share / Copy Official Axis Bank UPI Payment QR Standee
  const handleShareQrScanner = async () => {
    if (!lead) return;
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }

    const qrUrl = `${SITE.url}/media/janaseva-axis-bank-qr.jpg`;
    const qrCaption = `🙏 Namaskara ${lead.name} Sir/Madam!\n\nAttached is the Official Axis Bank UPI QR Scanner for Janaseva Ashrama (Turahalli, Bengaluru). Scan directly via GPay / PhonePe / Paytm / BHIM:\n\n💳 UPI ID: MAB.037349050110044@axisbank\n🏛️ Registered Trust: JANASEVA SAMRUDDI EDUCATI\n📜 Karnataka Govt JJ Act Reg: KA18CH0242\n🧾 100% Tax Deductible (Section 80G)\n🌐 Online Donation Link: ${SITE.url}/give?ref=${callerId}`;

    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const file = new File([blob], "janaseva-axis-bank-qr.jpg", { type: blob.type || "image/jpeg" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: qrCaption,
          title: "Official Axis Bank Payment QR Scanner - Janaseva Ashrama",
        });
        setQrCopied(true);
        setInlineFeedback({ type: "success", text: `✓ Axis Bank Payment QR shared to WhatsApp!` });
        setTimeout(() => setQrCopied(false), 3500);
        return;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
    }

    // Fallback: Copy QR text and open wa.me
    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(qrCaption)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setQrCopied(true);
    setInlineFeedback({ type: "success", text: `✓ Opened WhatsApp with Axis Bank UPI details!` });
    setTimeout(() => setQrCopied(false), 3500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-teal-900/15 overflow-hidden text-teal-950 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER STRIP ── */}
        <div className="flex items-center justify-between border-b border-teal-900/10 bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 px-4 py-3.5 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 text-lg font-bold ring-1 ring-emerald-400/30">
              💬
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm sm:text-base font-black truncate">
                  WhatsApp Outreach
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 border border-emerald-400/30">
                  🛡️ 0% Ban Risk
                </span>
              </div>
              <p className="text-[11px] text-white/80 truncate">
                Sending from your TC phone · Personalized &amp; Tracked
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* ── TELECALLER SENDER IDENTITY BADGE (ONLY FROM TC NUMBER) ── */}
        <div className="flex items-center justify-between border-b border-teal-900/10 bg-emerald-50/70 px-4 py-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
            <span>📱</span>
            <span>Send as TC:</span>
            <span className="rounded-md bg-emerald-200/80 text-emerald-900 px-2 py-0.5 font-black font-mono">
              {callerId}
            </span>
            {callerWhatsAppNumber && (
              <span className="text-emerald-800 text-[11px] font-mono">
                (+91 {callerWhatsAppNumber})
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
            ✓ Tracked Link Active
          </span>
        </div>

        {/* ── SCROLLABLE MODAL BODY ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-28 sm:pb-4">
          {/* 1. LEAD INFORMATION CARD */}
          <div className="rounded-2xl bg-cream/50 p-3 border border-teal-900/10 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-teal-950 text-sm sm:text-base truncate">
                  {lead.name}
                </span>
                {lead.dobDay && lead.dobMonth && (
                  <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 font-bold text-[10px]">
                    🎂 {lead.dobDay} {MONTH_NAMES[lead.dobMonth - 1]}
                  </span>
                )}
                {lead.stream && (
                  <span className="rounded-full bg-teal-100 text-teal-900 px-2 py-0.5 font-bold text-[10px]">
                    {lead.stream === "PARENTS" ? "👶 Parents Stream" : "👤 Direct Donor"}
                  </span>
                )}
              </div>

              {lead.childName && (
                <p className="text-xs text-teal-900 font-bold mt-0.5">
                  👶 Child: {lead.childName}
                </p>
              )}

              <p className="text-xs text-teal-950/70 font-mono mt-0.5">
                {displayPhone}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLaunchCall}
              className="flex h-10 items-center justify-center gap-1.5 px-3 rounded-xl bg-teal-950 text-white text-xs font-bold shadow-xs hover:bg-teal-900 active:scale-95 transition shrink-0 cursor-pointer"
              title={`Call ${lead.name} directly`}
            >
              <span>📞</span>
              <span>Call</span>
            </button>
          </div>

          {/* 2. SIMPLE CONTROLS: LANGUAGE & SEVA AMOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Language Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-teal-950/70 mb-1">
                🌐 Language
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("kanglish")}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    language === "kanglish"
                      ? "bg-teal-950 text-white border-teal-950 shadow-2xs ring-1 ring-amber-400"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <div>🔤 Kanglish</div>
                  <div className="text-[9px] opacity-75 font-normal">ಕನ್ನಡ in English</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                    language === "en"
                      ? "bg-teal-950 text-white border-teal-950 shadow-2xs ring-1 ring-amber-400"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <div>🇬🇧 English</div>
                  <div className="text-[9px] opacity-75 font-normal">Formal &amp; Direct</div>
                </button>
              </div>
            </div>

            {/* Seva Amount */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-teal-950/70 mb-1">
                💰 Seva Amount
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { label: "₹501", amt: 501 },
                  { label: "₹1,500", amt: 1500 },
                  { label: "₹2,500", amt: 2500 },
                  { label: "₹4,500", amt: 4500 },
                ].map((item) => (
                  <button
                    key={item.amt}
                    type="button"
                    onClick={() => handleAmountChange(item.amt)}
                    className={`p-1.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      suggestedAmount === item.amt
                        ? "bg-amber-400 text-teal-950 border-amber-500 shadow-2xs ring-1 ring-amber-400"
                        : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. CONCISE MESSAGE PREVIEW BOX */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-teal-950/70 flex items-center gap-1.5">
                <span>📝 Message Preview</span>
                {saltToken && (
                  <span className="font-mono text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                    Shield #{saltToken}
                  </span>
                )}
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-teal-900 hover:text-amber-800 cursor-pointer flex items-center gap-1"
              >
                <span>{copied ? "✓ Copied!" : "📋 Copy"}</span>
              </button>
            </div>

            <div className="relative rounded-2xl border border-teal-900/15 bg-sand/20 p-3 shadow-inner">
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-transparent text-xs text-teal-950 leading-relaxed focus:outline-hidden resize-none font-sans"
                placeholder="Generating personalized message..."
              />
              <div className="flex items-center justify-between border-t border-teal-900/10 pt-1.5 text-[10px] text-teal-950/60">
                <span>Chars: {messageText.length} &middot; Fits 1 mobile screen</span>
                <span className="text-emerald-700 font-semibold">✓ 1-Tap Ready</span>
              </div>
            </div>
          </div>

          {/* INLINE STATUS FEEDBACK (NO DISRUPTIVE BROWSER ALERTS!) */}
          {inlineFeedback && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn ${
                inlineFeedback.type === "success"
                  ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                  : inlineFeedback.type === "error"
                  ? "bg-rose-100 text-rose-950 border border-rose-300"
                  : "bg-teal-100 text-teal-950 border border-teal-300"
              }`}
            >
              <span>{inlineFeedback.text}</span>
              <button
                type="button"
                onClick={() => setInlineFeedback(null)}
                className="text-xs px-1 opacity-70 hover:opacity-100 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* 4. 2 CLEAR PRIMARY DISPATCH ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Primary Action: Open WhatsApp */}
            <button
              type="button"
              onClick={handleLaunchWhatsApp}
              className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1faa53] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-xl">💬</span>
              <div className="text-left">
                <div className="leading-tight">Open WhatsApp</div>
                <div className="text-[10px] font-normal opacity-90 leading-tight">
                  Chat directly with {lead.name}
                </div>
              </div>
            </button>

            {/* Secondary Action: Copy / Share Axis Bank QR */}
            <button
              type="button"
              onClick={handleShareQrScanner}
              className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-teal-950 font-black text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-xl">{qrCopied ? "✓" : "📷"}</span>
              <div className="text-left">
                <div className="leading-tight">
                  {qrCopied ? "QR Scanner Copied!" : "Share Axis Bank QR"}
                </div>
                <div className="text-[10px] font-normal opacity-90 leading-tight">
                  Official UPI Standee QR
                </div>
              </div>
            </button>
          </div>

          {/* 5. 1-TAP DISPOSITION LOGGING */}
          <div className="rounded-2xl border border-teal-900/15 bg-white p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-950">
                ⚡ 1-Tap Disposition Log:
              </span>
              {disposition && (
                <span className="text-[10px] font-bold text-teal-900 bg-sand/60 px-2 py-0.5 rounded-full">
                  Status: {disposition}
                </span>
              )}
            </div>

            {/* 5 Quick Status Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Interested 👍", val: "Interested", color: "bg-emerald-600 text-white" },
                { label: "Donated 🎉", val: "Donated", color: "bg-amber-600 text-white" },
                { label: "Reschedule 📅", val: "Reschedule", color: "bg-blue-600 text-white" },
                { label: "Busy / Ringing ⏳", val: "No_Answer", color: "bg-gray-600 text-white" },
                { label: "Not Interested ✕", val: "Rejected", color: "bg-rose-600 text-white" },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => {
                    setDisposition(s.val);
                    handleSaveDisposition(s.val);
                  }}
                  disabled={loggingDisp}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer min-h-[34px] ${
                    disposition === s.val
                      ? s.color
                      : "bg-cream text-teal-950 border border-teal-900/10 hover:bg-sand"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Datetime picker if Reschedule */}
            {disposition === "Reschedule" && (
              <div className="animate-fadeIn pt-1">
                <label className="block text-[10px] font-bold text-teal-950/70 mb-1">
                  Scheduled Callback Date &amp; Time:
                </label>
                <input
                  type="datetime-local"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/15 bg-white px-3 py-1.5 text-xs text-teal-950"
                />
              </div>
            )}

            {/* Notes Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add quick notes (e.g. Will donate on weekend)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveDisposition();
                  }
                }}
                className="flex-1 rounded-xl border border-teal-900/15 bg-cream/20 px-3 py-1.5 text-xs text-teal-950 placeholder:text-teal-950/40 focus:border-teal-950 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleSaveDisposition()}
                disabled={loggingDisp || (!disposition && !notes.trim())}
                className="rounded-xl bg-teal-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-900 transition disabled:opacity-40 cursor-pointer shrink-0"
              >
                {loggingDisp ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* ── MOBILE STICKY ACTION BAR ── */}
        <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-2.5 shadow-lg z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={handleLaunchWhatsApp}
            className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] active:bg-[#1faa53] text-white font-black text-xs shadow-md transition cursor-pointer"
          >
            <span className="text-lg">💬</span>
            <span>Open WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleLaunchCall}
            className="h-11 px-4 flex items-center justify-center gap-1 rounded-xl bg-teal-950 text-white text-xs font-bold active:scale-95 transition cursor-pointer"
            title={`Call ${displayPhone}`}
          >
            <span>📞</span>
            <span>Call</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-3 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-teal-950 text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* ── DESKTOP FOOTER ── */}
        <div className="hidden sm:flex items-center justify-between border-t border-teal-900/10 bg-cream/20 px-4 py-2.5 text-xs text-teal-950/60">
          <span>Lead ID: #{lead.leadId} &middot; Caller: {callerId}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-200 hover:bg-gray-300 text-teal-950 px-3.5 py-1.5 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
