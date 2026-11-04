"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import { AntiBanWhatsAppModal } from "@/components/admin/AntiBanWhatsAppModal";
import { parseCustomerPhone } from "@/lib/whatsapp-phone";
import { generateAntiBanMessage, type NarrativeAngle } from "@/lib/whatsapp-antiban";
import { validateIndianUtr } from "@/lib/crm-validators";

interface CallerProfile {
  callerId: string;
  name: string;
  whatsappNumber: string;
  email: string;
  dailyQuota?: number;
}

export const isPlaceholderValue = (val?: string | null) => {
  if (!val) return true;
  const s = val.trim().toLowerCase();
  return (
    s === "child" ||
    s === "student" ||
    s === "pupil" ||
    s === "kid" ||
    s === "unknown" ||
    s === "na" ||
    s === "n/a" ||
    s === "parent" ||
    s === "father" ||
    s === "mother" ||
    s === "guardian" ||
    s === "—" ||
    s === "-" ||
    s === ""
  );
};

export const cleanParentName = (lead: { childName?: string | null; name?: string | null; parentName?: string | null }) => {
  const p = lead.parentName?.trim();
  if (p && !isPlaceholderValue(p)) {
    return p;
  }
  const n = lead.name?.trim() || "";
  if (n) {
    if (n.toLowerCase().startsWith("child (") && n.endsWith(")")) {
      const inside = n.slice(7, -1).trim();
      if (inside && !isPlaceholderValue(inside)) return inside;
    }
    if (n.toLowerCase().endsWith("(parent)")) {
      const inside = n.slice(0, -8).trim();
      if (inside && !isPlaceholderValue(inside)) return inside;
    }
    if (n.includes("(") && n.endsWith(")")) {
      const inside = n.slice(n.indexOf("(") + 1, -1).trim();
      if (inside && !isPlaceholderValue(inside)) return inside;
    }
  }
  return "ಪೋಷಕರು (Parent)";
};

export const cleanChildName = (lead: { childName?: string | null; name?: string | null; parentName?: string | null }) => {
  const c = lead.childName?.trim();
  if (c && !isPlaceholderValue(c)) {
    return c;
  }
  const n = lead.name?.trim() || "";
  if (n) {
    // If name is "Child (PARENT_NAME)", the parent is inside the parentheses, so child name is relative
    if (n.toLowerCase().startsWith("child (") && n.endsWith(")")) {
      const p = cleanParentName(lead);
      if (p && p !== "ಪೋಷಕರು (Parent)") {
        return `${p} ಅವರ ಮಗು`;
      }
      return "ವಿದ್ಯಾರ್ಥಿ / ಮಗು";
    }

    if (n.includes("(") && n.endsWith(")")) {
      const beforeParen = n.slice(0, n.indexOf("(")).trim();
      if (beforeParen && !isPlaceholderValue(beforeParen)) {
        return beforeParen;
      }
    }
    const stripped = n.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
    if (stripped && !isPlaceholderValue(stripped) && !stripped.toLowerCase().startsWith("child (")) {
      return stripped;
    }
  }
  const p = cleanParentName(lead);
  if (p && p !== "ಪೋಷಕರು (Parent)") {
    return `${p} ಅವರ ಮಗು`;
  }
  return "ವಿದ್ಯಾರ್ಥಿ / ಮಗು";
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
    | "birthday_upcoming"
    | "birthday_calendar"
    | "date_newest"
    | "date_oldest"
    | "callback_earliest"
    | "interested_first"
    | "donated_amount_desc"
    | "name_asc"
  >("birthday_upcoming");
  const [portalPage, setPortalPage] = useState<number>(1);
  const portalPageSize = 40;
  const [toastMsg, setToastMsg] = useState("");

  // Contact & Secondary WhatsApp Editor state (Case 1)
  const [editContactLead, setEditContactLead] = useState<any | null>(null);
  const [editCallingPhone, setEditCallingPhone] = useState("");
  const [editWhatsAppPhone, setEditWhatsAppPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  // Disposition Reason Quick-Picker state
  const [selectedDispositionReason, setSelectedDispositionReason] = useState<string>("");

  // Anchor ref to Calling Card container so mobile transitions keep card in view without scrolling to top of page
  const callingCardRef = useRef<HTMLDivElement>(null);

  // 1-Tap Disposition Confirmation state (prevents accidental advance & mobile scroll jump)
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    leadId: number;
    leadName: string;
    phone: string;
    disposition: string;
    labelKannada: string;
    icon: string;
    notes?: string;
    callbackTime?: string;
    reason?: string;
  } | null>(null);

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
  const [selectedNarrativeAngle, setSelectedNarrativeAngle] = useState<NarrativeAngle>("birthday");

  // WhatsApp safe pacing timer (prevents rapid-fire automated flagging)
  const [waPacingSeconds, setWaPacingSeconds] = useState<number>(0);
  useEffect(() => {
    if (waPacingSeconds <= 0) return;
    const timer = setInterval(() => {
      setWaPacingSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [waPacingSeconds]);

  // Live in-call timer & talk-time tracking
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [callElapsedSeconds, setCallElapsedSeconds] = useState<number>(0);
  useEffect(() => {
    if (!callStartTime) {
      setCallElapsedSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallElapsedSeconds(Math.floor((Date.now() - callStartTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [callStartTime]);

  // Respectful Calling Hours Modal state (TRAI guidelines)
  const [nightCallLead, setNightCallLead] = useState<any | null>(null);

  // Offline Sync Queue state (resilience against mobile 4G drops)
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState<boolean>(false);

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

  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      // 2-tone alert chime for callbacks: A5 (880Hz) -> D6 (1174Hz)
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1174.66, now + 0.14);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } catch {}
  };

  // Quick Direct Donation Log Modal state
  const [activeDonationLead, setActiveDonationLead] = useState<any | null>(null);
  const [loggedDonationAmount, setLoggedDonationAmount] = useState<number>(1500);
  const [loggedDonationUtr, setLoggedDonationUtr] = useState<string>("");
  const [utrValidationError, setUtrValidationError] = useState<string>("");
  const [loggingDonation, setLoggingDonation] = useState<boolean>(false);

  // Shift Activity & Edit Modal state
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [loadingDailyLogs, setLoadingDailyLogs] = useState(false);
  const [showShiftDrawer, setShowShiftDrawer] = useState(false);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editDisposition, setEditDisposition] = useState("Interested");
  const [editAmount, setEditAmount] = useState<number | "">("");
  const [editUtr, setEditUtr] = useState("");
  const [editUtrError, setEditUtrError] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editPaymentMode, setEditPaymentMode] = useState("UPI");
  const [savingEdit, setSavingEdit] = useState(false);

  // End of Day (EOD) Submission state
  const [eodStatus, setEodStatus] = useState<{ isSubmitted: boolean; status: string; totalCallsToday: number } | null>(null);
  const [showEodModal, setShowEodModal] = useState(false);
  const [submittingEod, setSubmittingEod] = useState(false);
  const [eodDeclaration, setEodDeclaration] = useState(false);
  const [eodNotes, setEodNotes] = useState("");

  // Visual Update Stamp Alert & Database Confirmation state
  const [updateStampAlert, setUpdateStampAlert] = useState<{
    isOpen: boolean;
    leadId: number;
    name: string;
    disposition: string;
    stampedAt: string;
    telecallerId: string;
    note?: string;
    amount?: number;
  } | null>(null);

  const showStampConfirmation = (info: {
    leadId: number;
    name: string;
    disposition: string;
    stampedAt: string;
    telecallerId: string;
    note?: string;
    amount?: number;
  }) => {
    setUpdateStampAlert({ ...info, isOpen: true });
    playCelebrationChime();
    setTimeout(() => {
      setUpdateStampAlert((prev) => (prev?.leadId === info.leadId ? null : prev));
    }, 5500);
  };

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

    setStats((prev: any) => ({
      ...prev,
      totalAssigned: leadItems.length,
      contactedCount: contacted,
      convertedCount: converted,
      todayContactedCount: typeof prev?.todayContactedCount === "number" ? Math.max(prev.todayContactedCount, contacted) : contacted,
    }));
  };

  // Smooth scroll helper: Keeps calling card in focus on mobile without jumping to top of browser
  const scrollToCallingCard = () => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        callingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 40);
    }
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

  const loadCallerLeads = async (cid: string, isRefresh = false) => {
    setLoadingLeads(true);
    try {
      const refreshParam = isRefresh ? "&refresh=true" : "";
      const res = await fetch(`/api/v1/leads/assigned?callerId=${encodeURIComponent(cid)}${refreshParam}`);
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
            let restored = false;
            if (savedLastLead) {
              const num = Number(savedLastLead);
              const targetLead = leadItems.find((l: any) => l.leadId === num);
              if (targetLead && (!targetLead.status || targetLead.status === "Pending")) {
                setActiveFocusLeadId(num);
                const sIdx = leadItems.findIndex((l: any) => l.leadId === num);
                if (sIdx !== -1) setFocusIndex(sIdx);
                restored = true;
              }
            }
            if (!restored) {
              const firstPending = leadItems.find((l: any) => !l.status || l.status === "Pending");
              if (firstPending) {
                setActiveFocusLeadId(firstPending.leadId);
                const sIdx = leadItems.findIndex((l: any) => l.leadId === firstPending.leadId);
                if (sIdx !== -1) setFocusIndex(sIdx);
              }
            }
          } catch {}
        }
        void loadDailyLogs();
        void loadEodStatus();
      }
    } catch (err: any) {
      showToast("Error loading leads: " + err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadDailyLogs = async () => {
    setLoadingDailyLogs(true);
    try {
      const res = await fetch("/api/v1/telecaller/daily-logs");
      const data = await res.json();
      if (data.success) {
        const fetchedLogs = data.logs || [];
        setDailyLogs(fetchedLogs);
        // Persistently sync dialed IDs from server database so today's dial history is durable across logouts & tabs
        setSessionContactedIds((prev) => {
          const next = new Set(prev);
          fetchedLogs.forEach((lg: any) => {
            if (lg.leadId) next.add(lg.leadId);
          });
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to load daily logs:", e);
    } finally {
      setLoadingDailyLogs(false);
    }
  };

  const loadEodStatus = async () => {
    try {
      const res = await fetch("/api/v1/telecaller/eod-submit");
      const data = await res.json();
      if (data.success) {
        setEodStatus({
          isSubmitted: data.isSubmitted,
          status: data.status,
          totalCallsToday: data.totalCallsToday || 0,
        });
      }
    } catch (e) {
      console.error("Failed to load EOD status:", e);
    }
  };

  // ── Offline Queue Synchronization Engine (Prevents Data Loss on 4G Drops) ──
  const queueOfflineAction = (action: {
    url: string;
    method?: string;
    payload: any;
    leadId: number;
    leadName: string;
    actionLabel: string;
  }) => {
    if (typeof window === "undefined") return;
    try {
      const q: any[] = JSON.parse(localStorage.getItem("janaseva_offline_actions") || "[]");
      q.push({ ...action, queuedAt: new Date().toISOString() });
      localStorage.setItem("janaseva_offline_actions", JSON.stringify(q));
      setOfflineQueueCount(q.length);
      showToast(`📡 Saved offline (${q.length} queued). Will auto-sync when network reconnects.`);
    } catch (e) {
      console.error("Failed to save offline action", e);
    }
  };

  const syncOfflineQueue = async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    try {
      const raw = localStorage.getItem("janaseva_offline_actions");
      if (!raw) return;
      const q: any[] = JSON.parse(raw);
      if (!Array.isArray(q) || q.length === 0) return;

      setIsSyncingOffline(true);
      const remaining: any[] = [];
      let successCount = 0;

      for (const item of q) {
        try {
          const res = await fetch(item.url, {
            method: item.method || "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.success) {
            successCount++;
          } else {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      localStorage.setItem("janaseva_offline_actions", JSON.stringify(remaining));
      setOfflineQueueCount(remaining.length);
      setIsSyncingOffline(false);

      if (successCount > 0) {
        playCelebrationChime();
        showToast(`✓ Cloud sync complete: ${successCount} offline action(s) synced!`);
        void loadDailyLogs();
      }
    } catch {
      setIsSyncingOffline(false);
    }
  };

  // Sync offline queue on mount and network online event
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const q = JSON.parse(localStorage.getItem("janaseva_offline_actions") || "[]");
      setOfflineQueueCount(Array.isArray(q) ? q.length : 0);
    } catch {}

    const handleOnline = () => {
      void syncOfflineQueue();
    };
    window.addEventListener("online", handleOnline);
    const interval = setInterval(() => {
      void syncOfflineQueue();
    }, 25000);
    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, []);

  const handleOpenEdit = (log: any) => {
    setEditingLog(log);
    setEditDisposition(log.disposition || "Interested");
    setEditAmount(log.effectiveAmount || log.amount || "");
    setEditUtr(log.utr || "");
    setEditUtrError("");
    setEditNotes(log.notes || "");
    setEditPaymentMode(log.paymentMode || "UPI");
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    if (editDisposition === "Donated" && editUtr && editUtr.trim()) {
      const utrVal = validateIndianUtr(editUtr);
      if (!utrVal.isValid) {
        alert(utrVal.error || "Invalid UTR format");
        return;
      }
    }

    setSavingEdit(true);
    const payload = {
      disposition: editDisposition,
      amount: editAmount ? Number(editAmount) : null,
      utr: editUtr.trim() || undefined,
      notes: editNotes,
      paymentMode: editPaymentMode,
    };

    try {
      const res = await fetch(`/api/v1/leads/${editingLog.leadId}/log`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update log");
      showToast("✓ Entry updated successfully!");
      setEditingLog(null);
      // Update local leads list
      setLeads((prev) =>
        prev.map((l) => (l.leadId === editingLog.leadId ? { ...l, status: editDisposition } : l))
      );
      void loadDailyLogs();
      void loadEodStatus();
      if (callerProfile) {
        void loadCallerLeads(callerProfile.callerId);
      }
    } catch (e: any) {
      // Network drop: queue offline
      queueOfflineAction({
        url: `/api/v1/leads/${editingLog.leadId}/log`,
        method: "PATCH",
        payload,
        leadId: editingLog.leadId,
        leadName: editingLog.leadName || `Lead #${editingLog.leadId}`,
        actionLabel: `Edit -> ${editDisposition}`,
      });
      showToast("📡 Network drop: Edit saved offline. Will auto-sync when network returns.");
      setEditingLog(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSubmitEOD = async () => {
    setSubmittingEod(true);
    try {
      const res = await fetch("/api/v1/telecaller/eod-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionType: "MANUAL", notes: eodNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit EOD report");
      showToast("🎉 Shift submitted to Supervisor successfully!");
      setShowEodModal(false);
      void loadEodStatus();
      void loadDailyLogs();
    } catch (e: any) {
      alert("Error submitting shift: " + e.message);
    } finally {
      setSubmittingEod(false);
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

  // Lightweight Background Polling (Only when tab is active; polls lightweight daily logs instead of re-downloading hundreds of DB leads)
  useEffect(() => {
    if (!isLoggedIn || !callerProfile) return;

    let isMounted = true;
    const heartbeat = async () => {
      // Emergency resource guard: Never poll if tab is hidden or phone screen is off
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      try {
        // Poll lightweight daily logs (~1KB) instead of re-downloading all leads (~2MB)
        const res = await fetch(`/api/v1/telecaller/daily-logs?callerId=${encodeURIComponent(callerProfile.callerId)}&limit=20`);
        const data = await res.json();
        if (!isMounted || !data.success) return;

        if (Array.isArray(data.logs)) {
          setDailyLogs(data.logs);
        }
      } catch {
        // Silent catch for background polling
      }
    };

    // Poll every 3 minutes (180s) instead of 45s, saving 95%+ of Neon egress and Vercel Fluid CPU
    const interval = setInterval(heartbeat, 180000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void heartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
  const handleUpdateDisposition = async (
    leadId: number,
    disposition: string,
    notes?: string,
    callbackTime?: string,
    reason?: string
  ) => {
    if (!callerProfile) return;

    // Track talk duration if call timer was active
    const durationSec = callStartTime ? Math.round((Date.now() - callStartTime) / 1000) : 0;
    const durationPrefix = durationSec > 0 ? `[Talk time: ${Math.floor(durationSec / 60)}m ${durationSec % 60}s]` : "";
    setCallStartTime(null);
    const effectiveNotes = [durationPrefix, notes].filter(Boolean).join(" ") || "Updated from telecaller dashboard";

    const currentLead = leads.find((l) => l.leadId === leadId);
    const displayName = currentLead
      ? (currentLead.stream === "PARENTS" || Boolean(currentLead.parentName || currentLead.childName)
          ? `${cleanChildName(currentLead)} (${cleanParentName(currentLead)})`
          : currentLead.name)
      : `Lead #${leadId}`;

    const effectiveReason = reason || selectedDispositionReason || undefined;

    const payload = {
      callerId: callerProfile.callerId,
      disposition,
      notes: effectiveNotes,
      callbackTime: callbackTime || undefined,
      dispositionReason: effectiveReason,
    };

    try {
      const res = await fetch(`/api/v1/leads/${leadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const nowIso = new Date().toISOString();
        const updatedList = leads.map((l) =>
          l.leadId === leadId
            ? {
                ...l,
                status: disposition,
                lastContactedAt: nowIso,
                notes: effectiveNotes,
                dispositionReason: effectiveReason || l.dispositionReason,
              }
            : l
        );
        setLeads(updatedList);
        setStats((prev: any) => ({
          ...prev,
          todayContactedCount: ((prev && prev.todayContactedCount) || 0) + 1,
          contactedCount: ((prev && prev.contactedCount) || 0) + 1,
        }));
        computeStats(updatedList, callerProfile.callerId);

        showStampConfirmation({
          leadId,
          name: displayName,
          disposition,
          stampedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
          telecallerId: callerProfile.callerId,
          note: effectiveNotes,
        });
        setSelectedDispositionReason("");
      }
    } catch (err: any) {
      // Offline fallback: Queue locally so caller work is never lost on 4G drops
      queueOfflineAction({
        url: `/api/v1/leads/${leadId}/log`,
        method: "POST",
        payload,
        leadId,
        leadName: displayName,
        actionLabel: disposition,
      });
      const nowIso = new Date().toISOString();
      const updatedList = leads.map((l) =>
        l.leadId === leadId
          ? {
              ...l,
              status: disposition,
              lastContactedAt: nowIso,
              notes: effectiveNotes,
              dispositionReason: effectiveReason || l.dispositionReason,
            }
          : l
      );
      setLeads(updatedList);
      computeStats(updatedList, callerProfile.callerId);

      showStampConfirmation({
        leadId,
        name: displayName,
        disposition: `${disposition} (OFFLINE)`,
        stampedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        telecallerId: callerProfile.callerId,
        note: `Queued offline · Will auto-sync when network reconnects`,
      });
      setSelectedDispositionReason("");
    }
  };

  // 1-Tap Undo: Revert attended lead to Pending
  const handleRevertToPending = async (leadId: number) => {
    if (!callerProfile) return;
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/log`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revert_to_pending",
          disposition: "Pending",
          callerId: callerProfile.callerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedList = leads.map((l) =>
          l.leadId === leadId
            ? { ...l, status: "Pending", validationStatus: "UNVERIFIED", rescheduleDate: null }
            : l
        );
        setLeads(updatedList);
        setStats((prev: any) => ({
          ...prev,
          todayContactedCount: ((prev && prev.todayContactedCount) || 0) + 1,
          contactedCount: ((prev && prev.contactedCount) || 0) + 1,
        }));
        computeStats(updatedList, callerProfile.callerId);
        setSessionContactedIds((prev) => {
          const next = new Set(prev);
          next.delete(leadId);
          return next;
        });
        showToast(`↩️ ಲೀಡ್ #${leadId} ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಬಾಕಿ ಪಟ್ಟಿಗೆ (Pending) ಮರಳಿಸಲಾಗಿದೆ.`);
        setActiveFocusLeadId(leadId);
      } else {
        alert(data.error || "Failed to revert lead to Pending.");
      }
    } catch (e: any) {
      alert("Error reverting lead: " + e.message);
    }
  };

  // Save Contact Updates (Add/Change Calling Phone or Alternate WhatsApp Number - Case 1)
  const handleSaveContactUpdate = async (leadId: number, updates: { phone?: string; whatsappPhone?: string | null }) => {
    if (!callerProfile) return;
    try {
      setSavingContact(true);
      const res = await fetch(`/api/v1/leads/${leadId}/log`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_contact",
          callerId: callerProfile.callerId,
          ...updates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedList = leads.map((l) =>
          l.leadId === leadId
            ? { ...l, ...updates }
            : l
        );
        setLeads(updatedList);
        showToast(`✅ ಸಂಪರ್ಕ ಸಂಖ್ಯೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ (Numbers updated).`);
        setEditContactLead(null);
      } else {
        alert(data.error || "Failed to update contact.");
      }
    } catch (e: any) {
      alert("Error updating contact: " + e.message);
    } finally {
      setSavingContact(false);
    }
  };

  // 1-Tap Inline Disposition Handlers
  const handleInlineDisposition = async (leadId: number, disposition: string) => {
    await handleUpdateDisposition(leadId, disposition);
  };

  // Direct Call Execution
  const executeDirectDial = (lead: any) => {
    setActiveFocusLeadId(lead.leadId);
    setCurrentlyDialedLeadId(lead.leadId);
    setCallStartTime(Date.now());
    if (callerProfile) {
      persistContactedLead(callerProfile.callerId, lead.leadId);
    }
    const phoneInfo = parseCustomerPhone(lead.phone);
    window.location.href = `tel:${phoneInfo.e164}`;
    showToast(`📞 Dialing ${lead.name}... Talk timer started!`);
  };

  // Safe Phone Call Launch with Respectful Calling Hours Guard (TRAI Guidelines: 9:30 AM – 7:30 PM)
  const handleCallLead = (lead: any) => {
    if (!lead) return;
    const istTimeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const istHour = new Date(istTimeStr).getHours();
    if (istHour < 9 || istHour >= 20) {
      setNightCallLead(lead);
      return;
    }
    executeDirectDial(lead);
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

    const targetPhone = lead.whatsappPhone || lead.phone;
    const phoneInfo = parseCustomerPhone(targetPhone);
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

  // 1-Tap Direct WhatsApp Chat Launch (Concise Anti-Ban Engine with Safe Pacing & Quick Templates)
  const handleDirectWhatsAppChat = (lead: any, customAmount?: number) => {
    if (!lead || !callerProfile) return;
    setActiveFocusLeadId(lead.leadId);
    setCurrentlyDialedLeadId(lead.leadId);
    persistContactedLead(callerProfile.callerId, lead.leadId);
    setWaPacingSeconds(12);
    const targetPhone = lead.whatsappPhone || lead.phone;
    const phoneInfo = parseCustomerPhone(targetPhone);
    const amount = customAmount || selectedSevaAmount || 1500;
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";

    const isParent = lead.stream === "PARENTS" || Boolean(lead.parentName || lead.childName);
    const resolvedChild = cleanChildName(lead);
    const resolvedParent = cleanParentName(lead);

    const antiBanResult = generateAntiBanMessage({
      leadId: lead.leadId,
      leadName: isParent ? resolvedChild : lead.name,
      donorName: isParent ? resolvedParent : lead.name,
      parentName: resolvedParent,
      childName: isParent ? resolvedChild : undefined,
      stream: isParent ? "PARENTS" : lead.stream,
      phone: lead.phone,
      callerId: callerProfile.callerId,
      callerName: callerProfile.name,
      language: preferredLanguage,
      angle: selectedNarrativeAngle,
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
        scrollToCallingCard();
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
        scrollToCallingCard();
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
  const handleFocusDisposition = async (
    leadId: number,
    disposition: string,
    notes?: string,
    callbackTime?: string,
    reason?: string
  ) => {
    if (callerProfile) {
      persistContactedLead(callerProfile.callerId, leadId);
    }
    setCurrentlyDialedLeadId(null);

    // Compute next candidate BEFORE updating disposition
    const currentIdx = filteredLeads.findIndex((l) => l.leadId === leadId);
    let nextLeadId: number | null = null;

    if (filter === "Pending") {
      // Find remaining pending leads excluding the one currently being marked
      const remainingPending = filteredLeads.filter(
        (l) => l.leadId !== leadId && (!l.status || l.status === "Pending")
      );
      if (remainingPending.length > 0) {
        const afterCurrent = remainingPending.find((l) => {
          const idx = filteredLeads.findIndex((fl) => fl.leadId === l.leadId);
          return idx > currentIdx;
        });
        nextLeadId = afterCurrent ? afterCurrent.leadId : remainingPending[0].leadId;
      }
    } else {
      const nextPending = filteredLeads.slice(currentIdx + 1).find((l) => !l.status || l.status === "Pending");
      if (nextPending) {
        nextLeadId = nextPending.leadId;
      } else if (currentIdx + 1 < filteredLeads.length) {
        nextLeadId = filteredLeads[currentIdx + 1].leadId;
      }
    }

    await handleUpdateDisposition(leadId, disposition, notes, callbackTime, reason);

    if (nextLeadId) {
      setActiveFocusLeadId(nextLeadId);
      if (callerProfile) {
        try {
          localStorage.setItem(`janaseva_last_lead_${callerProfile.callerId}`, String(nextLeadId));
        } catch {}
      }
      scrollToCallingCard();
    } else {
      setActiveFocusLeadId(null);
    }
  };

  // Save Direct Offline / UPI Donation Log
  const handleSaveDonationLog = async () => {
    if (!activeDonationLead || !callerProfile) return;

    if (loggedDonationUtr.trim()) {
      const utrVal = validateIndianUtr(loggedDonationUtr);
      if (!utrVal.isValid) {
        alert(utrVal.error || "Invalid UTR format");
        return;
      }
    }

    const currentLeadId = activeDonationLead.leadId;
    persistContactedLead(callerProfile.callerId, currentLeadId);
    setLoggingDonation(true);

    // Identify next lead before state update
    const currentIdx = filteredLeads.findIndex((l) => l.leadId === currentLeadId);
    let nextLeadId: number | null = null;
    if (filter === "Pending") {
      const remainingPending = filteredLeads.filter(
        (l) => l.leadId !== currentLeadId && (!l.status || l.status === "Pending")
      );
      if (remainingPending.length > 0) {
        const afterCurrent = remainingPending.find((l) => {
          const idx = filteredLeads.findIndex((fl) => fl.leadId === l.leadId);
          return idx > currentIdx;
        });
        nextLeadId = afterCurrent ? afterCurrent.leadId : remainingPending[0].leadId;
      }
    } else {
      const nextPending = filteredLeads.slice(currentIdx + 1).find((l) => !l.status || l.status === "Pending");
      if (nextPending) {
        nextLeadId = nextPending.leadId;
      } else if (currentIdx + 1 < filteredLeads.length) {
        nextLeadId = filteredLeads[currentIdx + 1].leadId;
      }
    }

    const payload = {
      callerId: callerProfile.callerId,
      disposition: "Donated",
      amount: loggedDonationAmount,
      utr: loggedDonationUtr.trim() || undefined,
      notes: `Donation ₹${loggedDonationAmount} logged directly by ${callerProfile.callerId}${loggedDonationUtr ? ` (UTR: ${loggedDonationUtr.trim()})` : ""}`,
    };

    try {
      const res = await fetch(`/api/v1/leads/${currentLeadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        showStampConfirmation({
          leadId: currentLeadId,
          name: activeDonationLead.name,
          disposition: "Donated",
          stampedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
          telecallerId: callerProfile.callerId,
          amount: loggedDonationAmount,
          note: `Donation ₹${loggedDonationAmount} recorded · UTR: ${loggedDonationUtr.trim() || "Offline/Direct"}`,
        });
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
      // Offline fallback: Queue locally so caller work is never lost on 4G drops
      queueOfflineAction({
        url: `/api/v1/leads/${currentLeadId}/log`,
        method: "POST",
        payload,
        leadId: currentLeadId,
        leadName: activeDonationLead.name,
        actionLabel: `Donated ₹${loggedDonationAmount}`,
      });
      const updatedList = leads.map((l) =>
        l.leadId === currentLeadId ? { ...l, status: "Donated" } : l
      );
      setLeads(updatedList);
      setStats((prev) => ({
        ...prev,
        convertedCount: prev.convertedCount + 1,
        totalRevenue: prev.totalRevenue + loggedDonationAmount,
      }));
      showStampConfirmation({
        leadId: currentLeadId,
        name: activeDonationLead.name,
        disposition: "Donated (OFFLINE)",
        stampedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        telecallerId: callerProfile.callerId,
        amount: loggedDonationAmount,
        note: `Queued offline · UTR: ${loggedDonationUtr.trim() || "Offline/Direct"}`,
      });
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

  // Dynamic filter counter computation (stream-aware for zero count mismatch)
  const counts = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth() + 1;

    const t2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const t2Day = t2.getDate();
    const t2Month = t2.getMonth() + 1;

    let pending = 0;
    let attended = 0;
    let birthdays = 0;
    let tomorrowBirthdays = 0;
    let t2Birthdays = 0;
    let interested = 0;
    let reschedule = 0;
    let donated = 0;
    let parents = 0;
    let donors = 0;

    leads.forEach((l) => {
      const isParent = l.stream === "PARENTS" || (l.stream !== "DIRECT_DONOR" && l.stream !== "DIRECT_DONORS" && l.stream !== "donor" && l.stream !== "direct" && Boolean(l.parentName || l.childName));
      if (isParent) parents++;
      else donors++;

      // When streamFilter is active, respect stream filter for the tab status counts
      if (streamFilter === "PARENTS" && !isParent) return;
      if (streamFilter === "DIRECT_DONOR" && isParent) return;

      const isDone = l.status && l.status !== "Pending";
      if (!isDone) {
        pending++;
      } else {
        attended++;
      }

      const lDay = Number(l.dobDay ?? (l as any).dob_day ?? 0);
      const lMonth = Number(l.dobMonth ?? (l as any).dob_month ?? 0);

      const isTodayMatch = (lDay === curDay && lMonth === curMonth) || (lDay === curMonth && lMonth === curDay && lDay <= 12);
      const isTomorrowMatch = (lDay === tomorrowDay && lMonth === tomorrowMonth) || (lDay === tomorrowMonth && lMonth === tomorrowDay && lDay <= 12);
      const isT2Match = (lDay === t2Day && lMonth === t2Month) || (lDay === t2Month && lMonth === t2Day && lDay <= 12);

      if (isTodayMatch) birthdays++;
      if (isTomorrowMatch) tomorrowBirthdays++;
      if (isT2Match) t2Birthdays++;
      if (l.status === "Interested") interested++;
      if (l.status === "Reschedule") reschedule++;
      if (l.status === "Donated") donated++;
    });

    const activeStreamTotal =
      streamFilter === "PARENTS"
        ? parents
        : streamFilter === "DIRECT_DONOR"
        ? donors
        : leads.length;

    return {
      all: activeStreamTotal,
      pending,
      attended,
      birthdays,
      tomorrowBirthdays,
      t2Birthdays,
      interested,
      reschedule,
      donated,
      parents,
      donors,
      globalTotal: leads.length,
    };
  }, [leads, streamFilter, sessionContactedIds]);

  // Due callback calculation (Scheduled callbacks that are due now or within next 10 minutes)
  const dueCallbacks = useMemo(() => {
    const now = Date.now();
    return (leads || []).filter((l) => {
      if (l.status !== "Reschedule" || !l.rescheduleDate) return false;
      const dueTime = new Date(l.rescheduleDate).getTime();
      if (isNaN(dueTime)) return false;
      return dueTime <= now + 10 * 60 * 1000 && dueTime >= now - 24 * 60 * 60 * 1000;
    });
  }, [leads]);

  const [prevDueCount, setPrevDueCount] = useState(0);
  useEffect(() => {
    if (dueCallbacks.length > prevDueCount && prevDueCount !== 0) {
      playAlertChime();
    }
    setPrevDueCount(dueCallbacks.length);
  }, [dueCallbacks.length, prevDueCount]);

  // Filter & Search Leads with Date Sorting
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    const tomorrowMonth = tomorrow.getMonth() + 1;

    const t2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const t2Day = t2.getDate();
    const t2Month = t2.getMonth() + 1;

    // Strict phone number deduplication across cards to eliminate repetition within the filtered stream
    const seenPhones = new Set<string>();

    const q = searchQuery.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, "");
    const isSearching = q.length > 0;

    const base = leads.filter((l) => {
      // 1. Stream filter (Parents vs Direct Donors)
      const isParent = l.stream === "PARENTS" || (l.stream !== "DIRECT_DONOR" && l.stream !== "DIRECT_DONORS" && l.stream !== "donor" && l.stream !== "direct" && Boolean(l.parentName || l.childName));
      if (!isSearching) {
        if (streamFilter === "PARENTS" && !isParent) return false;
        if (streamFilter === "DIRECT_DONOR" && isParent) return false;
      }

      // 2. Tab Status Filtering (Bypassed when actively searching so all matching records can be found)
      let matchesFilter = true;
      if (!isSearching) {
        const lDay = Number(l.dobDay ?? (l as any).dob_day ?? 0);
        const lMonth = Number(l.dobMonth ?? (l as any).dob_month ?? 0);
        const isTodayMatch = (lDay === curDay && lMonth === curMonth) || (lDay === curMonth && lMonth === curDay && lDay <= 12);
        const isTomorrowMatch = (lDay === tomorrowDay && lMonth === tomorrowMonth) || (lDay === tomorrowMonth && lMonth === tomorrowDay && lDay <= 12);
        const isT2Match = (lDay === t2Day && lMonth === t2Month) || (lDay === t2Month && lMonth === t2Day && lDay <= 12);

        if (filter === "T2_Birthday") {
          matchesFilter = isT2Match;
        } else if (filter === "Tomorrow_Birthday") {
          matchesFilter = isTomorrowMatch;
        } else if (filter === "Today_Birthday") {
          matchesFilter = isTodayMatch;
        } else if (filter === "Pending") {
          matchesFilter = !l.status || l.status === "Pending";
        } else if (filter === "Interested") {
          matchesFilter = l.status === "Interested";
        } else if (filter === "Donated") {
          matchesFilter = l.status === "Donated";
        } else if (filter === "Attended") {
          matchesFilter = Boolean(l.status && l.status !== "Pending");
        } else if (filter === "Reschedule") {
          matchesFilter = l.status === "Reschedule";
        } else if (filter !== "ALL") {
          matchesFilter = l.status === filter;
        }

        if (!matchesFilter) return false;
      }

      // 3. Strict deduplication by normalized 10-digit mobile number WITHIN the filtered stream
      const cleanPhone = (l.phone || "").replace(/\D/g, "").slice(-10);
      if (cleanPhone && !isSearching) {
        if (seenPhones.has(cleanPhone)) return false;
        seenPhones.add(cleanPhone);
      }

      if (!isSearching) return true;

      // 4. Smart Multi-Field & Digit-Normalized Search (Searches Calling Phone, WhatsApp Phone, Names, Reasons & Notes)
      const phoneDigits = (l.phone || "").replace(/\D/g, "");
      const waDigits = (l.whatsappPhone || "").replace(/\D/g, "");

      const matchesPhone = qDigits.length >= 3 && (
        phoneDigits.includes(qDigits) ||
        waDigits.includes(qDigits) ||
        (l.phone && l.phone.toLowerCase().includes(q)) ||
        (l.whatsappPhone && l.whatsappPhone.toLowerCase().includes(q))
      );

      const matchesText =
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.parentName && l.parentName.toLowerCase().includes(q)) ||
        (l.childName && l.childName.toLowerCase().includes(q)) ||
        (l.dispositionReason && l.dispositionReason.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q)) ||
        String(l.leadId).includes(q);

      return matchesPhone || matchesText;
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
      // 0. SPECIFIC SORT: Interested Leads First
      if (dateSortOrder === "interested_first") {
        const aInt = a.status === "Interested";
        const bInt = b.status === "Interested";
        if (aInt && !bInt) return -1;
        if (!aInt && bInt) return 1;
        return a.leadId - b.leadId;
      }

      // 0b. SPECIFIC SORT: Donated Highest Amount First
      if (dateSortOrder === "donated_amount_desc") {
        const aDon = a.status === "Donated";
        const bDon = b.status === "Donated";
        if (aDon && !bDon) return -1;
        if (!aDon && bDon) return 1;
        const amtA = a.amount || a.lifetimeDonations || 0;
        const amtB = b.amount || b.lifetimeDonations || 0;
        return amtB - amtA || a.leadId - b.leadId;
      }

      // 0c. SPECIFIC SORT: Alphabetical A -> Z
      if (dateSortOrder === "name_asc") {
        const nameA = (a.name || a.parentName || "").toLowerCase();
        const nameB = (b.name || b.parentName || "").toLowerCase();
        return nameA.localeCompare(nameB) || a.leadId - b.leadId;
      }
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

  const filteredPendingCount = useMemo(() => {
    return filteredLeads.filter((l) => !l.status || l.status === "Pending").length;
  }, [filteredLeads]);

  // Persistent Resume: retain activeFocusLeadId or restore from localStorage on filter, stream or sort changes
  useEffect(() => {
    setPortalPage(1);
    if (activeFocusLeadId) {
      const idx = filteredLeads.findIndex((l) => l.leadId === activeFocusLeadId);
      if (idx !== -1) {
        setFocusIndex(idx);
        return;
      }
    }
    if (callerProfile) {
      try {
        const saved = localStorage.getItem(`janaseva_last_lead_${callerProfile.callerId}`);
        if (saved) {
          const num = Number(saved);
          const targetLead = filteredLeads.find((l) => l.leadId === num);
          if (targetLead && (!targetLead.status || targetLead.status === "Pending")) {
            setActiveFocusLeadId(num);
            const sIdx = filteredLeads.findIndex((l) => l.leadId === num);
            if (sIdx !== -1) {
              setFocusIndex(sIdx);
              return;
            }
          }
        }
      } catch {}
    }
    const firstPending = filteredLeads.find((l) => !l.status || l.status === "Pending");
    if (firstPending) {
      setActiveFocusLeadId(firstPending.leadId);
      const sIdx = filteredLeads.findIndex((l) => l.leadId === firstPending.leadId);
      setFocusIndex(sIdx !== -1 ? sIdx : 0);
    } else {
      setFocusIndex(0);
    }
  }, [filter, searchQuery, dateSortOrder, streamFilter, filteredLeads, activeFocusLeadId, callerProfile]);

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

  // Keep activeFocusLeadId synced with the currently displayed lead and persist in localStorage
  useEffect(() => {
    if (currentFocusLead) {
      if (currentFocusLead.leadId !== activeFocusLeadId) {
        setActiveFocusLeadId(currentFocusLead.leadId);
      }
      if (callerProfile) {
        try {
          localStorage.setItem(`janaseva_last_lead_${callerProfile.callerId}`, String(currentFocusLead.leadId));
        } catch {}
      }
    }
  }, [currentFocusLead, activeFocusLeadId, callerProfile]);

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
            <button
                  type="button" onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
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
  const todayCallsCount = typeof (stats as any).todayContactedCount === "number" ? (stats as any).todayContactedCount : stats.contactedCount;
  const progressPercent = Math.min(100, Math.round((todayCallsCount / dailyTarget) * 100));

  // ── AUTHENTICATED STATE: DEDICATED TELECALLER WORKSPACE ──
  return (
    <div className="space-y-4 animate-fadeIn max-w-4xl mx-auto px-2 sm:px-6 py-2 sm:py-4 pb-36 md:pb-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between sticky top-3 z-30 animate-fadeIn">
          <span>{toastMsg}</span>
          <button
                  type="button" onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2 cursor-pointer">✕</button>
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
            <span className="font-mono text-xs font-black text-emerald-800">{todayCallsCount}/{dailyTarget}</span>
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
                <span>🎯 ದಿನದ ಗುರಿ: {todayCallsCount}/{dailyTarget} ({progressPercent}%)</span>
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

            {/* Shift Activity & Edit Typo Drawer */}
            <button
              type="button"
              onClick={() => {
                setShowShiftDrawer(true);
                void loadDailyLogs();
              }}
              title="View today's calls and edit any incorrect entries or amounts"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-950 px-3 py-2 text-xs font-black transition cursor-pointer shadow-2xs"
            >
              <span>📝</span>
              <span>Today&apos;s Logs ({dailyLogs.length})</span>
            </button>

            {/* End of Day (EOD) Submit Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowEodModal(true);
                void loadDailyLogs();
                void loadEodStatus();
              }}
              title="Submit daily shift report to supervisor for payment verification"
              className={`focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition cursor-pointer shadow-2xs ${
                eodStatus?.isSubmitted
                  ? "bg-emerald-100 border-emerald-400 text-emerald-950"
                  : "bg-teal-950 hover:bg-teal-900 border-teal-800 text-gold"
              }`}
            >
              <span>{eodStatus?.isSubmitted ? "✅" : "📤"}</span>
              <span>{eodStatus?.isSubmitted ? "Shift Submitted" : "Submit Shift"}</span>
            </button>

            <button
              type="button"
              onClick={handleSendDailySupervisorReport}
              title="Send End-of-Day calling report to supervisor on WhatsApp"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 px-3 py-2 text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <span>📊 Daily WhatsApp</span>
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
              {todayCallsCount}
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
                {todayCallsCount} / {dailyTarget} Calls ({progressPercent}%)
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
              <h2 className="font-display text-base sm:text-lg font-bold text-teal-950 flex items-center gap-2 flex-wrap">
                <span>{viewMode === "focus" ? "⚡ Calling Card" : "📋 All Leads"}</span>
                <span className="text-xs font-mono bg-cream px-2.5 py-0.5 rounded-full border border-teal-900/15 font-bold">
                  {filteredLeads.length} leads
                </span>
                <button
                  type="button"
                  onClick={() => loadCallerLeads(callerProfile.callerId, true)}
                  disabled={loadingLeads}
                  title="Refresh leads from server (ಕ್ಯೂ ನವೀಕರಿಸಿ)"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black bg-teal-100 hover:bg-teal-200 active:scale-95 text-teal-950 transition cursor-pointer border border-teal-900/20"
                >
                  <span className={loadingLeads ? "animate-spin" : ""}>🔄</span>
                  <span>ನವೀಕರಿಸಿ (Refresh)</span>
                </button>
              </h2>
              <p className="text-xs text-teal-950/60 mt-0.5">
                {viewMode === "focus"
                  ? "Single-lead focus view. Tap Call or WhatsApp to reach donor."
                  : "Click any lead below to load into the Calling Card."}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, WA no or reason..."
                className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs bg-white text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-teal-950/40 hover:text-teal-950 text-xs cursor-pointer font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Global Search Status Banner */}
          {searchQuery.trim() && (
            <div className="flex items-center justify-between gap-2 p-2.5 px-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-950 text-xs font-bold">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span>🔍</span>
                <span>
                  &quot;<strong>{searchQuery}</strong>&quot; ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು: <strong>{filteredLeads.length}</strong> ಲೀಡ್‌ಗಳು ಕಂಡುಬಂದಿವೆ (ಎಲ್ಲಾ ಟ್ಯಾಬ್‌ಗಳಿಂದ)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-black underline cursor-pointer hover:text-amber-800 shrink-0"
              >
                ✕ ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ (Clear Search)
              </button>
            </div>
          )}

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
                { id: "Interested", label: "⭐ ಆಸಕ್ತರು (Interested)", count: counts.interested, color: "text-amber-900 bg-amber-200" },
                { id: "Donated", label: "💰 ದೇಣಿಗೆ (Donated)", count: counts.donated, color: "text-emerald-900 bg-emerald-200" },
                { id: "T2_Birthday", label: "🌟 ನಾಡಿದ್ದು ಹುಟ್ಟುಹಬ್ಬ (T+2)", count: counts.t2Birthdays, color: "text-indigo-900 bg-indigo-100" },
                { id: "Tomorrow_Birthday", label: "🎂 ನಾಳೆ ಹುಟ್ಟುಹಬ್ಬ (Tomorrow)", count: counts.tomorrowBirthdays, color: "text-purple-900 bg-purple-100" },
                { id: "Today_Birthday", label: "🎉 ಇಂದು ಹುಟ್ಟುಹಬ್ಬ (Today)", count: counts.birthdays, color: "text-pink-900 bg-pink-100" },
                { id: "Reschedule", label: "📅 ಮತ್ತೆ ಕರೆ (Callbacks)", count: counts.reschedule, color: "text-blue-900 bg-blue-100" },
                { id: "Attended", label: "✓ ಮುಗಿದಿದೆ (Completed)", count: counts.attended, color: "text-teal-900 bg-teal-100" },
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
                <option value="interested_first">⭐ ಆಸಕ್ತಿ ಹೊಂದಿದವರು ಮೊದಲು (Interested First)</option>
                <option value="donated_amount_desc">💰 ಗರಿಷ್ಠ ದೇಣಿಗೆ ಮೊದಲು (Highest Donation First)</option>
                <option value="callback_earliest">⏰ ಮರುಕರೆ ಸಮಯ (Urgent Callbacks First)</option>
                <option value="name_asc">🔤 ಹೆಸರಿನ ಅಕಾರಾದಿ (Name A → Z)</option>
                <option value="date_newest">🆕 ಹೊಸ ಲೀಡ್ ಮೊದಲು (Newest Added First)</option>
                <option value="date_oldest">⏳ ಹಳೆಯ ಲೀಡ್ ಮೊದಲು (Oldest Added First)</option>
                <option value="birthday_calendar">🎂 ಕ್ಯಾಲೆಂಡರ್ ದಿನಾಂಕ (Jan 1 → Dec 31)</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Mode Switcher on Mobile, Master-Detail Status on Desktop */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl bg-sand/40 border border-teal-900/15">
          {/* Mobile Switcher (Queue vs Calling Card + Shift Activity & EOD Submit) */}
          <div className="flex lg:hidden items-center gap-1.5 w-full flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode("focus")}
              className={`flex-1 rounded-xl px-2.5 py-2 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 shadow-xs ${
                viewMode === "focus"
                  ? "bg-teal-950 text-gold shadow-sm"
                  : "bg-white text-teal-950 hover:bg-cream"
              }`}
            >
              <span>⚡</span>
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("queue")}
              className={`flex-1 rounded-xl px-2.5 py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                viewMode === "queue"
                  ? "bg-teal-950 text-white shadow-sm"
                  : "bg-white text-teal-950 hover:bg-cream"
              }`}
            >
              <span>📋</span>
              <span>Queue ({filteredLeads.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowShiftDrawer(true);
                void loadDailyLogs();
              }}
              className="rounded-xl px-2.5 py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 bg-amber-100 text-amber-950 border border-amber-300"
              title="Today's calls"
            >
              <span>📝</span>
              <span>Logs ({dailyLogs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEodModal(true);
                void loadDailyLogs();
                void loadEodStatus();
              }}
              className={`rounded-xl px-2.5 py-2 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                eodStatus?.isSubmitted
                  ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                  : "bg-teal-950 text-amber-300"
              }`}
              title="Submit Shift"
            >
              <span>{eodStatus?.isSubmitted ? "✅" : "📤"}</span>
              <span>{eodStatus?.isSubmitted ? "Done" : "EOD"}</span>
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

        {/* ── ALARM: URGENT DUE CALLBACKS BANNER ── */}
        {dueCallbacks.length > 0 && (
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white p-3 rounded-2xl shadow-lg border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-pulse my-2">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-display font-black text-xs sm:text-sm tracking-wide">
                  URGENT CALLBACK DUE NOW ({dueCallbacks.length}): {dueCallbacks[0].name} ({dueCallbacks[0].phone})
                </p>
                <p className="text-[11px] text-amber-100 font-semibold">
                  Scheduled callback time has arrived! Donor is expecting your call now.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveFocusLeadId(dueCallbacks[0].leadId);
                  setViewMode("focus");
                  handleCallLead(dueCallbacks[0]);
                }}
                className="bg-teal-950 text-gold hover:bg-black font-black text-xs px-3.5 py-2 rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <span>📞 Dial &amp; Focus Now</span>
              </button>
            </div>
          </div>
        )}

        {/* ── OFFLINE QUEUE STATUS BANNER ── */}
        {offlineQueueCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 text-amber-950 px-3.5 py-2 rounded-2xl text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs my-2">
            <span className="flex items-center gap-2">
              <span className="text-base">📡</span>
              <span>
                <strong>{offlineQueueCount} update(s)</strong> saved in offline storage. Data is safe and will auto-sync when network returns.
              </span>
            </span>
            <button
              type="button"
              onClick={syncOfflineQueue}
              disabled={isSyncingOffline}
              className="bg-amber-600 hover:bg-amber-700 active:scale-95 text-white px-3 py-1 rounded-xl text-xs font-black cursor-pointer shrink-0 transition"
            >
              {isSyncingOffline ? "Syncing..." : "🔄 Sync to Server Now"}
            </button>
          </div>
        )}

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
                  {filteredLeads.length} total
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                  ⏳ {filteredPendingCount} pending to call
                </span>
              </div>
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
                  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                  const tomorrowDay = tomorrow.getDate();
                  const tomorrowMonth = tomorrow.getMonth() + 1;
                  const t2 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
                  const t2Day = t2.getDate();
                  const t2Month = t2.getMonth() + 1;
                  const lDay = Number(lead.dobDay ?? (lead as any).dob_day ?? 0);
                  const lMonth = Number(lead.dobMonth ?? (lead as any).dob_month ?? 0);
                  const isTodayBirthday = (lDay === curDay && lMonth === curMonth) || (lDay === curMonth && lMonth === curDay && lDay <= 12);
                  const isTomorrowBirthday = (lDay === tomorrowDay && lMonth === tomorrowMonth) || (lDay === tomorrowMonth && lMonth === tomorrowDay && lDay <= 12);
                  const isT2Birthday = (lDay === t2Day && lMonth === t2Month) || (lDay === t2Month && lMonth === t2Day && lDay <= 12);
                  const isSelected = lead.leadId === activeFocusLeadId;
                  const isDialing = lead.leadId === currentlyDialedLeadId;
                  const isDialed = sessionContactedIds.has(lead.leadId);
                  const isAttended = lead.status && lead.status !== "Pending";
                  const phoneInfo = parseCustomerPhone(lead.phone);
                  const isParent = lead.stream === "PARENTS" || (lead.stream !== "DIRECT_DONOR" && lead.stream !== "DIRECT_DONORS" && Boolean(lead.parentName || lead.childName));

                  return (
                    <div
                      key={lead.leadId}
                      onClick={() => {
                        setActiveFocusLeadId(lead.leadId);
                        const overallIdx = filteredLeads.findIndex((fl) => fl.leadId === lead.leadId);
                        if (overallIdx !== -1) setFocusIndex(overallIdx);
                        if (callerProfile) {
                          try {
                            localStorage.setItem(`janaseva_last_lead_${callerProfile.callerId}`, String(lead.leadId));
                          } catch {}
                        }
                        setViewMode("focus");
                      }}
                      className={`rounded-2xl p-3 border transition shadow-xs cursor-pointer select-none ${
                        isSelected
                          ? "border-amber-500 ring-2 ring-amber-400/50 bg-amber-50/60 shadow-sm"
                          : isTodayBirthday || isTomorrowBirthday || isT2Birthday
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
                            {isParent ? (
                              <span className="flex items-center gap-1.5 flex-wrap truncate">
                                <span className="text-indigo-950 font-black">👶 {cleanChildName(lead)}</span>
                                <span className="text-teal-900 font-bold bg-teal-50 px-1.5 py-0.2 rounded text-[11px] border border-teal-200/70">
                                  👨‍👩‍👧 {cleanParentName(lead)}
                                </span>
                              </span>
                            ) : lead.name}
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
                          ) : lead.status === "Wrong_Number" || lead.status === "Invalid_Number" ? (
                            <span className="rounded-full bg-rose-600 text-white px-2 py-0.5 text-[9px] font-black">
                              ❌ Invalid No
                            </span>
                          ) : lead.status === "Not_Reachable" ? (
                            <span className="rounded-full bg-slate-600 text-white px-2 py-0.5 text-[9px] font-black">
                              📵 Not Reachable
                            </span>
                          ) : lead.status === "No_Answer" || lead.status === "Busy" ? (
                            <span className="rounded-full bg-amber-700 text-white px-2 py-0.5 text-[9px] font-black">
                              ⏳ Busy / RNR
                            </span>
                          ) : lead.status === "Rejected" ? (
                            <span className="rounded-full bg-zinc-500 text-white px-2 py-0.5 text-[9px] font-black">
                              ✕ Rejected
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
                          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-950 px-2 py-0.5 rounded-md border border-indigo-200/60 flex items-center gap-1.5 flex-wrap">
                            <span>🎓 ಮಗು: <strong>{cleanChildName(lead)}</strong></span>
                            <span className="text-indigo-400">•</span>
                            <span>👨‍👩‍👧 ಪೋಷಕರು: <strong>{cleanParentName(lead)}</strong></span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold bg-teal-100 text-teal-900 px-1.5 py-0.2 rounded">
                            🎂 Direct Donor
                          </span>
                        )}

                        {lead.dobDay && lead.dobMonth && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            isT2Birthday
                              ? "bg-indigo-100 text-indigo-900 font-black"
                              : isTomorrowBirthday
                              ? "bg-purple-100 text-purple-900 font-black animate-pulse"
                              : isTodayBirthday
                              ? "bg-amber-100 text-amber-900 font-black"
                              : "text-teal-950/60"
                          }`}>
                            🎂 {lead.dobDay}/{lead.dobMonth} {isT2Birthday ? "(T+2)" : (isTomorrowBirthday ? "(Tomorrow)" : (isTodayBirthday ? "(Today)" : ""))}
                          </span>
                        )}

                        {lead.whatsappPhone && (
                          <span className="font-mono text-[10px] font-bold text-emerald-950 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                            🟢 WA: {lead.whatsappPhone}
                          </span>
                        )}

                        {lead.dispositionReason && (
                          <span className="text-[10px] font-bold text-indigo-950 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                            🏷️ {lead.dispositionReason}
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

                      {/* Queue Card Bottom Strip: Stamp & Open Card Action */}
                      <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-teal-900/5 text-[10px] flex-wrap">
                        {isAttended ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                              <span>🔖</span>
                              <span>STAMP: {lead.status?.toUpperCase()}</span>
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Revert lead #${lead.leadId} (${lead.name}) back to fresh pending queue?`)) {
                                  void handleRevertToPending(lead.leadId);
                                }
                              }}
                              className="text-[10px] font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-md cursor-pointer transition flex items-center gap-1 shadow-2xs"
                              title="Revert back to Pending"
                            >
                              <span>↩️ Revert</span>
                            </button>
                          </div>
                        ) : isSelected ? (
                          <span className="font-bold text-amber-950 bg-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            <span>📍</span>
                            <span>You are here</span>
                          </span>
                        ) : (
                          <span className="text-teal-950/60 font-medium">
                            Tap to open card &amp; call
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditContactLead(lead);
                              setEditCallingPhone(lead.phone || "");
                              setEditWhatsAppPhone(lead.whatsappPhone || "");
                            }}
                            className="text-[10px] font-bold text-teal-950 bg-white hover:bg-amber-50 border border-teal-900/15 px-1.5 py-0.5 rounded-md transition cursor-pointer"
                            title="Edit numbers / Add WhatsApp"
                          >
                            ✏️ No.
                          </button>
                          <span className="font-bold text-teal-900 bg-sand/60 hover:bg-sand px-2 py-0.5 rounded-md flex items-center gap-1">
                            <span>Open</span>
                            <span>➔</span>
                          </span>
                        </div>
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
          <div ref={callingCardRef} className={`space-y-4 lg:col-span-7 xl:col-span-8 ${viewMode === "focus" ? "block" : "hidden lg:block"}`}>
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
                  {(filter === "Tomorrow_Birthday" || filter === "T2_Birthday") && counts.pending > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilter("Pending");
                        setDateSortOrder("birthday_upcoming");
                        setFocusIndex(0);
                      }}
                      className="rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-teal-950 font-black px-5 py-3 text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 w-full max-w-sm mb-2"
                    >
                      <span>🎂</span>
                      <span>ಮುಂಬರುವ ಹುಟ್ಟುಹಬ್ಬಗಳಿಗೆ ಕರೆ ಮಾಡಿ ({counts.pending} ಬಾಕಿ)</span>
                    </button>
                  )}
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
                const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                const tomorrowDay = tomorrow.getDate();
                const tomorrowMonth = tomorrow.getMonth() + 1;
                const dayAfter = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
                const t2Day = dayAfter.getDate();
                const t2Month = dayAfter.getMonth() + 1;
                const curLeadDay = Number(currentFocusLead.dobDay ?? (currentFocusLead as any).dob_day ?? 0);
                const curLeadMonth = Number(currentFocusLead.dobMonth ?? (currentFocusLead as any).dob_month ?? 0);
                const isTodayBirthday = (curLeadDay === curDay && curLeadMonth === curMonth) || (curLeadDay === curMonth && curLeadMonth === curDay && curLeadDay <= 12);
                const isTomorrowBirthday = (curLeadDay === tomorrowDay && curLeadMonth === tomorrowMonth) || (curLeadDay === tomorrowMonth && curLeadMonth === tomorrowDay && curLeadDay <= 12);
                const isT2Birthday = (curLeadDay === t2Day && curLeadMonth === t2Month) || (curLeadDay === t2Month && curLeadMonth === t2Day && curLeadDay <= 12);
                const isParentLead = currentFocusLead.stream === "PARENTS" || (currentFocusLead.stream !== "DIRECT_DONOR" && currentFocusLead.stream !== "DIRECT_DONORS" && currentFocusLead.stream !== "donor" && currentFocusLead.stream !== "direct" && Boolean(currentFocusLead.parentName || currentFocusLead.childName));
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
                        {/* 1-Tap Mobile Return to Queue button */}
                        <button
                          type="button"
                          onClick={() => setViewMode("queue")}
                          className="lg:hidden rounded-xl bg-sand/80 hover:bg-sand border border-teal-900/20 px-2.5 py-1 text-xs font-black text-teal-950 transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                          title="Back to All Leads Queue"
                        >
                          <span>◀ Queue ({filteredLeads.length})</span>
                        </button>
                        <span className="text-xs font-mono font-black bg-teal-950 text-gold px-2.5 py-1 rounded-xl shadow-xs">
                          LEAD {safeFocusIndex + 1} OF {filteredLeads.length}
                        </span>
                        {isParentLead ? (
                          <span className="rounded-full bg-indigo-950 text-amber-300 px-3 py-1 text-xs font-black uppercase shadow-xs flex items-center gap-1.5 flex-wrap">
                            <span>👶</span>
                            <span>1. Parents Sheet:</span>
                            <span className="text-white">🎓 ಮಗು: <strong>{cleanChildName(currentFocusLead)}</strong></span>
                            <span className="text-amber-400/80">•</span>
                            <span className="text-white">👨‍👩‍👧 ಪೋಷಕರು: <strong>{cleanParentName(currentFocusLead)}</strong></span>
                          </span>
                        ) : (
                          <span className="rounded-full bg-teal-950 text-emerald-300 px-3 py-1 text-xs font-black uppercase shadow-xs flex items-center gap-1">
                            <span>🎂</span>
                            <span>2. Direct Donor Sheet</span>
                          </span>
                        )}
                        {isT2Birthday && (
                          <span className="rounded-full bg-indigo-600 text-white px-3 py-1 text-xs font-black uppercase shadow-xs animate-pulse flex items-center gap-1">
                            <span>🌟</span>
                            <span>ನಾಡಿದ್ದು ಹುಟ್ಟುಹಬ್ಬ (T+2 Advance Seva)</span>
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="rounded-full bg-emerald-100 text-emerald-900 px-2.5 py-0.5 text-xs font-bold border border-emerald-300">
                              ✓ {currentFocusLead.status}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Revert lead #${currentFocusLead.leadId} (${currentFocusLead.name}) back to Pending?`)) {
                                  void handleRevertToPending(currentFocusLead.leadId);
                                }
                              }}
                              className="rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-2 py-0.5 text-[10px] font-black transition cursor-pointer shadow-2xs flex items-center gap-1"
                              title="Accidentally marked? Revert back to Pending queue"
                            >
                              <span>↩️ Revert</span>
                            </button>
                          </div>
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

                    {/* ── OFFICIAL DATA UPDATE STAMP SEAL ── */}
                    {currentFocusLead.status && currentFocusLead.status !== "Pending" && (
                      <div className="rounded-2xl border-2 border-dashed border-teal-900/40 bg-sand/40 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full border-2 border-teal-900/60 bg-white flex items-center justify-center text-teal-950 font-black text-[9px] shrink-0 shadow-2xs rotate-[-8deg] font-mono">
                            SEAL
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black uppercase tracking-wider bg-teal-950 text-gold px-2.5 py-0.5 rounded-lg shadow-2xs">
                                🔖 STAMP: {currentFocusLead.status.toUpperCase()}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                ✓ RECORDED IN DATABASE
                              </span>
                            </div>
                            <p className="text-[11px] text-teal-950/80 mt-1 font-medium">
                              Logged by <strong>{callerProfile?.name || callerProfile?.callerId}</strong>
                              {currentFocusLead.lastContactedAt && (
                                <span> · {new Date(currentFocusLead.lastContactedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                              )}
                              {currentFocusLead.notes ? ` · "${currentFocusLead.notes}"` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Revert lead #${currentFocusLead.leadId} (${currentFocusLead.name}) back to fresh pending queue?`)) {
                                void handleRevertToPending(currentFocusLead.leadId);
                              }
                            }}
                            className="rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                            title="Undo disposition and restore lead to fresh pending state"
                          >
                            <span>↩️ Revert to Pending</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleJumpToNextPending}
                            className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-3 py-1.5 text-xs font-black transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <span>⏭️ Jump to Fresh Lead</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Donor Details Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-sand/25 p-4 rounded-2xl border border-teal-900/10">
                      <div>
                        {isParentLead ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-950 text-amber-300 px-2.5 py-0.5 rounded-lg">
                                👶 1. ಪೋಷಕರ ಶೀಟ್ (Parents / Child Birthday)
                              </span>
                              <span className="text-xs font-mono text-teal-950/50">#{currentFocusLead.leadId}</span>
                            </div>

                            {/* Prominent Dual Box: Both Child Name AND Parent Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                              {/* 1. Student / Child Block */}
                              <div className="bg-white/95 p-3 rounded-xl border border-indigo-200/90 shadow-2xs">
                                <span className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1 uppercase tracking-wide">
                                  <span>🎓</span>
                                  <span>ಮಗುವಿನ ಹೆಸರು (Child / Student):</span>
                                </span>
                                <h2 className="font-display text-xl sm:text-2xl font-black text-indigo-950 mt-0.5 leading-tight">
                                  {cleanChildName(currentFocusLead)}
                                </h2>
                              </div>

                              {/* 2. Parent Block */}
                              <div className="bg-white/95 p-3 rounded-xl border border-teal-200/90 shadow-2xs">
                                <span className="text-[11px] font-extrabold text-teal-900 flex items-center gap-1 uppercase tracking-wide">
                                  <span>👨‍👩‍👧</span>
                                  <span>ಪೋಷಕರ ಹೆಸರು (Parent Name):</span>
                                </span>
                                <h3 className="font-display text-xl sm:text-2xl font-black text-teal-950 mt-0.5 leading-tight">
                                  {cleanParentName(currentFocusLead)}
                                </h3>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-teal-950/80 flex-wrap pt-0.5">
                              <span className="font-mono text-xs font-bold text-teal-950 bg-white px-2 py-0.5 rounded-lg border border-teal-900/15 flex items-center gap-1">
                                <span>📱 Call:</span>
                                <strong>{phoneInfo.display}</strong>
                              </span>

                              {currentFocusLead.whatsappPhone ? (
                                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                                  <span>🟢 WA:</span>
                                  <strong>{currentFocusLead.whatsappPhone}</strong>
                                </span>
                              ) : (
                                <span className="text-[10px] text-teal-950/60 italic bg-sand/40 px-2 py-0.5 rounded-lg border border-teal-900/10">
                                  WA: Same as Call
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditContactLead(currentFocusLead);
                                  setEditCallingPhone(currentFocusLead.phone || "");
                                  setEditWhatsAppPhone(currentFocusLead.whatsappPhone || "");
                                }}
                                className="rounded-lg bg-sand/80 hover:bg-amber-100 text-teal-950 border border-teal-900/20 px-2 py-0.5 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Add alternate WhatsApp number or update calling number"
                              >
                                <span>✏️</span>
                                <span>Add / Change Numbers</span>
                              </button>

                              {currentFocusLead.whatsappPhone && (
                                <a
                                  href={`tel:${currentFocusLead.whatsappPhone.replace(/\D/g, "")}`}
                                  onClick={() => {
                                    setCurrentlyDialedLeadId(currentFocusLead.leadId);
                                    setCallStartTime(Date.now());
                                  }}
                                  className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Dial alternate WhatsApp number directly"
                                >
                                  <span>📞 Dial WA No.</span>
                                </a>
                              )}

                              {currentFocusLead.dispositionReason && (
                                <span className="rounded-lg bg-indigo-50 text-indigo-950 px-2 py-0.5 text-[11px] font-bold border border-indigo-200 flex items-center gap-1">
                                  <span>🏷️ Reason:</span>
                                  <span>{currentFocusLead.dispositionReason}</span>
                                </span>
                              )}

                              {currentFocusLead.lastContactedAt && (Date.now() - new Date(currentFocusLead.lastContactedAt).getTime()) < 4 * 60 * 60 * 1000 && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>Already dialed today — Avoid repeated call</span>
                                </span>
                              )}
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
                            <div className="flex items-center gap-2 text-xs text-teal-950/80 flex-wrap pt-0.5">
                              <span className="font-mono text-xs font-bold text-teal-950 bg-white px-2 py-0.5 rounded-lg border border-teal-900/15 flex items-center gap-1">
                                <span>📱 Call:</span>
                                <strong>{phoneInfo.display}</strong>
                              </span>

                              {currentFocusLead.whatsappPhone ? (
                                <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                                  <span>🟢 WA:</span>
                                  <strong>{currentFocusLead.whatsappPhone}</strong>
                                </span>
                              ) : (
                                <span className="text-[10px] text-teal-950/60 italic bg-sand/40 px-2 py-0.5 rounded-lg border border-teal-900/10">
                                  WA: Same as Call
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditContactLead(currentFocusLead);
                                  setEditCallingPhone(currentFocusLead.phone || "");
                                  setEditWhatsAppPhone(currentFocusLead.whatsappPhone || "");
                                }}
                                className="rounded-lg bg-sand/80 hover:bg-amber-100 text-teal-950 border border-teal-900/20 px-2 py-0.5 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Add alternate WhatsApp number or update calling number"
                              >
                                <span>✏️</span>
                                <span>Add / Change Numbers</span>
                              </button>

                              {currentFocusLead.whatsappPhone && (
                                <a
                                  href={`tel:${currentFocusLead.whatsappPhone.replace(/\D/g, "")}`}
                                  onClick={() => {
                                    setCurrentlyDialedLeadId(currentFocusLead.leadId);
                                    setCallStartTime(Date.now());
                                  }}
                                  className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Dial alternate WhatsApp number directly"
                                >
                                  <span>📞 Dial WA No.</span>
                                </a>
                              )}

                              {currentFocusLead.dispositionReason && (
                                <span className="rounded-lg bg-indigo-50 text-indigo-950 px-2 py-0.5 text-[11px] font-bold border border-indigo-200 flex items-center gap-1">
                                  <span>🏷️ Reason:</span>
                                  <span>{currentFocusLead.dispositionReason}</span>
                                </span>
                              )}

                              {currentFocusLead.lastContactedAt && (Date.now() - new Date(currentFocusLead.lastContactedAt).getTime()) < 4 * 60 * 60 * 1000 && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1">
                                  <span>⚠️</span>
                                  <span>Already dialed today — Avoid repeated call</span>
                                </span>
                              )}
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

                    {/* Active In-Call Talk Time Live Timer */}
                    {callStartTime && currentlyDialedLeadId === currentFocusLead.leadId && (
                      <div className="bg-emerald-600 text-white px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-black shadow-md border border-emerald-400 animate-pulse">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                          <span>📞 LIVE CALL: {currentFocusLead.name.toUpperCase()}</span>
                        </span>
                        <span className="font-mono text-sm tracking-widest bg-emerald-800/90 px-2.5 py-0.5 rounded-lg border border-white/20">
                          ⏱️ {String(Math.floor(callElapsedSeconds / 60)).padStart(2, "0")}:{String(callElapsedSeconds % 60).padStart(2, "0")}
                        </span>
                      </div>
                    )}

                    {/* ── STEP 1: PRIMARY TELECALLER ACTIONS (Bilingual, Ultra Simple & Direct) ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* ACTION 1: Dial Customer Now */}
                      <button
                        type="button"
                        onClick={() => handleCallLead(currentFocusLead)}
                        className="p-3.5 rounded-2xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer min-h-[58px]"
                      >
                        <span className="text-2xl">📞</span>
                        <div className="text-left">
                          <span className="block leading-tight font-black text-gold">
                            {isParentLead ? "ಪೋಷಕರಿಗೆ ಕರೆ ಮಾಡಿ (Call Parent)" : "ದಾನಿಗಳಿಗೆ ಕರೆ ಮಾಡಿ (Call Donor)"}
                          </span>
                          <span className="block text-xs font-mono text-white/90 font-bold">{phoneInfo.display}</span>
                        </div>
                      </button>

                      {/* ACTION 2: WhatsApp Details & UPI Link */}
                      <button
                        type="button"
                        onClick={() => handleDirectWhatsAppChat(currentFocusLead, selectedSevaAmount)}
                        disabled={waPacingSeconds > 0}
                        className={`p-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer min-h-[58px] ${
                          waPacingSeconds > 0
                            ? "bg-amber-600 cursor-not-allowed opacity-90"
                            : "bg-[#25D366] hover:brightness-105 active:scale-95"
                        }`}
                      >
                        <span className="text-2xl">{waPacingSeconds > 0 ? "⏳" : "💬"}</span>
                        {waPacingSeconds > 0 ? (
                          <div className="text-left">
                            <span className="block leading-tight font-black text-amber-100 flex items-center gap-1.5">
                              <span>Safe Pacing ({waPacingSeconds}s)...</span>
                            </span>
                            <span className="block text-[11px] text-white/90">Anti-ban safe interval active</span>
                          </div>
                        ) : (
                          <div className="text-left">
                            <span className="block leading-tight font-black">
                              {isParentLead
                                ? `👶 ${selectedNarrativeAngle === "trust_80g" ? "80G Tax ಸಂದೇಶ" : selectedNarrativeAngle === "location_visit" ? "ಆಶ್ರಮ ಲೊಕೇಶನ್ & ವಿಡಿಯೋ" : selectedNarrativeAngle === "provisions_inkind" ? "ದಿನಸಿ & ಅಕ್ಕಿ ಪಟ್ಟಿ" : "ಶುಭಾಶಯ ಸಂದೇಶ"}`
                                : `WhatsApp ಸಂದೇಶ (${selectedNarrativeAngle === "trust_80g" ? "80G Tax" : selectedNarrativeAngle === "location_visit" ? "Map/Video" : selectedNarrativeAngle === "provisions_inkind" ? "Groceries" : `₹${formatINR(selectedSevaAmount)}`})`}
                            </span>
                            <span className="block text-xs text-white/90 font-medium">Send Message &amp; Pay Link</span>
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Secondary Quick Share Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleDirectSharePaymentQr(currentFocusLead, selectedSevaAmount)}
                        className="rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/30 px-3 py-1.5 font-black transition flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        <span className="text-base">📷</span>
                        <span>QR ಸ್ಕ್ಯಾನರ್ ಫೋಟೋ ಕಳುಹಿಸಿ (Share Bank QR)</span>
                      </button>

                      <div className="flex items-center gap-2 text-teal-950/70">
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

                    {/* ── STEP 2: 🔥 MID-TOP 1-TAP CALL RESULT & AUTO-ADVANCE STRIP ── */}
                    {/* Placed prominently right under Call & WhatsApp buttons so 10th-grade telecallers never need to scroll! */}
                    <div className="rounded-3xl bg-sand/35 border-2 border-teal-900/15 p-3 sm:p-4 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs sm:text-sm font-black uppercase text-teal-950 tracking-wider flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>1-ಟ್ಯಾಪ್ ಕರೆ ಫಲಿತಾಂಶ (1-Tap Call Result):</span>
                        </span>
                        <span className="text-[11px] text-teal-950/70 font-bold">
                          ಟ್ಯಾಪ್ ಮಾಡಿ ಸೇವ್ ಮಾಡಿ &amp; ಮುಂದಿನ ಲೀಡ್‌ಗೆ ಹೋಗಿ
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Row 1: Primary Conversions & Reschedules (Large & High Contrast) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* 1. WARM / INTERESTED */}
                          <button
                            type="button"
                            onClick={() => {
                              setPendingConfirmation({
                                leadId: currentFocusLead.leadId,
                                leadName: currentFocusLead.name,
                                phone: currentFocusLead.phone,
                                disposition: "Interested",
                                labelKannada: "ಒಪ್ಪಿದ್ದಾರೆ (Interested)",
                                icon: "👍",
                                notes: cardNoteInput.trim() || undefined,
                                reason: selectedDispositionReason || undefined,
                              });
                            }}
                            className="min-h-[58px] p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-teal-950 font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border-2 border-amber-600/40"
                          >
                            <span className="flex items-center gap-1 text-sm sm:text-base font-black">
                              <span>👍</span>
                              <span>ಒಪ್ಪಿದ್ದಾರೆ</span>
                            </span>
                            <span className="text-[10px] text-teal-950/80 font-bold uppercase tracking-wider">Interested / Callback</span>
                          </button>

                          {/* 2. BUSY / +2h */}
                          <button
                            type="button"
                            onClick={() => {
                              const twoHoursLater = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
                              setPendingConfirmation({
                                leadId: currentFocusLead.leadId,
                                leadName: currentFocusLead.name,
                                phone: currentFocusLead.phone,
                                disposition: "Busy",
                                labelKannada: "ಬಿಜಿಯಿದ್ದಾರೆ (Busy / +2h)",
                                icon: "⏳",
                                notes: cardNoteInput.trim() || "Auto-rescheduled +2 hours",
                                callbackTime: twoHoursLater,
                                reason: selectedDispositionReason || "🏢 ಆಫೀಸ್‌ನಲ್ಲಿ ಬಿಜಿ (Busy in office)",
                              });
                            }}
                            className="min-h-[58px] p-2.5 rounded-2xl bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border-2 border-slate-600"
                          >
                            <span className="flex items-center gap-1 text-sm sm:text-base font-black">
                              <span>⏳</span>
                              <span>ಬಿಜಿಯಿದ್ದಾರೆ</span>
                            </span>
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Busy (+2 Hours)</span>
                          </button>

                          {/* 3. CALLBACK LATER */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveNotesLead(currentFocusLead);
                              setNotesText(cardNoteInput.trim() || currentFocusLead.notes || "");
                              setCallbackDateTime("");
                            }}
                            className="min-h-[58px] p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border-2 border-blue-500"
                          >
                            <span className="flex items-center gap-1 text-sm sm:text-base font-black">
                              <span>📅</span>
                              <span>ನಂತರ ಕರೆ</span>
                            </span>
                            <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Reschedule Date</span>
                          </button>

                          {/* 4. PAID / LOG DONATION */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDonationLead(currentFocusLead);
                              setLoggedDonationAmount(selectedSevaAmount || (isTodayBirthday ? 2500 : 1500));
                              setLoggedDonationUtr("");
                            }}
                            className="min-h-[58px] p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border-2 border-emerald-500"
                          >
                            <span className="flex items-center gap-1 text-sm sm:text-base font-black">
                              <span>🎉</span>
                              <span>ಹಣ ನೀಡಿದ್ದಾರೆ</span>
                            </span>
                            <span className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Log Paid ₹</span>
                          </button>
                        </div>

                        {/* Row 2: Floor Telephony Outcomes & Call Exceptions */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {/* 5. RINGING NO ANSWER (RNR) */}
                          <button
                            type="button"
                            onClick={() => {
                              setPendingConfirmation({
                                leadId: currentFocusLead.leadId,
                                leadName: currentFocusLead.name,
                                phone: currentFocusLead.phone,
                                disposition: "No_Answer",
                                labelKannada: "ರಿಂಗ್ ಆಗಿ ಕಟ್ (RNR)",
                                icon: "📳",
                                notes: cardNoteInput.trim() || "Ringing but no answer",
                                reason: selectedDispositionReason || "📳 ರಿಂಗ್ ಆಗಿದೆ, ಉತ್ತರಿಸಿಲ್ಲ",
                              });
                            }}
                            className="min-h-[52px] p-2 rounded-2xl bg-amber-700/90 hover:bg-amber-800 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border border-amber-600"
                            title="Ringing no answer / call disconnected"
                          >
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-black">
                              <span>📳</span>
                              <span>ರಿಂಗ್ ಆಗಿ ಕಟ್</span>
                            </span>
                            <span className="text-[9px] text-amber-200 font-bold uppercase tracking-wider">No Answer (RNR)</span>
                          </button>

                          {/* 6. CALL NOT GOING / NOT REACHABLE / SWITCHED OFF */}
                          <button
                            type="button"
                            onClick={() => {
                              setPendingConfirmation({
                                leadId: currentFocusLead.leadId,
                                leadName: currentFocusLead.name,
                                phone: currentFocusLead.phone,
                                disposition: "Not_Reachable",
                                labelKannada: "ಸಂಪರ್ಕವಿಲ್ಲ / ಆಫ್",
                                icon: "📵",
                                notes: cardNoteInput.trim() || "Call not connecting or switched off",
                                reason: selectedDispositionReason || "📵 ಸಂಪರ್ಕಕ್ಕೆ ಸಿಗುತ್ತಿಲ್ಲ / ಸ್ವಿಚ್ಡ್ ಆಫ್",
                              });
                            }}
                            className="min-h-[52px] p-2 rounded-2xl bg-indigo-900 hover:bg-indigo-950 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border border-indigo-700"
                            title="Call not connecting, network out of reach, or phone switched off"
                          >
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-black">
                              <span>📵</span>
                              <span>ಸಂಪರ್ಕವಿಲ್ಲ</span>
                            </span>
                            <span className="text-[9px] text-indigo-200 font-bold uppercase tracking-wider">Not Reachable</span>
                          </button>

                          {/* 7. WRONG / INVALID NUMBER */}
                          <button
                            type="button"
                            onClick={() => {
                              setPendingConfirmation({
                                leadId: currentFocusLead.leadId,
                                leadName: currentFocusLead.name,
                                phone: currentFocusLead.phone,
                                disposition: "Wrong_Number",
                                labelKannada: "ತಪ್ಪು ನಂಬರ್ (Invalid)",
                                icon: "❌",
                                notes: cardNoteInput.trim() || "Wrong number reported by telecaller",
                                reason: selectedDispositionReason || "❌ ತಪ್ಪು ನಂಬರ್ / ಅಮಾನ್ಯ ಸಂಖ್ಯೆ",
                              });
                            }}
                            className="min-h-[52px] p-2 rounded-2xl bg-rose-700 hover:bg-rose-800 active:scale-95 text-white font-black shadow-xs transition flex flex-col items-center justify-center cursor-pointer text-center border border-rose-600"
                            title="Wrong number or invalid telephone number"
                          >
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-black">
                              <span>❌</span>
                              <span>ತಪ್ಪು ನಂಬರ್</span>
                            </span>
                            <span className="text-[9px] text-rose-200 font-bold uppercase tracking-wider">Invalid Number</span>
                          </button>

                          {/* 8. REJECT / NOT INTERESTED */}
                          <button
                            type="button"
                            onClick={() => {
                              setPendingConfirmation({
                                leadId: currentFocusLead.leadId,
                                leadName: currentFocusLead.name,
                                phone: currentFocusLead.phone,
                                disposition: "Rejected",
                                labelKannada: "ಆಸಕ್ತಿಯಿಲ್ಲ (Reject)",
                                icon: "🛑",
                                notes: cardNoteInput.trim() || undefined,
                                reason: selectedDispositionReason || undefined,
                              });
                            }}
                            className="min-h-[52px] p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-900 border border-rose-300 font-black transition flex flex-col items-center justify-center cursor-pointer text-center"
                          >
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-black">
                              <span>🛑</span>
                              <span>ಆಸಕ್ತಿಯಿಲ್ಲ</span>
                            </span>
                            <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider">Not Interested</span>
                          </button>

                          {/* 9. SKIP CARD */}
                          <button
                            type="button"
                            onClick={() => handleSkipFocusLead(currentFocusLead)}
                            className="min-h-[52px] p-2 rounded-2xl bg-sand hover:bg-amber-100 active:scale-95 text-amber-950 border border-amber-300 font-black transition flex flex-col items-center justify-center cursor-pointer text-center"
                            title="Skip to next number without repeating today"
                          >
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-black">
                              <span>⏭️</span>
                              <span>ದಾಟಿಸಿ</span>
                            </span>
                            <span className="text-[9px] text-amber-800 font-bold uppercase tracking-wider">Skip Card</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── STEP 3: MANAGE WHATSAPP TEMPLATES (Medium-Size Buttons for 10th-Grade Telecallers) ── */}
                    <div className="rounded-3xl bg-amber-50/70 border border-amber-300/80 p-3 sm:p-4 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs sm:text-sm font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                          <span>💬</span>
                          <span>WhatsApp ಸಂದೇಶ ಮಾದರಿಗಳು (Message Templates):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsAppModal(currentFocusLead)}
                          className="text-xs font-black text-teal-950 bg-amber-200/80 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>⚙️</span>
                          <span>ಎಲ್ಲಾ ಮಾದರಿಗಳು (Manage All)</span>
                        </button>
                      </div>

                      {/* Medium-Size Template Choice Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedNarrativeAngle("birthday")}
                          className={`min-h-[48px] py-2 px-3 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center flex items-center justify-center gap-1.5 border shadow-2xs ${
                            selectedNarrativeAngle === "birthday"
                              ? "bg-amber-500 text-teal-950 border-amber-600 ring-2 ring-amber-400 shadow-sm"
                              : "bg-white text-teal-950 border-amber-200 hover:bg-amber-100/60"
                          }`}
                        >
                          <span className="text-base">🎂</span>
                          <span>ಹುಟ್ಟುಹಬ್ಬ (Birthday)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedNarrativeAngle("trust_80g")}
                          className={`min-h-[48px] py-2 px-3 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center flex items-center justify-center gap-1.5 border shadow-2xs ${
                            selectedNarrativeAngle === "trust_80g"
                              ? "bg-indigo-950 text-amber-300 border-indigo-950 ring-2 ring-amber-400 shadow-sm"
                              : "bg-white text-teal-950 border-amber-200 hover:bg-amber-100/60"
                          }`}
                        >
                          <span className="text-base">📜</span>
                          <span>80G ತೆರಿಗೆ (80G Tax)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedNarrativeAngle("location_visit")}
                          className={`min-h-[48px] py-2 px-3 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center flex items-center justify-center gap-1.5 border shadow-2xs ${
                            selectedNarrativeAngle === "location_visit"
                              ? "bg-teal-950 text-gold border-teal-950 ring-2 ring-amber-400 shadow-sm"
                              : "bg-white text-teal-950 border-amber-200 hover:bg-amber-100/60"
                          }`}
                        >
                          <span className="text-base">📍</span>
                          <span>ಆಶ್ರಮ ನಕ್ಷೆ (Map &amp; Video)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedNarrativeAngle("provisions_inkind")}
                          className={`min-h-[48px] py-2 px-3 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center flex items-center justify-center gap-1.5 border shadow-2xs ${
                            selectedNarrativeAngle === "provisions_inkind"
                              ? "bg-amber-800 text-white border-amber-900 ring-2 ring-amber-400 shadow-sm"
                              : "bg-white text-teal-950 border-amber-200 hover:bg-amber-100/60"
                          }`}
                        >
                          <span className="text-base">🍚</span>
                          <span>ಅಕ್ಕಿ &amp; ದಿನಸಿ (Groceries)</span>
                        </button>
                      </div>
                    </div>

                    {/* ── STEP 4: OUTREACH LANGUAGE & SEVA TIER SELECTOR ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Language Selector */}
                      <div className="rounded-2xl bg-cream/70 border border-teal-900/15 p-3 flex flex-col justify-between gap-2">
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider flex items-center gap-1">
                          <span>🌐</span>
                          <span>ಸಂದೇಶ ಭಾಷೆ (Language):</span>
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("kanglish")}
                            className={`min-h-[40px] rounded-xl px-2 py-1.5 text-xs font-bold transition cursor-pointer text-center ${
                              preferredLanguage === "kanglish"
                                ? "bg-teal-950 text-white shadow-2xs font-black ring-1 ring-teal-950"
                                : "bg-white text-teal-950 border border-teal-900/15 hover:bg-sand"
                            }`}
                          >
                            🔤 ಕಂಗ್ಲಿಷ್ (Kanglish)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("kn")}
                            className={`min-h-[40px] rounded-xl px-2 py-1.5 text-xs font-bold transition cursor-pointer text-center ${
                              preferredLanguage === "kn"
                                ? "bg-teal-950 text-gold shadow-2xs font-black ring-2 ring-amber-400"
                                : "bg-white text-teal-950 border border-teal-900/15 hover:bg-sand"
                            }`}
                          >
                            🇮🇳 ಕನ್ನಡ (Pure)
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreferredLanguage("en")}
                            className={`min-h-[40px] rounded-xl px-2 py-1.5 text-xs font-bold transition cursor-pointer text-center ${
                              preferredLanguage === "en"
                                ? "bg-teal-950 text-white shadow-2xs font-black ring-1 ring-teal-950"
                                : "bg-white text-teal-950 border border-teal-900/15 hover:bg-sand"
                            }`}
                          >
                            🇬🇧 English
                          </button>
                        </div>
                      </div>

                      {/* Seva Tier Selector */}
                      <div className="rounded-2xl bg-sand/40 border border-teal-900/15 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider">
                            🎯 ಸೇವಾ ಮೊತ್ತ (Amount):
                          </span>
                          <span className="text-xs font-black text-emerald-800">
                            ಆಯ್ಕೆ: ₹{formatINR(selectedSevaAmount)}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {[
                            { amt: 501, label: "₹501" },
                            { amt: 1500, label: "₹1,500" },
                            { amt: 2500, label: "₹2,500" },
                            { amt: 4500, label: "₹4,500" },
                            { amt: 6000, label: "₹6,000" },
                          ].map((tier) => (
                            <button
                              key={tier.amt}
                              type="button"
                              onClick={() => setSelectedSevaAmount(tier.amt)}
                              className={`min-h-[38px] py-1 px-1 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${
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
                    </div>

                    {/* ── STEP 5: QUICK REASONS & NOTES (ಐಚ್ಛಿಕ - Optional) ── */}
                    {/* Reason Chips */}
                    <div className="rounded-2xl border border-teal-900/15 bg-sand/30 p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider flex items-center gap-1">
                          <span>🏷️</span>
                          <span>ಕರೆ ಕಾರಣ (Call Reason - ಎಲ್ಲರಿಗೂ ಕಾಣಿಸುತ್ತದೆ):</span>
                        </span>
                        {selectedDispositionReason && (
                          <button
                            type="button"
                            onClick={() => setSelectedDispositionReason("")}
                            className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
                          >
                            ✕ Clear Reason
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "💰 ಆರ್ಥಿಕ ಸಮಸ್ಯೆ (Financial constraint)",
                          "🏛️ ಆಶ್ರಮಕ್ಕೆ ನೇರ ಭೇಟಿ (Ashrama visit)",
                          "🏢 ಆಫೀಸ್‌ನಲ್ಲಿ ಬಿಜಿ (Busy in office)",
                          "⏳ ಸಂಜೆ ಕರೆ (Evening call)",
                          "📲 UPI QR ಕಳುಹಿಸಲಾಗಿದೆ (UPI QR sent)",
                          "📜 80G ರಶೀದಿ ಬೇಕು (Needs 80G)",
                          "👵 ವೃದ್ಧಾಶ್ರಮ ಸೇವೆ ಆಸಕ್ತಿ (Old age care)",
                          "❌ ತಪ್ಪು ನಂಬರ್ / ಸ್ವಿಚ್ಡ್ ಆಫ್ (Wrong No)",
                          "🙏 ಈ ತಿಂಗಳು ಸಾಧ್ಯವಿಲ್ಲ (Not this month)",
                        ].map((reasonItem) => {
                          const isPicked = selectedDispositionReason === reasonItem;
                          return (
                            <button
                              key={reasonItem}
                              type="button"
                              onClick={() => setSelectedDispositionReason(isPicked ? "" : reasonItem)}
                              className={`text-xs px-2.5 py-1 rounded-xl font-bold transition cursor-pointer border ${
                                isPicked
                                  ? "bg-teal-950 text-gold border-teal-950 shadow-xs ring-2 ring-amber-400"
                                  : "bg-white text-teal-950 border-teal-900/15 hover:bg-amber-50"
                              }`}
                            >
                              {isPicked ? "✓ " : ""}{reasonItem}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Note Chips & Custom Note Input */}
                    <div className="rounded-2xl border border-teal-900/15 bg-sand/20 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-teal-950 tracking-wider flex items-center gap-1.5">
                          <span>⚡</span>
                          <span>1-ಟ್ಯಾಪ್ ಟಿಪ್ಪಣಿಗಳು (Quick Note Chips):</span>
                        </span>
                        <span className="text-[10px] text-teal-950/60 font-semibold">
                          ಟ್ಯಾಪ್ ಮಾಡಿ ಸೇರಿಸಿ
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          isParentLead ? "👶 ತಂದೆ ಮಾತನಾಡಿದ್ದಾರೆ" : "👤 ದಾನಿ ಮಾತನಾಡಿದ್ದಾರೆ",
                          isParentLead ? "👩 ತಾಯಿ ಮಾತನಾಡಿದ್ದಾರೆ" : "🤝 ಒಪ್ಪಿದ್ದಾರೆ",
                          `🎂 ₹${formatINR(selectedSevaAmount)} ಅನ್ನದಾನಕ್ಕೆ ಒಪ್ಪಿದ್ದಾರೆ`,
                          "📲 WhatsApp QR ಕಳುಹಿಸಲಾಗಿದೆ",
                          "🏛️ ಆಶ್ರಮಕ್ಕೆ ಭೇಟಿ ನೀಡುತ್ತಾರೆ",
                          "📜 80G ರಶೀದಿ ಕೇಳಿದ್ದಾರೆ",
                          "🗣️ ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ",
                          "⏳ ಸಂಜೆ ಕರೆ ಮಾಡಿ",
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
                            className="text-xs bg-white hover:bg-amber-100/80 border border-teal-900/15 text-teal-950 px-2.5 py-1 rounded-xl font-bold transition cursor-pointer shadow-2xs"
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
                          placeholder={currentFocusLead.notes ? `ಪ್ರಸ್ತುತ: ${currentFocusLead.notes}` : "ಟಿಪ್ಪಣಿ ಬರೆಯಿರಿ ಅಥವಾ ಮೇಲಿನ ಚಿಪ್ಸ್ ಟ್ಯಾಪ್ ಮಾಡಿ..."}
                          className="flex-1 rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
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
                              showToast("✓ ಟಿಪ್ಪಣಿ ಉಳಿಸಲಾಗಿದೆ!");
                            } finally {
                              setSavingCardNote(false);
                            }
                          }}
                          className="rounded-xl bg-teal-950 text-gold hover:bg-teal-900 px-3.5 py-2 text-xs font-black shadow-xs cursor-pointer disabled:opacity-40 shrink-0"
                        >
                          {savingCardNote ? "Saving..." : "💾 ಸೇವ್ (Save)"}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setLoggedDonationUtr(val);
                  if (val.trim()) {
                    const check = validateIndianUtr(val);
                    setUtrValidationError(!check.isValid ? (check.error || "Invalid UTR") : "");
                  } else {
                    setUtrValidationError("");
                  }
                }}
                placeholder="e.g. 428910293847 (12 digits from GPay/PhonePe)"
                className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-teal-950 focus:ring-2 outline-none ${
                  utrValidationError ? "border-rose-500 focus:ring-rose-400 bg-rose-50/50" : "border-teal-900/20 focus:ring-amber-400"
                }`}
              />
              {utrValidationError ? (
                <p className="text-[11px] font-bold text-rose-700 mt-1">
                  ⚠️ {utrValidationError}
                </p>
              ) : (
                <p className="text-[10px] text-teal-950/60 mt-1">
                  Amount and attribution will immediately update your caller stats and revenue bar. Must be 12-digit UPI UTR.
                </p>
              )}
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

      {/* ── TODAY'S SHIFT ACTIVITY & SELF-CORRECTION (EDIT) DRAWER ── */}
      {showShiftDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs"
          onClick={() => setShowShiftDrawer(false)}
        >
          <div
            className="relative w-full max-w-2xl h-full bg-white shadow-2xl p-4 sm:p-6 overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-teal-950 flex items-center gap-2">
                  <span>📝 Today&apos;s Shift Activity</span>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                    {dailyLogs.length} calls
                  </span>
                </h3>
                <p className="text-xs text-teal-950/60 mt-0.5">
                  Review today&apos;s logged dispositions, correct typos, and verify donation claims.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowShiftDrawer(false)}
                className="text-teal-950/60 hover:text-teal-950 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="grid grid-cols-4 gap-2 bg-sand/30 p-2.5 rounded-2xl border border-teal-900/10 text-center text-xs">
              <div>
                <span className="block text-[10px] text-teal-950/60 font-bold uppercase">Total Calls</span>
                <span className="font-display font-black text-base text-teal-950">{dailyLogs.length}</span>
              </div>
              <div>
                <span className="block text-[10px] text-amber-900 font-bold uppercase">Interested</span>
                <span className="font-display font-black text-base text-amber-900">
                  {dailyLogs.filter((l) => l.disposition === "Interested").length}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-emerald-900 font-bold uppercase">Donated</span>
                <span className="font-display font-black text-base text-emerald-900">
                  {dailyLogs.filter((l) => l.disposition === "Donated").length}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-blue-900 font-bold uppercase">Callbacks</span>
                <span className="font-display font-black text-base text-blue-900">
                  {dailyLogs.filter((l) => l.disposition === "Reschedule").length}
                </span>
              </div>
            </div>

            {/* Shift Submission Status Banner */}
            {eodStatus?.isSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <div>
                    <p className="font-bold">Today&apos;s Shift Submitted to Supervisor</p>
                    <p className="text-[11px] text-emerald-800">Calls are finalized and locked for daily audit.</p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-300">
                  Locked
                </span>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏳</span>
                  <div>
                    <p className="font-bold">Shift in Progress (Editable)</p>
                    <p className="text-[11px] text-amber-800">You can correct any typos before end-of-day submission.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftDrawer(false);
                    setShowEodModal(true);
                  }}
                  className="rounded-xl bg-teal-950 text-gold px-3 py-1.5 font-bold text-xs shadow-xs hover:bg-teal-900 cursor-pointer"
                >
                  Submit Shift →
                </button>
              </div>
            )}

            {/* List of Today's Calls */}
            {loadingDailyLogs ? (
              <div className="p-8 text-center text-xs text-teal-950/60 bg-cream/40 rounded-2xl">
                Loading today&apos;s shift records...
              </div>
            ) : dailyLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-teal-950/60 bg-cream/40 rounded-2xl">
                No calls logged yet today. Dial numbers from your Calling Card to get started!
              </div>
            ) : (
              <div className="space-y-2.5">
                {dailyLogs.map((log: any) => {
                  const logTime = new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const isParent = log.stream === "PARENTS" || Boolean(log.parentName || log.childName);
                  const childDisp = cleanChildName(log);
                  const parentDisp = cleanParentName(log);

                  return (
                    <div
                      key={log.logId}
                      className="rounded-2xl border border-teal-900/10 bg-white p-3.5 shadow-xs space-y-2 hover:border-teal-900/20 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-teal-950">
                              {isParent ? `${childDisp} (${parentDisp})` : log.leadName}
                            </span>
                            <span className="text-[10px] font-mono text-teal-950/60 bg-sand/60 px-1.5 py-0.2 rounded">
                              {log.phone}
                            </span>
                          </div>
                          <span className="text-[10px] text-teal-950/50 block mt-0.5">
                            Logged at {logTime} {log.isEdited && <span className="text-amber-800 font-bold">· ✏️ Edited</span>}
                          </span>
                        </div>

                        {/* Disposition Pill */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              log.disposition === "Donated"
                                ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                : log.disposition === "Interested"
                                ? "bg-amber-100 text-amber-950 border border-amber-300"
                                : log.disposition === "Reschedule"
                                ? "bg-blue-100 text-blue-950 border border-blue-300"
                                : "bg-rose-100 text-rose-950 border border-rose-300"
                            }`}
                          >
                            {log.disposition}
                          </span>

                          {!eodStatus?.isSubmitted && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(log)}
                                className="text-xs font-bold text-teal-950 bg-sand/60 hover:bg-sand border border-teal-900/15 px-2 py-0.5 rounded-lg cursor-pointer"
                                title="Edit this entry"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Revert lead #${log.leadId} (${log.leadName}) back to fresh pending queue?`)) {
                                    void handleRevertToPending(log.leadId);
                                    void loadDailyLogs();
                                  }
                                }}
                                className="text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-lg cursor-pointer"
                                title="Revert to Pending"
                              >
                                ↩️ Revert
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Donation Info if Donated */}
                      {log.disposition === "Donated" && (
                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2 text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-emerald-950">
                              Claimed: ₹{formatINR(log.effectiveAmount)}
                            </span>
                            {log.utr && (
                              <span className="font-mono text-[10px] text-emerald-900/70 block">
                                UTR: {log.utr}
                              </span>
                            )}
                          </div>
                          <div>
                            {log.verificationStatus === "VERIFIED" ? (
                              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                ✓ Verified: ₹{formatINR(log.verifiedAmount || log.effectiveAmount)}
                              </span>
                            ) : log.verificationStatus === "REJECTED" ? (
                              <div className="text-right space-y-0.5">
                                <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full inline-block">
                                  ✕ Rejected by Admin
                                </span>
                                {log.rejectionReason && (
                                  <span className="block text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-left max-w-[210px] leading-tight">
                                    Reason: {log.rejectionReason}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold bg-amber-400 text-teal-950 px-2 py-0.5 rounded-full">
                                ⏳ Pending Admin Check
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes / Callback info */}
                      {log.notes && (
                        <p className="text-[11px] text-teal-950/70 bg-cream/30 p-2 rounded-lg italic">
                          &ldquo;{log.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT LOG MODAL ── */}
      {editingLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setEditingLog(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/15 text-teal-950 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <div>
                  <h3 className="font-display font-black text-base text-teal-950">
                    Edit Log: {editingLog.leadName}
                  </h3>
                  <p className="text-[11px] text-teal-950/60 font-mono">
                    {editingLog.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="text-teal-950/60 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Supervisor Rejection Alert Note */}
            {editingLog.rejectionReason && (
              <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-xl text-xs text-rose-950 font-bold space-y-0.5">
                <span className="text-rose-700 block text-[10px] uppercase font-black tracking-wider">
                  ⚠️ Supervisor Rejection Note:
                </span>
                <p className="font-semibold text-rose-900">{editingLog.rejectionReason}</p>
                <p className="text-[10px] text-rose-800/80">Please verify UTR or amount with the donor and save correction below.</p>
              </div>
            )}

            {/* Disposition Dropdown */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Call Disposition:
              </label>
              <select
                value={editDisposition}
                onChange={(e) => setEditDisposition(e.target.value)}
                className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-bold text-teal-950 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
              >
                <option value="Interested">Interested (ಒಪ್ಪಿದ್ದಾರೆ)</option>
                <option value="Donated">Donated (ದಾನ ಮಾಡಿದ್ದಾರೆ / ಪಾವತಿ)</option>
                <option value="Reschedule">Reschedule / Callback (ಮತ್ತೆ ಕರೆ)</option>
                <option value="No_Answer">No Answer / Busy (ಬಿಜಿ / ಕರೆ ಸ್ವೀಕರಿಸಿಲ್ಲ)</option>
                <option value="Rejected">Rejected (ನಿರಾಕರಿಸಿದ್ದಾರೆ)</option>
                <option value="Wrong_Number">Wrong / Invalid Number (ತಪ್ಪು ಸಂಖ್ಯೆ)</option>
                <option value="Pending">Pending (ಮತ್ತೆ ಕ್ಯೂಗೆ ಸೇರಿಸಿ)</option>
              </select>
            </div>

            {/* If Donated: Amount, Mode, UTR */}
            {editDisposition === "Donated" && (
              <div className="space-y-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    Correct Donation Amount (₹):
                  </label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Enter corrected amount in INR"
                    className="w-full rounded-xl border border-emerald-300 px-3 py-2 text-xs font-bold text-teal-950 bg-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-950 mb-1">
                      Payment Mode:
                    </label>
                    <select
                      value={editPaymentMode}
                      onChange={(e) => setEditPaymentMode(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 px-2 py-1.5 text-xs text-teal-950 bg-white outline-none"
                    >
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank_Transfer">Bank NEFT / IMPS</option>
                      <option value="QR">QR Scan</option>
                      <option value="Cash">Cash / In-Person</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-950 mb-1">
                      UTR / Ref No:
                    </label>
                    <input
                      type="text"
                      value={editUtr}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditUtr(val);
                        if (val.trim()) {
                          const check = validateIndianUtr(val);
                          setEditUtrError(!check.isValid ? (check.error || "Invalid UTR") : "");
                        } else {
                          setEditUtrError("");
                        }
                      }}
                      placeholder="e.g. 4289..."
                      className={`w-full rounded-xl border px-2 py-1.5 text-xs font-mono text-teal-950 bg-white outline-none ${
                        editUtrError ? "border-rose-500 bg-rose-50/50" : "border-emerald-300"
                      }`}
                    />
                    {editUtrError && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">
                        ⚠️ {editUtrError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Call Notes / Reason for Change:
              </label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Enter notes or correction explanation..."
                rows={3}
                className="w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-950 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="py-2.5 px-3 rounded-xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-gold font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {savingEdit ? "Saving..." : "Save Corrections"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── END OF DAY (EOD) SHIFT SUBMISSION MODAL ── */}
      {showEodModal && callerProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setShowEodModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/15 text-teal-950 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="font-display font-black text-base text-teal-950">
                    End-of-Day Shift Submission
                  </h3>
                  <p className="text-[11px] text-teal-950/60 font-mono">
                    {callerProfile.name} ({callerProfile.callerId})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEodModal(false)}
                className="text-teal-950/60 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Shift Metrics Review */}
            <div className="space-y-2 bg-sand/30 p-3.5 rounded-2xl border border-teal-900/10 text-xs">
              <p className="font-bold text-teal-950 mb-2">Today&apos;s Outreach Summary:</p>
              <div className="flex justify-between py-1 border-b border-teal-900/10">
                <span className="text-teal-950/70">Total Calls Logged Today:</span>
                <span className="font-black text-teal-950">{dailyLogs.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-teal-900/10">
                <span className="text-teal-950/70">Interested Donors:</span>
                <span className="font-black text-amber-900">
                  {dailyLogs.filter((l) => l.disposition === "Interested").length}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-teal-900/10">
                <span className="text-teal-950/70">Donations Claimed:</span>
                <span className="font-black text-emerald-900">
                  {dailyLogs.filter((l) => l.disposition === "Donated").length} donors (₹
                  {formatINR(
                    dailyLogs
                      .filter((l) => l.disposition === "Donated")
                      .reduce((sum, l) => sum + (l.effectiveAmount || 0), 0)
                  )}
                  )
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-teal-950/70">Callbacks Scheduled:</span>
                <span className="font-black text-blue-900">
                  {dailyLogs.filter((l) => l.disposition === "Reschedule").length}
                </span>
              </div>
            </div>

            {/* Optional Shift Notes */}
            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Shift Notes for Supervisor (Optional):
              </label>
              <textarea
                value={eodNotes}
                onChange={(e) => setEodNotes(e.target.value)}
                placeholder="E.g. Completed today's target; 4 donors requested follow-up tomorrow..."
                rows={2}
                className="w-full rounded-xl border border-teal-900/20 p-2 text-xs text-teal-950 bg-white outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Declaration Checkbox */}
            <label className="flex items-start gap-2 text-xs text-teal-950 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={eodDeclaration}
                onChange={(e) => setEodDeclaration(e.target.checked)}
                className="mt-0.5 rounded border-teal-900/30 text-teal-950 focus:ring-teal-950"
              />
              <span>
                I confirm that all call dispositions and donation amounts entered today are accurate and ready for supervisor review.
              </span>
            </label>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setShowEodModal(false)}
                className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEOD}
                disabled={submittingEod || !eodDeclaration}
                className="py-2.5 px-3 rounded-xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-gold font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {submittingEod ? "Submitting..." : "Confirm & Submit Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESPECTFUL CALLING HOURS ADVISORY MODAL (TRAI GUIDELINES) ── */}
      {nightCallLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-teal-900/20 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 border-b border-teal-900/10 pb-3">
              <span className="text-3xl">🌙</span>
              <div>
                <h3 className="font-display font-black text-base text-teal-950">
                  Calling Hours Advisory
                </h3>
                <p className="text-[10px] text-teal-950/60 font-semibold uppercase tracking-wider">
                  TRAI &amp; Telecom Anti-Harassment Rules
                </p>
              </div>
            </div>

            <p className="text-xs text-teal-950/80 leading-relaxed">
              Current Bengaluru time is{" "}
              <strong className="text-teal-950 font-mono">
                {new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })}
              </strong>
              . Standard courteous calling hours in India are <strong>9:30 AM – 7:30 PM</strong>. Calling late at night or early morning may disturb the donor.
            </p>

            <div className="bg-sand/30 p-2.5 rounded-xl border border-teal-900/10 text-xs">
              <p className="font-bold text-teal-950 truncate">
                Target: {nightCallLead.name}
              </p>
              <p className="font-mono text-teal-950/70 text-[11px]">
                {parseCustomerPhone(nightCallLead.phone).display}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setNightCallLead(null)}
                className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
              >
                Cancel / Dial Later
              </button>
              <button
                type="button"
                onClick={() => {
                  const lead = nightCallLead;
                  setNightCallLead(null);
                  executeDirectDial(lead);
                }}
                className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                Proceed &amp; Call Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPDATE CONFIRMATION & DATABASE STAMP ALERT BANNER ── */}
      {updateStampAlert && updateStampAlert.isOpen && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-fadeIn">
          <div className="rounded-2xl bg-teal-950 text-white p-4 shadow-2xl border-2 border-amber-400 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">💮</span>
                <div>
                  <h4 className="text-xs font-black text-amber-300 tracking-wide uppercase">
                    Data Stamped &amp; Saved in Database!
                  </h4>
                  <p className="text-[10px] text-white/70">
                    Committed to Server · {updateStampAlert.stampedAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpdateStampAlert(null)}
                className="text-white/60 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1">
              <p className="font-bold text-white truncate">
                Lead #{updateStampAlert.leadId}: {updateStampAlert.name}
              </p>
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold bg-amber-400 text-teal-950 px-2 py-0.5 rounded-md font-mono">
                  {updateStampAlert.disposition}
                </span>
                {updateStampAlert.amount && (
                  <span className="font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-md font-mono">
                    ₹{formatINR(updateStampAlert.amount)}
                  </span>
                )}
                <span className="text-white/70 text-[10px]">
                  Attributed to: <strong>{updateStampAlert.telecallerId}</strong>
                </span>
              </div>
              {updateStampAlert.note && (
                <p className="text-[10px] text-white/80 italic bg-white/10 p-1.5 rounded-lg truncate">
                  &quot;{updateStampAlert.note}&quot;
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                <span>✓</span> Auto-saved to shift log
              </span>
              <button
                type="button"
                onClick={() => setUpdateStampAlert(null)}
                className="text-[11px] font-black bg-amber-400 hover:bg-amber-300 text-teal-950 px-2.5 py-1 rounded-lg cursor-pointer transition shadow-2xs"
              >
                OK / Continue ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT CONTACT NUMBERS & ALTERNATE WHATSAPP MODAL (CASE 1) ── */}
      {editContactLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setEditContactLead(null)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-teal-900/15 text-teal-950 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <div>
                  <h3 className="font-display font-black text-base text-teal-950">
                    ಸಂಪರ್ಕ ಸಂಖ್ಯೆ ಬದಲಾವಣೆ (Edit Phone Numbers)
                  </h3>
                  <p className="text-[11px] text-teal-950/60 font-mono">
                    Lead #{editContactLead.leadId}: {editContactLead.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditContactLead(null)}
                className="text-teal-950/60 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 space-y-1">
              <p className="font-bold">💡 Case 1: WhatsApp ಬೇರೆ ಸಂಖ್ಯೆ ಹೊಂದಿದ್ದರೆ (Alternate WhatsApp)</p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                ದಾನಿಗಳು ಕರೆ ಸಂಖ್ಯೆಗಿಂತ ಬೇರೆ WhatsApp ಸಂಖ್ಯೆ ಬಳಸುತ್ತಿದ್ದರೆ ಇಲ್ಲಿ ನಮೂದಿಸಿ. 1-ಕ್ಲಿಕ್ WhatsApp ಮತ್ತು QR ಸಂದೇಶಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಆ ಸಂಖ್ಯೆಗೆ ತಲುಪುತ್ತವೆ.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editCallingPhone.trim()) {
                  alert("Calling phone number cannot be empty.");
                  return;
                }
                void handleSaveContactUpdate(editContactLead.leadId, {
                  phone: editCallingPhone.trim(),
                  whatsappPhone: editWhatsAppPhone.trim() || null,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  📞 Calling Phone Number (ಕರೆ ಮಾಡುವ ಸಂಖ್ಯೆ):
                </label>
                <input
                  type="text"
                  required
                  value={editCallingPhone}
                  onChange={(e) => setEditCallingPhone(e.target.value)}
                  placeholder="e.g. 9845012345"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-mono font-bold text-teal-950 bg-white focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  🟢 Alternate WhatsApp Number (WhatsApp ಬೇರೆ ಸಂಖ್ಯೆ - ಐಚ್ಛಿಕ):
                </label>
                <input
                  type="text"
                  value={editWhatsAppPhone}
                  onChange={(e) => setEditWhatsAppPhone(e.target.value)}
                  placeholder="e.g. 9880011223 (ಖಾಲಿ ಬಿಟ್ಟರೆ ಕರೆ ಸಂಖ್ಯೆಯೇ ಬಳಸಲಾಗುತ್ತದೆ)"
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-mono font-bold text-teal-950 bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                />
                <p className="text-[10px] text-teal-950/60 mt-1">
                  Leave blank if WhatsApp is on the same calling number.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => setEditContactLead(null)}
                  className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContact || !editCallingPhone.trim()}
                  className="py-2.5 px-3 rounded-xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-gold font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {savingContact ? "Saving..." : "💾 Save Numbers"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MOBILE STICKY BOTTOM NAVIGATION BAR (Thumb-friendly 1-Tap Navigation for Telecallers) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-teal-900/15 shadow-2xl px-2 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => {
            setViewMode("focus");
            scrollToCallingCard();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
            viewMode === "focus"
              ? "bg-teal-950 text-gold font-black shadow-xs ring-1 ring-amber-400/50"
              : "text-teal-950/70 hover:bg-sand/40"
          }`}
        >
          <span className="text-lg">⚡</span>
          <span className="text-[10px] font-bold">ಕಾರ್ಡ್ (Card)</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("queue")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
            viewMode === "queue"
              ? "bg-teal-950 text-white font-black shadow-xs ring-1 ring-teal-800"
              : "text-teal-950/70 hover:bg-sand/40"
          }`}
        >
          <span className="text-lg">📋</span>
          <span className="text-[10px] font-bold">ಕ್ಯೂ ({filteredLeads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowShiftDrawer(true);
            void loadDailyLogs();
          }}
          className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-teal-950/70 hover:bg-sand/40 transition cursor-pointer"
        >
          <span className="text-lg">📝</span>
          <span className="text-[10px] font-bold">ಕರೆಗಳು ({dailyLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (currentFocusLead) {
              handleOpenWhatsAppModal(currentFocusLead);
            } else {
              setIsAntiBanModalOpen(true);
            }
          }}
          className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
        >
          <span className="text-lg">💬</span>
          <span className="text-[10px] font-bold">ಮೆಸೇಜ್ (WA)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowEodModal(true);
            void loadDailyLogs();
            void loadEodStatus();
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition cursor-pointer ${
            eodStatus?.isSubmitted
              ? "bg-emerald-100 text-emerald-950 font-black border border-emerald-300"
              : "text-amber-900 hover:bg-amber-50"
          }`}
        >
          <span className="text-lg">{eodStatus?.isSubmitted ? "✅" : "📤"}</span>
          <span className="text-[10px] font-bold">ವರದಿ (EOD)</span>
        </button>
      </div>

      {/* ── 1-TAP DISPOSITION CONFIRMATION MODAL (Prevents accidental clicks & mobile scroll jumping) ── */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-teal-900/20 p-5 space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl p-2 rounded-2xl bg-amber-100 border border-amber-300 shadow-2xs">
                  {pendingConfirmation.icon}
                </span>
                <div>
                  <h3 id="confirm-dialog-title" className="font-display font-black text-base text-teal-950">
                    ಖಚಿತಪಡಿಸಿ (Confirm Action)
                  </h3>
                  <p className="text-xs text-teal-950/70 font-semibold">
                    ಫಲಿತಾಂಶ ದಾಖಲಿಸಿ ಮುಂದಿನ ಸಂಖ್ಯೆಗೆ ಹೋಗಿ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="text-teal-950/50 hover:text-teal-950 text-lg font-bold p-1 cursor-pointer"
                title="Cancel"
              >
                ✕
              </button>
            </div>

            {/* Lead & Disposition Details Card */}
            <div className="rounded-2xl bg-sand/30 border border-teal-900/15 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-950/60 uppercase">ದಾನಿ / ವ್ಯಕ್ತಿ (Lead):</span>
                <span className="font-black text-teal-950 text-sm">
                  {pendingConfirmation.leadName} (#{pendingConfirmation.leadId})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-950/60 uppercase">ಸಂಪರ್ಕ ಸಂಖ್ಯೆ (Phone):</span>
                <span className="font-mono font-bold text-teal-950">
                  +91 {pendingConfirmation.phone}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-teal-900/10">
                <span className="text-[11px] font-bold text-teal-950/60 uppercase">ಆಯ್ಕೆಮಾಡಿದ ಫಲಿತಾಂಶ:</span>
                <span className="inline-flex items-center gap-1 font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl text-xs border border-amber-300">
                  <span>{pendingConfirmation.icon}</span>
                  <span>{pendingConfirmation.labelKannada}</span>
                </span>
              </div>
              {pendingConfirmation.reason && (
                <div className="flex items-center justify-between pt-1 border-t border-teal-900/10">
                  <span className="text-[11px] font-bold text-teal-950/60 uppercase">ಕಾರಣ (Reason):</span>
                  <span className="font-bold text-teal-950 text-[11px]">
                    {pendingConfirmation.reason}
                  </span>
                </div>
              )}
              {pendingConfirmation.notes && (
                <div className="pt-1 border-t border-teal-900/10 text-[11px]">
                  <span className="font-bold text-teal-950/60 uppercase block">ಟಿಪ್ಪಣಿ (Note):</span>
                  <p className="font-semibold text-teal-950 italic mt-0.5 bg-white/70 p-1.5 rounded-lg border border-teal-900/10">
                    &ldquo;{pendingConfirmation.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Micro Safe Notice */}
            <p className="text-[11px] text-teal-950/70 text-center font-medium">
              ಖಚಿತಪಡಿಸಿದ ನಂತರ, ಈ ಡೇಟಾ ಉಳಿದು ಮುಂದಿನ ದಾನಿಯ ವಿವರಗಳು ತಕ್ಷಣವೇ ತೆರೆಯಲ್ಪಡುತ್ತವೆ.
            </p>

            {/* Action Buttons: 2 large touch-friendly buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="py-3.5 px-4 rounded-2xl border-2 border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm active:scale-98 transition cursor-pointer text-center"
              >
                ✕ ಬೇಡ / ರದ್ದು (Cancel)
              </button>
              <button
                type="button"
                onClick={async () => {
                  const toConfirm = pendingConfirmation;
                  setPendingConfirmation(null);
                  if (!toConfirm) return;
                  await handleFocusDisposition(
                    toConfirm.leadId,
                    toConfirm.disposition,
                    toConfirm.notes,
                    toConfirm.callbackTime,
                    toConfirm.reason
                  );
                  setCardNoteInput("");
                  setSelectedDispositionReason("");
                  scrollToCallingCard();
                }}
                className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-center ring-2 ring-emerald-400"
              >
                <span>✅ ಹೌದು, ಸೇವ್ ಮಾಡಿ</span>
                <span>▶</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
