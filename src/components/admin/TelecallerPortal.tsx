"use client";

import { useEffect, useState, useMemo } from "react";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import { AntiBanWhatsAppModal } from "@/components/admin/AntiBanWhatsAppModal";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";
import { generateAntiBanMessage } from "@/lib/whatsapp-antiban";

interface CallerProfile {
  callerId: string;
  name: string;
  whatsappNumber: string;
  email: string;
  dailyQuota?: number;
}

export const cleanChildName = (lead: { childName?: string | null; name?: string | null }) => {
  if (lead.childName && lead.childName.trim() && lead.childName.trim().toLowerCase() !== "child") {
    return lead.childName.trim();
  }
  if (lead.name && lead.name.trim()) {
    const stripped = lead.name.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
    if (stripped && stripped.toLowerCase() !== "child") {
      return stripped;
    }
  }
  return "Child";
};

export function TelecallerPortal({ initialCallerId }: { initialCallerId?: string }) {
  // Session & Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [callerProfile, setCallerProfile] = useState<CallerProfile | null>(null);

  // Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState(initialCallerId || "");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [cardNoteInput, setCardNoteInput] = useState("");
  const [savingCardNote, setSavingCardNote] = useState(false);
  const [isMobileStatsExpanded, setIsMobileStatsExpanded] = useState(false);

  // Change Password Modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Leads & Data state
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Default to Pending so telecallers immediately start with fresh, uncalled numbers (prevents seeing already-contacted numbers)
  const [filter, setFilter] = useState<string>("Pending");
  const [streamFilter, setStreamFilter] = useState<"ALL" | "PARENTS" | "DIRECT_DONOR">("ALL");
  const [dateSortOrder, setDateSortOrder] = useState<
    "birthday_upcoming" | "birthday_calendar" | "date_newest" | "date_oldest" | "callback_earliest"
  >("birthday_upcoming");
  const [portalPage, setPortalPage] = useState<number>(1);
  const portalPageSize = 40;
  const [toastMsg, setToastMsg] = useState("");

  // Notes & Callback Modal state
  const [activeNotesLead, setActiveNotesLead] = useState<any | null>(null);
  const [notesText, setNotesText] = useState("");
  const [callbackDateTime, setCallbackDateTime] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Anti-Ban WhatsApp Modal state
  const [isAntiBanModalOpen, setIsAntiBanModalOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<any | null>(null);

  // Stats state
  const [stats, setStats] = useState({
    totalAssigned: 0,
    contactedCount: 0,
    convertedCount: 0,
    totalRevenue: 0,
  });

  // Next-Gen Focus Dialing Mode state (Lead ID anchored for zero index drift & zero duplicate repetition)
  const [viewMode, setViewMode] = useState<"focus" | "queue">("focus");
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [activeFocusLeadId, setActiveFocusLeadId] = useState<number | null>(null);
  const [currentlyDialedLeadId, setCurrentlyDialedLeadId] = useState<number | null>(null);
  const [sessionContactedIds, setSessionContactedIds] = useState<Set<number>>(() => new Set());
  const [selectedSevaAmount, setSelectedSevaAmount] = useState<number>(1500);
  const [preferredLanguage, setPreferredLanguage] = useState<"kanglish" | "kn" | "en">("kanglish");

  // Audio chime using Web Audio API (0 dependencies)
  const playCelebrationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      // 4-note victory arpeggio: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch {}
  };

  // Quick Direct Donation Log Modal state
  const [activeDonationLead, setActiveDonationLead] = useState<any | null>(null);
  const [loggedDonationAmount, setLoggedDonationAmount] = useState<number>(1500);
  const [loggedDonationUtr, setLoggedDonationUtr] = useState<string>("");
  const [loggingDonation, setLoggingDonation] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  };

  const computeStats = (leadItems: any[], _cid?: string) => {
    let contacted = 0;
    let converted = 0;
    leadItems.forEach((l) => {
      if (l.status && l.status !== "Pending") contacted++;
      if (l.status === "Donated") converted++;
    });

    setStats((prev) => ({
      ...prev,
      totalAssigned: leadItems.length,
      contactedCount: contacted,
      convertedCount: converted,
    }));
  };

  // ── Contacted Leads Persistent Session Cache Helpers ──
  // Guarantees zero number repetition across app switches, phone dialer launches, and mobile browser reloads
  const getSessionDialedKey = (cid: string) => {
    const today = new Date().toISOString().slice(0, 10);
    return `janaseva_dialed_${cid}_${today}`;
  };

  const persistContactedLead = (cid: string, leadId: number) => {
    setSessionContactedIds((prev) => {
      const next = new Set(prev).add(leadId);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(getSessionDialedKey(cid), JSON.stringify(Array.from(next)));
          localStorage.setItem(`janaseva_last_lead_${cid}`, String(leadId));
        } catch {}
      }
      return next;
    });
  };

  const loadCallerLeads = async (cid: string) => {
    setLoadingLeads(true);
    try {
      const res = await fetch(`/api/v1/leads/assigned?callerId=${encodeURIComponent(cid)}`);
      const data = await res.json();
      if (data.success) {
        const leadItems = data.leads || [];
        setLeads(leadItems);
        if (data.callerStats) {
          setStats(data.callerStats);
        } else {
          computeStats(leadItems, cid);
        }

        // Restore today's session dialed/contacted lead IDs and active focus lead
        if (typeof window !== "undefined") {
          try {
            const savedDialed = localStorage.getItem(getSessionDialedKey(cid));
            if (savedDialed) {
              const parsed = JSON.parse(savedDialed);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSessionContactedIds(new Set(parsed));
              }
            }
            const savedLastLead = localStorage.getItem(`janaseva_last_lead_${cid}`);
            if (savedLastLead) {
              const num = Number(savedLastLead);
              if (num && leadItems.some((l: any) => l.leadId === num)) {
                setActiveFocusLeadId(num);
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      showToast("Error loading leads: " + err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  const checkCurrentSession = async () => {
    setAuthChecking(true);
    try {
      const res = await fetch("/api/v1/auth/login");
      const data = await res.json();
      if (data.authenticated && data.caller) {
        setCallerProfile(data.caller);
        setIsLoggedIn(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("janaseva_telecaller_profile", JSON.stringify(data.caller));
        }
        await loadCallerLeads(data.caller.callerId);
      } else {
        // Fallback to saved localStorage profile if user enabled Remember Me on mobile
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("janaseva_telecaller_profile");
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed?.callerId) {
                setCallerProfile(parsed);
                setIsLoggedIn(true);
                await loadCallerLeads(parsed.callerId);
                return;
              }
            } catch {}
          }
        }
        setIsLoggedIn(false);
        setCallerProfile(null);
      }
    } catch {
      // If offline/error, fallback to saved local session
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("janaseva_telecaller_profile");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.callerId) {
              setCallerProfile(parsed);
              setIsLoggedIn(true);
              void loadCallerLeads(parsed.callerId);
              return;
            }
          } catch {}
        }
      }
      setIsLoggedIn(false);
    } finally {
      setAuthChecking(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlCaller = params.get("caller") || params.get("id");
      if (urlCaller) {
        setLoginIdentifier(urlCaller.toUpperCase());
      }
    }

    queueMicrotask(() => {
      void checkCurrentSession();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-Time Background Heartbeat Polling (every 45s for mobile battery and data savings)
  useEffect(() => {
    if (!isLoggedIn || !callerProfile) return;

    let isMounted = true;
    const heartbeat = async () => {
      try {
        const res = await fetch(`/api/v1/leads/assigned?callerId=${encodeURIComponent(callerProfile.callerId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!isMounted || !data.success || !Array.isArray(data.leads)) return;

        const newLeads = data.leads;

        setLeads((prevLeads) => {
          // Detect newly converted lead
          const newlyConverted = newLeads.find((nl: any) => {
            const old = prevLeads.find((ol: any) => ol.leadId === nl.leadId);
            return nl.status === "Donated" && old && old.status !== "Donated";
          });

          if (newlyConverted) {
            playCelebrationChime();
            showToast(`🎉 LIVE CONVERSION! ${newlyConverted.name} completed donation! Attributed to ${callerProfile.callerId}`);
          }

          return newLeads;
        });

        if (data.callerStats) {
          setStats(data.callerStats);
        } else {
          computeStats(newLeads, callerProfile.callerId);
        }
      } catch {
        // Silent catch for background polling
      }
    };

    const interval = setInterval(heartbeat, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, callerProfile]);

  // Handle Telecaller Sign In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Authentication failed. Check your Caller ID/Email and password.");
      }
      setCallerProfile(data.caller);
      setIsLoggedIn(true);
      if (rememberMe && typeof window !== "undefined") {
        localStorage.setItem("janaseva_telecaller_profile", JSON.stringify(data.caller));
      }
      showToast(`Welcome back, ${data.caller.name}! (${data.caller.callerId})`);
      await loadCallerLeads(data.caller.callerId);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Handle Telecaller Sign Out
  const handleLogout = async () => {
    try {
      await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("janaseva_telecaller_profile");
    }
    setIsLoggedIn(false);
    setCallerProfile(null);
    setLeads([]);
    showToast("Signed out successfully.");
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    if (!callerProfile) return;

    if (pwdNew !== pwdConfirm) {
      setPwdError("New password and confirm password do not match.");
      return;
    }
    if (pwdNew.length < 4) {
      setPwdError("New password must be at least 4 characters.");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          callerId: callerProfile.callerId,
          currentPassword: pwdCurrent,
          newPassword: pwdNew,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update password.");
      }
      showToast("✓ Password updated successfully!");
      setIsChangePasswordOpen(false);
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  // Anti-Ban WhatsApp Modal Trigger
  const handleOpenWhatsAppModal = (lead: any) => {
    setSelectedLeadForWhatsApp(lead);
    setIsAntiBanModalOpen(true);
  };

  const handleDispositionLoggedFromModal = async (leadId: number, disp: string) => {
    if (callerProfile) {
      persistContactedLead(callerProfile.callerId, leadId);
    }
    const updatedList = leads.map((l) => (l.leadId === leadId ? { ...l, status: disp } : l));
    setLeads(updatedList);
    if (callerProfile) {
      computeStats(updatedList, callerProfile.callerId);
    }
    showToast(`✓ Marked lead #${leadId} as ${disp}`);

    // Compute next candidate cleanly without double increment
    const currentIdx = filteredLeads.findIndex((l) => l.leadId === leadId);
    if (currentIdx + 1 < filteredLeads.length) {
      setActiveFocusLeadId(filteredLeads[currentIdx + 1].leadId);
    } else if (currentIdx > 0) {
      setActiveFocusLeadId(filteredLeads[currentIdx - 1].leadId);
    } else {
      setActiveFocusLeadId(null);
    }
  };

  // Update Call Disposition
  const handleUpdateDisposition = async (leadId: number, disposition: string, notes?: string, callbackTime?: string) => {
    if (!callerProfile) return;
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: callerProfile.callerId,
          disposition,
          notes: notes || "Updated from telecaller dashboard",
          callbackTime: callbackTime || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedList = leads.map((l) => (l.leadId === leadId ? { ...l, status: disposition } : l));
        setLeads(updatedList);
        showToast(`✓ Status updated to ${disposition}`);
        computeStats(updatedList, callerProfile.callerId);
      }
    } catch (err: any) {
      showToast("Error updating disposition: " + err.message);
    }
  };

  // 1-Tap Inline Disposition Handlers
  const handleInlineDisposition = async (leadId: number, disposition: string) => {
    await handleUpdateDisposition(leadId, disposition);
  };

  // Safe Phone Call Launch (Direct Customer Call) - Locks card onto current lead so it does not jump or advance while dialing
  const handleCallLead = (lead: any) => {
    if (!lead) return;
    setActiveFocusLeadId(lead.leadId);
    setCurrentlyDialedLeadId(lead.leadId);
    if (callerProfile) {
      persistContactedLead(callerProfile.callerId, lead.leadId);
    }
    const phoneInfo = parseCustomerPhone(lead.phone);
    window.location.href = `tel:${phoneInfo.e164}`;
    showToast(`📞 Dialing ${lead.name}... After call, tap outcome below to advance!`);
  };

  // Safe WhatsApp Dispatch Launch - Locks card onto current lead
  const handleWhatsAppLead = (lead: any) => {
    if (!lead) return;
    setActiveFocusLeadId(lead.leadId);
    setCurrentlyDialedLeadId(lead.leadId);
    if (callerProfile) {
      persistContactedLead(callerProfile.callerId, lead.leadId);
    }
    handleOpenWhatsAppModal(lead);
  };

  // Save Notes / Callback Modal
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotesLead || !callerProfile) return;
    setSavingNotes(true);
    try {
      const currentId = activeNotesLead.leadId;
      const newStatus = callbackDateTime ? "Reschedule" : activeNotesLead.status || "Contacted";

      const currentIdx = filteredLeads.findIndex((l) => l.leadId === currentId);
      const nextCandidate =
        currentIdx + 1 < filteredLeads.length
          ? filteredLeads[currentIdx + 1].leadId
          : currentIdx > 0
          ? filteredLeads[currentIdx - 1].leadId
          : null;

      await handleUpdateDisposition(currentId, newStatus, notesText, callbackDateTime);
      persistContactedLead(callerProfile.callerId, currentId);
      setActiveNotesLead(null);
      setNotesText("");
      setCallbackDateTime("");
      setActiveFocusLeadId(nextCandidate);
    } finally {
      setSavingNotes(false);
    }
  };

  // Simulate Payment Conversion Test
  const handleSimulatePayment = async (leadId: number) => {
    if (!callerProfile) return;
    try {
      const res = await fetch("/api/v1/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_donation",
          callerRefId: callerProfile.callerId,
          leadId,
          amount: 1000,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        showToast(`🎉 ₹1,000 Donation attributed to you (${callerProfile.callerId})! Lead marked as Donated.`);
        await loadCallerLeads(callerProfile.callerId);
      }
    } catch (err: any) {
      showToast("Attribution test failed: " + err.message);
    }
  };

  // 1-Tap Direct Axis Bank Payment QR Share from Portal
  const handleDirectSharePaymentQr = async (lead: any, customAmount?: number) => {
    if (!lead || !callerProfile) return;
    persistContactedLead(callerProfile.callerId, lead.leadId);
    if (!lead.status || lead.status === "Pending") {
      void handleUpdateDisposition(lead.leadId, "Contacted", "Auto-marked attended on QR share");
    }

    const phoneInfo = parseCustomerPhone(lead.phone);
    try {
      await navigator.clipboard.writeText(phoneInfo.waNumber);
    } catch {}

    const amount = customAmount || selectedSevaAmount || 1500;
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";
    const qrUrl = `${siteOrigin}/media/janaseva-axis-bank-qr.jpg`;
    const donationUrl = `${siteOrigin}/give?ref=${callerProfile.callerId}&lead_id=${lead.leadId}&amount=${amount}`;
    const qrCaption = `🙏 Namaskara ${lead.name} Sir/Madam!\n\nAttached is our Official Axis Bank UPI Payment QR Scanner for Janaseva Ashrama (Turahalli, Bengaluru). Scan directly via GPay / PhonePe / Paytm / BHIM:\n\n👉 [ 📲 1-TAP PAY ₹${formatINR(amount)} (GPay / PhonePe / Card + 80G Tax Receipt) ]\n${donationUrl}\n\n💳 Direct UPI / GPay ID:\nMAB.037349050110044@axisbank\n🏛️ Registered Trust: JANASEVA SAMRUDDI EDUCATI\n📜 Karnataka Govt JJ Act Reg: KA18CH0242\n🧾 100% Tax Deductible (Section 80G Form 10AC)\n\n📍 Turahalli, Bengaluru · Google Maps: https://maps.app.goo.gl/uPjN24rP1i1YkX6t7\n📞 Ashrama Helpline: +91 99803 59595`;

    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const file = new File([blob], "janaseva-axis-bank-qr.jpg", { type: blob.type || "image/jpeg" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: qrCaption,
          title: "Janaseva Ashrama Axis Bank Payment QR",
        });
        showToast(`✓ Axis Bank Payment QR shared to ${lead.name}! Phone copied to clipboard.`);
        return;
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
    }

    // Fallback: Copy QR to clipboard and open wa.me
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = qrUrl;
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
      }, "image/png");
    } catch {}

    const targetUrl = `https://wa.me/${phoneInfo.waNumber}?text=${encodeURIComponent(qrCaption)}`;
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    showToast(`✓ Opened WhatsApp to ${phoneInfo.display}! Axis Bank QR copied to clipboard.`);
  };

  // 1-Tap Direct WhatsApp Chat Launch (Concise Anti-Ban Engine)
  const handleDirectWhatsAppChat = (lead: any, customAmount?: number) => {
    if (!lead || !callerProfile) return;
    setActiveFocusLeadId(lead.leadId);
    setCurrentlyDialedLeadId(lead.leadId);
    persistContactedLead(callerProfile.callerId, lead.leadId);
    const phoneInfo = parseCustomerPhone(lead.phone);
    const amount = customAmount || selectedSevaAmount || 1500;
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";

    const isParent = lead.stream === "PARENTS" || Boolean(lead.parentName || lead.childName);
    const resolvedChild = cleanChildName(lead);

    const antiBanResult = generateAntiBanMessage({
      leadId: lead.leadId,
      leadName: isParent ? resolvedChild : lead.name,
      donorName: isParent ? (lead.parentName || resolvedChild) : lead.name,
      parentName: lead.parentName || lead.name,
      childName: isParent ? resolvedChild : undefined,
      stream: isParent ? "PARENTS" : lead.stream,
      phone: lead.phone,
      callerId: callerProfile.callerId,
      callerName: callerProfile.name,
      language: preferredLanguage,
      amount,
      mode: "concise",
      baseUrl: siteOrigin,
    });

    // Auto-copy Axis Bank UPI QR info to clipboard for instant attachment
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(
        `Axis Bank UPI ID: MAB.037349050110044@axisbank (Janaseva Ashrama) - ₹${formatINR(amount)}`
      ).catch(() => {});
    }

    const targetUrl = `https://wa.me/${phoneInfo.waNumber}?text=${encodeURIComponent(antiBanResult.text)}`;
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    showToast(`✓ Opened WhatsApp directly to ${phoneInfo.display}!`);
  };

  // 1-Click CSV Export for Staff & Supervisor
  const handleExportCsv = () => {
    if (!callerProfile || leads.length === 0) {
      showToast("No leads in queue to export.");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const headers = [
      "Lead ID",
      "Donor Name",
      "Phone",
      "Birthday Day",
      "Birthday Month",
      "Status",
      "Notes",
      "Scheduled Callback",
      "Assigned Caller",
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const exportData = filteredLeads.length > 0 ? filteredLeads : leads;
    const rows = exportData.map((l) => [
      escapeCsv(l.leadId),
      escapeCsv(l.name),
      escapeCsv(parseCustomerPhone(l.phone).display),
      escapeCsv(l.dobDay || ""),
      escapeCsv(l.dobMonth || ""),
      escapeCsv(l.status || "Pending"),
      escapeCsv(l.notes || ""),
      escapeCsv(l.rescheduleDate ? new Date(l.rescheduleDate).toLocaleString("en-IN") : ""),
      escapeCsv(callerProfile.callerId),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `janaseva-telecaller-${callerProfile.callerId}-${dateSortOrder}-${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`✓ Exported ${exportData.length} leads in sorted order to CSV file!`);
  };

  // 1-Click WhatsApp EOD Summary to Supervisor
  const handleSendDailySupervisorReport = () => {
    if (!callerProfile) return;
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const reportText = `📊 *JANASEVA ASHRAMA - TELECALLER DAILY REPORT*\n\n` +
      `👤 *Telecaller:* ${callerProfile.name} (${callerProfile.callerId})\n` +
      `📅 *Date:* ${todayStr}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *Daily Target:* ${dailyTarget} Contacts\n` +
      `📞 *Attended Today:* ${stats.contactedCount} (${progressPercent}% achieved)\n` +
      `🎉 *Conversions (Donations):* ${stats.convertedCount}\n` +
      `💰 *Total Attributed Revenue:* ₹${stats.totalRevenue.toLocaleString("en-IN")}\n` +
      `👍 *Warm / Interested:* ${counts.interested}\n` +
      `📅 *Scheduled Callbacks:* ${counts.reschedule}\n` +
      `⏳ *Pending in Queue:* ${counts.pending}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏛️ *Trust:* Karnataka JJ Act KA18CH0242 · 80G Form 10AC\n` +
      `📍 Turahalli, Bengaluru · Janaseva Ashrama`;

    const supervisorWaNumber = "919980359595";
    const targetUrl = `https://wa.me/${supervisorWaNumber}?text=${encodeURIComponent(reportText)}`;
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = targetUrl;
    } else {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
    showToast("✓ Opened WhatsApp with Daily EOD Summary for Supervisor!");
  };

  // Quick Note Chips Appender
  const handleApplyQuickNote = (phrase: string) => {
    setNotesText((prev) => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return phrase;
      return `${cleanPrev} · ${phrase}`;
    });
  };

  // Quick Preset Callback Date-Time Setter
  const handleApplyPresetCallback = (type: "+1h" | "+2h" | "today6pm" | "today8pm" | "tom10am" | "tom4pm") => {
    const d = new Date();
    if (type === "+1h") {
      d.setHours(d.getHours() + 1);
    } else if (type === "+2h") {
      d.setHours(d.getHours() + 2);
    } else if (type === "today6pm") {
      d.setHours(18, 0, 0, 0);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    } else if (type === "today8pm") {
      d.setHours(20, 0, 0, 0);
      if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    } else if (type === "tom10am") {
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
    } else if (type === "tom4pm") {
      d.setDate(d.getDate() + 1);
      d.setHours(16, 0, 0, 0);
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setCallbackDateTime(formatted);
    return formatted;
  };

  // Focus Mode Safe Navigation Handlers (Lead ID Anchored)
  const handleNextFocusLead = () => {
    if (safeFocusIndex < filteredLeads.length - 1) {
      const nextIdx = safeFocusIndex + 1;
      setFocusIndex(nextIdx);
      const nextId = filteredLeads[nextIdx]?.leadId;
      if (nextId) {
        setActiveFocusLeadId(nextId);
        if (callerProfile) {
          try {
            localStorage.setItem(`janaseva_last_lead_${callerProfile.callerId}`, String(nextId));
          } catch {}
        }
      }
    }
  };

  const handlePrevFocusLead = () => {
    if (safeFocusIndex > 0) {
      const prevIdx = safeFocusIndex - 1;
      setFocusIndex(prevIdx);
      const prevId = filteredLeads[prevIdx]?.leadId;
      if (prevId) {
        setActiveFocusLeadId(prevId);
        if (callerProfile) {
          try {
            localStorage.setItem(`janaseva_last_lead_${callerProfile.callerId}`, String(prevId));
          } catch {}
        }
      }
    }
  };

  const handleSkipFocusLead = (lead: any) => {
    if (!lead || !callerProfile) return;
    persistContactedLead(callerProfile.callerId, lead.leadId);
    showToast(`⏭️ Skipped #${lead.leadId} for today's queue.`);

    const currentIdx = filteredLeads.findIndex((l) => l.leadId === lead.leadId);
    const nextCandidate =
      currentIdx + 1 < filteredLeads.length
        ? filteredLeads[currentIdx + 1].leadId
        : currentIdx > 0
        ? filteredLeads[currentIdx - 1].leadId
        : null;
    setActiveFocusLeadId(nextCandidate);
  };

  const handleJumpToNextPending = () => {
    // Find the next lead in filteredLeads starting after safeFocusIndex that is Pending
    const nextPending = filteredLeads.slice(safeFocusIndex + 1).find((l) => !l.status || l.status === "Pending");
    if (nextPending) {
      const nextIdx = filteredLeads.findIndex((l) => l.leadId === nextPending.leadId);
      if (nextIdx !== -1) setFocusIndex(nextIdx);
      setActiveFocusLeadId(nextPending.leadId);
      showToast(`⏭️ Jumped to fresh lead: ${nextPending.name}`);
    } else {
      // Clean completion: never wrap around to repeat the first 5 numbers
      showToast("🎉 All pending leads in this queue have been reached!");
    }
  };

  // Focus Mode Disposition with Auto-Advance (Prevents skipping and duplicate bounce)
  const handleFocusDisposition = async (leadId: number, disposition: string, notes?: string, callbackTime?: string) => {
    if (callerProfile) {
      persistContactedLead(callerProfile.callerId, leadId);
    }
    setCurrentlyDialedLeadId(null);

    // Compute next candidate BEFORE updating disposition
    const currentIdx = filteredLeads.findIndex((l) => l.leadId === leadId);
    let nextLeadId: number | null = null;

    if (filter === "Pending") {
      // In "Pending" filter, updating status removes current lead from the list.
      // The subsequent lead naturally slides into currentIdx position!
      if (currentIdx + 1 < filteredLeads.length) {
        nextLeadId = filteredLeads[currentIdx + 1].leadId;
      } else if (currentIdx > 0) {
        nextLeadId = filteredLeads[currentIdx - 1].leadId;
      }
    } else {
      // In "ALL" or other views where the lead remains in the list, advance to next pending lead
      const nextPending = filteredLeads.slice(currentIdx + 1).find((l) => !l.status || l.status === "Pending");
      if (nextPending) {
        nextLeadId = nextPending.leadId;
      } else if (currentIdx + 1 < filteredLeads.length) {
        nextLeadId = filteredLeads[currentIdx + 1].leadId;
      }
    }

    await handleUpdateDisposition(leadId, disposition, notes, callbackTime);

    if (nextLeadId) {
      setActiveFocusLeadId(nextLeadId);
      if (callerProfile) {
        try {
          localStorage.setItem(`janaseva_last_lead_${callerProfile.callerId}`, String(nextLeadId));
        } catch {}
      }
    } else {
      setActiveFocusLeadId(null);
    }
  };

  // Save Direct Offline / UPI Donation Log
  const handleSaveDonationLog = async () => {
    if (!activeDonationLead || !callerProfile) return;
    const currentLeadId = activeDonationLead.leadId;
    persistContactedLead(callerProfile.callerId, currentLeadId);
    setLoggingDonation(true);

    // Identify next lead before state update
    const currentIdx = filteredLeads.findIndex((l) => l.leadId === currentLeadId);
    let nextLeadId: number | null = null;
    if (filter === "Pending") {
      if (currentIdx + 1 < filteredLeads.length) {
        nextLeadId = filteredLeads[currentIdx + 1].leadId;
      } else if (currentIdx > 0) {
        nextLeadId = filteredLeads[currentIdx - 1].leadId;
      }
    } else {
      const nextPending = filteredLeads.slice(currentIdx + 1).find((l) => !l.status || l.status === "Pending");
      if (nextPending) {
        nextLeadId = nextPending.leadId;
      } else if (currentIdx + 1 < filteredLeads.length) {
        nextLeadId = filteredLeads[currentIdx + 1].leadId;
      }
    }

    try {
      const res = await fetch(`/api/v1/leads/${currentLeadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId: callerProfile.callerId,
          disposition: "Donated",
          amount: loggedDonationAmount,
          utr: loggedDonationUtr.trim() || undefined,
          notes: `Donation ₹${loggedDonationAmount} logged directly by ${callerProfile.callerId}${loggedDonationUtr ? ` (UTR: ${loggedDonationUtr.trim()})` : ""}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedList = leads.map((l) =>
          l.leadId === currentLeadId ? { ...l, status: "Donated" } : l
        );
        setLeads(updatedList);
        setStats((prev) => ({
          ...prev,
          convertedCount: prev.convertedCount + 1,
          totalRevenue: prev.totalRevenue + loggedDonationAmount,
        }));
        showToast(`🎉 ₹${loggedDonationAmount} Donation logged for ${activeDonationLead.name}! Attributed to ${callerProfile.callerId}`);
        setActiveDonationLead(null);
        setLoggedDonationUtr("");
        setCurrentlyDialedLeadId(null);

        if (viewMode === "focus") {
          if (nextLeadId) {
            setActiveFocusLeadId(nextLeadId);
          } else {
            setActiveFocusLeadId(null);
          }
        }
      } else {
        alert("Failed to save donation: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error logging donation: " + err.message);
    } finally {
      setLoggingDonation(false);
    }
  };

  // Copy Referral Link
  const handleCopyReferralLink = () => {
    if (!callerProfile) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";
    const refLink = `${origin}/give?ref=${callerProfile.callerId}`;
    navigator.clipboard.writeText(refLink);
    showToast("✓ Referral link copied: " + refLink);
  };

  // Dynamic filter counter computation
  const counts = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth() + 1;

    let pending = 0;
    let attended = 0;
    let birthdays = 0;
    let tomorrowBirthdays = 0;
    let interested = 0;
    let reschedule = 0;
    let donated = 0;
    let parents = 0;
    let donors = 0;

    leads.forEach((l) => {
      const isDone = l.status && l.status !== "Pending";
      if (!isDone) {
        pending++;
        const isParent = l.stream === "PARENTS" || Boolean(l.parentName || l.childName);
        if (isParent) parents++;
        else donors++;
      } else {
        attended++;
      }

      if (l.dobDay === curDay && l.dobMonth === curMonth) birthdays++;
      if (l.dobDay === tomorrowDay && l.dobMonth === tomorrowMonth) tomorrowBirthdays++;
      if (l.status === "Interested") interested++;
      if (l.status === "Reschedule") reschedule++;
      if (l.status === "Donated") donated++;
    });

    return {
      all: leads.length,
      pending,
      attended,
      birthdays,
      tomorrowBirthdays,
      interested,
      reschedule,
      donated,
      parents,
      donors,
    };
  }, [leads, sessionContactedIds]);

  // Filter & Search Leads with Date Sorting
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth() + 1;

    // Strict phone number deduplication across cards to eliminate repetition within the filtered stream
    const seenPhones = new Set<string>();

    const base = leads.filter((l) => {
      // 1. Stream filter (Parents vs Direct Donors)
      const isParent = l.stream === "PARENTS" || Boolean(l.parentName || l.childName);
      if (streamFilter === "PARENTS" && !isParent) return false;
      if (streamFilter === "DIRECT_DONOR" && isParent) return false;

      // 2. Strict deduplication by normalized 10-digit mobile number
      const cleanPhone = (l.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanPhone) {
        if (seenPhones.has(cleanPhone)) return false;
        seenPhones.add(cleanPhone);
      }

      let matchesFilter = true;
      if (filter === "Tomorrow_Birthday") {
        matchesFilter = l.dobDay === tomorrowDay && l.dobMonth === tomorrowMonth;
      } else if (filter === "Today_Birthday") {
        matchesFilter = l.dobDay === curDay && l.dobMonth === curMonth;
      } else if (filter === "Pending") {
        // Pending leads: Keep freshly contacted leads from the current session visible so cards never vanish under the caller!
        matchesFilter = !l.status || l.status === "Pending" || sessionContactedIds.has(l.leadId);
      } else if (filter === "Attended") {
        matchesFilter = (l.status && l.status !== "Pending") || sessionContactedIds.has(l.leadId);
      } else if (filter === "Reschedule") {
        matchesFilter = l.status === "Reschedule";
      } else if (filter !== "ALL") {
        matchesFilter = l.status === filter;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.parentName && l.parentName.toLowerCase().includes(q)) ||
        (l.childName && l.childName.toLowerCase().includes(q)) ||
        String(l.leadId).includes(q);
      return matchesFilter && matchesSearch;
    });

    // Helper for exact upcoming birthday distance in calendar days (100% leap-year & month rollover safe)
    const thisYear = now.getFullYear();
    const todayStart = new Date(thisYear, now.getMonth(), now.getDate()).getTime();

    const getBirthdayDistance = (m?: number, d?: number) => {
      if (!m || !d || m < 1 || m > 12 || d < 1 || d > 31) return 9999;
      let bdate = new Date(thisYear, m - 1, d);
      let diffDays = Math.round((bdate.getTime() - todayStart) / 86400000);
      if (diffDays < 0) {
        bdate = new Date(thisYear + 1, m - 1, d);
        diffDays = Math.round((bdate.getTime() - todayStart) / 86400000);
      }
      return diffDays;
    };

    const nowMs = Date.now();

    return [...base].sort((a, b) => {
      // 1. SPECIFIC SORT: Urgent Callbacks First
      if (dateSortOrder === "callback_earliest") {
        const aResched = a.status === "Reschedule";
        const bResched = b.status === "Reschedule";
        if (aResched && !bResched) return -1;
        if (!aResched && bResched) return 1;
        if (aResched && bResched) {
          const tA = a.rescheduleDate ? new Date(a.rescheduleDate).getTime() : Infinity;
          const tB = b.rescheduleDate ? new Date(b.rescheduleDate).getTime() : Infinity;
          return tA - tB || a.leadId - b.leadId;
        }
        const aPending = !a.status || a.status === "Pending";
        const bPending = !b.status || b.status === "Pending";
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return a.leadId - b.leadId;
      }

      // 2. SPECIFIC SORT: Newest Leads Added First
      if (dateSortOrder === "date_newest") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.leadId;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.leadId;
        return timeB - timeA || b.leadId - a.leadId;
      }

      // 3. SPECIFIC SORT: Oldest Leads Added First
      if (dateSortOrder === "date_oldest") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.leadId;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.leadId;
        return timeA - timeB || a.leadId - b.leadId;
      }

      // 4. SPECIFIC SORT: Calendar Date Progression (Jan 1 -> Dec 31)
      if (dateSortOrder === "birthday_calendar") {
        const mA = a.dobMonth || 99;
        const mB = b.dobMonth || 99;
        if (mA !== mB) return mA - mB;
        const dA = a.dobDay || 99;
        const dB = b.dobDay || 99;
        return dA - dB || a.leadId - b.leadId;
      }

      // 5. DEFAULT SORT: Upcoming Birthdays (Advance Calling Priority)
      // Rank 1: Due Rescheduled Callbacks (due now or overdue)
      const aDueCallback = a.status === "Reschedule" && a.rescheduleDate && new Date(a.rescheduleDate).getTime() <= nowMs;
      const bDueCallback = b.status === "Reschedule" && b.rescheduleDate && new Date(b.rescheduleDate).getTime() <= nowMs;
      if (aDueCallback && !bDueCallback) return -1;
      if (!aDueCallback && bDueCallback) return 1;

      // Rank 2: Pending/Uncontacted ahead of already completed leads
      const aPending = !a.status || a.status === "Pending";
      const bPending = !b.status || b.status === "Pending";
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // Rank 3: Tomorrow's Birthday (T+1 distance = 1) is the ultimate advance calling target
      const distA = getBirthdayDistance(a.dobMonth, a.dobDay);
      const distB = getBirthdayDistance(b.dobMonth, b.dobDay);
      const rankA = distA === 1 ? -1 : distA;
      const rankB = distB === 1 ? -1 : distB;
      if (rankA !== rankB) return rankA - rankB;

      return a.leadId - b.leadId;
    });
  }, [leads, filter, searchQuery, dateSortOrder, streamFilter, sessionContactedIds]);

  // Reset pagination and active focus lead when filter, search, date sort, or stream changes
  useEffect(() => {
    setPortalPage(1);
    setFocusIndex(0);
    setActiveFocusLeadId(null);
  }, [filter, searchQuery, dateSortOrder, streamFilter]);

  const totalPortalPages = Math.max(1, Math.ceil(filteredLeads.length / portalPageSize));
  const paginatedLeads = useMemo(() => {
    const start = (portalPage - 1) * portalPageSize;
    return filteredLeads.slice(start, start + portalPageSize);
  }, [filteredLeads, portalPage, portalPageSize]);

  // Safe Focus Index & Lead computation (Anchored to activeFocusLeadId for zero drift)
  const safeFocusIndex = useMemo(() => {
    if (filteredLeads.length === 0) return 0;
    if (activeFocusLeadId) {
      const idx = filteredLeads.findIndex((l) => l.leadId === activeFocusLeadId);
      if (idx !== -1) return idx;
    }
    return Math.min(Math.max(0, focusIndex), filteredLeads.length - 1);
  }, [filteredLeads, activeFocusLeadId, focusIndex]);

  const currentFocusLead = filteredLeads[safeFocusIndex] || null;

  // Keep activeFocusLeadId synced with the currently displayed lead
  useEffect(() => {
    if (currentFocusLead && currentFocusLead.leadId !== activeFocusLeadId) {
      setActiveFocusLeadId(currentFocusLead.leadId);
    }
  }, [currentFocusLead, activeFocusLeadId]);

  // Keyboard Shortcuts for Focus Power-Dialing Mode
  useEffect(() => {
    if (viewMode !== "focus" || isAntiBanModalOpen || activeNotesLead || activeDonationLead || isChangePasswordOpen) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (!currentFocusLead) return;

      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleCallLead(currentFocusLead);
      } else if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        handleDirectWhatsAppChat(currentFocusLead);
      } else if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        void handleDirectSharePaymentQr(currentFocusLead);
      } else if (e.key === "1") {
        e.preventDefault();
        void handleFocusDisposition(currentFocusLead.leadId, "Interested");
      } else if (e.key === "2") {
        e.preventDefault();
        const twoHoursLater = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
        void handleFocusDisposition(currentFocusLead.leadId, "No_Answer", "Auto-rescheduled +2 hours", twoHoursLater);
      } else if (e.key === "3") {
        e.preventDefault();
        setActiveNotesLead(currentFocusLead);
        setNotesText(currentFocusLead.notes || "");
      } else if (e.key === "4") {
        e.preventDefault();
        setActiveDonationLead(currentFocusLead);
        setLoggedDonationAmount(1500);
      } else if (e.key === "5") {
        e.preventDefault();
        void handleFocusDisposition(currentFocusLead.leadId, "Rejected");
      } else if (e.key === "n" || e.key === "N" || e.key === "ArrowRight") {
        e.preventDefault();
        handleNextFocusLead();
      } else if (e.key === "p" || e.key === "P" || e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevFocusLead();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, focusIndex, safeFocusIndex, currentFocusLead, filteredLeads, isAntiBanModalOpen, activeNotesLead, activeDonationLead, isChangePasswordOpen]);

  // Loading Session Screen
  if (authChecking) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center animate-fadeIn">
        <LogoMark size={64} className="ring-4 ring-amber-400/30 animate-pulse mb-4" />
        <h2 className="font-display text-xl font-bold text-teal-950">
          Janaseva Ashrama Telecaller Portal
        </h2>
        <p className="text-xs text-teal-950/60 mt-1">Verifying your secure caller session...</p>
      </div>
    );
  }

  // ── UNAUTHENTICATED STATE: DEDICATED TELECALLER LOGIN SCREEN ──
  if (!isLoggedIn || !callerProfile) {
    return (
      <div className="max-w-md mx-auto my-10 px-4 animate-fadeIn">
        {toastMsg && (
          <div className="mb-4 rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
          </div>
        )}

        <div className="rounded-3xl bg-white p-7 sm:p-9 shadow-xl border border-teal-900/10 text-teal-950">
          {/* Logo & Portal Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-teal-950 text-gold mb-3 shadow-md">
              <LogoMark size={48} />
            </div>
            <h1 className="font-display text-2xl font-black text-teal-950">
              Telecaller Portal Login
            </h1>
            <p className="text-xs text-teal-950/70 mt-1 max-w-xs mx-auto">
              Sign in with your assigned Caller ID or Email to access your daily birthday lead queue and anti-ban dispatch tools.
            </p>
          </div>

          {/* Login Error Notification */}
          {loginError && (
            <div className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 font-semibold flex items-start gap-2">
              <span className="text-rose-600 font-black">⚠️</span>
              <p className="leading-relaxed">{loginError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-teal-950/80 mb-1">
                Caller ID or Registered Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. TC01 or tc01@janaseva.org"
                  className="w-full rounded-xl border border-teal-900/20 px-3.5 py-2.5 text-xs font-semibold text-teal-950 placeholder:text-teal-950/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-teal-950/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your advisor password"
                  className="w-full rounded-xl border border-teal-900/20 px-3.5 py-2.5 text-xs font-semibold text-teal-950 placeholder:text-teal-950/40 focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20 outline-none"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-teal-900/30 text-teal-950 focus:ring-amber-400 h-4 w-4"
                />
                <span className="text-xs font-bold text-teal-950">
                  ನೆನಪಿಡಿ (Keep Me Signed In)
                </span>
              </label>
              <span className="text-[10px] text-teal-950/60 font-semibold">
                Auto-saves on this phone
              </span>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full mt-2 focus-ring tap-scale rounded-xl bg-teal-950 hover:bg-teal-900 text-gold py-3 text-xs font-black shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 min-h-[48px]"
            >
              {loginSubmitting ? (
                <>
                  <span className="animate-spin text-base">⏳</span>
                  <span>ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ (Authenticating)...</span>
                </>
              ) : (
                <>
                  <span>🔐 ಲಾಗಿನ್ ಆಗಿ (Access My Workspace)</span>
                </>
              )}
            </button>
          </form>

          {/* Real User Help Notice (No Demo Buttons) */}
          <div className="mt-6 pt-5 border-t border-teal-900/10 text-center space-y-2">
            <p className="text-[11px] font-bold text-teal-950/80">
              🌸 ಜನಸೇವಾ ಆಶ್ರಮ ತುರಹಳ್ಳಿ ಸಿಬ್ಬಂದಿ ಪೋರ್ಟಲ್
            </p>
            <p className="text-[10px] text-teal-950/60 max-w-xs mx-auto">
              ನಿಮ್ಮ Caller ID (ಉದಾ: TC01) ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್ ಸಹಾಯಕ್ಕಾಗಿ ಸೂಪರ್‌ವೈಸರ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ:
              <br />
              <strong className="text-teal-950 font-bold">Admin Helpline: +91 99803 59595</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Daily target for high-volume telecaller (user indicated 300 to 500 dispatches)
  const dailyTarget = callerProfile.dailyQuota && callerProfile.dailyQuota >= 100 ? callerProfile.dailyQuota : 400;
  const progressPercent = Math.min(100, Math.round((stats.contactedCount / dailyTarget) * 100));

  // ── AUTHENTICATED STATE: DEDICATED TELECALLER WORKSPACE ──
  return (
    <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto px-2 sm:px-6 py-2 sm:py-4 pb-36 md:pb-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between sticky top-3 z-30 animate-fadeIn">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* ── TOP TELECALLER HEADER & STATS BAR ── */}
      {/* Mobile-Optimized Compact Header (< sm): Takes only ~75px so donor card is immediately visible! */}
      <div className="sm:hidden rounded-2xl bg-white p-3 shadow-xs border border-teal-900/10 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-950 text-gold font-display font-black text-xs shrink-0 shadow-xs">
              {callerProfile.callerId}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-sm font-black text-teal-950 truncate">
                {callerProfile.name}
              </h1>
              <p className="text-[10px] text-teal-950/60 leading-tight">
                📱 +91 {callerProfile.whatsappNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              title="Download Leads CSV"
              className="rounded-lg bg-sand border border-teal-900/15 text-teal-950 px-2 py-1 text-[10px] font-bold"
            >
              📥 CSV
            </button>
            <button
              type="button"
              onClick={handleSendDailySupervisorReport}
              title="Daily EOD Report"
              className="rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 px-2 py-1 text-[10px] font-bold"
            >
              📊 ವರದಿ
            </button>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="rounded-lg bg-rose-50 border border-rose-200 text-rose-700 px-2 py-1 text-[10px] font-bold"
            >
              🚪
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Badges */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          <div className="bg-cream rounded-xl p-1.5 border border-teal-900/10">
            <span className="block text-[8px] font-black uppercase text-teal-950/60">ಕ್ಯೂ (Queue)</span>
            <span className="font-mono text-xs font-black text-teal-950">{stats.totalAssigned}</span>
          </div>
          <div className="bg-emerald-50 rounded-xl p-1.5 border border-emerald-200">
            <span className="block text-[8px] font-black uppercase text-emerald-800">ಕರೆ (Today)</span>
            <span className="font-mono text-xs font-black text-emerald-800">{stats.contactedCount}/{dailyTarget}</span>
          </div>
          <div className="bg-amber-50 rounded-xl p-1.5 border border-amber-200">
            <span className="block text-[8px] font-black uppercase text-amber-900">ದಾನ (Paid)</span>
            <span className="font-mono text-xs font-black text-amber-900">{stats.convertedCount}</span>
          </div>
          <div className="bg-teal-950 text-gold rounded-xl p-1.5 border border-teal-900">
            <span className="block text-[8px] font-black uppercase text-amber-300">ಸಂಗ್ರಹ</span>
            <span className="font-mono text-[10px] font-black truncate">{formatINR(stats.totalRevenue)}</span>
          </div>
        </div>

        {/* Toggle Detailed Mobile Stats if user wants */}
        <div className="pt-0.5 text-center">
          <button
            type="button"
            onClick={() => setIsMobileStatsExpanded((prev) => !prev)}
            className="text-[10px] font-bold text-teal-900/70 hover:text-teal-950 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{isMobileStatsExpanded ? "ಅಂಕಿಅಂಶ ಮುಚ್ಚಿ ▲" : "ಹೆಚ್ಚಿನ ವಿವರ (Progress & Links) ▼"}</span>
          </button>
        </div>

        {isMobileStatsExpanded && (
          <div className="space-y-2 pt-2 border-t border-teal-900/10 animate-fadeIn">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-950">
                <span>🎯 ದಿನದ ಗುರಿ: {stats.contactedCount}/{dailyTarget} ({progressPercent}%)</span>
                <span>{progressPercent}% Complete</span>
              </div>
              <div className="w-full bg-teal-950/10 rounded-full h-2 overflow-hidden border border-teal-900/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-800 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(100, Math.max(3, progressPercent))}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyReferralLink}
                className="flex-1 py-1 px-2 rounded-lg bg-sand border border-teal-900/15 text-teal-950 text-[10px] font-bold"
              >
                🔗 ರೆಫರಲ್ ಲಿಂಕ್ ಕಾಪಿ
              </button>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(true)}
                className="py-1 px-2 rounded-lg bg-white border border-teal-900/15 text-teal-950 text-[10px] font-bold"
              >
                🔑 ಪಾಸ್‌ವರ್ಡ್
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Full Header (hidden on mobile, visible on sm and up) */}
      <div className="hidden sm:block rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-teal-900/10 pb-4">
          <div className="flex items-center gap-3">
            <LogoMark size={44} className="ring-2 ring-amber-400/30 shrink-0" />
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-teal-950 text-gold font-display font-black text-base shadow-sm shrink-0">
              {callerProfile.callerId}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg sm:text-xl font-bold text-teal-950 truncate">
                  {callerProfile.name}
                </h1>
                <span className="rounded-full bg-emerald-500/15 text-emerald-800 px-2 py-0.5 text-[10px] font-black uppercase">
                  Staff Advisor
                </span>
              </div>
              <p className="text-xs text-teal-950/60 mt-0.5 flex flex-wrap items-center gap-2">
                <span>📱 +91 {callerProfile.whatsappNumber}</span>
                <span>·</span>
                <span>✉️ {callerProfile.email || `${callerProfile.callerId.toLowerCase()}@janaseva.org`}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              title="Download entire queue and today's work to CSV"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3 py-2 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>📥 CSV</span>
            </button>

            <button
              type="button"
              onClick={handleSendDailySupervisorReport}
              title="Send End-of-Day calling report to supervisor on WhatsApp"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-2 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>📊 Daily Report</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReferralLink}
              title="Copy your personal donation tracking link"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-sand hover:bg-amber-100/80 border border-teal-900/15 text-teal-950 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <span>🔗 Link</span>
              <span className="text-[10px] bg-white rounded px-1.5 py-0.5 font-bold shadow-2xs">Copy</span>
            </button>

            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(true)}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <span>🔑 Password</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 text-xs font-bold transition cursor-pointer"
            >
              <span>🚪 Logout</span>
            </button>
          </div>
        </div>

        {/* Real-Time Telecaller Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-4">
          <div className="rounded-2xl bg-cream/70 p-3 sm:p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Assigned Queue
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-teal-950 mt-1">
              {stats.totalAssigned}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">
              To Call: {counts.pending}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50/70 p-3 sm:p-4 border border-emerald-200">
            <p className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
              Attended Today
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-emerald-800 mt-1">
              {stats.contactedCount}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
              {progressPercent}% of {dailyTarget} goal
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50/70 p-3 sm:p-4 border border-amber-200">
            <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
              Conversions
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-amber-800 mt-1">
              {stats.convertedCount}
            </p>
            <p className="text-[10px] text-amber-800 font-bold mt-0.5">
              {stats.totalAssigned > 0 ? ((stats.convertedCount / stats.totalAssigned) * 100).toFixed(1) : 0}% success rate
            </p>
          </div>

          <div className="rounded-2xl bg-teal-950 p-3 sm:p-4 text-white shadow-sm border border-teal-900">
            <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
              Attributed Revenue
            </p>
            <p className="font-display text-xl sm:text-2xl font-black text-gold mt-1">
              {formatINR(stats.totalRevenue)}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">ref={callerProfile.callerId}</p>
          </div>
        </div>

        {/* Clean Daily Progress Bar */}
        <div className="mt-4 rounded-2xl bg-sand/30 p-3 sm:p-4 border border-teal-900/10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-teal-950">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span>Today&apos;s Outreach:</span>
              <span className="font-mono text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 text-xs font-bold">
                {stats.contactedCount} / {dailyTarget} Calls ({progressPercent}%)
              </span>
            </div>
            <span className="text-[11px] text-teal-950/70 font-semibold">
              Daily Target: {dailyTarget} contacts
            </span>
          </div>

          <div className="w-full bg-teal-950/10 rounded-full h-2.5 overflow-hidden border border-teal-900/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-800 h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(3, progressPercent))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── ASSIGNED LEADS WORKSPACE & QUEUE ── */}
      <div className="rounded-3xl bg-white p-4 sm:p-6 shadow-sm border border-teal-900/10 space-y-4">
        {/* Filter Tabs & Search Header */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-teal-950 flex items-center gap-2">
                <span>{viewMode === "focus" ? "⚡ Calling Card" : "📋 All Leads"}</span>
                <span className="text-xs font-mono bg-cream px-2.5 py-0.5 rounded-full border border-teal-900/15 font-bold">
                  {filteredLeads.length} leads
                </span>
              </h2>
              <p className="text-xs text-teal-950/60 mt-0.5">
                {viewMode === "focus"
                  ? "Single-lead focus view. Tap Call or WhatsApp to reach donor."
                  : "Click any lead below to load into the Calling Card."}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search donor name or phone..."
                className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs bg-white text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-teal-950/40 hover:text-teal-950 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Dual-Stream Switcher Bar: Parents Sheet vs Direct Donors Sheet */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-sand/35 p-2 rounded-2xl border border-teal-900/10">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-black text-teal-950 uppercase tracking-wider px-1 shrink-0">
                📂 ಡೇಟಾ ಶೀಟ್ (Stream):
              </span>
              <button
                type="button"
                onClick={() => {
                  setStreamFilter("ALL");
                  setFocusIndex(0);
                  setActiveFocusLeadId(null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  streamFilter === "ALL"
                    ? "bg-teal-950 text-gold shadow-xs"
                    : "bg-white text-teal-950/80 hover:bg-sand border border-teal-900/10"
                }`}
              >
                <span>🌟 ಎಲ್ಲಾ ಶೀಟ್‌ಗಳು (All Streams)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStreamFilter("PARENTS");
                  setFocusIndex(0);
                  setActiveFocusLeadId(null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  streamFilter === "PARENTS"
                    ? "bg-indigo-950 text-amber-300 shadow-xs"
                    : "bg-white text-indigo-950 hover:bg-indigo-50 border border-indigo-900/20"
                }`}
              >
                <span>👶 1. ಪೋಷಕರ ಶೀಟ್ (Parents / Child DOB)</span>
                <span className="text-[10px] bg-amber-400 text-teal-950 px-1.5 py-0.2 rounded-full font-black">
                  {counts.parents} ಬಾಕಿ
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStreamFilter("DIRECT_DONOR");
                  setFocusIndex(0);
                  setActiveFocusLeadId(null);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  streamFilter === "DIRECT_DONOR"
                    ? "bg-teal-950 text-emerald-300 shadow-xs"
                    : "bg-white text-teal-950 hover:bg-teal-50 border border-teal-900/20"
                }`}
              >
                <span>🎂 2. ನೇರ ದಾನಿಗಳ ಶೀಟ್ (Direct Donors DOB)</span>
                <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded-full font-black">
                  {counts.donors} ಬಾಕಿ
                </span>
              </button>
            </div>
          </div>

          {/* Controls Bar: Filter Tabs + Date Sort Option */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            {/* Clean Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
              {[
                { id: "Pending", label: "⏳ ಕರೆ ಬಾಕಿ (To Call)", count: counts.pending, color: "text-amber-900 bg-amber-100" },
                { id: "Tomorrow_Birthday", label: "🎂 ನಾಳೆ ಹುಟ್ಟುಹಬ್ಬ (Tomorrow)", count: counts.tomorrowBirthdays, color: "text-purple-900 bg-purple-100" },
                { id: "Today_Birthday", label: "🎉 ಇಂದು ಹುಟ್ಟುಹಬ್ಬ (Today)", count: counts.birthdays, color: "text-pink-900 bg-pink-100" },
                { id: "Reschedule", label: "📅 ಮತ್ತೆ ಕರೆ (Callbacks)", count: counts.reschedule, color: "text-blue-900 bg-blue-100" },
                { id: "Attended", label: "✓ ಮುಗಿದಿದೆ (Completed)", count: counts.attended, color: "text-emerald-900 bg-emerald-100" },
                { id: "ALL", label: "📋 ಎಲ್ಲವೂ (All)", count: counts.all, color: "text-teal-950/60 bg-white" },
              ].map((st) => {
                const isActive = filter === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setFilter(st.id);
                      setFocusIndex(0);
                    }}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? "bg-teal-950 text-white shadow-sm"
                        : "bg-cream text-teal-950/80 hover:bg-sand border border-teal-900/10"
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                        isActive ? "bg-white/20 text-white" : st.color
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Date Sort Selector */}
            <div className="flex items-center gap-1.5 shrink-0 bg-sand/40 border border-teal-900/15 rounded-xl px-2.5 py-1 self-start sm:self-auto">
              <span className="font-bold text-teal-950/70 text-[11px] whitespace-nowrap">📅 ವಿಂಗಡಣೆ (Sort):</span>
              <select
                value={dateSortOrder}
                onChange={(e) => {
                  setDateSortOrder(e.target.value as any);
                  setFocusIndex(0);
                  setPortalPage(1);
                }}
                className="bg-transparent text-xs font-bold text-teal-950 outline-none cursor-pointer"
              >
                <option value="birthday_upcoming">🎂 ಇಂದು &amp; ಮುಂಬರುವ ಹುಟ್ಟುಹಬ್ಬ (Upcoming First)</option>
                <option value="birthday_calendar">🎂 ಕ್ಯಾಲೆಂಡರ್ ದಿನಾಂಕ (Jan 1 → Dec 31)</option>
                <option value="date_newest">🆕 ಹೊಸ ಲೀಡ್ ಮೊದಲು (Newest Added First)</option>
                <option value="date_oldest">⏳ ಹಳೆಯ ಲೀಡ್ ಮೊದಲು (Oldest Added First)</option>
                <option value="callback_earliest">⏰ ಮರುಕರೆ ಸಮಯ (Urgent Callbacks First)</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Mode Switcher on Mobile, Master-Detail Status on Desktop */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-sand/40 border border-teal-900/15">
          {/* Mobile Switcher (Queue vs Calling Card) */}
          <div className="flex lg:hidden items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => setViewMode("focus")}
              className={`flex-1 rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                viewMode === "focus"
                  ? "bg-teal-950 text-gold shadow-sm"
                  : "bg-white text-teal-950 hover:bg-cream"
              }`}
            >
              <span>⚡</span>
              <span>Calling Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("queue")}
              className={`flex-1 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === "queue"
                  ? "bg-teal-950 text-white shadow-sm"
                  : "bg-white text-teal-950 hover:bg-cream"
              }`}
            >
              <span>📋</span>
              <span>All Leads ({filteredLeads.length})</span>
            </button>
          </div>

          {/* Desktop Cockpit Status Info */}
          <div className="hidden lg:flex items-center justify-between w-full px-2 text-xs font-bold text-teal-950">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>🖥️ Master-Detail Split Cockpit: Queue on Left, Calling Card on Right</span>
              <span className="text-[10px] font-mono bg-cream px-2 py-0.5 rounded-full border border-teal-900/15 font-black text-emerald-900">
                Zero Vanishing Active
              </span>
            </div>
            <span className="text-[11px] text-teal-950/70 font-semibold">
              Click any lead on the left to load into Calling Card · Live In-Call FAQ &amp; Quick Notes below
            </span>
          </div>
        </div>

        {/* ── MASTER-DETAIL SPLIT COCKPIT (Desktop 2-Column Split / Mobile Tabbed Cockpit) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">
          {/* ── LEFT PANE: CALLING QUEUE (Always visible on desktop; on mobile shown when viewMode === 'queue') ── */}
          <div className={`space-y-3 lg:col-span-5 xl:col-span-4 ${viewMode === "queue" ? "block" : "hidden lg:block"}`}>
            {/* Queue Header & Filter Summary */}
            <div className="flex items-center justify-between bg-sand/50 p-2.5 rounded-2xl border border-teal-900/10">
              <div className="flex items-center gap-2">
                <span className="text-base">📋</span>
                <span className="font-display font-black text-xs sm:text-sm text-teal-950">
                  Calling Queue
                </span>
                <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-teal-900/15 text-teal-950">
                  {filteredLeads.length}
                </span>
              </div>
              <span className="text-[11px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                {counts.pending} to call
              </span>
            </div>

            {/* Leads List */}
            {loadingLeads ? (
              <div className="p-8 text-center text-teal-950/60 text-xs bg-cream/30 rounded-2xl border border-teal-900/10">
                Loading assigned leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-teal-950/60 text-xs bg-cream/30 rounded-2xl border border-teal-900/10 space-y-2">
                <p className="font-bold text-teal-950">No leads found matching current filter.</p>
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className="rounded-xl bg-teal-950 text-white px-3 py-1.5 text-xs font-bold shadow-xs hover:bg-teal-900 cursor-pointer"
                >
                  Show All ({leads.length})
                </button>
              </div>
            ) : (
              <div className="max-h-[820px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {paginatedLeads.map((lead, localIdx) => {
                  const idx = (portalPage - 1) * portalPageSize + localIdx;
                  const now = new Date();
                  const curDay = now.getDate();
                  const curMonth = now.getMonth() + 1;
                  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                  const tomorrowDay = tomorrow.getDate();
                  const tomorrowMonth = tomorrow.getMonth() + 1;
                  const isTodayBirthday = lead.dobDay === curDay && lead.dobMonth === curMonth;
                  const isTomorrowBirthday = lead.dobDay === tomorrowDay && lead.dobMonth === tomorrowMonth;
                  const isSelected = lead.leadId === activeFocusLeadId;
                  const isDialing = lead.leadId === currentlyDialedLeadId;
                  const isDialed = sessionContactedIds.has(lead.leadId);
                  const isAttended = lead.status && lead.status !== "Pending";
                  const phoneInfo = parseCustomerPhone(lead.phone);
                  const isParent = lead.stream === "PARENTS" || Boolean(lead.parentName || lead.childName);

                  return (
                    <div
                      key={lead.leadId}
                      onClick={() => {
                        setActiveFocusLeadId(lead.leadId);
                        const overallIdx = filteredLeads.findIndex((fl) => fl.leadId === lead.leadId);
                        if (overallIdx !== -1) setFocusIndex(overallIdx);
                        setViewMode("focus");
                      }}
                      className={`rounded-2xl p-3 border transition shadow-xs cursor-pointer select-none ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/60 shadow-sm"
                          : isTodayBirthday || isTomorrowBirthday
                          ? "border-purple-300 bg-purple-50/30 hover:border-purple-400"
                          : isAttended
                          ? "border-emerald-500/25 bg-white/80 hover:border-emerald-500/40"
                          : "border-teal-900/10 bg-white hover:border-teal-900/30"
                      }`}
                    >
                      {/* Top Row: Stream, Name & Status */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md ${
                            isSelected ? "bg-amber-500 text-teal-950 font-black" : "bg-teal-950/10 text-teal-950/70"
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-display font-black text-xs sm:text-sm text-teal-950 truncate">
                            {isParent ? `👶 ${cleanChildName(lead)}` : lead.name}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {lead.status === "Donated" ? (
                            <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-black shadow-2xs">
                              🎉 Donated
                            </span>
                          ) : lead.status === "Interested" ? (
                            <span className="rounded-full bg-amber-500 text-teal-950 px-2 py-0.5 text-[9px] font-black">
                              👍 Interested
                            </span>
                          ) : lead.status === "Reschedule" ? (
                            <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black">
                              📅 Callback
                            </span>
                          ) : isDialing ? (
                            <span className="rounded-full bg-emerald-500 text-white px-2 py-0.5 text-[9px] font-black animate-pulse">
                              📞 Dialing...
                            </span>
                          ) : isDialed ? (
                            <span className="rounded-full bg-slate-600 text-white px-2 py-0.5 text-[9px] font-bold">
                              ✓ Dialed
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[9px] font-bold border border-amber-300">
                              ⏳ To Call
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Stream pill, Birthday info & Phone */}
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-teal-950/70 flex-wrap">
                        {isParent ? (
                          <span className="text-[9px] font-bold bg-indigo-100 text-indigo-900 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <span>👶</span>
                            <span>ಮಗು: <strong>{cleanChildName(lead)}</strong></span>
                            {lead.parentName && <span className="opacity-75 font-normal">({lead.parentName})</span>}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-teal-100 text-teal-900 px-1.5 py-0.2 rounded">
                            🎂 Direct Donor
                          </span>
                        )}

                        {lead.dobDay && lead.dobMonth && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isTomorrowBirthday
                              ? "bg-purple-100 text-purple-900 font-black animate-pulse"
                              : isTodayBirthday
                              ? "bg-amber-100 text-amber-900 font-black"
                              : "text-teal-950/60"
                          }`}>
                            🎂 {lead.dobDay}/{lead.dobMonth} {isTomorrowBirthday ? "(Tomorrow)" : (isTodayBirthday ? "(Today)" : "")}
                          </span>
                        )}

                        <span className="font-mono text-[11px] font-bold text-teal-950 ml-auto">
                          {phoneInfo.display}
                        </span>
                      </div>

                      {/* Bottom Note Preview if present */}
                      {lead.notes && (
                        <p className="mt-1 text-[10px] text-teal-950/60 italic truncate border-t border-teal-900/5 pt-0.5">
                          📝 &quot;{lead.notes}&quot;
                        </p>
                      )}

                      {/* Action buttons inside queue card for fast access */}
                      <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-teal-900/5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCallLead(lead);
                          }}
                          className="px-2 py-1 rounded-lg bg-teal-950 text-white text-[10px] font-bold hover:bg-teal-900 active:scale-95 shadow-2xs"
                        >
                          📞 Call
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectWhatsAppChat(lead, selectedSevaAmount);
                          }}
                          className="px-2 py-1 rounded-lg bg-[#25D366] text-white text-[10px] font-bold hover:brightness-105 active:scale-95 shadow-2xs"
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPortalPages > 1 && (
              <div className="flex items-center justify-between bg-sand/30 p-2 rounded-xl border border-teal-900/10 text-xs">
                <button
                  type="button"
                  onClick={() => setPortalPage((p) => Math.max(1, p - 1))}
                  disabled={portalPage === 1}
                  className="rounded-lg px-2.5 py-1 bg-white hover:bg-sand disabled:opacity-40 text-teal-950 font-bold transition cursor-pointer border border-teal-900/10 text-[11px]"
                >
                  ◀ Prev
                </button>
                <span className="font-mono font-bold text-teal-950 text-[11px]">
                  Page {portalPage} of {totalPortalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPortalPage((p) => Math.min(totalPortalPages, p + 1))}
                  disabled={portalPage === totalPortalPages}
                  className="rounded-lg px-2.5 py-1 bg-white hover:bg-sand disabled:opacity-40 text-teal-950 font-bold transition cursor-pointer border border-teal-900/10 text-[11px]"
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT PANE: ACTIVE CALLING CARD WORKSPACE (Always visible on desktop; on mobile shown when viewMode === 'focus') ── */}
          <div className={`space-y-4 lg:col-span-7 xl:col-span-8 ${viewMode === "focus" ? "block" : "hidden lg:block"}`}>
            {/* Mobile Back-To-Queue Header */}
            <div className="lg:hidden flex items-center justify-between bg-sand/60 border border-teal-900/15 p-2 rounded-xl mb-1">
              <button
                type="button"
                onClick={() => setViewMode("queue")}
                className="text-xs font-black text-teal-950 flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-xl bg-white border border-teal-900/15 shadow-2xs active:scale-95"
              >
                <span>◀</span>
                <span>ಎಲ್ಲಾ ಲೀಡ್‌ಗಳು (Queue: {filteredLeads.length})</span>
              </button>
              <span className="text-xs font-mono font-bold text-teal-950 bg-cream px-2 py-1 rounded-lg border border-teal-900/10">
                #{safeFocusIndex + 1} of {filteredLeads.length}
              </span>
            </div>

            {!currentFocusLead ? (
              <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-amber-50/50 via-white to-cream/30 text-center border border-teal-900/15 shadow-sm space-y-4">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center text-3xl">
                  🎉
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-display font-black text-teal-950">
                    {filter === "Pending" ? "Outstanding Effort! Today's Pending Queue Reached!" : "All Leads Completed in This Filter!"}
                  </h3>
                  <p className="text-xs text-teal-950/70 max-w-md mx-auto mt-1">
                    {filter === "Pending"
                      ? "You have contacted or updated every pending lead assigned to your queue today. Zero repetition guarantee active."
                      : "No more leads match the selected filter. Review scheduled callbacks, check attended donors, or switch filters below."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setFilter("Reschedule")}
                    className="rounded-xl bg-amber-500 text-teal-950 px-4 py-2 text-xs font-black shadow-xs hover:bg-amber-600 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📅</span>
                    <span>Review Callbacks ({counts.reschedule || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("Attended")}
                    className="rounded-xl bg-teal-950 text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-teal-900 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📞</span>
                    <span>View Attended Today ({stats.contactedCount || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("ALL")}
                    className="rounded-xl bg-white border border-teal-900/20 text-teal-950 hover:bg-sand px-4 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    Full Roster ({leads.length})
                  </button>
                </div>
              </div>
            ) : (
              (() => {
                const now = new Date();
                const curDay = now.getDate();
                const curMonth = now.getMonth() + 1;
                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                const tomorrowDay = tomorrow.getDate();
                const tomorrowMonth = tomorrow.getMonth() + 1;
                const isTodayBirthday = currentFocusLead.dobDay === curDay && currentFocusLead.dobMonth === curMonth;
                const isTomorrowBirthday = currentFocusLead.dobDay === tomorrowDay && currentFocusLead.dobMonth === tomorrowMonth;
                const isParentLead = currentFocusLead.stream === "PARENTS" || Boolean(currentFocusLead.parentName || currentFocusLead.childName);
                const phoneInfo = parseCustomerPhone(currentFocusLead.phone);

                return (
                  <div
                    className={`rounded-3xl bg-white p-5 sm:p-7 border shadow-md space-y-5 transition ${
                      isTomorrowBirthday || isTodayBirthday
                        ? "border-amber-400 ring-4 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 to-white"
                        : "border-teal-900/15"
                    }`}
                  >
                    {/* Top Status & Queue Index Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-black bg-teal-950 text-gold px-2.5 py-1 rounded-xl shadow-xs">
                          LEAD {safeFocusIndex + 1} OF {filteredLeads.length}
                        </span>
                        {isParentLead ? (
                          <span className="rounded-full bg-indigo-950 text-amber-300 px-3 py-1 text-xs font-black uppercase shadow-xs flex items-center gap-1">
                            <span>👶</span>
                            <span>1. Parents Sheet (ಮಗು: {cleanChildName(currentFocusLead)})</span>
                          </span>
                        ) : (
                          <span className="rounded-full bg-teal-950 text-emerald-300 px-3 py-1 text-xs font-black uppercase shadow-xs flex items-center gap-1">
                            <span>🎂</span>
                            <span>2. Direct Donor Sheet</span>
                          </span>
                        )}
                        {isTomorrowBirthday && (
                          <span className="rounded-full bg-purple-600 text-white px-3 py-1 text-xs font-black uppercase shadow-xs animate-pulse flex items-center gap-1">
                            <span>🎂</span>
                            <span>Tomorrow&apos;s Birthday! (Advance Wish)</span>
                          </span>
                        )}
                        {isTodayBirthday && (
                          <span className="rounded-full bg-amber-500 text-teal-950 px-3 py-1 text-xs font-black uppercase shadow-xs animate-pulse flex items-center gap-1">
                            <span>🎉</span>
                            <span>Today&apos;s Birthday!</span>
                          </span>
                        )}
                        {currentFocusLead.status && currentFocusLead.status !== "Pending" ? (
                          <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-xs font-bold border border-emerald-300">
                            ✓ {currentFocusLead.status}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-xs font-bold border border-amber-300">
                            ⏳ Pending
                          </span>
                        )}
                      </div>

                      {/* Navigation Prev / Next buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePrevFocusLead}
                          disabled={safeFocusIndex === 0}
                          className="rounded-xl bg-cream hover:bg-sand disabled:opacity-30 border border-teal-900/15 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer"
                        >
                          ◀ Prev
                        </button>
                        <button
                          type="button"
                          onClick={handleNextFocusLead}
                          disabled={safeFocusIndex >= filteredLeads.length - 1}
                          className="rounded-xl bg-teal-950 text-white hover:bg-teal-900 disabled:opacity-30 px-2.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          Next ▶
                        </button>
                        <button
                          type="button"
                          onClick={handleJumpToNextPending}
                          title="Jump to the next fresh pending lead in queue"
                          className="rounded-xl bg-amber-500 hover:bg-amber-600 text-teal-950 px-2.5 py-1.5 text-xs font-black transition cursor-pointer shadow-2xs flex items-center gap-1"
                        >
                          <span>⏭️ Fresh</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Dial Banner */}
                    {currentlyDialedLeadId === currentFocusLead.leadId && (
                      <div className="rounded-2xl bg-emerald-100 border-2 border-emerald-500 p-3.5 flex items-center justify-between gap-3 animate-pulse shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">📞</span>
                          <div>
                            <p className="text-xs font-black text-emerald-950 leading-tight">
                              ಕರೆ ಪ್ರಾರಂಭವಾಗಿದೆ (Call in Progress...)
                            </p>
                            <p className="text-[11px] text-emerald-800 mt-0.5">
                              After call, tap an outcome button below (Interested / Busy / Paid / Not Interested) to save &amp; advance!
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentlyDialedLeadId(null)}
                          className="text-[11px] font-bold text-emerald-900 bg-white/70 px-2.5 py-1 rounded-lg border border-emerald-300 hover:bg-white cursor-pointer shrink-0"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Already Attended Lead Warning Banner */}
                    {currentFocusLead.status && currentFocusLead.status !== "Pending" && (
                      <div className="rounded-2xl bg-amber-50 border border-amber-300 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                          <span className="text-base">⚠️</span>
                          <span>
                            ಈ ನಂಬರ್‌ಗೆ ಈಗಾಗಲೇ ಕರೆ ಮಾಡಲಾಗಿದೆ (Already Contacted: <strong>{currentFocusLead.status}</strong>).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleJumpToNextPending}
                          className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
                        >
                          <span>⏭️ ಮುಂದಿನ ಹೊಸ ನಂಬರ್ (Jump to Fresh Lead)</span>
                        </button>
                      </div>
                    )}

                    {/* Donor Details Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sand/25 p-4 rounded-2xl border border-teal-900/10">
                      <div>
                        {isParentLead ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-amber-300 px-2.5 py-0.5 rounded-lg">
                                👶 1. ಪೋಷಕರ ಶೀಟ್ (Parents / Child Birthday)
                              </span>
                              <span className="text-xs font-mono text-teal-950/50">#{currentFocusLead.leadId}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-bold text-teal-950/70">ಮಗುವಿನ ಹೆಸರು (Child / Student):</span>
                              <h2 className="font-display text-xl sm:text-2xl font-black text-indigo-950">
                                {cleanChildName(currentFocusLead)}
                              </h2>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-teal-950/80 flex-wrap pt-0.5">
                              <span><strong>ಪೋಷಕರು (Parent):</strong> {currentFocusLead.parentName || "Parent"}</span>
                              <span className="font-mono text-xs font-bold text-teal-950 bg-white px-2 py-0.5 rounded-lg border border-teal-900/15">
                                📱 {phoneInfo.display}
                              </span>
                              {currentFocusLead.dobDay && currentFocusLead.dobMonth && (
                                <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-lg">
                                  🎂 ಮಗುವಿನ ಹುಟ್ಟುಹಬ್ಬ: {currentFocusLead.dobDay}/{currentFocusLead.dobMonth} {isTomorrowBirthday ? " (ನಾಳೆ / Tomorrow!)" : (isTodayBirthday ? " (ಇಂದು / Today!)" : "")}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider bg-teal-950 text-emerald-300 px-2.5 py-0.5 rounded-lg">
                                🎂 2. ನೇರ ದಾನಿಗಳ ಶೀಟ್ (Direct Donor Birthday)
                              </span>
                              <span className="text-xs font-mono text-teal-950/50">#{currentFocusLead.leadId}</span>
                            </div>
                            <h2 className="font-display text-xl sm:text-2xl font-black text-teal-950">
                              {currentFocusLead.name}
                            </h2>
                            <div className="flex items-center gap-2.5 text-xs text-teal-950/70 flex-wrap pt-0.5">
                              <span className="font-mono text-sm font-bold text-teal-950 bg-white px-2 py-0.5 rounded-lg border border-teal-900/15">
                                📱 {phoneInfo.display}
                              </span>
                              {currentFocusLead.dobDay && currentFocusLead.dobMonth && (
                                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg">
                                  🎂 ದಾನಿಗಳ ಹುಟ್ಟುಹಬ್ಬ: {currentFocusLead.dobDay}/{currentFocusLead.dobMonth} {isTomorrowBirthday ? " (ನಾಳೆ / Tomorrow!)" : (isTodayBirthday ? " (ಇಂದು / Today!)" : "")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Suggested Seva Amount Tag */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-teal-950/60 uppercase block">Suggested Seva:</span>
                        <span className="text-sm sm:text-base font-black text-emerald-800">
                          {isTomorrowBirthday || isTodayBirthday ? "₹2,500 (Birthday Feast)" : "₹1,500 (Breakfast / Cow Milk)"}
                        </span>
                      </div>
                    </div>

                    {/* ── 1-TAP OUTREACH LANGUAGE SELECTOR (KANGLISH / KANNADA / ENGLISH) ── */}
                    <div className="rounded-2xl bg-cream/70 border border-teal-900/15 p-2.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🌐</span>
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider">
                          ಸಂದೇಶ ಭಾಷೆ (Language):
                        </span>
                      </div>
                      <div className="inline-flex rounded-xl bg-white p-0.5 border border-teal-900/15 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreferredLanguage("kanglish")}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                            preferredLanguage === "kanglish"
                              ? "bg-teal-950 text-white shadow-2xs font-black ring-1 ring-teal-950"
                              : "text-teal-950/70 hover:text-teal-950"
                          }`}
                        >
                          🔤 Kanglish
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreferredLanguage("kn")}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                            preferredLanguage === "kn"
                              ? "bg-teal-950 text-gold shadow-2xs font-black ring-2 ring-amber-400"
                              : "text-teal-950/70 hover:text-teal-950"
                          }`}
                        >
                          🇮🇳 ಕನ್ನಡ (Kannada)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreferredLanguage("en")}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                            preferredLanguage === "en"
                              ? "bg-teal-950 text-white shadow-2xs font-black ring-1 ring-teal-950"
                              : "text-teal-950/70 hover:text-teal-950"
                          }`}
                        >
                          🇬🇧 English
                        </button>
                      </div>
                    </div>

                    {/* ── 1-TAP SEVA TIER SELECTOR PILLS ── */}
                    <div className="rounded-2xl bg-sand/40 border border-teal-900/15 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider">
                          🎯 Select Seva Tier (Sets WhatsApp &amp; UPI Links):
                        </span>
                        <span className="text-xs font-black text-emerald-800">
                          Selected: ₹{formatINR(selectedSevaAmount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {[
                          { amt: 501, label: "₹501 Milk / Starter" },
                          { amt: 1500, label: "₹1,500 Breakfast" },
                          { amt: 2500, label: "₹2,500 Feast" },
                          { amt: 4500, label: "₹4,500 Full Day" },
                          { amt: 6000, label: "₹6,000 Ration" },
                        ].map((tier) => (
                          <button
                            key={tier.amt}
                            type="button"
                            onClick={() => setSelectedSevaAmount(tier.amt)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${
                              selectedSevaAmount === tier.amt
                                ? "bg-teal-950 text-gold border-teal-950 shadow-xs font-black"
                                : "bg-white text-teal-950 border-teal-900/15 hover:bg-sand"
                            }`}
                          >
                            {tier.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ── PRIMARY TELECALLER ACTIONS (Bilingual, Ultra Simple & Direct) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* ACTION 1: Dial Customer Now */}
                      <button
                        type="button"
                        onClick={() => handleCallLead(currentFocusLead)}
                        className="p-3.5 rounded-2xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer min-h-[56px]"
                      >
                        <span className="text-2xl">📞</span>
                        <div className="text-left">
                          <span className="block leading-tight font-black text-gold">
                            {isParentLead ? "ಪೋಷಕರಿಗೆ ಕರೆ ಮಾಡಿ (Call Parent)" : "ದಾನಿಗಳಿಗೆ ಕರೆ ಮಾಡಿ (Call Donor)"}
                          </span>
                          <span className="block text-[11px] font-mono text-white/80">{phoneInfo.display}</span>
                        </div>
                      </button>

                      {/* ACTION 2: WhatsApp Details & UPI Link */}
                      <button
                        type="button"
                        onClick={() => handleDirectWhatsAppChat(currentFocusLead, selectedSevaAmount)}
                        className="p-3.5 rounded-2xl bg-[#25D366] hover:brightness-105 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer min-h-[56px]"
                      >
                        <span className="text-2xl">💬</span>
                        <div className="text-left">
                          <span className="block leading-tight font-black">
                            {isParentLead ? `👶 ಶುಭಾಶಯ ಸಂದೇಶ (${cleanChildName(currentFocusLead)})` : `WhatsApp ಸಂದೇಶ (₹${formatINR(selectedSevaAmount)})`}
                          </span>
                          <span className="block text-[11px] text-white/90">Send Seva Details &amp; Pay Link</span>
                        </div>
                      </button>
                    </div>

                    {/* Secondary Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => handleDirectSharePaymentQr(currentFocusLead, selectedSevaAmount)}
                        className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 px-3.5 py-2 font-black transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <span className="text-base">📷</span>
                        <span>QR ಸ್ಕ್ಯಾನರ್ ಫೋಟೋ ಕಳುಹಿಸಿ (Share Bank QR)</span>
                      </button>

                      <div className="flex items-center gap-2 text-teal-950/60">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNotesLead(currentFocusLead);
                            setNotesText(currentFocusLead.notes || "");
                            setCallbackDateTime("");
                          }}
                          className="font-bold text-teal-900 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>📝</span>
                          <span>Add Detailed Note</span>
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppModal(currentFocusLead)}
                          className="font-bold text-teal-900 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>⚙️</span>
                          <span>Message Templates</span>
                        </button>
                      </div>
                    </div>

                    {/* ── FEATURE 2: 1-TAP QUICK NOTE CHIPS & INLINE NOTES ── */}
                    <div className="rounded-2xl border border-teal-900/15 bg-sand/20 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>1-Tap Quick Note Chips:</span>
                        </span>
                        <span className="text-[10px] text-teal-950/60 font-semibold">
                          Tap chip to add to notes
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          isParentLead ? "👶 ತಂದೆ ಮಾತನಾಡಿದ್ದಾರೆ (Father answered)" : "👤 ದಾನಿ ಮಾತನಾಡಿದ್ದಾರೆ (Donor answered)",
                          isParentLead ? "👩 ತಾಯಿ ಮಾತನಾಡಿದ್ದಾರೆ (Mother answered)" : "🤝 ಒಪ್ಪಿದ್ದಾರೆ (Agreed to donate)",
                          `🎂 ₹${formatINR(selectedSevaAmount)} ಅನ್ನದಾನಕ್ಕೆ ಒಪ್ಪಿದ್ದಾರೆ`,
                          "📲 WhatsApp QR ಕಳುಹಿಸಲಾಗಿದೆ",
                          "🏛️ ಆಶ್ರಮಕ್ಕೆ ಭೇಟಿ ನೀಡುತ್ತಾರೆ",
                          "📜 80G ರಶೀದಿ ಕೇಳಿದ್ದಾರೆ",
                          "🗣️ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ",
                          "⏳ ಸಂಜೆ ಕರೆ (Call evening)",
                          "📵 ಕರೆ ಸ್ವೀಕರಿಸಿಲ್ಲ (RNR)",
                          "❌ ನಂಬರ್ ಬದಲಾಗಿದೆ",
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => {
                              const cleanCurrent = (cardNoteInput || currentFocusLead.notes || "").trim();
                              const newNote = cleanCurrent ? `${cleanCurrent} · ${chip}` : chip;
                              setCardNoteInput(newNote);
                              showToast(`Added: ${chip}`);
                            }}
                            className="text-[10px] bg-white hover:bg-amber-100/80 border border-teal-900/15 text-teal-950 px-2 py-1 rounded-lg font-bold transition cursor-pointer shadow-2xs"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>

                      {/* Note Input Field with 1-Tap Save */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={cardNoteInput}
                          onChange={(e) => setCardNoteInput(e.target.value)}
                          placeholder={currentFocusLead.notes ? `Current: ${currentFocusLead.notes}` : "Type custom note or tap chips above..."}
                          className="flex-1 rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs text-teal-950 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                        <button
                          type="button"
                          disabled={savingCardNote || !cardNoteInput.trim()}
                          onClick={async () => {
                            if (!callerProfile || !cardNoteInput.trim()) return;
                            setSavingCardNote(true);
                            try {
                              await handleUpdateDisposition(
                                currentFocusLead.leadId,
                                currentFocusLead.status || "Contacted",
                                cardNoteInput.trim()
                              );
                              setCardNoteInput("");
                              showToast("✓ Note saved to lead record!");
                            } finally {
                              setSavingCardNote(false);
                            }
                          }}
                          className="rounded-xl bg-teal-950 text-gold hover:bg-teal-900 px-3 py-1.5 text-xs font-black shadow-xs cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          {savingCardNote ? "Saving..." : "💾 Save Note"}
                        </button>
                      </div>
                    </div>

                    {/* ── 1-TAP DISPOSITION & AUTO-ADVANCE STRIP ── */}
                    <div className="space-y-2 pt-2 border-t border-teal-900/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider">
                          ⚡ 1-Tap Result &amp; Auto-Advance:
                        </span>
                        <span className="text-[10px] text-teal-950/60 font-semibold">
                          Tap any pill below to save &amp; advance to next lead
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                        {/* WARM / INTERESTED */}
                        <button
                          type="button"
                          onClick={() => {
                            const note = cardNoteInput.trim() || undefined;
                            void handleFocusDisposition(currentFocusLead.leadId, "Interested", note);
                            setCardNoteInput("");
                          }}
                          className="min-h-[54px] p-2 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-teal-950 font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>👍</span>
                            <span>ಒಪ್ಪಿದ್ದಾರೆ</span>
                          </span>
                          <span className="text-[10px] text-teal-950/80 font-bold uppercase tracking-wider">Interested</span>
                        </button>

                        {/* BUSY / NO ANSWER */}
                        <button
                          type="button"
                          onClick={() => {
                            const twoHoursLater = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
                            const note = cardNoteInput.trim() || "Auto-rescheduled +2 hours";
                            void handleFocusDisposition(currentFocusLead.leadId, "No_Answer", note, twoHoursLater);
                            setCardNoteInput("");
                          }}
                          className="min-h-[54px] p-2 rounded-2xl bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>⏳</span>
                            <span>ಬಿಜಿಯಿದ್ದಾರೆ</span>
                          </span>
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Busy / +2h</span>
                        </button>

                        {/* CALLBACK LATER */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNotesLead(currentFocusLead);
                            setNotesText(cardNoteInput.trim() || currentFocusLead.notes || "");
                            setCallbackDateTime("");
                          }}
                          className="min-h-[54px] p-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>📅</span>
                            <span>ನಂತರ ಕರೆ</span>
                          </span>
                          <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Callback</span>
                        </button>

                        {/* PAID / LOG DONATION */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDonationLead(currentFocusLead);
                            setLoggedDonationAmount(selectedSevaAmount || (isTodayBirthday ? 2500 : 1500));
                            setLoggedDonationUtr("");
                          }}
                          className="min-h-[54px] p-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>🎉</span>
                            <span>ಹಣ ನೀಡಿದ್ದಾರೆ</span>
                          </span>
                          <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Log Paid ₹</span>
                        </button>

                        {/* NOT INTERESTED */}
                        <button
                          type="button"
                          onClick={() => {
                            const note = cardNoteInput.trim() || undefined;
                            void handleFocusDisposition(currentFocusLead.leadId, "Rejected", note);
                            setCardNoteInput("");
                          }}
                          className="min-h-[54px] p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-800 border border-rose-200 font-black transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>✕</span>
                            <span>ಆಸಕ್ತಿಯಿಲ್ಲ</span>
                          </span>
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Reject</span>
                        </button>

                        {/* SKIP LEAD */}
                        <button
                          type="button"
                          onClick={() => handleSkipFocusLead(currentFocusLead)}
                          className="min-h-[54px] p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-300 font-black transition flex flex-col items-center justify-center cursor-pointer text-center"
                          title="Skip to next number without repeating today"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>⏭️</span>
                            <span>ದಾಟಿಸಿ</span>
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Skip Card</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Utility Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-900/10 text-[11px] text-teal-950/60">
                      <span className="font-semibold text-emerald-800">
                        ✓ Master-Detail Safe Mode: Leads stay firmly in queue when dialed
                      </span>

                      <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-teal-950/50">
                        <span>Shortcuts: [C] Call · [W] WhatsApp · [Q] QR · [1] Interested · [2] Busy · [N] Next</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD MODAL ── */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/10 text-teal-950">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3 mb-4">
              <h3 className="font-display text-base font-bold text-teal-950 flex items-center gap-2">
                <span>🔑</span> Change Portal Password
              </h3>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="text-teal-950/50 hover:text-teal-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {pwdError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-semibold">
                ⚠️ {pwdError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdCurrent}
                  onChange={(e) => setPwdCurrent(e.target.value)}
                  placeholder="Enter current password (default: ashrama@123)"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  placeholder="At least 4 characters"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NOTES & RESCHEDULE CALLBACK MODAL ── */}
      {activeNotesLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/10 text-teal-950">
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3 mb-4">
              <div>
                <h3 className="font-display text-base font-bold text-teal-950">
                  Call Notes: {activeNotesLead.name}
                </h3>
                <p className="text-[11px] text-teal-950/60">Phone: {parseCustomerPhone(activeNotesLead.phone).display}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotesLead(null)}
                className="text-teal-950/50 hover:text-teal-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  1-Tap Quick Note Chips:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    `👍 Agreed to donate ₹${formatINR(selectedSevaAmount)} via UPI`,
                    "🎂 Wished birthday, visiting ashrama on weekend",
                    "📲 Sent Axis Bank QR scanner, will pay tonight",
                    "⏳ Busy in meeting, call back later",
                    "❌ Out of service / switched off",
                    "🙏 Requested 80G tax receipt on WhatsApp",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleApplyQuickNote(chip)}
                      className="text-[10px] bg-sand/60 hover:bg-amber-100/70 border border-teal-900/15 text-teal-950 px-2 py-1 rounded-lg font-semibold transition cursor-pointer text-left"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-bold text-teal-950/80 mb-1">
                  Call Notes &amp; Donor Feedback
                </label>
                <textarea
                  rows={3}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="e.g. Wished happy birthday, donor agreed to donate ₹2,500 after 6 PM..."
                  className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-teal-950/80">
                    Callback Date &amp; Time (Optional)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetCallback("+2h")}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                    >
                      +2 Hrs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetCallback("today6pm")}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                    >
                      Today 6 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetCallback("tom10am")}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                    >
                      Tom 10 AM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetCallback("tom4pm")}
                      className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                    >
                      Tom 4 PM
                    </button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={callbackDateTime}
                  onChange={(e) => setCallbackDateTime(e.target.value)}
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:border-amber-500 outline-none"
                />
                <p className="text-[10px] text-teal-950/60 mt-1">
                  Setting a callback time automatically marks this lead status as Reschedule.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setActiveNotesLead(null)}
                  className="rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNotes}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingNotes ? "Saving..." : "Save Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ANTI-BAN WHATSAPP OUTREACH MODAL ── */}
      {selectedLeadForWhatsApp && callerProfile && (
        <AntiBanWhatsAppModal
          isOpen={isAntiBanModalOpen}
          onClose={() => {
            setIsAntiBanModalOpen(false);
            setSelectedLeadForWhatsApp(null);
          }}
          lead={selectedLeadForWhatsApp}
          callerId={callerProfile.callerId}
          callerName={callerProfile.name}
          callerWhatsAppNumber={callerProfile.whatsappNumber}
          initialSenderMode="individual"
          initialLanguage={preferredLanguage}
          onDispositionLogged={(leadId, disp) => {
            handleDispositionLoggedFromModal(leadId, disp);
          }}
        />
      )}

      {/* ── DIRECT DONATION LOGGER MODAL (FOR IMMEDIATE 80G RECEIPT & ATTRIBUTION) ── */}
      {activeDonationLead && callerProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setActiveDonationLead(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/15 text-teal-950 space-y-4 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-display font-black text-base text-teal-950">
                    Log Donation: {activeDonationLead.name}
                  </h3>
                  <p className="text-[11px] text-teal-950/60 font-mono">
                    {parseCustomerPhone(activeDonationLead.phone).display} · Attribution to {callerProfile.callerId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDonationLead(null)}
                className="text-teal-950/60 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Amount Presets */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1.5">
                Select or Enter Seva Amount:
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[501, 1500, 2500, 4500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoggedDonationAmount(amt)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer border ${
                      loggedDonationAmount === amt
                        ? "bg-teal-950 text-gold border-teal-950 shadow-xs"
                        : "bg-cream text-teal-950 border-teal-900/15 hover:bg-sand"
                    }`}
                  >
                    ₹{formatINR(amt)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={loggedDonationAmount}
                onChange={(e) => setLoggedDonationAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-sm font-bold text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                placeholder="Enter custom amount in INR"
              />
            </div>

            {/* Optional UTR Number */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                UPI Reference / UTR Number (Optional):
              </label>
              <input
                type="text"
                value={loggedDonationUtr}
                onChange={(e) => setLoggedDonationUtr(e.target.value)}
                placeholder="e.g. 428910293847 (12 digits from GPay/PhonePe)"
                className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-mono text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <p className="text-[10px] text-teal-950/60 mt-1">
                Amount and attribution will immediately update your caller stats and revenue bar.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setActiveDonationLead(null)}
                className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDonationLog}
                disabled={loggingDonation || loggedDonationAmount <= 0}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {loggingDonation ? "Saving..." : `Confirm ₹${formatINR(loggedDonationAmount)} Paid`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY BOTTOM THUMB ACTION COCKPIT ── */}
      {viewMode === "focus" && currentFocusLead && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-2 pb-3 shadow-2xl space-y-1.5 animate-fadeIn">
          {/* Row 1: 1-Tap Fast Disposition Auto-Advance (5 Columns for 5 Action Buttons) */}
          <div className="grid grid-cols-5 gap-1 text-[11px] font-black">
            <button
              type="button"
              onClick={() => handleFocusDisposition(currentFocusLead.leadId, "Interested")}
              className="py-1.5 px-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-teal-950 text-center truncate shadow-2xs cursor-pointer"
              title="Interested"
            >
              👍 ಒಪ್ಪಿದ್ದಾರೆ
            </button>
            <button
              type="button"
              onClick={() => {
                const twoHoursLater = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
                void handleFocusDisposition(currentFocusLead.leadId, "No_Answer", "Auto-rescheduled +2 hours", twoHoursLater);
              }}
              className="py-1.5 px-0.5 rounded-lg bg-slate-700 hover:bg-slate-800 active:scale-95 text-white text-center truncate shadow-2xs cursor-pointer"
              title="Busy / Call later"
            >
              ⏳ ಬಿಜಿ
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveNotesLead(currentFocusLead);
                setNotesText(currentFocusLead.notes || "");
                setCallbackDateTime("");
              }}
              className="py-1.5 px-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-center truncate shadow-2xs cursor-pointer"
              title="Callback Schedule"
            >
              📅 ನಂತರ
            </button>
            <button
              type="button"
              onClick={() => handleFocusDisposition(currentFocusLead.leadId, "Rejected")}
              className="py-1.5 px-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-800 border border-rose-200 text-center truncate shadow-2xs cursor-pointer"
              title="Rejected"
            >
              ✕ ಬೇಡ
            </button>
            <button
              type="button"
              onClick={() => handleSkipFocusLead(currentFocusLead)}
              className="py-1.5 px-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-900 border border-amber-300 text-center truncate shadow-2xs cursor-pointer"
              title="Skip Lead"
            >
              ⏭️ ದಾಟಿಸಿ
            </button>
          </div>

          {/* Row 2: Dial & Outreach Actions */}
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleCallLead(currentFocusLead)}
              className="flex-1 py-2 px-1 rounded-xl bg-teal-950 text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer min-h-[46px]"
            >
              <span className="text-sm">📞</span>
              <span className="text-[10px] leading-tight">ಕರೆ</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectWhatsAppChat(currentFocusLead, selectedSevaAmount)}
              className="flex-1 py-2 px-1 rounded-xl bg-[#25D366] text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer min-h-[46px]"
            >
              <span className="text-sm">💬</span>
              <span className="text-[10px] leading-tight">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectSharePaymentQr(currentFocusLead, selectedSevaAmount)}
              className="flex-1 py-2 px-1 rounded-xl bg-amber-600 text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer min-h-[46px]"
            >
              <span className="text-sm">📷</span>
              <span className="text-[10px] leading-tight">QR ಸ್ಕ್ಯಾನ್</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveDonationLead(currentFocusLead);
                setLoggedDonationAmount(selectedSevaAmount || 1500);
                setLoggedDonationUtr("");
              }}
              className="flex-1 py-2 px-1 rounded-xl bg-emerald-600 text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer min-h-[46px]"
            >
              <span className="text-sm">🎉</span>
              <span className="text-[10px] leading-tight">ಪಾವತಿ</span>
            </button>
            <button
              type="button"
              onClick={handleNextFocusLead}
              disabled={safeFocusIndex >= filteredLeads.length - 1}
              className="py-2 px-2.5 rounded-xl bg-sand border border-teal-900/20 text-teal-950 font-black text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-40 cursor-pointer min-h-[46px]"
              title="Next Lead"
            >
              <span className="text-sm">▶</span>
              <span className="text-[10px] leading-tight">ಮುಂದಕ್ಕೆ</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
