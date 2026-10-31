"use client";

import { useEffect, useState, useMemo } from "react";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import { AntiBanWhatsAppModal } from "@/components/admin/AntiBanWhatsAppModal";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";

interface CallerProfile {
  callerId: string;
  name: string;
  whatsappNumber: string;
  email: string;
  dailyQuota?: number;
}

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
  const [isScriptExpanded, setIsScriptExpanded] = useState(false);
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
  const [filter, setFilter] = useState<string>("ALL");
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

  // Next-Gen Focus Dialing Mode state
  const [viewMode, setViewMode] = useState<"focus" | "queue">("focus");
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [quickPitchLang, setQuickPitchLang] = useState<"kanglish" | "kn" | "en">("kanglish");
  const [selectedSevaAmount, setSelectedSevaAmount] = useState<number>(1500);

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

  const handleDispositionLoggedFromModal = (leadId: number, disp: string) => {
    const updatedList = leads.map((l) => (l.leadId === leadId ? { ...l, status: disp } : l));
    setLeads(updatedList);
    if (callerProfile) {
      computeStats(updatedList, callerProfile.callerId);
    }
    showToast(`✓ Marked lead #${leadId} as ${disp}`);
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

  // Auto-Mark Attended on Phone Call Launch (Direct Customer Call)
  const handleCallLead = (lead: any) => {
    if (!lead.status || lead.status === "Pending") {
      void handleUpdateDisposition(lead.leadId, "Contacted", "Auto-marked attended on call click");
    }
    const phoneInfo = parseCustomerPhone(lead.phone);
    window.location.href = `tel:${phoneInfo.e164}`;
  };

  // Auto-Mark Attended on WhatsApp Dispatch Launch
  const handleWhatsAppLead = (lead: any) => {
    if (!lead.status || lead.status === "Pending") {
      void handleUpdateDisposition(lead.leadId, "Contacted", "Auto-marked attended on WhatsApp dispatch");
    }
    handleOpenWhatsAppModal(lead);
  };

  // Save Notes / Callback Modal
  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNotesLead || !callerProfile) return;
    setSavingNotes(true);
    try {
      const newStatus = callbackDateTime ? "Reschedule" : activeNotesLead.status || "Contacted";
      await handleUpdateDisposition(activeNotesLead.leadId, newStatus, notesText, callbackDateTime);
      setActiveNotesLead(null);
      setNotesText("");
      setCallbackDateTime("");
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

  // 1-Tap Direct WhatsApp Chat Launch
  const handleDirectWhatsAppChat = (lead: any, customAmount?: number) => {
    if (!lead || !callerProfile) return;
    if (!lead.status || lead.status === "Pending") {
      void handleUpdateDisposition(lead.leadId, "Contacted", "Auto-marked attended on WhatsApp dispatch");
    }
    const phoneInfo = parseCustomerPhone(lead.phone);
    const amount = customAmount || selectedSevaAmount || 1500;
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";
    const donationUrl = `${siteOrigin}/give?ref=${callerProfile.callerId}&lead_id=${lead.leadId}&amount=${amount}`;
    const upiLink = `upi://pay?pa=MAB.037349050110044@axisbank&pn=Janaseva%20Ashrama&am=${amount}&cu=INR&tn=Annadana%20Seva%20${callerProfile.callerId}`;
    const text = `🙏 Namaskara ${lead.name} Sir/Madam!\n\nJanaseva Ashrama (Turahalli, Bengaluru) nalli ashrataraagiruva 25 anatha makkala kadeyinda ee vishēsha prarthane mattu namaskara! 👦✨\n\nNamma 25 makkala nitya baale ele ootakke mattu vidyabhyasakke sahaya bedi nimage ee sandēsha kalsuthiddivi.\n\n🍲 Pavitra Annadana Seva Tiers:\n• ₹501 — 3 Dinada Cow Milk & Pediatric Care\n• ₹1,500 — 25 Makkalige Bisi Breakfast Feast\n• ₹2,500 — Wholesome Festive Lunch Feast (Payasa + Sweets)\n• ₹4,500 — Full Day 4-Meal Annadana (All 25 Boys)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n👉 [ 📲 1-TAP PAY ₹${formatINR(amount)} (GPay / PhonePe / 80G Tax Receipt) ]\n${donationUrl}\n\n⚡ 1-Tap GPay / PhonePe App Link:\n${upiLink}\n\n💳 Direct UPI ID (GPay / PhonePe / BHIM):\nMAB.037349050110044@axisbank\n🏛️ Registered Account: JANASEVA SAMRUDDI EDUCATI\n📜 Karnataka Govt JJ Act Reg: KA18CH0242 · 100% 80G Tax Exemption (Form 10AC: AABTJ7431MF20231)\n\n👉 [ 📍 GOOGLE MAPS ASHRAMA PIN ]\nhttps://maps.app.goo.gl/uPjN24rP1i1YkX6t7\n\n👉 [ 📞 DIRECT CALL ASHRAMA ]\n+91 99803 59595\n━━━━━━━━━━━━━━━━━━━━━━━━━\nShree Devaru nimage mattu nimma kutumbakke aayu, aarogya, aishwarya thumbalendu namma 25 makkalu prathidina 6:30 AM satsang nalli prarthane maduthare! 🙏✨`;

    const targetUrl = `https://wa.me/${phoneInfo.waNumber}?text=${encodeURIComponent(text)}`;
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

    const rows = leads.map((l) => [
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
    link.download = `janaseva-telecaller-${callerProfile.callerId}-${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`✓ Exported ${leads.length} leads to CSV file!`);
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
    window.open(targetUrl, "_blank", "noopener,noreferrer");
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
  const handleApplyPresetCallback = (type: "+2h" | "today6pm" | "tom10am" | "tom4pm") => {
    const d = new Date();
    if (type === "+2h") {
      d.setHours(d.getHours() + 2);
    } else if (type === "today6pm") {
      d.setHours(18, 0, 0, 0);
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
  };

  // Focus Mode Disposition with Auto-Advance
  const handleFocusDisposition = async (leadId: number, disposition: string, notes?: string, callbackTime?: string) => {
    await handleUpdateDisposition(leadId, disposition, notes, callbackTime);
    if (focusIndex < filteredLeads.length - 1) {
      setFocusIndex((prev) => prev + 1);
    }
  };

  // Save Direct Offline / UPI Donation Log
  const handleSaveDonationLog = async () => {
    if (!activeDonationLead || !callerProfile) return;
    setLoggingDonation(true);
    try {
      const res = await fetch(`/api/v1/leads/${activeDonationLead.leadId}/log`, {
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
          l.leadId === activeDonationLead.leadId ? { ...l, status: "Donated" } : l
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
        if (viewMode === "focus" && focusIndex < filteredLeads.length - 1) {
          setFocusIndex((prev) => prev + 1);
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

    let pending = 0;
    let attended = 0;
    let birthdays = 0;
    let interested = 0;
    let reschedule = 0;
    let donated = 0;

    leads.forEach((l) => {
      const isAttended = l.status && l.status !== "Pending";
      if (!isAttended) pending++;
      else attended++;

      if (l.dobDay === curDay && l.dobMonth === curMonth) birthdays++;
      if (l.status === "Interested") interested++;
      if (l.status === "Reschedule") reschedule++;
      if (l.status === "Donated") donated++;
    });

    return {
      all: leads.length,
      pending,
      attended,
      birthdays,
      interested,
      reschedule,
      donated,
    };
  }, [leads]);

  // Filter & Search Leads
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    return leads.filter((l) => {
      let matchesFilter = true;
      if (filter === "Today_Birthday") {
        matchesFilter = l.dobDay === curDay && l.dobMonth === curMonth;
      } else if (filter === "Pending") {
        matchesFilter = !l.status || l.status === "Pending";
      } else if (filter === "Attended") {
        matchesFilter = l.status && l.status !== "Pending";
      } else if (filter !== "ALL") {
        matchesFilter = l.status === filter;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        String(l.leadId).includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [leads, filter, searchQuery]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setPortalPage(1);
  }, [filter, searchQuery]);

  const totalPortalPages = Math.max(1, Math.ceil(filteredLeads.length / portalPageSize));
  const paginatedLeads = useMemo(() => {
    const start = (portalPage - 1) * portalPageSize;
    return filteredLeads.slice(start, start + portalPageSize);
  }, [filteredLeads, portalPage, portalPageSize]);

  // Safe Focus Index & Lead computation
  const safeFocusIndex = focusIndex >= filteredLeads.length ? Math.max(0, filteredLeads.length - 1) : focusIndex;
  const currentFocusLead = filteredLeads[safeFocusIndex] || null;

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
        if (focusIndex < filteredLeads.length - 1) setFocusIndex((prev) => prev + 1);
      } else if (e.key === "p" || e.key === "P" || e.key === "ArrowLeft") {
        e.preventDefault();
        if (focusIndex > 0) setFocusIndex((prev) => prev - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, focusIndex, currentFocusLead, filteredLeads, isAntiBanModalOpen, activeNotesLead, activeDonationLead, isChangePasswordOpen]);

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

          {/* 5 Clean Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "Pending", label: "⏳ ಕರೆ ಬಾಕಿ (To Call)", count: counts.pending, color: "text-amber-900 bg-amber-100" },
              { id: "Today_Birthday", label: "🎂 ಇಂದು ಹುಟ್ಟುಹಬ್ಬ (Birthdays)", count: counts.birthdays, color: "text-purple-900 bg-purple-100" },
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
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-sand/40 border border-teal-900/15">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("focus")}
              className={`rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
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
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "queue"
                  ? "bg-teal-950 text-white shadow-sm"
                  : "bg-white text-teal-950 hover:bg-cream"
              }`}
            >
              <span>📋</span>
              <span>All Leads List ({filteredLeads.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-teal-950/70 font-semibold hidden sm:inline">
            {viewMode === "focus"
              ? "🎯 Focused dialer mode"
              : "Click any lead to open in Calling Card"}
          </span>
        </div>

        {/* ── 1. CONTINUOUS FOCUS DIALER VIEW (EXPERT MODE) ── */}
        {viewMode === "focus" && (
          <div className="space-y-4 animate-fadeIn">
            {!currentFocusLead ? (
              <div className="rounded-3xl p-10 bg-cream/30 text-center border border-teal-900/10 space-y-3">
                <span className="text-4xl">🎉</span>
                <h3 className="text-base font-black text-teal-950">
                  All filtered leads completed in this queue!
                </h3>
                <p className="text-xs text-teal-950/70 max-w-sm mx-auto">
                  You have contacted or updated all leads matching this filter. Switch to another filter or view the full queue.
                </p>
                <button
                  type="button"
                  onClick={() => setFilter("ALL")}
                  className="rounded-xl bg-teal-950 text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-teal-900 cursor-pointer"
                >
                  View All Queue ({leads.length})
                </button>
              </div>
            ) : (
              (() => {
                const now = new Date();
                const isTodayBirthday = currentFocusLead.dobDay === now.getDate() && currentFocusLead.dobMonth === now.getMonth() + 1;
                const phoneInfo = parseCustomerPhone(currentFocusLead.phone);

                return (
                  <div
                    className={`rounded-3xl bg-white p-5 sm:p-7 border shadow-md space-y-5 transition ${
                      isTodayBirthday
                        ? "border-amber-400 ring-4 ring-amber-400/20 bg-gradient-to-b from-amber-50/30 to-white"
                        : "border-teal-900/15"
                    }`}
                  >
                    {/* Top Status & Queue Index Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black bg-teal-950 text-gold px-2.5 py-1 rounded-xl shadow-xs">
                          LEAD {safeFocusIndex + 1} OF {filteredLeads.length}
                        </span>
                        {isTodayBirthday && (
                          <span className="rounded-full bg-amber-500 text-teal-950 px-3 py-1 text-xs font-black uppercase shadow-xs animate-pulse flex items-center gap-1">
                            <span>🎂</span>
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
                          onClick={() => setFocusIndex((prev) => Math.max(0, prev - 1))}
                          disabled={safeFocusIndex === 0}
                          className="rounded-xl bg-cream hover:bg-sand disabled:opacity-30 border border-teal-900/15 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                        >
                          ◀ Prev
                        </button>
                        <button
                          type="button"
                          onClick={() => setFocusIndex((prev) => Math.min(filteredLeads.length - 1, prev + 1))}
                          disabled={safeFocusIndex >= filteredLeads.length - 1}
                          className="rounded-xl bg-teal-950 text-white hover:bg-teal-900 disabled:opacity-30 px-3 py-1.5 text-xs font-bold transition cursor-pointer shadow-2xs"
                        >
                          Next ▶
                        </button>
                      </div>
                    </div>

                    {/* Donor Details Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-xl sm:text-2xl font-black text-teal-950">
                            {currentFocusLead.name}
                          </h2>
                          <span className="text-xs font-mono text-teal-950/50">
                            #{currentFocusLead.leadId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-teal-950/70 flex-wrap">
                          <span className="font-mono text-sm font-bold text-teal-950 bg-sand/40 px-2 py-0.5 rounded-lg border border-teal-900/10">
                            {phoneInfo.display}
                          </span>
                          {currentFocusLead.dobDay && currentFocusLead.dobMonth && (
                            <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg">
                              🎂 Birthday: {currentFocusLead.dobDay}/{currentFocusLead.dobMonth}
                            </span>
                          )}
                          <span>Turahalli Outreach Queue</span>
                        </div>
                      </div>

                      {/* Suggested Seva Amount Tag */}
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-teal-950/60 uppercase block">Suggested Seva:</span>
                        <span className="text-sm sm:text-base font-black text-emerald-800">
                          {isTodayBirthday ? "₹2,500 (Birthday Feast)" : "₹1,500 (Breakfast / Cow Milk)"}
                        </span>
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
                          <span className="block leading-tight font-black text-gold">ಕರೆ ಮಾಡಿ (Call Donor)</span>
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
                          <span className="block leading-tight font-black">WhatsApp ಸಂದೇಶ (₹{formatINR(selectedSevaAmount)})</span>
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
                          <span>Add Note</span>
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

                    {/* ── INTEGRATED 30-SECOND TRUST SCRIPT BOX (Collapsible) ── */}
                    <div className="rounded-2xl border border-teal-900/15 bg-sand/30 p-2.5 sm:p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setIsScriptExpanded((prev) => !prev)}
                          className="flex items-center gap-1.5 font-black text-teal-950 text-[11px] cursor-pointer"
                        >
                          <span>🗣️</span>
                          <span>ಮಾತನಾಡುವ ವಿಧಾನ (30s Pitch Script)</span>
                          <span className="text-[10px] bg-teal-950/10 rounded px-1.5 py-0.5 font-bold">
                            {isScriptExpanded ? "ಮುಚ್ಚಿ ▲" : "ಓದಿ (Open) ▼"}
                          </span>
                        </button>
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-teal-900/15 text-[10px]">
                          <button
                            type="button"
                            onClick={() => {
                              setQuickPitchLang("kanglish");
                              setIsScriptExpanded(true);
                            }}
                            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                              quickPitchLang === "kanglish" ? "bg-teal-950 text-white" : "text-teal-950/70"
                            }`}
                          >
                            Kanglish
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickPitchLang("kn");
                              setIsScriptExpanded(true);
                            }}
                            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                              quickPitchLang === "kn" ? "bg-teal-950 text-white" : "text-teal-950/70"
                            }`}
                          >
                            ಕನ್ನಡ
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickPitchLang("en");
                              setIsScriptExpanded(true);
                            }}
                            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                              quickPitchLang === "en" ? "bg-teal-950 text-white" : "text-teal-950/70"
                            }`}
                          >
                            English
                          </button>
                        </div>
                      </div>

                      {isScriptExpanded && (
                        <div className="p-3 rounded-xl bg-white border border-teal-900/10 text-teal-950 leading-relaxed text-[11px] font-medium shadow-2xs animate-fadeIn">
                          {quickPitchLang === "kanglish" && (
                            <p>
                              <strong className="text-teal-900 font-bold">&quot;Namaskara {currentFocusLead.name} Sir/Madam!</strong> Naanu Janaseva Ashrama (Turahalli, Bengaluru) inda maathadthiddeve. {isTodayBirthday ? `Namma 25 makkala tharaphinda nimage Janmadinada Shubhashayagalu! 🎂 ` : ""}Namma Ashrama dalli 25 anatha baalakarige nithya satvik oota needthiddivi. Namma samsthe Karnataka JJ Act (KA18CH0242) nalli registered aagide, mattu 80G tax receipt siguththe. <strong>Naanu iga nimma WhatsApp ge makkala photo mattu namma official Axis Bank payment scanner kalisthini Sir/Madam.</strong> Dayavittu nodi nimma shakti anukoola chikka sahaya maadi.&quot;
                            </p>
                          )}
                          {quickPitchLang === "kn" && (
                            <p>
                              <strong className="text-teal-900 font-bold">&quot;ನಮಸ್ಕಾರ {currentFocusLead.name} ಅವರೇ!</strong> ನಾನು ತುರಹಳ್ಳಿಯ ಜನಸೇವಾ ಆಶ್ರಮದಿಂದ (ಬೆಂಗಳೂರು) ಕರೆ ಮಾಡುತ್ತಿದ್ದೇನೆ. {isTodayBirthday ? `ನಮ್ಮ 25 ಮಕ್ಕಳ ಪರವಾಗಿ ತಮಗೆ ಹುಟ್ಟುಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು! 🎂 ` : ""}ನಮ್ಮಲ್ಲಿರುವ 25 ಬಾಲಕರ ನಿತ್ಯ ಅನ್ನದಾನ ಸೇವೆಗೆ ತಮ್ಮ ಸಹಕಾರ ಕೋರುತ್ತಿದ್ದೇವೆ. ನಮ್ಮದು ಸರ್ಕಾರದ ಅಧಿಕೃತ ಬಾಲನ್ಯಾಯ ಕಾಯ್ದೆಯಡಿ (JJ Act KA18CH0242) ನೋಂದಾಯಿತ ಆಶ್ರಮವಾಗಿದ್ದು, 80G ತೆರಿಗೆ ವಿನಾಯಿತಿ ಲಭ್ಯವಿದೆ. <strong>ನಾನು ಈಗ ತಮ್ಮ WhatsApp ಗೆ ಮಕ್ಕಳ ಊಟದ ಫೋಟೋ ಹಾಗೂ ಅಧಿಕೃತ ಆಕ್ಸಿಸ್ ಬ್ಯಾಂಕ್ ಪೇಮೆಂಟ್ ಸ್ಕ್ಯಾನರ್ ಕಳುಹಿಸುತ್ತೇನೆ.</strong> ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಸಹಾಯ ಮಾಡಿ.&quot;
                            </p>
                          )}
                          {quickPitchLang === "en" && (
                            <p>
                              <strong className="text-teal-900 font-bold">&quot;Hello {currentFocusLead.name} Ji!</strong> Warm greetings from Janaseva Ashrama, Bengaluru. {isTodayBirthday ? `Heartfelt Birthday Wishes from all our 25 resident boys! 🎂 ` : ""}We care for 25 orphaned boys at our Turahalli home providing wholesome meals, shelter, and schooling. We are Govt-licensed under JJ Act KA18CH0242 with 80G tax exemption. <strong>I am sharing our children&apos;s meal photo and official Axis Bank UPI Payment QR Scanner directly to your WhatsApp right now.</strong> Kindly review and support our resident children with whatever amount is comfortable for you.&quot;
                            </p>
                          )}
                        </div>
                      )}
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

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {/* WARM / INTERESTED */}
                        <button
                          type="button"
                          onClick={() => handleFocusDisposition(currentFocusLead.leadId, "Interested")}
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
                            void handleFocusDisposition(currentFocusLead.leadId, "No_Answer", "Auto-rescheduled +2 hours", twoHoursLater);
                          }}
                          className="min-h-[54px] p-2 rounded-2xl bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>⏳</span>
                            <span>ಬಿಜಿಯಿದ್ದಾರೆ</span>
                          </span>
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Busy / Call +2h</span>
                        </button>

                        {/* CALLBACK LATER */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNotesLead(currentFocusLead);
                            setNotesText(currentFocusLead.notes || "");
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
                          <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Log Donation ₹</span>
                        </button>

                        {/* NOT INTERESTED */}
                        <button
                          type="button"
                          onClick={() => handleFocusDisposition(currentFocusLead.leadId, "Rejected")}
                          className="min-h-[54px] p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-800 border border-rose-200 font-black transition flex flex-col items-center justify-center cursor-pointer text-center"
                        >
                          <span className="flex items-center gap-1 text-sm font-black">
                            <span>✕</span>
                            <span>ಆಸಕ್ತಿಯಿಲ್ಲ</span>
                          </span>
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Not Interested</span>
                        </button>
                      </div>
                    </div>

                    {/* Bottom Utility Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-teal-900/10 text-[11px] text-teal-950/60">
                      <span className="font-semibold text-emerald-800">
                        ✓ Safe Mode: Auto-marks lead attended upon Call or WhatsApp
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
        )}

        {/* ── 2. ALL LEADS LIST VIEW (CLEAN, FAST, UNIFIED) ── */}
        {viewMode === "queue" && (
          <div className="space-y-2.5 animate-fadeIn">
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
              <>
                {paginatedLeads.map((lead, localIdx) => {
                  const idx = (portalPage - 1) * portalPageSize + localIdx;
                  const now = new Date();
                const isTodayBirthday = lead.dobDay === now.getDate() && lead.dobMonth === now.getMonth() + 1;
                const isAttended = lead.status && lead.status !== "Pending";
                const phoneInfo = parseCustomerPhone(lead.phone);

                return (
                  <div
                    key={lead.leadId}
                    className={`rounded-2xl p-3.5 sm:p-4 bg-white border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isTodayBirthday
                        ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20"
                        : isAttended
                        ? "border-emerald-500/30 bg-white"
                        : "border-teal-900/10 hover:border-teal-900/30"
                    }`}
                  >
                    {/* Left: Lead details & 1-tap card launcher */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setFocusIndex(idx);
                            setViewMode("focus");
                          }}
                          className="font-display font-black text-sm sm:text-base text-teal-950 hover:text-amber-600 transition text-left cursor-pointer flex items-center gap-1.5"
                          title="Click to open in Calling Card"
                        >
                          <span>{lead.name}</span>
                          <span className="text-[10px] font-mono text-teal-950/40">#{lead.leadId}</span>
                        </button>

                        {isTodayBirthday && (
                          <span className="rounded-full bg-amber-500 text-teal-950 px-2 py-0.5 text-[10px] font-black uppercase shadow-xs animate-pulse">
                            🎂 Today!
                          </span>
                        )}

                        {lead.status === "Donated" ? (
                          <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black shadow-xs">
                            🎉 Donated
                          </span>
                        ) : lead.status === "Interested" ? (
                          <span className="rounded-full bg-amber-500 text-teal-950 px-2 py-0.5 text-[10px] font-black">
                            👍 Interested
                          </span>
                        ) : lead.status === "Reschedule" ? (
                          <span className="rounded-full bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black">
                            📅 Callback
                          </span>
                        ) : isAttended ? (
                          <span className="rounded-full bg-emerald-100 text-emerald-900 px-2 py-0.5 text-[10px] font-bold border border-emerald-300">
                            ✓ {lead.status}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold border border-amber-300">
                            ⏳ To Call
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-teal-950/70 flex-wrap">
                        <span className="font-mono font-bold text-teal-950">
                          {phoneInfo.display}
                        </span>
                        {lead.dobDay && lead.dobMonth && !isTodayBirthday && (
                          <span>🎂 {lead.dobDay}/{lead.dobMonth}</span>
                        )}
                        {lead.notes && (
                          <span className="truncate max-w-xs text-teal-950/60 italic">
                            &quot;{lead.notes}&quot;
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Touch Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setFocusIndex(idx);
                          setViewMode("focus");
                        }}
                        className="rounded-xl bg-sand/60 hover:bg-sand border border-teal-900/15 text-teal-950 px-2.5 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Open full calling card"
                      >
                        <span>⚡ Card</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCallLead(lead)}
                        className="rounded-xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-white px-3 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>📞 Call</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectWhatsAppChat(lead, selectedSevaAmount)}
                        className="rounded-xl bg-[#25D366] hover:brightness-105 active:scale-95 text-white px-3 py-2 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>💬 WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveNotesLead(lead);
                          setNotesText(lead.notes || "");
                          setCallbackDateTime("");
                        }}
                        className="rounded-xl bg-white border border-teal-900/20 text-teal-950 hover:bg-cream p-2 text-xs transition cursor-pointer"
                        title="Add Call Note / Callback"
                      >
                        <span>📝</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Queue Pagination Bar (Ensures 60 FPS smooth browsing on Android) */}
              {totalPortalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-teal-900/10 text-xs shadow-xs mt-3">
                  <span className="font-bold text-teal-950">
                    Showing {(portalPage - 1) * portalPageSize + 1}–{Math.min(portalPage * portalPageSize, filteredLeads.length)} of {filteredLeads.length.toLocaleString()} leads
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPortalPage((p) => Math.max(1, p - 1))}
                      disabled={portalPage === 1}
                      className="rounded-xl px-3 py-1.5 bg-sand hover:bg-amber-100 disabled:opacity-40 text-teal-950 font-bold transition cursor-pointer"
                    >
                      ◀ Prev
                    </button>
                    <span className="font-mono font-bold text-teal-950 px-2">
                      Page {portalPage} of {totalPortalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPortalPage((p) => Math.min(totalPortalPages, p + 1))}
                      disabled={portalPage === totalPortalPages}
                      className="rounded-xl px-3 py-1.5 bg-sand hover:bg-amber-100 disabled:opacity-40 text-teal-950 font-bold transition cursor-pointer"
                    >
                      Next ▶
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        )}
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-900/15 p-2 shadow-2xl space-y-1.5 animate-fadeIn">
          {/* Row 1: 1-Tap Fast Disposition Auto-Advance */}
          <div className="grid grid-cols-4 gap-1 text-[11px] font-black">
            <button
              type="button"
              onClick={() => handleFocusDisposition(currentFocusLead.leadId, "Interested")}
              className="py-1 px-1 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-teal-950 text-center truncate shadow-2xs cursor-pointer"
            >
              👍 ಒಪ್ಪಿದ್ದಾರೆ
            </button>
            <button
              type="button"
              onClick={() => {
                const twoHoursLater = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
                void handleFocusDisposition(currentFocusLead.leadId, "No_Answer", "Auto-rescheduled +2 hours", twoHoursLater);
              }}
              className="py-1 px-1 rounded-lg bg-slate-700 hover:bg-slate-800 active:scale-95 text-white text-center truncate shadow-2xs cursor-pointer"
            >
              ⏳ ಬಿಜಿ (+2h)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveNotesLead(currentFocusLead);
                setNotesText(currentFocusLead.notes || "");
                setCallbackDateTime("");
              }}
              className="py-1 px-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-center truncate shadow-2xs cursor-pointer"
            >
              📅 ನಂತರ ಕರೆ
            </button>
            <button
              type="button"
              onClick={() => handleFocusDisposition(currentFocusLead.leadId, "Rejected")}
              className="py-1 px-1 rounded-lg bg-rose-100 hover:bg-rose-200 active:scale-95 text-rose-800 border border-rose-200 text-center truncate shadow-2xs cursor-pointer"
            >
              ✕ ಬೇಡ
            </button>
          </div>

          {/* Row 2: Dial & Outreach Actions */}
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => handleCallLead(currentFocusLead)}
              className="flex-1 py-2.5 px-1 rounded-xl bg-teal-950 text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="text-sm">📞</span>
              <span className="text-[10px] leading-tight">ಕರೆ</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectWhatsAppChat(currentFocusLead, selectedSevaAmount)}
              className="flex-1 py-2.5 px-1 rounded-xl bg-[#25D366] text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="text-sm">💬</span>
              <span className="text-[10px] leading-tight">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleDirectSharePaymentQr(currentFocusLead, selectedSevaAmount)}
              className="flex-1 py-2.5 px-1 rounded-xl bg-amber-600 text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer"
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
              className="flex-1 py-2.5 px-1 rounded-xl bg-emerald-600 text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="text-sm">🎉</span>
              <span className="text-[10px] leading-tight">ಪಾವತಿ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (focusIndex < filteredLeads.length - 1) setFocusIndex((prev) => prev + 1);
              }}
              disabled={safeFocusIndex >= filteredLeads.length - 1}
              className="py-2.5 px-2.5 rounded-xl bg-sand border border-teal-900/20 text-teal-950 font-black text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-40 cursor-pointer"
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
