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
  initialLanguage?: AntiBanLanguage;
  onDispositionLogged?: (leadId: number, disposition: string, notes?: string, callbackTime?: string) => void;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface OutreachTemplate {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  badge?: string;
  angle: OutreachAngle;
  mediaId: string;
  suggestedAmount?: number;
  description: string;
}

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    id: "birthday_wishes",
    name: "🎂 ಹುಟ್ಟುಹಬ್ಬ ಸೇವೆ (Birthday)",
    shortLabel: "Birthday",
    icon: "🎂",
    badge: "Direct Donor",
    angle: "birthday",
    mediaId: "birthday_celebration",
    suggestedAmount: 2500,
    description: "Celebration with children's fruit feast & special prayer",
  },
  {
    id: "child_blessing",
    name: "👶 ಮಕ್ಕಳ ಆಶೀರ್ವಾದ (Child Blessing)",
    shortLabel: "Child Blessing",
    icon: "👶",
    badge: "Parents Sheet",
    angle: "birthday",
    mediaId: "ashrama_tour_video",
    suggestedAmount: 1500,
    description: "Special prayer for donor's child in the Ashrama hall",
  },
  {
    id: "annadana_meals",
    name: "🍲 ಅನ್ನದಾನ ಸೇವೆ (Annadana)",
    shortLabel: "Annadana",
    icon: "🍲",
    badge: "Popular",
    angle: "annadana",
    mediaId: "annadana_feast",
    suggestedAmount: 2500,
    description: "Full-day satvik feast for 25 resident orphaned boys",
  },
  {
    id: "upi_qr_standee",
    name: "💳 ಬ್ಯಾಂಕ್ ಕ್ಯೂಆರ್ (Bank QR)",
    shortLabel: "Bank QR",
    icon: "💳",
    badge: "Instant Scan",
    angle: "trust_80g",
    mediaId: "payment_qr_scanner",
    suggestedAmount: undefined,
    description: "Official Axis Bank standee for GPay / PhonePe / Paytm",
  },
  {
    id: "tax_80g_receipt",
    name: "📜 80G ತೆರಿಗೆ (80G Tax)",
    shortLabel: "80G Tax",
    icon: "📜",
    badge: "50% Rebate",
    angle: "trust_80g",
    mediaId: "form_10ac_80g",
    suggestedAmount: 5000,
    description: "Govt JJ Act KA18CH0242 tax exemption certificate",
  },
  {
    id: "polite_callback",
    name: "⏰ ಮರುಕರೆ ನೆನಪೋಲೆ (Followup)",
    shortLabel: "Followup",
    icon: "⏰",
    badge: "Callback",
    angle: "annadana",
    mediaId: "prayer_assembly",
    suggestedAmount: 1500,
    description: "Gentle reminder with morning shloka assembly & prayer",
  },
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
  initialLanguage = "kanglish",
  onDispositionLogged,
}: AntiBanWhatsAppModalProps) {
  // 1-Tap Active Template state
  const [activeTemplateId, setActiveTemplateId] = useState<string>("birthday_wishes");
  const [language, setLanguage] = useState<AntiBanLanguage>(initialLanguage);
  const [angle, setAngle] = useState<OutreachAngle>("birthday");
  const [selectedMediaId, setSelectedMediaId] = useState<string>("birthday_celebration");
  const [senderMode, setSenderMode] = useState<"central" | "individual">(
    callerId === "ADMIN" ? initialSenderMode : "individual"
  );
  const [suggestedAmount, setSuggestedAmount] = useState<number | undefined>(2500);

  // Generated state
  const [messageText, setMessageText] = useState<string>("");
  const [captionText, setCaptionText] = useState<string>("");
  const [saltToken, setSaltToken] = useState<string>("");
  const [whatsappUrl, setWhatsappUrl] = useState<string>("");
  const [activeMedia, setActiveMedia] = useState<MediaAsset>(CURATED_OUTREACH_MEDIA.birthday_celebration);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [photoCopied, setPhotoCopied] = useState<boolean>(false);

  // Mobile Drawers / Accordions
  const [showAdvancedControls, setShowAdvancedControls] = useState<boolean>(false);
  const [showCallScript, setShowCallScript] = useState<boolean>(false);

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

  // Telecaller call pitch script language
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
    const isParent = lead.stream === "PARENTS" || Boolean(lead.parentName || lead.childName);
    const effectiveChild = (
      lead.childName && lead.childName.trim().toLowerCase() !== "child"
        ? lead.childName.trim()
        : lead.name.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim() || "Child"
    );

    const local = generateAntiBanMessage({
      leadId: lead.leadId,
      leadName: isParent ? effectiveChild : lead.name,
      donorName: isParent ? (lead.parentName || effectiveChild) : lead.name,
      parentName: lead.parentName || lead.name,
      childName: isParent ? effectiveChild : undefined,
      stream: isParent ? "PARENTS" : ((lead.stream as any) || undefined),
      callerId,
      callerName: callerName || "Janaseva Ashrama Volunteer",
      language: activeLang,
      angle: activeAngle,
      mediaId: activeMediaId,
      amount: activeAmt,
      mode: "concise",
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

  // Trigger regeneration on open or when lead changes
  useEffect(() => {
    if (isOpen && lead) {
      // Smart Auto-Select Template
      let defaultTmplId = "birthday_wishes";
      if (lead.stream === "PARENTS" || lead.childName || lead.parentName) {
        defaultTmplId = "child_blessing";
      } else if (lead.dobDay && lead.dobMonth) {
        defaultTmplId = "birthday_wishes";
      } else {
        defaultTmplId = "annadana_meals";
      }

      const tmpl = OUTREACH_TEMPLATES.find((t) => t.id === defaultTmplId) || OUTREACH_TEMPLATES[0];
      setActiveTemplateId(tmpl.id);
      setAngle(tmpl.angle);
      setSelectedMediaId(tmpl.mediaId);
      setSuggestedAmount(tmpl.suggestedAmount);

      setDisposition(lead.status || "");
      setNotes("");
      setCallbackTime("");
      setDispSuccess(false);
      setCustomUploadedFile(null);
      setApiCardMessage("");
      setLanguage(initialLanguage);

      void checkBaileysStatus();
      generateMessage({
        lang: initialLanguage,
        ang: tmpl.angle,
        media: tmpl.mediaId,
        amt: tmpl.suggestedAmount,
      });
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

  // 1-Tap Template Selection Handler
  const handleSelectTemplate = (tmpl: OutreachTemplate) => {
    setActiveTemplateId(tmpl.id);
    setAngle(tmpl.angle);
    setSelectedMediaId(tmpl.mediaId);
    setSuggestedAmount(tmpl.suggestedAmount);
    generateMessage({
      ang: tmpl.angle,
      media: tmpl.mediaId,
      amt: tmpl.suggestedAmount,
    });
  };

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

  // Safe Disposition Logger
  const handleSaveDisposition = async (chosenDisposition?: string) => {
    const dispToSave = chosenDisposition || disposition;
    if (!dispToSave) {
      setApiCardMessage("⚠️ Please select a disposition (e.g. Interested, Reschedule, etc.)");
      setTimeout(() => setApiCardMessage(""), 4000);
      return;
    }
    setLoggingDisp(true);
    try {
      const validCallbackIso =
        callbackTime && !isNaN(new Date(callbackTime).getTime())
          ? new Date(callbackTime).toISOString()
          : undefined;

      const res = await fetch(`/api/v1/leads/${lead.leadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition: dispToSave,
          notes: notes.trim() || undefined,
          callbackTime: validCallbackIso,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDispSuccess(true);
        setDisposition(dispToSave);
        setApiCardMessage(`✓ Saved disposition: ${dispToSave}`);
        if (onDispositionLogged) {
          onDispositionLogged(lead.leadId, dispToSave, notes, callbackTime);
        }
        setTimeout(() => {
          setDispSuccess(false);
          setApiCardMessage("");
        }, 3500);
      } else {
        setApiCardMessage("⚠️ Failed to log disposition: " + (data.error || "Unknown error"));
        setTimeout(() => setApiCardMessage(""), 5000);
      }
    } catch (err: any) {
      setApiCardMessage("⚠️ Error saving disposition: " + err.message);
      setTimeout(() => setApiCardMessage(""), 5000);
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
        setTimeout(() => setPhotoCopied(false), 3000);
      });
    } catch (err: any) {
      // Fallback: Copy direct URL
      navigator.clipboard.writeText(customUploadedFile?.previewUrl || activeMedia.url);
      setPhotoCopied(true);
      setTimeout(() => setPhotoCopied(false), 3000);
    }
  };

  // STEP 1: Share Real Media Card directly with Customer
  const handleShareRealMedia = async () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);

    const mediaUrl = customUploadedFile?.previewUrl || activeMedia.url;
    const mediaTitle = customUploadedFile?.name || activeMedia.title;

    if (navigator.share) {
      try {
        const res = await fetch(mediaUrl);
        const blob = await res.blob();
        const extension = activeMedia.type === "video" ? "mp4" : activeMedia.type === "document" ? "pdf" : "jpg";
        const file = new File([blob], `${activeMedia.filename || `ashrama-media.${extension}`}`, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: mediaTitle,
            text: captionText || messageText,
          });
          setApiCardMessage(`✓ Photo shared to customer WhatsApp (${displayPhone})!`);
          setTimeout(() => setApiCardMessage(""), 5000);
          return;
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    // Fallback: Copy customer phone and open direct WhatsApp chat
    navigator.clipboard.writeText(displayPhone.replace(/\s+/g, ""));
    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      `[Photo: ${mediaTitle} - ${mediaUrl}]\n\n${messageText}`
    )}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setApiCardMessage(`✓ Customer ${displayPhone} phone copied! WhatsApp opened.`);
    setTimeout(() => setApiCardMessage(""), 5000);
  };

  // STEP 2: Share Axis Bank UPI Payment QR Standee
  const handleShareQrScanner = async () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    const qrMedia = CURATED_OUTREACH_MEDIA.payment_qr_scanner;
    if (navigator.share) {
      try {
        const res = await fetch(qrMedia.url);
        const blob = await res.blob();
        const file = new File([blob], qrMedia.filename || "janaseva-axis-bank-qr.jpg", { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: qrMedia.title,
            text: `Namaskara ${lead.name} Ji! Janaseva Ashrama official Axis Bank UPI Payment QR Scanner. Scan with GPay / PhonePe / Paytm / BHIM.\n\n${messageText}`,
          });
          setApiCardMessage(`✓ Axis Bank UPI QR dispatched to customer ${displayPhone}!`);
          setTimeout(() => setApiCardMessage(""), 5000);
          return;
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }

    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      `[Axis Bank QR Scanner: ${qrMedia.url}]\n\n${messageText}`
    )}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // STEP 3: Direct WhatsApp Chat with Customer
  const handleSendDirectToCustomer = async () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);
    try {
      await handleCopyPhotoToClipboard();
    } catch {}

    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");

    setApiCardMessage(`✓ Opened WhatsApp directly to Customer ${lead.name} (${displayPhone})! Photo copied.`);
    setTimeout(() => setApiCardMessage(""), 5000);
  };

  // BAILEYS WHATSAPP GATEWAY (Open-source direct server dispatch)
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
      setApiCardMessage("⚠️ Error starting WhatsApp connection: " + err.message);
      setTimeout(() => setApiCardMessage(""), 5000);
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
        setApiCardMessage(`⚡ Real photo & message sent directly to Customer ${displayPhone} via Ashrama WhatsApp!`);
        setDisposition("Contacted");
        if (onDispositionLogged) {
          onDispositionLogged(lead.leadId, "Contacted", `Dispatched directly to customer ${displayPhone} via Baileys`);
        }
        setTimeout(() => setApiCardMessage(""), 5000);
      } else {
        setApiCardMessage("⚠️ Baileys dispatch failed: " + (data.error || "Unknown error"));
        setTimeout(() => setApiCardMessage(""), 5000);
      }
    } catch (err: any) {
      setApiCardMessage("⚠️ Error sending via Baileys: " + err.message);
      setTimeout(() => setApiCardMessage(""), 5000);
    } finally {
      setSendingBaileys(false);
    }
  };

  // META CLOUD API CARD DISPATCH
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
        setApiCardMessage(`ℹ️ Meta Cloud API token not set; opening directly to Customer (${displayPhone}) via WhatsApp!`);
        setTimeout(() => setApiCardMessage(""), 4500);
        await handleSendDirectToCustomer();
      }
    } catch (err: any) {
      setApiCardMessage("⚠️ Error dispatching Meta Card: " + err.message);
      setTimeout(() => setApiCardMessage(""), 5000);
    } finally {
      setSendingApiCard(false);
    }
  };

  // Standard Click-to-Chat (wa.me)
  const handleLaunchWhatsApp = () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    setCooldownSeconds(10);
    const targetUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  // Direct Phone Call
  const handleLaunchCall = () => {
    if (!lead.status || lead.status === "Pending") {
      void handleSaveDisposition("Contacted");
    }
    window.location.href = `tel:${displayPhone.replace(/\s+/g, "")}`;
  };

  // Local file / camera upload
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

  const isParentLead = lead.stream === "PARENTS" || Boolean(lead.parentName || lead.childName);
  const rawChild = lead.childName?.trim();
  const rawName = lead.name?.trim() || "";
  let effectiveChildName = "";
  if (rawChild && rawChild.toLowerCase() !== "child") {
    effectiveChildName = rawChild;
  } else if (rawName.toLowerCase().startsWith("child (") && rawName.endsWith(")")) {
    const inside = rawName.slice(7, -1).trim();
    if (inside && inside.toLowerCase() !== "child" && inside.toLowerCase() !== "parent") {
      effectiveChildName = `${inside} ಅವರ ಮಗು`;
    }
  } else {
    const stripped = rawName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
    if (stripped && stripped.toLowerCase() !== "child") {
      effectiveChildName = stripped;
    }
  }
  if (!effectiveChildName && lead.parentName && lead.parentName.trim() && lead.parentName.trim().toLowerCase() !== "parent") {
    effectiveChildName = `${lead.parentName.trim()} ಅವರ ಮಗು`;
  }
  if (!effectiveChildName) {
    effectiveChildName = "ವಿದ್ಯಾರ್ಥಿ / ಮಗು";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl border border-teal-900/15 overflow-hidden text-teal-950 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 1. COMPACT TOP HEADER ── */}
        <div className="flex items-center justify-between border-b border-teal-900/10 bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-white shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 text-lg font-bold ring-1 ring-emerald-400/30">
              💬
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-display text-xs sm:text-base font-black truncate">
                  Anti-Ban WhatsApp Dispatcher
                </h3>
                <span className="rounded-full bg-emerald-400/20 text-emerald-300 text-[9px] font-black uppercase px-2 py-0.2 border border-emerald-400/30 shrink-0">
                  🛡️ 0% Ban Risk
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-white/70 truncate">
                1-Tap Templates · Real Photos · Axis Bank UPI · 80G Tax Receipt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0 ml-2"
            title="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* ── 2. RECIPIENT & SENDER CONTEXT BAR ── */}
        <div className="flex items-center justify-between gap-2 border-b border-teal-900/10 bg-cream/40 px-3.5 sm:px-5 py-2 text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-950 text-white font-bold text-xs shrink-0">
              {lead.name[0]?.toUpperCase() || "L"}
            </div>
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-teal-950 text-xs sm:text-sm truncate">
                {isParentLead ? `👶 ${effectiveChildName}` : lead.name}
              </span>
              <span className="font-mono text-teal-950/70 bg-white px-1.5 py-0.2 rounded border border-teal-900/10 text-[11px]">
                {displayPhone}
              </span>
              {lead.dobDay && lead.dobMonth && (
                <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.2 font-bold text-[10px] shrink-0">
                  🎂 {lead.dobDay} {MONTH_NAMES[lead.dobMonth - 1]}
                </span>
              )}
              {isParentLead && (
                <span className="rounded-full bg-indigo-100 text-indigo-900 px-2 py-0.2 font-bold text-[10px] shrink-0 flex items-center gap-1">
                  <span>👶 ಮಗು:</span>
                  <strong>{effectiveChildName}</strong>
                </span>
              )}
              {isParentLead && lead.parentName && (
                <span className="rounded-full bg-purple-100 text-purple-900 px-2 py-0.2 font-bold text-[10px] shrink-0">
                  👨‍👩‍👧 ಪೋಷಕರು: {lead.parentName}
                </span>
              )}
              {lead.stream && (
                <span className={`rounded-full px-2 py-0.2 font-bold text-[10px] shrink-0 ${
                  isParentLead ? "bg-indigo-950 text-amber-300" : "bg-blue-100 text-blue-900"
                }`}>
                  {isParentLead ? "Parents Sheet" : "Direct Donor"}
                </span>
              )}
              {lead.status && lead.status !== "Pending" ? (
                <span className="rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.2 font-bold text-[10px] shrink-0">
                  ✓ Attended ({lead.status})
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.2 font-bold text-[10px] shrink-0">
                  ⏳ Pending
                </span>
              )}
            </div>
          </div>

          {/* Sender indicator */}
          {callerId === "ADMIN" ? (
            <div className="inline-flex rounded-lg bg-white p-0.5 border border-teal-900/15 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => handleSenderModeChange("central")}
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                  senderMode === "central" ? "bg-teal-950 text-white" : "text-teal-950/70"
                }`}
              >
                🏢 Central
              </button>
              {callerWhatsAppNumber && (
                <button
                  type="button"
                  onClick={() => handleSenderModeChange("individual")}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition cursor-pointer ${
                    senderMode === "individual" ? "bg-teal-950 text-white" : "text-teal-950/70"
                  }`}
                >
                  👤 TC
                </button>
              )}
            </div>
          ) : (
            <div className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 shrink-0">
              📱 TC: <strong className="font-mono">{callerId}</strong>
            </div>
          )}
        </div>

        {/* ── 3. SCROLLABLE WORKSPACE (ZERO HORIZONTAL/VERTICAL OVERHEAD) ── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 pb-36 sm:pb-5">

          {/* ── SECTION A: 1-TAP OUTREACH TEMPLATES (PRIMARY MAIN SELECTOR) ── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                <span>⚡</span>
                <span>1-Tap Outreach Templates (Content + Photo + QR)</span>
              </label>
              <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.2 rounded-full font-bold">
                1 Click Auto-Configures All
              </span>
            </div>

            {/* 6 Responsive Grid Cards (Medium-Size Buttons for Easy Touch) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {OUTREACH_TEMPLATES.map((tmpl) => {
                const isSelected = activeTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`min-h-[56px] p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1 relative ${
                      isSelected
                        ? "bg-teal-950 text-white border-teal-950 shadow-md ring-2 ring-amber-400"
                        : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0">{tmpl.icon}</span>
                        <span className="font-black text-xs sm:text-sm truncate">
                          {tmpl.name}
                        </span>
                      </div>
                      {tmpl.badge && (
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-amber-400 text-teal-950"
                            : "bg-teal-950/10 text-teal-950"
                        }`}>
                          {tmpl.badge}
                        </span>
                      )}
                    </div>
                    <p className={`text-[11px] line-clamp-1 leading-tight font-medium ${
                      isSelected ? "text-amber-200" : "text-teal-950/70"
                    }`}>
                      {tmpl.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-teal-950 text-xs font-black shadow-xs">
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION B: COMPACT 1-ROW LANGUAGE BAR ── */}
          <div className="flex items-center justify-between gap-1.5 bg-sand/30 p-1.5 rounded-xl border border-teal-900/10">
            <span className="text-[10px] font-black uppercase text-teal-950/70 shrink-0 px-1">
              🌐 ಭಾಷೆ (Lang):
            </span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
              {[
                { id: "kanglish", label: "🔤 Kanglish (Recommended)" },
                { id: "kn", label: "🇮🇳 ಕನ್ನಡ (Pure)" },
                { id: "en", label: "🇬🇧 English" },
                { id: "mixed", label: "💬 Manglish" },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleLanguageChange(l.id as AntiBanLanguage)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0 ${
                    language === l.id
                      ? "bg-teal-950 text-gold shadow-2xs ring-1 ring-amber-400"
                      : "bg-white text-teal-950/80 hover:bg-cream border border-teal-900/10"
                  }`}
                >
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── SECTION C: LIVE ALTERED ANTI-BAN MESSAGE & ATTACHED PHOTO CARD (ABOVE FOLD ON MOBILE) ── */}
          <div className="rounded-2xl border border-teal-900/15 bg-white p-3 space-y-2.5 shadow-xs">
            {/* Header with Anti-Ban Badge + Spin Permutation */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base">💬</span>
                <span className="text-xs font-black uppercase text-teal-950 truncate">
                  Anti-Ban Message Preview
                </span>
                {saltToken && (
                  <span className="font-mono text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                    Shield #{saltToken}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => generateMessage()}
                disabled={loading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950 text-white text-[11px] font-bold cursor-pointer shrink-0 shadow-2xs hover:bg-teal-900 transition"
                title="Spin a fresh unique message permutation"
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                <span>Spin Variation</span>
              </button>
            </div>

            {/* Attached Media Asset Banner (Mini Photo Thumbnail + Copy Photo) */}
            <div className="flex items-center justify-between gap-2 bg-cream/70 p-2 rounded-xl border border-teal-900/10">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-teal-950/10 overflow-hidden shrink-0 flex items-center justify-center border border-teal-900/15">
                  {customUploadedFile ? (
                    customUploadedFile.type === "image" ? (
                      <img src={customUploadedFile.previewUrl} alt="Upload" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">📄</span>
                    )
                  ) : activeMedia.type === "image" ? (
                    <img
                      src={activeMedia.url}
                      alt={activeMedia.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-lg">{activeMedia.type === "video" ? "🎥" : "📄"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-teal-950/60">Attached Photo/QR:</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1 rounded font-bold uppercase">Ready</span>
                  </div>
                  <p className="text-xs font-bold text-teal-950 truncate">
                    {customUploadedFile?.name || activeMedia.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyPhotoToClipboard}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-cream border border-teal-900/15 text-[10px] font-bold text-teal-950 cursor-pointer shadow-2xs"
                  title="Copy photo to clipboard so you can paste (Ctrl+V) directly into WhatsApp"
                >
                  {photoCopied ? "✓ Copied!" : "📋 Copy Photo"}
                </button>
                <a
                  href={customUploadedFile?.previewUrl || activeMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded-lg bg-teal-950 hover:bg-teal-900 text-[10px] font-bold text-white shadow-2xs"
                >
                  👁️ View
                </a>
              </div>
            </div>

            {/* WhatsApp Message Preview Textarea */}
            <div className="relative rounded-xl border border-teal-900/15 bg-sand/20 p-2.5 shadow-inner">
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setCaptionText(e.target.value);
                }}
                className="w-full bg-transparent text-xs text-teal-950 leading-relaxed focus:outline-hidden resize-none font-sans"
                placeholder="Generating personalized anti-ban message..."
              />
              <div className="flex items-center justify-between border-t border-teal-900/10 pt-1.5 text-[10px] text-teal-950/60">
                <span>
                  {messageText ? messageText.trim().split(/\s+/).length : 0} words · {messageText.length} chars
                </span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <span>🛡️</span> 0% Ban Risk · Zero-Width Hash Salted
                </span>
              </div>
            </div>
          </div>

          {/* Status Alert Banner */}
          {apiCardMessage && (
            <div className="rounded-2xl bg-teal-950 text-gold p-3 text-xs font-bold border border-amber-400/30 animate-fadeIn">
              {apiCardMessage}
            </div>
          )}

          {/* Pacing Cooldown / Anti-Ban Safety Meter */}
          {cooldownSeconds > 0 && (
            <div className="rounded-2xl bg-amber-500/15 border border-amber-500/30 p-2.5 text-xs text-amber-950 font-bold flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="animate-spin text-base">⏱️</span>
                <span>High-Volume Pacing Cooldown: Wait {cooldownSeconds}s before next send</span>
              </div>
              <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border border-amber-400">
                Rate-Limit Shield
              </span>
            </div>
          )}

          {/* ── SECTION D: COLLAPSIBLE CUSTOM OVERRIDES DRAWER ── */}
          <div className="rounded-2xl border border-teal-900/15 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowAdvancedControls(!showAdvancedControls)}
              className="w-full flex items-center justify-between p-3 bg-cream/40 hover:bg-cream text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">⚙️</span>
                <div>
                  <div className="text-xs font-black text-teal-950">
                    Custom Overrides &amp; Camera Upload
                  </div>
                  <div className="text-[10px] text-teal-950/60 font-medium">
                    Snap kitchen photo, pick manual angle, custom amount tiers, or full media catalog
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-950 px-2 py-0.5 rounded-lg bg-white border border-teal-900/10 shrink-0 ml-2">
                {showAdvancedControls ? "▲ Hide" : "▼ Customize"}
              </span>
            </button>

            {showAdvancedControls && (
              <div className="p-3.5 space-y-4 border-t border-teal-900/10 animate-fadeIn bg-white">
                {/* 1. Manual Angle Selector */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-teal-950/70 mb-1.5">
                    🎯 Narrative Focus Angle
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "annadana", icon: "🍲", title: "Annadana Meals", desc: "Full-day hot food" },
                      { id: "birthday", icon: "🎂", title: "Birthday Seva", desc: "Celebration feast" },
                      { id: "vidya", icon: "📚", title: "Vidya & School", desc: "Uniforms & kits" },
                      { id: "trust_80g", icon: "📜", title: "80G Tax Exemption", desc: "JJ Act KA18CH0242" },
                    ].map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleAngleChange(a.id as OutreachAngle)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                          angle === a.id
                            ? "bg-teal-950 text-white border-teal-950 shadow-xs"
                            : "bg-white text-teal-950 border-teal-900/15 hover:bg-cream"
                        }`}
                      >
                        <span className="text-base">{a.icon}</span>
                        <div>
                          <div>{a.title}</div>
                          <div className="text-[10px] opacity-75 font-normal">{a.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Manual Pre-Selected Tier Amounts */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-teal-950/70 mb-1.5">
                    💰 Pre-Selected Tier Amount (Optional)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Default Tiers", amt: undefined },
                      { label: "₹1,500 (Basic)", amt: 1500 },
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
                            ? "bg-amber-400 text-teal-950 shadow-xs font-black"
                            : "bg-white text-teal-950 border border-teal-900/15 hover:bg-cream"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Full Curated Media List */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-teal-950/70 mb-1.5">
                    📎 Curated Media Library (All Assets)
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
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
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">
                              {m.type === "image" ? "🖼️" : m.type === "video" ? "🎥" : "📄"}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-teal-950 truncate text-[11px]">{m.title}</p>
                              <p className="text-[10px] text-teal-950/60 truncate">{m.description}</p>
                            </div>
                          </div>
                          {isSelected && <span className="text-amber-600 font-bold text-xs shrink-0">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Live Kitchen Camera & File Upload */}
                <div className="rounded-2xl bg-teal-950/5 p-3 border border-teal-900/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-teal-950">
                      📸 Live Kitchen Camera &amp; Upload
                    </span>
                    <span className="text-[10px] text-teal-950/60 font-semibold">
                      Custom photo / video / PDF
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

                {/* 5. Bangalore Physical Location & Verified Google Maps Pin */}
                <div className="rounded-2xl bg-cream/70 p-3 border border-teal-900/10 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-950 flex items-center gap-1.5">
                      <span>📍</span>
                      <span>Bangalore Physical Proof</span>
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
                      <span>🗺️ Open Maps Pin</span>
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
            )}
          </div>

          {/* ── SECTION E: 30-SECOND CALL PITCH SCRIPT (COLLAPSIBLE / ACCORDION) ── */}
          <div className="rounded-2xl border border-teal-900/15 bg-white overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setShowCallScript(!showCallScript)}
              className="w-full flex items-center justify-between p-3 bg-sand/30 hover:bg-sand/40 text-left transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🗣️</span>
                <div>
                  <div className="text-xs font-black text-teal-950">
                    Telecaller 30-Second Trust Pitch (Call Script)
                  </div>
                  <div className="text-[10px] text-teal-950/60 font-medium">
                    Govt JJ Act KA18CH0242 · 80G tax receipt · 25 orphaned boys
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-950 px-2 py-0.5 rounded-lg bg-white border border-teal-900/10 shrink-0 ml-2">
                {showCallScript ? "▲ Hide" : "▼ Read Pitch"}
              </span>
            </button>

            {showCallScript && (
              <div className="p-3 border-t border-teal-900/10 space-y-2.5 animate-fadeIn bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-teal-950/70 uppercase">Script Language:</span>
                  <div className="flex items-center gap-1 bg-cream/70 p-0.5 rounded-lg border border-teal-900/15 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setScriptLang("kanglish")}
                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                        scriptLang === "kanglish" ? "bg-teal-950 text-white" : "text-teal-950/70"
                      }`}
                    >
                      Kanglish
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptLang("kn")}
                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                        scriptLang === "kn" ? "bg-teal-950 text-white" : "text-teal-950/70"
                      }`}
                    >
                      ಕನ್ನಡ
                    </button>
                    <button
                      type="button"
                      onClick={() => setScriptLang("en")}
                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                        scriptLang === "en" ? "bg-teal-950 text-white" : "text-teal-950/70"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-sand/20 border border-teal-900/10 text-teal-950 leading-relaxed text-[11px] font-medium shadow-2xs">
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

                <div className="flex items-center justify-between text-[10px] text-teal-950/75">
                  <span>⚡ <strong>Tip:</strong> Call the donor first, speak 30 seconds, then tap WhatsApp send!</span>
                  <button
                    type="button"
                    onClick={handleLaunchCall}
                    className="font-bold text-teal-900 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>📞 Call {displayPhone}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION F: 1-TAP DISPOSITION LOGGING ── */}
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

        {/* ── 4. STICKY ACTION FOOTER (ALWAYS VISIBLE AT BOTTOM) ── */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-2.5 sm:p-3 shadow-lg z-20 space-y-1.5 shrink-0">
          {/* Main Action Button */}
          <button
            type="button"
            onClick={baileysStatus === "connected" ? handleSendBaileys : handleShareRealMedia}
            disabled={sendingBaileys}
            className={`flex h-11 sm:h-12 w-full items-center justify-center gap-2 rounded-2xl active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer ${
              baileysStatus === "connected"
                ? "bg-gradient-to-r from-emerald-600 to-teal-800"
                : "bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1faa53]"
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
                  ? "Delivered directly via Ashrama WhatsApp Gateway"
                  : "Attaches photo file to WhatsApp · Customer phone copied"}
              </div>
            </div>
          </button>

          {/* Quick Row: Call Customer, Direct Chat, Link Scanner QR */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={handleLaunchCall}
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-teal-950 text-white text-xs font-bold active:scale-95 transition cursor-pointer"
              title={`Call ${lead.name} (${displayPhone})`}
            >
              <span>📞</span>
              <span>Call</span>
            </button>
            <button
              type="button"
              onClick={handleSendDirectToCustomer}
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-300 text-xs font-bold active:scale-95 transition cursor-pointer"
              title="Open direct WhatsApp chat with prefilled text"
            >
              <span>💬</span>
              <span>Direct Chat</span>
            </button>
            <button
              type="button"
              onClick={handleConnectBaileys}
              className="flex h-9 items-center justify-center gap-1 rounded-xl bg-sand text-teal-950 border border-teal-900/15 text-xs font-bold active:scale-95 transition cursor-pointer"
              title="Link WhatsApp scanner for 1-click auto-sending"
            >
              <span>📱</span>
              <span>Link QR</span>
            </button>
          </div>
        </div>

        {/* ── BAILEYS SCANNER MODAL ── */}
        {showQrModal && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-teal-900/20 text-center space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-teal-900/10 pb-2">
                <h4 className="font-display font-black text-teal-950 text-sm">
                  📱 Link WhatsApp Scanner
                </h4>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {baileysQr ? (
                <div className="space-y-2">
                  <div className="flex justify-center p-2 bg-white rounded-2xl border-2 border-emerald-500 shadow-inner">
                    <img src={baileysQr} alt="WhatsApp QR Code" className="w-56 h-56" />
                  </div>
                  <p className="text-xs text-teal-950 font-bold">
                    Scan with WhatsApp &gt; Linked Devices
                  </p>
                  <p className="text-[10px] text-teal-950/60">
                    Enables 1-click automated photo &amp; message delivery directly from Ashrama number!
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-2">
                  <div className="animate-spin text-3xl">⏳</div>
                  <p className="text-xs text-teal-950 font-bold">
                    Generating secure QR session...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
