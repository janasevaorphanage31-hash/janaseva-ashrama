"use client";

import { useState, useEffect, useRef } from "react";
import type { AntiBanLanguage, OutreachAngle, MediaAsset } from "@/lib/whatsapp-antiban";
import { generateAntiBanMessage, CURATED_OUTREACH_MEDIA } from "@/lib/whatsapp-antiban";
import { SITE } from "@/lib/site";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";

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
  const [language, setLanguage] = useState<AntiBanLanguage>("kanglish");
  const [angle, setAngle] = useState<OutreachAngle>("annadana");
  const [selectedMediaId, setSelectedMediaId] = useState<string>("annadana_feast");
  const [senderMode, setSenderMode] = useState<"central" | "individual">(initialSenderMode);
  const [suggestedAmount, setSuggestedAmount] = useState<number | undefined>(undefined);

  // Generated state
  const [messageText, setMessageText] = useState<string>("");
  const [captionText, setCaptionText] = useState<string>("");
  const [saltToken, setSaltToken] = useState<string>("");
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const [activeMedia, setActiveMedia] = useState<MediaAsset>(CURATED_OUTREACH_MEDIA.annadana_feast);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [photoCopied, setPhotoCopied] = useState<boolean>(false);

  // Baileys WhatsApp Gateway state (Open-Source GitHub Engine)
  const [baileysStatus, setBaileysStatus] = useState<string>("disconnected");
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [baileysPhone, setBaileysPhone] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [sendingBaileys, setSendingBaileys] = useState<boolean>(false);
  const [connectingBaileys, setConnectingBaileys] = useState<boolean>(false);

  // Meta Cloud API Card dispatch state
  const [sendingApiCard, setSendingApiCard] = useState<boolean>(false);
  const [apiCardMessage, setApiCardMessage] = useState<string>("");

  // Live File / Camera Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [customUploadedFile, setCustomUploadedFile] = useState<{
    previewUrl: string;
    name: string;
    type: "image" | "video" | "document";
    size: string;
  } | null>(null);

  // High-Volume Safe Outreach Cooldown Timer
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Inline disposition logging
  const [disposition, setDisposition] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [callbackTime, setCallbackTime] = useState<string>("");
  const [loggingDisp, setLoggingDisp] = useState<boolean>(false);
  const [dispSuccess, setDispSuccess] = useState<boolean>(false);

  // Telecaller call pitch script
  const [showCallScript, setShowCallScript] = useState<boolean>(true);
  const [scriptLang, setScriptLang] = useState<"kanglish" | "kn" | "en">("kanglish");

  // Cooldown timer interval
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Generate / refresh altered message (Instant client-side calculation + background sync)
  const generateMessage = async (overrides?: {
    lang?: AntiBanLanguage;
    ang?: OutreachAngle;
    media?: string;
    mode?: "central" | "individual";
    amt?: number;
  }) => {
    if (!lead) return;
    setCopied(false);

    const activeLang = overrides?.lang ?? language;
    const activeAngle = overrides?.ang ?? angle;
    const activeMediaId = overrides?.media ?? selectedMediaId;
    const activeMode = overrides?.mode ?? senderMode;
    const activeAmt = overrides?.amt !== undefined ? overrides.amt : suggestedAmount;

    // 1. INSTANT LOCAL GENERATION (0ms guarantee, zero blank messages)
    const local = generateAntiBanMessage({
      leadId: lead.leadId,
      donorName: lead.name,
      callerId,
      callerName: callerName || "Janaseva Ashrama Volunteer",
      language: activeLang,
      angle: activeAngle,
      mediaId: activeMediaId,
      amount: activeAmt,
      baseUrl: typeof window !== "undefined" ? window.location.origin : SITE.url,
      masterWhatsAppNumber: masterWhatsAppNumber || SITE.phoneIntl,
      senderMode: activeMode,
    });

    setMessageText(local.messageText);
    setCaptionText(local.captionText);
    setSaltToken(local.saltToken);
    if (local.mediaAsset) {
      setActiveMedia(local.mediaAsset);
    }
    setWhatsappUrl(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(local.messageText)}`);

    // 2. SERVER SYNC (Non-blocking background enrichment)
    try {
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
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.messageText) {
          setMessageText(data.messageText);
          setCaptionText(data.captionText || data.messageText);
          setSaltToken(data.saltToken);
          setWhatsappUrl(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(data.messageText)}`);
          if (data.mediaAsset) {
            setActiveMedia(data.mediaAsset);
          }
        }
      }
    } catch {
      // Local message remains fully functional
    }
  };

  // Check Baileys WhatsApp Gateway status
  const checkBaileysStatus = async () => {
    try {
      const res = await fetch("/api/v1/telecaller/baileys");
      const data = await res.json();
      if (data.success) {
        setBaileysStatus(data.status);
        setBaileysQr(data.qrCodeDataUrl);
        setBaileysPhone(data.connectedPhone);
      }
    } catch {}
  };

  // Trigger regeneration on open or when key parameters change
  useEffect(() => {
    if (isOpen && lead) {
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
      setCustomUploadedFile(null);
      setApiCardMessage("");
      setLanguage("kanglish");

      void checkBaileysStatus();
      generateMessage({ lang: "kanglish", ang: initialAngle, media: initialMedia });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lead?.leadId]);

  // Polling for Baileys QR code completion when QR modal is active
  useEffect(() => {
    if (!showQrModal) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/v1/telecaller/baileys");
        const data = await res.json();
        if (data.success) {
          setBaileysStatus(data.status);
          setBaileysQr(data.qrCodeDataUrl);
          setBaileysPhone(data.connectedPhone);
          if (data.status === "connected") {
            setShowQrModal(false);
            setApiCardMessage(`🎉 Ashrama WhatsApp connected (+${data.connectedPhone || ""})!`);
            setTimeout(() => setApiCardMessage(""), 5000);
          }
        }
      } catch {}
    }, 2500);
    return () => clearInterval(interval);
  }, [showQrModal]);

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

  // Fixed endpoint: Uses /api/v1/leads/${lead.leadId}/log
  const handleSaveDisposition = async (chosenDisposition?: string) => {
    const dispToSave = chosenDisposition || disposition;
    if (!dispToSave) {
      alert("Please select a disposition (e.g. Interested, Reschedule, etc.)");
      return;
    }
    setLoggingDisp(true);
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
        setDispSuccess(true);
        setDisposition(dispToSave);
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

  // 1-Click Copy Photo to Clipboard (so telecaller can Paste Ctrl+V directly into WhatsApp)
  const handleCopyPhotoToClipboard = async () => {
    try {
      const mediaUrl = customUploadedFile?.previewUrl || activeMedia.url;
      const res = await fetch(mediaUrl);
      const blob = await res.blob();

      // Convert to PNG on canvas to ensure clipboard API compatibility across Chrome/Safari
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = mediaUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": pngBlob }),
        ]);
        setPhotoCopied(true);
        setTimeout(() => setPhotoCopied(false), 3500);
      }, "image/png");
    } catch (err) {
      console.warn("Clipboard photo copy fallback:", err);
      alert("Photo copy not supported on this browser. Use 'Share Real Photo' button instead.");
    }
  };

  // NATIVE MOBILE SHARE: Attaches REAL IMAGE FILE with Kanglish caption (100% matches Akshayakalpa card!)
  const handleShareRealMedia = async () => {
    if (!lead) return;
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);

    // Pre-copy customer phone number to clipboard for convenient paste into search
    try {
      await navigator.clipboard.writeText(formattedPhone);
    } catch {}

    try {
      const mediaUrl = customUploadedFile?.previewUrl || activeMedia.url;
      const filename = customUploadedFile?.name || activeMedia.filename || "janaseva-photo.jpg";

      const res = await fetch(mediaUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: captionText || messageText,
          title: "Janaseva Ashrama",
        });
        setApiCardMessage(`✓ Real photo & Kanglish message shared! Customer phone (${displayPhone}) copied to clipboard.`);
        setTimeout(() => setApiCardMessage(""), 5000);
        return;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Native share unsupported, falling back to direct web launch:", err);
    }

    // Fallback: Copy photo to clipboard and open wa.me directly
    await handleCopyPhotoToClipboard();
    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setApiCardMessage(`✓ Opened WhatsApp directly to ${displayPhone}! Photo is copied to clipboard.`);
    setTimeout(() => setApiCardMessage(""), 5000);
  };

  // SHARE PAYMENT QR SCANNER: Attaches the Official Axis Bank UPI Payment Standee QR image directly
  const handleShareQrScanner = async () => {
    if (!lead) return;
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);

    const qrAsset = CURATED_OUTREACH_MEDIA.payment_qr_scanner || {
      id: "payment_qr_scanner",
      url: `${SITE.url}/media/janaseva-axis-bank-qr.jpg`,
      filename: "janaseva-axis-bank-qr.jpg",
      title: "Axis Bank UPI Payment QR Scanner",
      type: "image" as const,
      description: "Official Axis Bank Standee QR",
    };

    setActiveMedia(qrAsset);
    setSelectedMediaId("payment_qr_scanner");

    // Pre-copy customer phone number to clipboard
    try {
      await navigator.clipboard.writeText(formattedPhone);
    } catch {}

    const qrCaption = `🙏 Namaskara ${lead.name} Sir/Madam!\n\nAttached is our Official Axis Bank UPI Payment QR Scanner for Janaseva Ashrama (Turahalli, Bengaluru). Scan directly via GPay / PhonePe / Paytm / BHIM:\n\n💳 UPI ID: MAB.037349050110044@axisbank\n🏛️ Registered Trust: JANASEVA SAMRUDDI EDUCATI\n📜 Karnataka Govt JJ Act Reg: KA18CH0242\n🧾 100% Tax Deductible (Section 80G Form 10AC)\n📍 Turahalli, Bengaluru · Google Maps: ${SITE.mapsUrl}`;

    try {
      const res = await fetch(qrAsset.url);
      const blob = await res.blob();
      const file = new File([blob], qrAsset.filename || "janaseva-axis-bank-qr.jpg", { type: blob.type || "image/jpeg" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: qrCaption,
          title: "Official Axis Bank Payment QR Scanner - Janaseva Ashrama",
        });
        setApiCardMessage(`✓ Axis Bank Payment QR Scanner shared! Customer phone (${displayPhone}) copied to clipboard.`);
        setTimeout(() => setApiCardMessage(""), 5000);
        return;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.warn("Native share unsupported for QR scanner, using clipboard fallback:", err);
    }

    // Fallback: Copy QR to clipboard and open wa.me
    try {
      const res = await fetch(qrAsset.url);
      const blob = await res.blob();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = qrAsset.url;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      canvas.toBlob(async (pngBlob) => {
        if (!pngBlob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": pngBlob })]);
        setPhotoCopied(true);
        setTimeout(() => setPhotoCopied(false), 3500);
      }, "image/png");
    } catch {}

    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(qrCaption)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setApiCardMessage(`✓ Opened WhatsApp directly to ${displayPhone}! Axis Bank QR Scanner is copied to clipboard.`);
    setTimeout(() => setApiCardMessage(""), 5000);
  };

  // DIRECT CUSTOMER WHATSAPP: 1-Tap launch strictly targeting the CUSTOMER's phone number in Kanglish
  const handleSendDirectToCustomer = async () => {
    if (!lead) return;
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);

    // 1. Copy real photo to clipboard so telecaller can effortlessly Ctrl+V / Paste in WhatsApp
    try {
      await handleCopyPhotoToClipboard();
    } catch {}

    // 2. Open WhatsApp strictly targeting the CUSTOMER'S exact phone number
    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    setApiCardMessage(`✓ Opened WhatsApp directly to Customer ${lead.name} (${displayPhone})! Photo is on clipboard.`);
    setTimeout(() => setApiCardMessage(""), 5000);
  };

  // BAILEYS WHATSAPP GATEWAY (Open-source direct server dispatch to customer number)
  const handleConnectBaileys = async () => {
    setShowQrModal(true);
    setConnectingBaileys(true);
    try {
      const res = await fetch("/api/v1/telecaller/baileys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (data.success) {
        setBaileysStatus(data.status);
        setBaileysQr(data.qrCodeDataUrl);
        setBaileysPhone(data.connectedPhone);
      }
    } catch (err: any) {
      alert("Error starting WhatsApp connection: " + err.message);
    } finally {
      setConnectingBaileys(false);
    }
  };

  const handleSendBaileys = async () => {
    if (!lead) return;
    if (baileysStatus !== "connected") {
      void handleConnectBaileys();
      return;
    }
    setSendingBaileys(true);
    setApiCardMessage("");
    try {
      const mediaUrl = customUploadedFile?.previewUrl || activeMedia.url;
      const res = await fetch("/api/v1/telecaller/baileys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          leadId: lead.leadId,
          recipientPhone: formattedPhone,
          messageText,
          mediaUrl,
          captionText: captionText || messageText,
          mediaType: customUploadedFile?.type || activeMedia.type || "image",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApiCardMessage(`⚡ Real photo & Kanglish message sent directly to Customer ${displayPhone} via Ashrama WhatsApp!`);
        setDisposition("Contacted");
        if (onDispositionLogged) {
          onDispositionLogged(lead.leadId, "Contacted", `Dispatched directly to customer ${displayPhone} via Baileys`);
        }
        setTimeout(() => setApiCardMessage(""), 5000);
      } else {
        alert("Baileys dispatch failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error sending via Baileys: " + err.message);
    } finally {
      setSendingBaileys(false);
    }
  };

  // META CLOUD API CARD DISPATCH (Dispatches to Customer's exact number)
  const handleSendMetaApiCard = async () => {
    if (!lead) return;
    setSendingApiCard(true);
    setApiCardMessage("");
    try {
      const res = await fetch("/api/v1/telecaller/dispatch-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.leadId,
          mediaUrl: activeMedia.url,
          captionText: captionText || messageText,
          mediaType: activeMedia.type === "video" ? "video" : activeMedia.type === "document" ? "document" : "image",
        }),
      });
      const data = await res.json();
      if (data.success && data.isApiConfigured) {
        setApiCardMessage(`🎉 Verified Meta Card delivered directly to Customer ${displayPhone}!`);
        setDisposition("Contacted");
        if (onDispositionLogged) {
          onDispositionLogged(lead.leadId, "Contacted", `Meta WhatsApp API Card dispatched to customer ${displayPhone}`);
        }
        setTimeout(() => setApiCardMessage(""), 5000);
      } else {
        // Fallback: Open WhatsApp directly to customer's number
        setApiCardMessage(`ℹ️ Meta Cloud API token not set; opening directly to Customer (${displayPhone}) via WhatsApp!`);
        setTimeout(() => setApiCardMessage(""), 4500);
        await handleSendDirectToCustomer();
      }
    } catch (err: any) {
      alert("Error dispatching Meta Card: " + err.message);
    } finally {
      setSendingApiCard(false);
    }
  };

  // Standard Click-to-Chat (wa.me) directly targeting Customer
  const handleLaunchWhatsApp = () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);
    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // Automatic Attended Marking when calling
  const handleLaunchCall = () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    window.location.href = `tel:${displayPhone.replace(/\s+/g, "")}`;
  };

  // Handle local file / camera upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const type = isImage ? "image" : isVideo ? "video" : "document";
    const previewUrl = URL.createObjectURL(file);
    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeInKb} KB`;

    setCustomUploadedFile({
      previewUrl,
      name: file.name,
      type,
      size: sizeStr,
    });
  };

  const phoneInfo = parseCustomerPhone(lead.phone);
  const formattedPhone = phoneInfo.waNumber;
  const displayPhone = phoneInfo.display;

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
        <div className="flex items-center justify-between border-b border-teal-900/10 bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 px-4 sm:px-5 py-3.5 sm:py-4 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 text-xl font-bold ring-1 ring-emerald-400/30">
              💬
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-sm sm:text-lg font-black truncate">
                  Anti-Ban WhatsApp Dispatch Hub
                </h3>
                <span className="shrink-0 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 border border-emerald-400/30">
                  🛡️ 0% Ban Risk
                </span>
              </div>
              <p className="text-xs text-white/75 truncate mt-0.5">
                Kanglish + Kannada + English · Real Media Cards · Action Call Buttons · Verified Maps Pin
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-900/10 bg-cream/40 px-4 sm:px-5 py-2.5 sm:py-3 text-xs">
          {/* Recipient info */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-950 text-white font-bold text-xs shrink-0">
              {lead.name[0]?.toUpperCase() || "L"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-teal-950 text-sm">{lead.name}</span>
                <span className="font-mono text-teal-950/70 bg-white px-2 py-0.5 rounded-md border border-teal-900/10 text-xs">
                  {displayPhone}
                </span>
                {lead.dobDay && lead.dobMonth && (
                  <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 font-bold text-[10px]">
                    🎂 {lead.dobDay} {MONTH_NAMES[lead.dobMonth - 1]}
                  </span>
                )}
                {lead.status && lead.status !== "Pending" ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5 font-bold text-[10px]">
                    ✓ Attended ({lead.status})
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 font-bold text-[10px]">
                    ⏳ Pending
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-36 sm:pb-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Controls, Language, Angle, Media Picker, Camera (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* 1. Language Pill Selector (Now includes Kanglish prominently!) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-teal-950/70">
                  🌐 Outreach Language
                </label>
                <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.2 rounded-full font-bold">
                  Recommended: Kanglish
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("kanglish")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "kanglish"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs ring-2 ring-amber-400"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">🔤</span>
                  <div className="text-left">
                    <div>Kanglish</div>
                    <div className="text-[10px] opacity-75 font-normal">Kannada in English script</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange("kn")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "kn"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">🇮🇳</span>
                  <div className="text-left">
                    <div>ಕನ್ನಡ (Pure)</div>
                    <div className="text-[10px] opacity-75 font-normal">Kannada script</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "en"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">🇬🇧</span>
                  <div className="text-left">
                    <div>English</div>
                    <div className="text-[10px] opacity-75 font-normal">Formal &amp; Corporate</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange("mixed")}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    language === "mixed"
                      ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                      : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                  }`}
                >
                  <span className="text-base">💬</span>
                  <div className="text-left">
                    <div>Manglish</div>
                    <div className="text-[10px] opacity-75 font-normal">Casual urban mix</div>
                  </div>
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
                        ? "bg-amber-400 text-teal-950 shadow-xs"
                        : "bg-white text-teal-950 border border-teal-900/15 hover:bg-cream"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Curated Media Attachment Picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-teal-950/70">
                  📎 Media Asset to Attach (Real Photo/Video)
                </label>
                <span className="text-[10px] text-teal-950/60 font-semibold">
                  1 Asset Embedded
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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

              {/* Selected Media Action Preview */}
              {activeMedia && (
                <div className="mt-2 rounded-2xl bg-cream/60 p-2.5 border border-teal-900/10 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-teal-950/60 uppercase">Selected Photo</p>
                    <p className="text-xs font-bold text-teal-950 truncate">{activeMedia.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyPhotoToClipboard}
                      className="rounded-lg bg-white px-2 py-1 text-[10px] font-bold text-teal-950 border border-teal-900/15 hover:bg-cream cursor-pointer"
                      title="Copy photo to clipboard so you can paste (Ctrl+V) directly into WhatsApp"
                    >
                      {photoCopied ? "✓ Copied!" : "📋 Copy Photo"}
                    </button>
                    <a
                      href={activeMedia.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-teal-950 px-2 py-1 text-[10px] font-bold text-white hover:bg-teal-900"
                      title="Open full resolution in new tab"
                    >
                      👁️ View
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Live Camera & Local File Picker (Live Kitchen Photo / Custom Video) */}
            <div className="rounded-2xl bg-teal-950/5 p-3 border border-teal-900/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-teal-950">
                  📸 Live Kitchen Camera &amp; Upload
                </span>
                <span className="text-[10px] text-teal-950/60 font-semibold">
                  Custom photo/video/PDF
                </span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white hover:bg-cream border border-teal-900/15 text-teal-950 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <span className="text-base">📷</span>
                  <span>Snap Kitchen Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white hover:bg-cream border border-teal-900/15 text-teal-950 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <span className="text-base">📁</span>
                  <span>Select File / PDF</span>
                </button>
              </div>

              {customUploadedFile && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2 min-w-0">
                    {customUploadedFile.type === "image" ? (
                      <img
                        src={customUploadedFile.previewUrl}
                        alt="Upload preview"
                        className="w-9 h-9 object-cover rounded-lg border border-emerald-400 shrink-0"
                      />
                    ) : (
                      <span className="text-2xl">📄</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-950 truncate">
                        {customUploadedFile.name}
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        {customUploadedFile.size} · Ready to attach
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomUploadedFile(null)}
                    className="text-emerald-900 hover:text-rose-700 text-xs font-bold px-2 py-1 cursor-pointer"
                    title="Remove attachment"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* 6. Bangalore Physical Location & Exact Verified Google Maps Pin from SITE */}
            <div className="rounded-2xl bg-cream/70 p-3 border border-teal-900/10 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-950 flex items-center gap-1.5">
                  <span>📍</span>
                  <span>Official Bangalore Location Proof</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  Verified Ashrama
                </span>
              </div>
              <p className="text-[11px] text-teal-950/80 leading-relaxed">
                {SITE.address}
              </p>
              <div className="flex items-center gap-3 pt-0.5">
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-900 hover:underline"
                >
                  <span>🗺️ Open Google Maps Pin ({SITE.mapsUrl.split("/").pop()})</span>
                </a>
                <span>·</span>
                <a
                  href={`tel:${SITE.phoneIntl}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 hover:underline"
                >
                  <span>📞 {SITE.phoneIntl}</span>
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Message Preview, Action Buttons, Media Share & Quick Logging (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Live Message Preview Header */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-teal-950/70 flex items-center gap-2">
                  <span>📝 Altered Message Preview ({language.toUpperCase()})</span>
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
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 hover:text-amber-800 cursor-pointer"
                  title="Spin a fresh unique message permutation"
                >
                  <span className={loading ? "animate-spin" : ""}>🔄</span>
                  <span>Alter Permutation</span>
                </button>
              </div>

              {/* Textarea */}
              <div className="relative rounded-2xl border border-teal-900/15 bg-sand/20 p-3 shadow-inner">
                <textarea
                  rows={9}
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    setCaptionText(e.target.value);
                  }}
                  className="w-full bg-transparent text-xs sm:text-sm text-teal-950 leading-relaxed focus:outline-hidden resize-none font-sans"
                  placeholder="Generating unique personalized message..."
                />

                <div className="flex items-center justify-between border-t border-teal-900/10 pt-2 text-[10px] text-teal-950/60">
                  <span>
                    Words: {messageText ? messageText.trim().split(/\s+/).length : 0} · Chars:{" "}
                    {messageText.length}
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <span>✓</span> Zero-Width Hash Salted · Anti-Ban Active
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Action Buttons Embedded in Card (Matching Akshayakalpa Sample) */}
            <div className="rounded-2xl bg-cream/70 p-3 border border-teal-900/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-teal-950">
                  🎯 WhatsApp Action Buttons (Call-to-Action)
                </span>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full font-bold">
                  Interactive Links
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`${SITE.url}/give?ref=${callerId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition"
                >
                  <span>🌐</span>
                  <span>1-Tap Donate Button</span>
                </a>
                <a
                  href={`tel:${SITE.phoneIntl}`}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-teal-950 hover:bg-teal-900 text-white text-xs font-black shadow-xs transition"
                >
                  <span>📞</span>
                  <span>Call Ashrama ({SITE.phoneIntl})</span>
                </a>
              </div>
            </div>

            {/* Pacing Cooldown / Anti-Ban Safety Meter */}
            {cooldownSeconds > 0 ? (
              <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-950 font-bold flex items-center justify-between animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="animate-spin text-base">⏱️</span>
                  <span>High-Volume Pacing Cooldown: Wait {cooldownSeconds}s before next send</span>
                </div>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border border-amber-400">
                  Rate-Limit Shield
                </span>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-950 font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Safety Engine: Ready to send next message (0% Ban Risk)</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                  Optimal Speed
                </span>
              </div>
            )}

            {apiCardMessage && (
              <div className="rounded-2xl bg-teal-950 text-gold p-3 text-xs font-bold border border-amber-400/30 animate-fadeIn">
                {apiCardMessage}
              </div>
            )}

            {/* ── PROGRESSIVE DISPATCH WORKFLOW (AUTOMATED OR STEP-WISE) ── */}
            <div className="space-y-3">
              {baileysStatus === "connected" ? (
                /* ⚡ AUTOMATED 1-CLICK DISPATCH (WHEN SCANNER IS LINKED) */
                <div className="rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 p-4 text-white shadow-lg border border-emerald-500/30 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                        Live Image Sharing Scanner Active (+{baileysPhone || "Linked"})
                      </span>
                    </div>
                    <span className="text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                      ⚡ 100% Complete Auto-Send
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendBaileys}
                    disabled={sendingBaileys}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:brightness-105 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">{sendingBaileys ? "⏳" : "⚡"}</span>
                    <span>
                      {sendingBaileys
                        ? `Sending Complete Media Package to ${displayPhone}...`
                        : `1-Click Complete Send to ${lead.name} (${displayPhone})`}
                    </span>
                  </button>
                  <p className="text-[10px] text-white/75 text-center mt-2">
                    Delivers real photo + donor-friendly Kanglish message directly to customer&apos;s WhatsApp!
                  </p>
                </div>
              ) : (
                /* 📋 STEP-WISE GUIDED OUTREACH (WHEN SCANNER NOT YET LINKED) */
                <div className="rounded-2xl bg-cream/40 border border-teal-900/15 p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">📋</span>
                      <span className="text-xs font-black uppercase tracking-wider text-teal-950">
                        Step-Wise Outreach Workflow:
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleConnectBaileys}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-teal-900 bg-white px-2.5 py-1 rounded-lg border border-teal-900/20 shadow-2xs hover:bg-sand transition cursor-pointer"
                      title="Scan QR once to enable 1-click automated photo sending"
                    >
                      <span>📱</span>
                      <span>Link WhatsApp Scanner</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Open Customer Chat */}
                    <button
                      type="button"
                      onClick={handleSendDirectToCustomer}
                      className="p-2.5 rounded-2xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-white text-left font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer min-h-[54px]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-teal-950 text-xs font-black shadow-xs">
                        💬
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-amber-300 truncate text-[11px]">WhatsApp Message</div>
                        <div className="text-[10px] font-normal opacity-85 truncate">
                          Pre-filled text &amp; UPI
                        </div>
                      </div>
                    </button>

                    {/* Share Payment QR Scanner */}
                    <button
                      type="button"
                      onClick={handleShareQrScanner}
                      className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-105 active:scale-95 text-white text-left font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer min-h-[54px]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-amber-900 text-xs font-black shadow-xs">
                        💳
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-white truncate text-[11px]">Payment QR</div>
                        <div className="text-[10px] font-normal opacity-90 truncate">
                          Axis Bank Standee
                        </div>
                      </div>
                    </button>

                    {/* Share Real Seva Photo */}
                    <button
                      type="button"
                      onClick={handleShareRealMedia}
                      className="p-2.5 rounded-2xl bg-[#25D366] hover:brightness-105 active:scale-95 text-white text-left font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer min-h-[54px]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-900 text-xs font-black shadow-xs">
                        📸
                      </span>
                      <div className="min-w-0">
                        <div className="font-black text-white truncate text-[11px]">Seva Photo</div>
                        <div className="text-[10px] font-normal opacity-90 truncate">
                          Meal Feast photo
                        </div>
                      </div>
                    </button>
                  </div>

                  <p className="text-[10px] text-teal-950/70 text-center font-medium">
                    💡 <strong>Pro-Tip</strong>: Tap <strong>Link WhatsApp Scanner</strong> above to pair your Ashrama WhatsApp once, and unlock 1-click automated complete sending!
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* ACTION 3: Meta Cloud API Verified Card */}
                <button
                  type="button"
                  onClick={handleSendMetaApiCard}
                  disabled={sendingApiCard}
                  className="focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-sand hover:bg-amber-100 text-teal-950 px-2.5 py-2 text-xs font-bold border border-teal-900/15 shadow-2xs transition cursor-pointer min-h-[40px] disabled:opacity-60"
                  title="Dispatches official verified card with buttons directly via Meta API"
                >
                  <span>{sendingApiCard ? "⏳" : "💎"}</span>
                  <span className="truncate">{sendingApiCard ? "Sending..." : "Meta Card"}</span>
                </button>

                {/* ACTION 4: Copy Photo to Clipboard (for Web / Desktop Ctrl+V) */}
                <button
                  type="button"
                  onClick={handleCopyPhotoToClipboard}
                  className="focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-cream text-teal-950 px-2.5 py-2 text-xs font-bold border border-teal-900/15 shadow-2xs transition cursor-pointer min-h-[40px]"
                  title="Copies photo binary so you can Paste (Ctrl+V) directly into WhatsApp Web"
                >
                  <span>{photoCopied ? "✓" : "🖼️"}</span>
                  <span className="truncate">{photoCopied ? "Copied!" : "Copy Photo"}</span>
                </button>

                {/* ACTION 5: Copy Message Text */}
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-cream text-teal-950 px-2.5 py-2 text-xs font-bold border border-teal-900/15 shadow-2xs transition cursor-pointer min-h-[40px]"
                  title="Copy formatted text message with action buttons"
                >
                  <span>{copied ? "✓" : "📋"}</span>
                  <span className="truncate">{copied ? "Copied!" : "Copy Text"}</span>
                </button>

                {/* ACTION 6: Direct wa.me link */}
                <button
                  type="button"
                  onClick={handleLaunchWhatsApp}
                  className="focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-cream text-teal-950 px-2.5 py-2 text-xs font-bold border border-teal-900/15 shadow-2xs transition cursor-pointer min-h-[40px]"
                  title="Launch standard click-to-chat"
                >
                  <span>💬</span>
                  <span className="truncate">wa.me Chat</span>
                </button>
              </div>
            </div>

            {/* ── TELECALLER 30-SECOND HIGH-TRUST CALL PITCH SCRIPT ── */}
            <div className="rounded-2xl border border-teal-900/15 bg-sand/30 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-teal-950 uppercase text-[11px]">
                  <span>🗣️</span>
                  <span>Telecaller Trust Pitch (Call Script)</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-teal-900/15 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setScriptLang("kanglish")}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      scriptLang === "kanglish" ? "bg-teal-950 text-white" : "text-teal-950/70 hover:text-teal-950"
                    }`}
                  >
                    Kanglish
                  </button>
                  <button
                    type="button"
                    onClick={() => setScriptLang("kn")}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      scriptLang === "kn" ? "bg-teal-950 text-white" : "text-teal-950/70 hover:text-teal-950"
                    }`}
                  >
                    ಕನ್ನಡ
                  </button>
                  <button
                    type="button"
                    onClick={() => setScriptLang("en")}
                    className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                      scriptLang === "en" ? "bg-teal-950 text-white" : "text-teal-950/70 hover:text-teal-950"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Script Box */}
              <div className="p-2.5 rounded-xl bg-white border border-teal-900/10 text-teal-950 leading-relaxed text-[11px] font-medium shadow-2xs">
                {scriptLang === "kanglish" && (
                  <p>
                    <strong className="text-teal-900 font-bold">&quot;Namaskara {lead.name} Sir/Madam!</strong> Naanu Janaseva Ashrama (Turahalli, Bengaluru) inda maathadthiddeve. Namma Ashrama dalli 25 anatha baalakarige nithya satvik oota needthiddivi. Namma samsthe Karnataka Sarkarada JJ Act (KA18CH0242) nalli registered aagide, mattu Income Tax 80G prakara 50% tax exemption receipt siguththe. <strong>Naanu iga nimma WhatsApp ge makkala photo mattu namma official Axis Bank payment scanner kalisthini Sir/Madam.</strong> Dayavittu nodi nimma anukoola prakara chikka sahaya maadi.&quot;
                  </p>
                )}
                {scriptLang === "kn" && (
                  <p>
                    <strong className="text-teal-900 font-bold">&quot;ನಮಸ್ಕಾರ {lead.name} ಅವರೇ!</strong> ನಾನು ತುರಹಳ್ಳಿಯ ಜನಸೇವಾ ಆಶ್ರಮದಿಂದ (ಬೆಂಗಳೂರು) ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. ನಮ್ಮಲ್ಲಿರುವ 25 ಬಾಲಕರ ನಿತ್ಯ ಅನ್ನದಾನ ಸೇವೆಗೆ ತಮ್ಮ ಸಹಕಾರ ಕೋರುತ್ತಿದ್ದೇವೆ. ನಮ್ಮದು ಸರ್ಕಾರದ ಅಧಿಕೃತ ಬಾಲನ್ಯಾಯ ಕಾಯ್ದೆಯಡಿ (JJ Act KA18CH0242) ನೋಂದಾಯಿತ ಆಶ್ರಮವಾಗಿದ್ದು, 80G ತೆರಿಗೆ ವಿನಾಯಿತಿ ಲಭ್ಯವಿದೆ. <strong>ನಾನು ಈಗ ತಮ್ಮ WhatsApp ಗೆ ಮಕ್ಕಳ ಊಟದ ಫೋಟೋ ಹಾಗೂ ಅಧಿಕೃತ ಆಕ್ಸಿಸ್ ಬ್ಯಾಂಕ್ ಪೇಮೆಂಟ್ ಸ್ಕ್ಯಾನರ್ ಕಳುಹಿಸುತ್ತೇನೆ.</strong> ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಸಹಾಯ ಮಾಡಿ.&quot;
                  </p>
                )}
                {scriptLang === "en" && (
                  <p>
                    <strong className="text-teal-900 font-bold">&quot;Hello {lead.name} Ji!</strong> Warm greetings from Janaseva Ashrama, Bengaluru. We care for 25 orphaned boys at our Turahalli home, providing nutritious meals, shelter, and schooling. We are Govt-licensed under JJ Act KA18CH0242 with 80G tax exemption. <strong>I am sharing our children&apos;s meal photo and official Axis Bank UPI Payment QR Scanner directly to your WhatsApp right now.</strong> Kindly review and support our resident children with whatever amount is comfortable for you.&quot;
                  </p>
                )}
              </div>

              {/* Call to Action for Telecaller */}
              <div className="flex items-center justify-between text-[10px] text-teal-950/75 pt-0.5">
                <span>⚡ <strong>Tip:</strong> Call the donor first, speak 30 seconds, then tap Step 1 &amp; Step 2!</span>
                <button
                  type="button"
                  onClick={handleLaunchCall}
                  className="font-bold text-teal-900 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>📞 Call {displayPhone}</span>
                </button>
              </div>
            </div>

            {/* Direct Phone Call Button (Auto marks attended) */}
            <div className="flex items-center justify-between bg-cream/40 p-2.5 rounded-2xl border border-teal-900/10 text-xs">
              <span className="text-teal-950/70 font-medium">Prefer speaking on call first?</span>
              <button
                type="button"
                onClick={handleLaunchCall}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                <span>📞</span>
                <span>Call Lead ({displayPhone})</span>
              </button>
            </div>

            {/* ── QUICK CALL LOGGING / DISPOSITION INLINE ── */}
            <div className="rounded-2xl border border-teal-900/15 bg-white p-3.5 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-950">
                  ⚡ 1-Tap Disposition Log
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
                  { label: "Interested 👍", val: "Interested", color: "bg-emerald-600 text-white" },
                  { label: "Reschedule 📅", val: "Reschedule", color: "bg-blue-600 text-white" },
                  { label: "No Answer ⏳", val: "No_Answer", color: "bg-gray-600 text-white" },
                  { label: "Donated 🎉", val: "Donated", color: "bg-amber-600 text-white" },
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
                  placeholder="Add quick notes (e.g. Requested 80G tax receipt PDF)..."
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
                  {loggingDisp ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY MOBILE ACTION BAR ── */}
        <div className="sm:hidden sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-3 shadow-lg z-20 space-y-2">
          {/* Main 1-tap Action: Baileys 1-Click if connected, or Share Real Photo if disconnected */}
          <button
            type="button"
            onClick={baileysStatus === "connected" ? handleSendBaileys : handleShareRealMedia}
            disabled={sendingBaileys}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer ${
              baileysStatus === "connected"
                ? "bg-gradient-to-r from-emerald-600 to-teal-800"
                : "bg-[#25D366] active:bg-[#1faa53]"
            }`}
          >
            <span className="text-xl">{baileysStatus === "connected" ? (sendingBaileys ? "⏳" : "⚡") : "📲"}</span>
            <div className="text-left">
              <div className="font-black leading-tight">
                {baileysStatus === "connected"
                  ? (sendingBaileys ? `Sending to ${displayPhone}...` : `1-Click Auto-Send (${displayPhone})`)
                  : `Share Real Photo + Message (${displayPhone})`}
              </div>
              <div className="text-[10px] font-normal opacity-90 leading-tight">
                {baileysStatus === "connected"
                  ? "Real photo & message delivered via Ashrama WhatsApp"
                  : "Attaches photo file to WhatsApp · Customer phone copied"}
              </div>
            </div>
          </button>

          {/* Quick Row: Call Customer, Direct Chat (wa.me), Baileys Gateway */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleLaunchCall}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-teal-950 text-white text-xs font-bold active:scale-95 transition cursor-pointer"
              title={`Call ${lead.name} (${displayPhone})`}
            >
              <span>📞</span>
              <span>Call</span>
            </button>
            <button
              type="button"
              onClick={handleSendDirectToCustomer}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold active:scale-95 transition cursor-pointer"
              title="Open customer chat directly"
            >
              <span>💬</span>
              <span>Direct Chat</span>
            </button>
            <button
              type="button"
              onClick={baileysStatus === "connected" ? handleSendBaileys : handleConnectBaileys}
              className="flex h-10 items-center justify-center gap-1 rounded-xl bg-cream border border-teal-900/15 text-teal-950 text-xs font-bold active:scale-95 transition cursor-pointer"
              title={baileysStatus === "connected" ? "Send real media via Ashrama Gateway" : "Connect Gateway"}
            >
              <span>{baileysStatus === "connected" ? "⚡" : "📱"}</span>
              <span>{baileysStatus === "connected" ? "Gateway" : "Link QR"}</span>
            </button>
          </div>
        </div>

        {/* ── FOOTER CLOSE ── */}
        <div className="flex items-center justify-between border-t border-teal-900/10 bg-cream/20 px-4 sm:px-5 py-3 text-xs text-teal-950/60">
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

      {/* ── BAILEYS QR CODE MODAL ── */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/15 text-center text-teal-950 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inline-flex p-3 rounded-2xl bg-teal-950 text-gold mb-3 shadow-md">
              <span className="text-3xl">📱</span>
            </div>
            <h3 className="font-display text-lg font-bold text-teal-950">
              Link Ashrama WhatsApp
            </h3>
            <p className="text-xs text-teal-950/70 mt-1 leading-relaxed">
              Scan this QR code with WhatsApp to connect the automated Baileys sending gateway.
            </p>

            <div className="my-4 p-3 bg-sand/30 rounded-2xl border border-teal-900/10 flex flex-col items-center justify-center min-h-[260px]">
              {connectingBaileys ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="animate-spin text-3xl">⏳</span>
                  <span className="text-xs font-bold text-teal-950">Generating WhatsApp QR...</span>
                </div>
              ) : baileysQr ? (
                <div className="space-y-2">
                  <img
                    src={baileysQr}
                    alt="WhatsApp QR Code"
                    className="w-56 h-56 mx-auto rounded-xl shadow-xs border border-teal-900/10"
                  />
                  <p className="text-[11px] font-semibold text-emerald-800 animate-pulse">
                    ⚡ Waiting for scan from WhatsApp...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-teal-950/70">Click below to initialize QR connection</p>
                  <button
                    type="button"
                    onClick={handleConnectBaileys}
                    className="rounded-xl bg-teal-950 text-gold font-bold px-4 py-2 text-xs shadow-xs"
                  >
                    Generate QR Code
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] text-teal-950/70 text-left bg-cream p-3 rounded-xl border border-teal-900/10 space-y-1">
              <p className="font-bold text-teal-950">How to scan:</p>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Open WhatsApp on the ashrama phone</li>
                <li>Tap <b>Settings</b> or <b>3 Dots</b> &gt; <b>Linked Devices</b></li>
                <li>Tap <b>Link a Device</b> and point camera here</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full mt-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-teal-950 py-2.5 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
