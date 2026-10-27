"use client";

import { useState, useEffect, useId } from "react";
import type { AntiBanLanguage, OutreachAngle, MediaAsset } from "@/lib/whatsapp-antiban";
import { CURATED_OUTREACH_MEDIA } from "@/lib/whatsapp-antiban";

export interface AntiBanLeadData {
  leadId: number;
  name: string;
  phone: string;
  status?: string;
  dobDay?: number;
  dobMonth?: number;
  assignedCallerId?: string | null;
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
  initialSenderMode = "central",
  onDispositionLogged,
}: AntiBanWhatsAppModalProps) {
  const [language, setLanguage] = useState<AntiBanLanguage>("en");
  const [angle, setAngle] = useState<OutreachAngle>("annadana");
  const [selectedMediaId, setSelectedMediaId] = useState<string>("annadana_feast");
  const [senderMode, setSenderMode] = useState<"central" | "individual">(initialSenderMode);
  const [suggestedAmount, setSuggestedAmount] = useState<number | undefined>(undefined);

  // Generated state
  const [messageText, setMessageText] = useState<string>("");
  const [saltToken, setSaltToken] = useState<string>("");
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const [activeMedia, setActiveMedia] = useState<MediaAsset>(CURATED_OUTREACH_MEDIA.annadana_feast);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Inline disposition logging
  const [disposition, setDisposition] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [callbackTime, setCallbackTime] = useState<string>("");
  const [loggingDisp, setLoggingDisp] = useState<boolean>(false);
  const [dispSuccess, setDispSuccess] = useState<boolean>(false);

  // Generate / refresh altered message
  const generateMessage = async (overrides?: {
    lang?: AntiBanLanguage;
    ang?: OutreachAngle;
    media?: string;
    mode?: "central" | "individual";
    amt?: number;
  }) => {
    if (!lead) return;
    setLoading(true);
    setCopied(false);
    try {
      const activeLang = overrides?.lang ?? language;
      const activeAngle = overrides?.ang ?? angle;
      const activeMediaId = overrides?.media ?? selectedMediaId;
      const activeMode = overrides?.mode ?? senderMode;
      const activeAmt = overrides?.amt !== undefined ? overrides.amt : suggestedAmount;

      const q = new URLSearchParams({
        callerId,
        language: activeLang,
        angle: activeAngle,
        mediaId: activeMediaId,
        senderMode: activeMode,
        ...(activeAmt ? { amount: String(activeAmt) } : {}),
      });

      const res = await fetch(`/api/v1/telecaller/whatsapp-link/${lead.leadId}?${q.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setMessageText(data.messageText);
        setSaltToken(data.saltToken);
        setWhatsappUrl(data.whatsappUrl);
        if (data.mediaAsset) {
          setActiveMedia(data.mediaAsset);
        }
      } else {
        alert("Failed to generate altered message: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error generating WhatsApp message: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Trigger regeneration on open or when key parameters change
  useEffect(() => {
    if (isOpen && lead) {
      // Determine smart initial angle: if lead has birthday today or near, pick birthday
      const now = new Date();
      const isLeadBirthday =
        lead.dobDay === now.getDate() && lead.dobMonth === now.getMonth() + 1;
      const initialAngle = isLeadBirthday ? "birthday" : "annadana";
      const initialMedia = isLeadBirthday ? "birthday_celebration" : "annadana_feast";

      setAngle(initialAngle);
      setSelectedMediaId(initialMedia);
      setDisposition(lead.status || "");
      setNotes("");
      setCallbackTime("");
      setDispSuccess(false);

      generateMessage({ ang: initialAngle, media: initialMedia });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lead?.leadId]);

  if (!isOpen || !lead) return null;

  const handleLanguageChange = (l: AntiBanLanguage) => {
    setLanguage(l);
    generateMessage({ lang: l });
  };

  const handleAngleChange = (a: OutreachAngle) => {
    setAngle(a);
    let smartMedia = selectedMediaId;
    if (a === "birthday") smartMedia = "birthday_celebration";
    if (a === "annadana") smartMedia = "annadana_feast";
    if (a === "vidya") smartMedia = "ashrama_tour_video";
    if (a === "trust_80g") smartMedia = "form_10ac_80g";
    setSelectedMediaId(smartMedia);
    generateMessage({ ang: a, media: smartMedia });
  };

  const handleMediaSelect = (mId: string) => {
    setSelectedMediaId(mId);
    generateMessage({ media: mId });
  };

  const handleSenderModeChange = (mode: "central" | "individual") => {
    setSenderMode(mode);
    generateMessage({ mode });
  };

  const handleAmountChange = (amt: number | undefined) => {
    setSuggestedAmount(amt);
    generateMessage({ amt });
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveDisposition = async (chosenDisposition?: string) => {
    const dispToSave = chosenDisposition || disposition;
    if (!dispToSave) {
      alert("Please select a disposition (e.g. Interested, Reschedule, etc.)");
      return;
    }
    setLoggingDisp(true);
    try {
      const res = await fetch("/api/v1/telecaller/log-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.leadId,
          callerId,
          disposition: dispToSave,
          notes: notes.trim() || undefined,
          callbackTime: callbackTime ? new Date(callbackTime).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispSuccess(true);
        if (onDispositionLogged) {
          onDispositionLogged(lead.leadId, dispToSave, notes, callbackTime);
        }
        setTimeout(() => setDispSuccess(false), 3500);
      } else {
        alert("Failed to log disposition: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving disposition: " + err.message);
    } finally {
      setLoggingDisp(false);
    }
  };

  const cleanPhone = lead.phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone.slice(-10)}`;
  const displayPhone = `+91 ${cleanPhone.slice(-10)}`;

  const mediaList = Object.values(CURATED_OUTREACH_MEDIA);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[94vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-teal-900/15 overflow-hidden text-teal-950 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER STRIP ── */}
        <div className="flex items-center justify-between border-b border-teal-900/10 bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 text-xl font-bold ring-1 ring-emerald-400/30">
              💬
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-black truncate">
                  Send WhatsApp Message (Anti-Ban Protected)
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 border border-emerald-400/30">
                  🛡️ 0% Ban Risk
                </span>
              </div>
              <p className="text-xs text-white/75 truncate mt-0.5">
                Every dispatch is dynamically altered with unique greetings, spintax tokens &amp; official media.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* ── RECIPIENT & SENDER CONTEXT BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-900/10 bg-cream/40 px-5 py-3 text-xs">
          {/* Recipient info */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-950 text-white font-bold text-xs">
              {lead.name[0]?.toUpperCase() || "L"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-950 text-sm">{lead.name}</span>
                <span className="font-mono text-teal-950/70 bg-white px-2 py-0.5 rounded-md border border-teal-900/10">
                  {displayPhone}
                </span>
                {lead.dobDay && lead.dobMonth && (
                  <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 font-bold text-[10px]">
                    🎂 {lead.dobDay} {MONTH_NAMES[lead.dobMonth - 1]}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sender Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-teal-950/60 font-medium">Send As:</span>
            <div className="inline-flex rounded-xl bg-white p-0.5 border border-teal-900/15 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSenderModeChange("central")}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  senderMode === "central"
                    ? "bg-teal-950 text-white shadow-2xs"
                    : "text-teal-950/70 hover:text-teal-950"
                }`}
                title="Send as central official WhatsApp (+91 99803 59595)"
              >
                🏢 Central ({masterWhatsAppNumber.replace(/\s+/g, "")})
              </button>
              {callerWhatsAppNumber && (
                <button
                  type="button"
                  onClick={() => handleSenderModeChange("individual")}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                    senderMode === "individual"
                      ? "bg-teal-950 text-white shadow-2xs"
                      : "text-teal-950/70 hover:text-teal-950"
                  }`}
                  title={`Send as telecaller ${callerId} (+91 ${callerWhatsAppNumber})`}
                >
                  👤 {callerId} (+91 {callerWhatsAppNumber})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── MODAL BODY: 2-COLUMN WORKSPACE ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-32 sm:pb-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Controls, Language, Angle, Media Picker (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Language Pill Selector */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-teal-950/70 mb-1.5">
                🌐 Outreach Language
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "en"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-sm">🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("kn")}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "kn"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-sm">🇮🇳</span>
                  <span>ಕನ್ನಡ (Kannada)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("mixed")}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "mixed"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-sm">🔤</span>
                  <span>Manglish</span>
                </button>
              </div>
            </div>

            {/* 2. Angle Selector */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-teal-950/70 mb-1.5">
                🎯 Narrative Angle
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAngleChange("annadana")}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                    angle === "annadana"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">🍲</span>
                  <div>
                    <div>Annadana Meals</div>
                    <div className="text-[10px] opacity-75 font-normal">Full-day hot food</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAngleChange("birthday")}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                    angle === "birthday"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">🎂</span>
                  <div>
                    <div>Birthday Seva</div>
                    <div className="text-[10px] opacity-75 font-normal">Celebration feast</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAngleChange("vidya")}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                    angle === "vidya"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">📚</span>
                  <div>
                    <div>Vidya &amp; School</div>
                    <div className="text-[10px] opacity-75 font-normal">Uniforms &amp; kits</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAngleChange("trust_80g")}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                    angle === "trust_80g"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">📜</span>
                  <div>
                    <div>80G Tax Exemption</div>
                    <div className="text-[10px] opacity-75 font-normal">JJ Act KA18CH0242</div>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Suggested Contribution Tiers */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-teal-950/70 mb-1.5">
                💰 Pre-Selected Tier Amount (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Default Tiers", amt: undefined },
                  { label: "₹2,500 (1 Meal)", amt: 2500 },
                  { label: "₹4,500 (Full Day)", amt: 4500 },
                  { label: "₹5,000 (Feast)", amt: 5000 },
                  { label: "₹9,600 (Vidya)", amt: 9600 },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAmountChange(item.amt)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      suggestedAmount === item.amt
                        ? "bg-saffron text-teal-950 shadow-xs"
                        : "bg-white text-teal-950 border border-teal-900/15 hover:bg-cream"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Media Attachment Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-teal-950/70">
                  📎 Media Asset to Attach
                </label>
                <span className="text-[10px] text-teal-950/60">
                  Select 1 asset to send/copy
                </span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {mediaList.map((m) => {
                  const isSelected = selectedMediaId === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleMediaSelect(m.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                        isSelected
                          ? "bg-amber-50 border-amber-400 ring-1 ring-amber-400/40"
                          : "bg-white border-teal-900/10 hover:bg-cream"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-950/5 text-sm">
                          {m.type === "image"
                            ? "🖼️"
                            : m.type === "video"
                            ? "🎥"
                            : m.type === "document"
                            ? "📄"
                            : "🔗"}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-teal-950 truncate text-[11px]">
                            {m.title}
                          </p>
                          <p className="text-[10px] text-teal-950/60 truncate">
                            {m.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            m.type === "image"
                              ? "bg-blue-100 text-blue-800"
                              : m.type === "video"
                              ? "bg-purple-100 text-purple-800"
                              : m.type === "document"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {m.type}
                        </span>
                        {isSelected && (
                          <span className="text-amber-600 font-bold text-xs">✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Media Quick Action Preview */}
              {activeMedia && (
                <div className="mt-2 rounded-2xl bg-cream/60 p-2.5 border border-teal-900/10 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-teal-950/60 uppercase">Selected Asset</p>
                    <p className="text-xs font-bold text-teal-950 truncate">{activeMedia.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={activeMedia.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-teal-950 border border-teal-900/15 hover:bg-cream"
                      title="Open full resolution in new tab"
                    >
                      👁️ View
                    </a>
                    <a
                      href={activeMedia.url}
                      download={activeMedia.filename}
                      className="rounded-lg bg-teal-950 px-2 py-1 text-[10px] font-bold text-white hover:bg-teal-900"
                      title="Download file to attach in WhatsApp"
                    >
                      ⬇️ Download
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Live Message Preview, Anti-Ban Badge, Actions & Quick Logging (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Live Message Preview Header */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-teal-950/70 flex items-center gap-2">
                  <span>📝 Altered Message Preview</span>
                  {saltToken && (
                    <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Shield #{saltToken}
                    </span>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => generateMessage()}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 hover:text-saffron-dark cursor-pointer"
                  title="Spin a fresh unique message permutation"
                >
                  <span className={loading ? "animate-spin" : ""}>🔄</span>
                  <span>Alter Variation</span>
                </button>
              </div>

              {/* Textarea */}
              <div className="relative rounded-2xl border border-teal-900/15 bg-sand/20 p-3 shadow-inner">
                <textarea
                  rows={10}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-teal-950 leading-relaxed focus:outline-hidden resize-none font-sans"
                  placeholder="Generating unique personalized message..."
                />

                <div className="flex items-center justify-between border-t border-teal-900/10 pt-2 text-[10px] text-teal-950/60">
                  <span>
                    Words: {messageText ? messageText.trim().split(/\s+/).length : 0} · Chars:{" "}
                    {messageText.length}
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span>✓</span> Spintax Randomized (Ban Resistant)
                  </span>
                </div>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Copy Message Text Button */}
              <button
                type="button"
                onClick={handleCopyText}
                className="focus-ring tap-scale inline-flex items-center justify-center gap-2 rounded-2xl bg-white hover:bg-cream text-teal-950 px-4 py-3 text-xs sm:text-sm font-bold border border-teal-900/15 shadow-xs transition cursor-pointer"
              >
                <span>{copied ? "✓" : "📋"}</span>
                <span>{copied ? "Copied to Clipboard!" : "Copy Message Text"}</span>
              </button>

              {/* Open in WhatsApp Web / App */}
              <a
                href={whatsappUrl || `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`}
                target="_blank"
                rel="noreferrer"
                className="focus-ring tap-scale inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:brightness-105 text-white px-4 py-3 text-xs sm:text-sm font-black shadow-md transition cursor-pointer"
              >
                <span>💬</span>
                <span>Send via WhatsApp</span>
              </a>
            </div>

            {/* Direct Phone Call Button */}
            <div className="flex items-center justify-between bg-cream/40 p-2.5 rounded-2xl border border-teal-900/10 text-xs">
              <span className="text-teal-950/70 font-medium">Prefer to speak first?</span>
              <a
                href={`tel:${displayPhone.replace(/\s+/g, "")}`}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs"
              >
                <span>📞</span>
                <span>Call Lead ({displayPhone})</span>
              </a>
            </div>

            {/* ── QUICK CALL LOGGING / DISPOSITION INLINE ── */}
            <div className="rounded-2xl border border-teal-900/15 bg-white p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-950">
                  ⚡ Quick Log Disposition
                </span>
                {dispSuccess && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-fadeIn">
                    ✓ Saved to CRM Lead History!
                  </span>
                )}
              </div>

              {/* Quick Status Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Interested", val: "Interested", color: "bg-emerald-600 text-white" },
                  { label: "Reschedule", val: "Reschedule", color: "bg-blue-600 text-white" },
                  { label: "Rejected", val: "Rejected", color: "bg-rose-600 text-white" },
                  { label: "No Answer", val: "No_Answer", color: "bg-gray-600 text-white" },
                  { label: "🎉 Donated", val: "Donated", color: "bg-amber-600 text-white" },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => {
                      setDisposition(s.val);
                      handleSaveDisposition(s.val);
                    }}
                    disabled={loggingDisp}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      disposition === s.val
                        ? s.color
                        : "bg-cream text-teal-950 border border-teal-900/10 hover:bg-cream-dark"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Callback Datetime picker if Reschedule */}
              {disposition === "Reschedule" && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-bold text-teal-950/70 mb-1">
                    Scheduled Callback Time:
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
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add quick notes (e.g. Asked to send 80G PDF, will pay tomorrow)..."
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
                  className="rounded-xl bg-teal-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-900 transition disabled:opacity-40 cursor-pointer"
                >
                  {loggingDisp ? "Saving..." : "Save Log"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY MOBILE ACTION BAR ── */}
        <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-3 shadow-lg z-20 space-y-2">
          {/* Main 1-tap WhatsApp trigger */}
          <a
            href={whatsappUrl || `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] active:bg-[#1faa53] text-white font-black text-sm shadow-md transition"
          >
            <span className="text-lg">💬</span>
            <span>Send via WhatsApp (wa.me)</span>
          </a>

          {/* Quick Row: Call, Copy, Alter */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={`tel:${displayPhone.replace(/\s+/g, "")}`}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-teal-950 text-white text-xs font-bold active:scale-95 transition"
            >
              <span>📞</span>
              <span>Call</span>
            </a>
            <button
              type="button"
              onClick={handleCopyText}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-cream border border-teal-900/15 text-teal-950 text-xs font-bold active:scale-95 transition cursor-pointer"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              type="button"
              onClick={() => generateMessage()}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>Alter</span>
            </button>
          </div>
        </div>

        {/* ── FOOTER CLOSE ── */}
        <div className="flex items-center justify-between border-t border-teal-900/10 bg-cream/20 px-5 py-3 text-xs text-teal-950/60">
          <span>Lead ID: #{lead.leadId} · Assigned: {lead.assignedCallerId || callerId}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-200 hover:bg-gray-300 text-teal-950 px-4 py-2 font-bold transition cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
