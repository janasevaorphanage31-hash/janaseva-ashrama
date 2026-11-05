"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import type { TelecallerStats, CrmWhatsAppSettings, InfluencerStats } from "@/lib/antigravity-crm";
import { AntiBanWhatsAppModal } from "@/components/admin/AntiBanWhatsAppModal";
import { validateIndianMobile } from "@/lib/indian-phone-validator";
import {
  saveActiveUploadJob,
  getActiveUploadJob,
  clearActiveUploadJob,
  acquireWakeLock,
  releaseWakeLock,
  type PersistedUploadJob,
} from "@/lib/upload-manager";

export function AdminTelecallerCRM() {
  const [loading, setLoading] = useState(true);
  const [callers, setCallers] = useState<TelecallerStats[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [streamCounts, setStreamCounts] = useState<{ DIRECT_DONOR: number; PARENTS: number }>({ DIRECT_DONOR: 0, PARENTS: 0 });

  // Bulk Reassignment State
  const [selectedCallerForLeads, setSelectedCallerForLeads] = useState<string>("ALL");
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [targetCallerId, setTargetCallerId] = useState<string>("TC01");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [leadStreamFilter, setLeadStreamFilter] = useState<"ALL" | "PARENTS" | "DIRECT_DONOR">("ALL");
  const [leadDateSort, setLeadDateSort] = useState<
    "birthday_upcoming" | "birthday_calendar" | "date_newest" | "date_oldest" | "callback_earliest"
  >("birthday_upcoming");

  // Notifications & Loaders
  const [toastMessage, setToastMessage] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Virtual Client Pagination (Prevents DOM overload and browser freezes)
  const [leadsPage, setLeadsPage] = useState<number>(1);
  const [leadsPerPage, setLeadsPerPage] = useState<number>(50);

  // Wipe All Leads & Reset Daily Queue Modals
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [isResetDailyModalOpen, setIsResetDailyModalOpen] = useState<boolean>(false);
  const [resetDistributionMode, setResetDistributionMode] = useState<"balanced" | "round_robin">("balanced");

  // 1. Add Telecaller Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addCallerForm, setAddCallerForm] = useState({
    callerId: "",
    name: "",
    whatsappNumber: "",
    email: "",
    password: "ashrama@123",
    dailyQuota: 50,
  });

  // 2. Delete Telecaller Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [callerToDelete, setCallerToDelete] = useState<TelecallerStats | null>(null);
  const [redistributeOnDelete, setRedistributeOnDelete] = useState(true);

  // 3. Bulk Lead Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadStream, setUploadStream] = useState<"PARENTS" | "DIRECT_DONOR">("PARENTS");
  const [uploadMode, setUploadMode] = useState<"paste" | "file">("paste");
  const [pastedText, setPastedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedLeads, setParsedLeads] = useState<
    Array<{
      stream?: "PARENTS" | "DIRECT_DONOR";
      name: string;
      parentName?: string;
      childName?: string;
      phone: string;
      dobDay: number;
      dobMonth: number;
      email?: string;
    }>
  >([]);
  const [parsedJunkCount, setParsedJunkCount] = useState<number>(0);
  const [activeResumableJob, setActiveResumableJob] = useState<PersistedUploadJob | null>(null);
  const [autoDistributeOnUpload, setAutoDistributeOnUpload] = useState(true);
  const [distributionMode, setDistributionMode] = useState<"balanced" | "round_robin">("balanced");
  const [uploadProgress, setUploadProgress] = useState<{
    inProgress: boolean;
    currentChunk: number;
    totalChunks: number;
    processedLeads: number;
    totalLeads: number;
    percent: number;
    stage: "uploading" | "distributing" | "done" | "error";
    statusMessage: string;
    insertedTotal: number;
    duplicatesTotal: number;
    enrichedTotal?: number;
    junkTotal?: number;
  } | null>(null);

  // 3b. Batch Rollback & In-Flight Cancel States
  const cancelRequestedRef = useRef(false);
  const currentUploadBatchIdRef = useRef<string | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancellingUpload, setCancellingUpload] = useState(false);
  const [isRollbackModalOpen, setIsRollbackModalOpen] = useState(false);
  const [recentBatches, setRecentBatches] = useState<Array<{
    batchId: string;
    totalCount: number;
    pendingCount: number;
    contactedCount: number;
    latestLeadId: number;
    createdAt: string;
  }>>([]);
  const [selectedBatchForRollback, setSelectedBatchForRollback] = useState<string>("");
  const [rollingBackBatch, setRollingBackBatch] = useState(false);

  // 4. Export & Maintenance Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  // 5. Telecaller Credentials & Access Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedCallerForAccess, setSelectedCallerForAccess] = useState<TelecallerStats | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  // 6. CRM Central WhatsApp Settings
  const [crmSettings, setCrmSettings] = useState<CrmWhatsAppSettings>({
    masterWhatsAppNumber: "+91 99803 59595",
    senderMode: "central",
    defaultLanguage: "en",
    defaultAngle: "annadana",
    enableAntiBan: true,
  });
  const [savingCrmSettings, setSavingCrmSettings] = useState(false);

  // 7. Edit Telecaller Details Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCaller, setEditingCaller] = useState<TelecallerStats | null>(null);
  const [editCallerForm, setEditCallerForm] = useState({
    name: "",
    whatsappNumber: "",
    email: "",
    dailyQuota: 50,
    isActive: true,
  });

  // 8. Anti-Ban WhatsApp Modal in Admin CRM
  const [isAntiBanModalOpen, setIsAntiBanModalOpen] = useState(false);
  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<any | null>(null);

  // ── SUB-TABS: STAFF TELECALLERS vs FINANCIAL CRM vs INSTAGRAM INFLUENCERS ──
  const [activeSubtab, setActiveSubtab] = useState<"callers" | "financials" | "influencers">("callers");
  const [influencers, setInfluencers] = useState<InfluencerStats[]>([]);
  const [totalInfluencerRaised, setTotalInfluencerRaised] = useState(0);
  const [totalInfluencerDonors, setTotalInfluencerDonors] = useState(0);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);

  // Financial CRM & Approvals state
  const [finStats, setFinStats] = useState<any | null>(null);
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [adjustingDonation, setAdjustingDonation] = useState<any | null>(null);
  const [adjustedAmountInput, setAdjustedAmountInput] = useState<number | "">("");
  const [adjustNoteInput, setAdjustNoteInput] = useState("");
  const [rejectingDonation, setRejectingDonation] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedCallerForLedger, setSelectedCallerForLedger] = useState<any | null>(null);
  const [callerLedgerLogs, setCallerLedgerLogs] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Add / Edit Influencer Modal State
  const [isInfluencerModalOpen, setIsInfluencerModalOpen] = useState(false);
  const [influencerForm, setInfluencerForm] = useState({
    influencerCode: "",
    displayName: "",
    instagramHandle: "",
    whatsappNumber: "",
    targetGoalAmount: 50000,
    campaignStory: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 5000);
  };

  const loadLeadsForReassignment = async (callerId: string) => {
    try {
      const res = await fetch(`/api/v1/leads/assigned?callerId=${callerId}`);
      const data = await res.json();
      if (data.success) {
        setLeadsList(data.leads || []);
      }
    } catch {}
  };

  const loadInfluencers = async () => {
    setLoadingInfluencers(true);
    try {
      const res = await fetch("/api/v1/admin/influencers");
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success && data.influencers) {
          setInfluencers(data.influencers);
          setTotalInfluencerRaised(data.totalFundsRaised || 0);
          setTotalInfluencerDonors(data.totalDonors || 0);
        }
      }
    } catch (err: any) {
      console.error("Error loading influencers:", err);
    } finally {
      setLoadingInfluencers(false);
    }
  };

  const handleOpenAddInfluencer = () => {
    setInfluencerForm({
      influencerCode: "",
      displayName: "",
      instagramHandle: "",
      whatsappNumber: "",
      targetGoalAmount: 50000,
      campaignStory: "",
    });
    setIsInfluencerModalOpen(true);
  };

  const handleSaveInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!influencerForm.displayName.trim()) return showToast("⚠️ Please enter the influencer display name.");
    if (!influencerForm.influencerCode.trim()) return showToast("⚠️ Please enter a custom referral code (e.g. ROHIT_FIT).");
    if (influencerForm.whatsappNumber.replace(/\D/g, "").length < 10) {
      return showToast("⚠️ Please enter a valid 10-digit WhatsApp number.");
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_or_update",
          influencerCode: influencerForm.influencerCode.trim().toUpperCase(),
          displayName: influencerForm.displayName.trim(),
          instagramHandle: influencerForm.instagramHandle.trim(),
          whatsappNumber: influencerForm.whatsappNumber.replace(/\D/g, "").slice(-10),
          targetGoalAmount: Number(influencerForm.targetGoalAmount || 50000),
          campaignStory: influencerForm.campaignStory.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save influencer");

      showToast(`✓ ${data.message}`);
      setInfluencers(data.influencers || []);
      setTotalInfluencerRaised(data.totalFundsRaised || 0);
      setTotalInfluencerDonors(data.totalDonors || 0);
      setIsInfluencerModalOpen(false);
    } catch (err: any) {
      showToast("❌ Error saving influencer: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleInfluencerStatus = async (code: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/influencers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_status",
          influencerCode: code,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to toggle status");
      showToast(`✓ ${data.message}`);
      setInfluencers(data.influencers || []);
    } catch (err: any) {
      showToast("Error updating status: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label} to clipboard!`);
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers");
      const data = await res.json();
      if (data.success) {
        setCallers(data.callers || []);
        setTotalLeads(data.totalLeads || 0);
        setTotalDonations(data.totalDonations || 0);
        setTotalRevenue(data.totalRevenue || 0);
        if (data.streamCounts) {
          setStreamCounts(data.streamCounts);
        }

        if (data.crmWhatsAppSettings) {
          setCrmSettings(data.crmWhatsAppSettings);
        }

        // Pre-fill targetCallerId if valid
        if (data.callers && data.callers.length > 0) {
          const firstActive = data.callers.find((c: TelecallerStats) => c.isActive) || data.callers[0];
          setTargetCallerId(firstActive.callerId);
        }
      }
      await Promise.all([
        loadLeadsForReassignment(selectedCallerForLeads || "ALL"),
        loadInfluencers(),
        loadFinancialData(),
      ]);
    } catch (err: any) {
      showToast("Error loading telecaller CRM data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialData = async () => {
    setLoadingFinancials(true);
    try {
      const res = await fetch("/api/v1/admin/financial-crm");
      const data = await res.json();
      if (data.success) {
        setFinStats(data);
      }
    } catch (e: any) {
      console.error("Failed to load financial CRM data:", e);
    } finally {
      setLoadingFinancials(false);
    }
  };

  const handleApproveDonation = async (txnId: string) => {
    setActionInProgress(txnId);
    try {
      const res = await fetch("/api/v1/admin/donations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txnId, action: "APPROVE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approval failed");
      showToast("✓ Donation approved and credited to verified collections!");
      await loadFinancialData();
      await loadAdminData();
    } catch (e: any) {
      showToast("❌ Error approving donation: " + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmAdjustDonation = async () => {
    if (!adjustingDonation) return;
    setActionInProgress(adjustingDonation.txnId);
    try {
      const res = await fetch("/api/v1/admin/donations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnId: adjustingDonation.txnId,
          action: "ADJUST",
          verifiedAmount: Number(adjustedAmountInput),
          adminNotes: adjustNoteInput || "Adjusted against bank statement",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adjustment failed");
      showToast("✓ Donation adjusted & verified successfully!");
      setAdjustingDonation(null);
      await loadFinancialData();
      await loadAdminData();
    } catch (e: any) {
      showToast("❌ Error adjusting donation: " + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleConfirmRejectDonation = async () => {
    if (!rejectingDonation) return;
    setActionInProgress(rejectingDonation.txnId);
    try {
      const res = await fetch("/api/v1/admin/donations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txnId: rejectingDonation.txnId,
          action: "REJECT",
          rejectionReason: rejectionReasonInput || "No payment received in bank statement",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rejection failed");
      showToast("✓ Donation claim marked as rejected.");
      setRejectingDonation(null);
      await loadFinancialData();
      await loadAdminData();
    } catch (e: any) {
      showToast("❌ Error rejecting donation: " + e.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnlockCallerShift = async (callerId: string) => {
    const confirmed = window.confirm(`Unlock today's shift for ${callerId}? This will allow the telecaller to edit today's call logs again.`);
    if (!confirmed) return;
    try {
      const res = await fetch("/api/v1/admin/shifts/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unlock failed");
      showToast(`✓ Shift unlocked for ${callerId}`);
      await loadFinancialData();
    } catch (e: any) {
      showToast("❌ Error unlocking shift: " + e.message);
    }
  };

  const handleViewCallerLedger = async (caller: any) => {
    setSelectedCallerForLedger(caller);
    setLoadingLedger(true);
    try {
      const res = await fetch(`/api/v1/telecaller/daily-logs?callerId=${encodeURIComponent(caller.callerId)}`);
      const data = await res.json();
      if (data.success) {
        setCallerLedgerLogs(data.logs || []);
      }
    } catch (e: any) {
      console.error("Failed to load caller ledger:", e);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadAdminData();
      void getActiveUploadJob().then((savedJob) => {
        if (
          savedJob &&
          (savedJob.status === "in_progress" || savedJob.status === "paused") &&
          savedJob.currentChunk < savedJob.totalChunks
        ) {
          setActiveResumableJob(savedJob);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── ADD TELECALLER ──
  const handleOpenAddModal = () => {
    // Auto calculate next sequential ID e.g. TC16
    const numbers = callers
      .map((c) => parseInt(c.callerId.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    const suggestedId = `TC${String(nextNum).padStart(2, "0")}`;

    setAddCallerForm({
      callerId: suggestedId,
      name: "",
      whatsappNumber: "",
      email: `${suggestedId.toLowerCase()}@janaseva.org`,
      password: "ashrama@123",
      dailyQuota: 50,
    });
    setIsAddModalOpen(true);
  };

  const handleCreateTelecaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCallerForm.name.trim()) return showToast("⚠️ Please enter the telecaller full name.");
    if (addCallerForm.whatsappNumber.replace(/\D/g, "").length < 10) {
      return showToast("⚠️ Please enter a valid 10-digit WhatsApp phone number.");
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_caller",
          callerId: addCallerForm.callerId.trim().toUpperCase(),
          name: addCallerForm.name.trim(),
          whatsappNumber: addCallerForm.whatsappNumber.replace(/\D/g, "").slice(-10),
          email: addCallerForm.email.trim(),
          password: addCallerForm.password,
          dailyQuota: Number(addCallerForm.dailyQuota) || 50,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create telecaller");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast("❌ Error adding telecaller: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── DELETE TELECALLER ──
  const handlePromptDelete = (caller: TelecallerStats) => {
    setCallerToDelete(caller);
    setRedistributeOnDelete(true);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!callerToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_caller",
          callerId: callerToDelete.callerId,
          redistributeLeads: redistributeOnDelete,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete telecaller");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
      setTotalLeads(data.totalLeads || 0);
      setIsDeleteModalOpen(false);
      setCallerToDelete(null);
    } catch (err: any) {
      showToast("❌ Error deleting telecaller: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── TOGGLE ACTIVE STATUS ──
  const handleToggleActive = async (callerId: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_active",
          callerId,
          isActive: !currentStatus,
          redistributeLeads: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update caller status");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
    } catch (err: any) {
      showToast("Status change failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── TOGGLE ATTENDANCE (WORKING TODAY VS ABSENT TODAY) ──
  const handleToggleAttendance = async (callerId: string, currentWorkingStatus?: boolean) => {
    setActionLoading(true);
    const newStatus = !(currentWorkingStatus ?? true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_attendance",
          callerId,
          isWorkingToday: newStatus,
          reallocateLeads: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update attendance status");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
    } catch (err: any) {
      showToast("Attendance update failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── REALLOCATE ABSENTEE T+1 ADVANCE LEADS TO PRESENT FLOOR CALLERS ──
  const handleReallocateAbsenteeAdvance = async () => {
    if (!confirm("Harvest time-critical T+1 (Tomorrow) and T+2 leads from absent/paused callers and distribute them equally among callers working on the floor today?")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reallocate_absentee_advance",
          includeT2: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to reallocate advance leads");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
    } catch (err: any) {
      showToast("Reallocation failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── UNIVERSAL SPREADSHEET & CSV PARSING ENGINE ──
  const MONTH_MAP: Record<string, number> = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
    apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
    aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10,
    october: 10, nov: 11, november: 11, dec: 12, december: 12,
  };

  const normalizePhoneNumber = (raw: any): string => {
    if (raw == null) return "";
    let str = String(raw).trim();
    if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
      try {
        const num = Number(str);
        if (!isNaN(num)) {
          str = BigInt(Math.round(num)).toString();
        }
      } catch {}
    }
    const digits = str.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    if (digits.length >= 10) return digits.slice(-10);
    return "";
  };

  const parseBirthdayCell = (
    val: any,
    defaultDay: number,
    defaultMonth: number
  ): { day: number; month: number } => {
    if (val == null) return { day: defaultDay, month: defaultMonth };
    if (typeof val === "number" && val > 100 && val < 60000) {
      try {
        const parsed = (XLSX.SSF as any)?.parse_date_code?.(val);
        if (parsed && parsed.d && parsed.m) {
          return { day: parsed.d, month: parsed.m };
        }
      } catch {}
    }

    const str = String(val).trim();
    if (!str) return { day: defaultDay, month: defaultMonth };

    const monthMatch = str.match(
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i
    );
    if (monthMatch) {
      const mName = monthMatch[1].toLowerCase();
      const m = MONTH_MAP[mName] || defaultMonth;
      const dayMatch = str.match(/\b([0-2]?[0-9]|3[01])\b/);
      const d = dayMatch ? parseInt(dayMatch[1], 10) : defaultDay;
      return { day: d >= 1 && d <= 31 ? d : defaultDay, month: m };
    }

    const parts = str
      .split(/[-/.\s]+/)
      .map((p) => parseInt(p, 10))
      .filter((n) => !isNaN(n));
    if (parts.length >= 2) {
      if (parts[0] > 31) {
        // YYYY-MM-DD
        const m = parts[1];
        const d = parts[2] || defaultDay;
        return {
          day: d >= 1 && d <= 31 ? d : defaultDay,
          month: m >= 1 && m <= 12 ? m : defaultMonth,
        };
      } else {
        // DD/MM/YYYY or MM/DD/YYYY
        let d = parts[0];
        let m = parts[1];
        if (m > 12 && d <= 12) {
          const temp = d;
          d = m;
          m = temp;
        } else if (d === defaultMonth && m <= 31 && d !== m) {
          const temp = d;
          d = m;
          m = temp;
        }
        return {
          day: d >= 1 && d <= 31 ? d : defaultDay,
          month: m >= 1 && m <= 12 ? m : defaultMonth,
        };
      }
    }

    return { day: defaultDay, month: defaultMonth };
  };

  const parse2DGrid = (grid: any[][], streamOverride?: "PARENTS" | "DIRECT_DONOR") => {
    if (!grid || grid.length === 0) {
      setParsedLeads([]);
      setParsedJunkCount(0);
      return;
    }

    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;
    let junkCount = 0;

    // ── FAST PATH: Detect known exact Excel formats and skip fuzzy header scan ──
    const headerRow0 = (grid[0] || []).map((c: any) => String(c || "").trim());

    // DIRECT DONOR FORMAT: ["Name", "Mobile No.", "Date of Birth ", "", "", ""]
    // Layout: 2 donors per row — cols 0,1,2 = person 1; cols 3,4,5 = person 2
    const isDirectDonorPairedFormat =
      headerRow0.length >= 3 &&
      /^name$/i.test(headerRow0[0]) &&
      /mobile/i.test(headerRow0[1]) &&
      /date.{0,5}birth/i.test(headerRow0[2]) &&
      (headerRow0[3] === "" || headerRow0[3] === undefined || /^name$/i.test(headerRow0[3]));

    if (isDirectDonorPairedFormat) {
      // Paired-column Direct Donor ingestion — emit 2 leads per data row
      const leads: Array<{
        stream: "DIRECT_DONOR";
        name: string;
        phone: string;
        dobDay: number;
        dobMonth: number;
        email?: string;
      }> = [];

      for (let r = 1; r < grid.length; r++) {
        const cells = grid[r] || [];
        // Person 1: cols 0, 1, 2
        const p1Name = String(cells[0] || "").trim();
        const p1Check = validateIndianMobile(cells[1]);
        const p1Dob = parseBirthdayCell(cells[2], curDay, curMonth);
        if (p1Check.isValid && p1Name) {
          leads.push({ stream: "DIRECT_DONOR", name: p1Name, phone: p1Check.phone10, dobDay: p1Dob.day, dobMonth: p1Dob.month });
        } else if (p1Name && cells[1]) {
          junkCount++;
        }
        // Person 2: cols 3, 4, 5 (if present)
        if (cells.length > 3) {
          const p2Name = String(cells[3] || "").trim();
          const p2Check = validateIndianMobile(cells[4]);
          const p2Dob = parseBirthdayCell(cells[5], curDay, curMonth);
          if (p2Check.isValid && p2Name) {
            leads.push({ stream: "DIRECT_DONOR", name: p2Name, phone: p2Check.phone10, dobDay: p2Dob.day, dobMonth: p2Dob.month });
          } else if (p2Name && cells[4]) {
            junkCount++;
          }
        }
      }
      setParsedLeads(leads);
      setParsedJunkCount(junkCount);
      return;
    }

    // PARENTS FORMAT: ["STUDENT NAME", "FATHER NAME", "MOTHER NAME", "MOBILE", "DOB"]
    const isParentsExactFormat =
      headerRow0.length >= 4 &&
      /student.{0,4}name/i.test(headerRow0[0]) &&
      /father.{0,4}name/i.test(headerRow0[1]) &&
      /mobile|phone/i.test(headerRow0[3]);

    if (isParentsExactFormat) {
      const leads: Array<{
        stream: "PARENTS";
        name: string;
        childName: string;
        parentName: string;
        phone: string;
        dobDay: number;
        dobMonth: number;
      }> = [];

      for (let r = 1; r < grid.length; r++) {
        const cells = grid[r] || [];
        const studentName = String(cells[0] || "").trim();
        const fatherName = String(cells[1] || "").trim();
        const motherName = String(cells[2] || "").trim();
        const pCheck = validateIndianMobile(cells[3]);
        const dob = parseBirthdayCell(cells[4], curDay, curMonth);

        if (!pCheck.isValid) {
          if (cells[3]) junkCount++;
          continue;
        }

        // Primary parent = father if available, else mother
        const primaryParent = fatherName || motherName || "Parent";
        // Display name: "StudentName (FatherName)"
        const displayName = studentName
          ? primaryParent && primaryParent !== "Parent"
            ? `${studentName} (${primaryParent})`
            : `${studentName} (ಮಗು)`
          : primaryParent;

        leads.push({
          stream: "PARENTS",
          name: displayName,
          childName: studentName,
          parentName: primaryParent,
          phone: pCheck.phone10,
          dobDay: dob.day,
          dobMonth: dob.month,
        });
      }
      setParsedLeads(leads);
      setParsedJunkCount(junkCount);
      return;
    }

    // ── GENERAL FUZZY PATH (CSV paste / other formats) ──

    // Multi-row header detection: scan up to the first 6 rows for donor/name/phone/dob columns
    let headerRowIdx = -1;
    let nameCol = -1;
    let parentCol = -1;
    let childCol = -1;
    let phoneCol = -1;
    let dayCol = -1;
    let monthCol = -1;
    let emailCol = -1;
    let dateCol = -1;

    const maxHeaderScan = Math.min(grid.length, 6);
    for (let r = 0; r < maxHeaderScan; r++) {
      const row = grid[r] || [];
      let tempNameCol = -1;
      let tempParentCol = -1;
      let tempChildCol = -1;
      let tempPhoneCol = -1;
      let tempDayCol = -1;
      let tempMonthCol = -1;
      let tempEmailCol = -1;
      let tempDateCol = -1;

      row.forEach((cellVal: any, colIdx: number) => {
        const raw = String(cellVal || "").toLowerCase().trim();
        const h = raw.replace(/[^a-z0-9]/g, "");

        if (
          h.includes("child") ||
          h.includes("student") ||
          h.includes("pupil") ||
          h.includes("kid") ||
          h.includes("baby") ||
          h.includes("son") ||
          h.includes("daughter") ||
          h.includes("ward") ||
          h.includes("makkal") ||
          h.includes("magu") ||
          h.includes("vidyarth") ||
          h.includes("studname") ||
          h.includes("stdname") ||
          h.includes("candidate") ||
          h.includes("scholar") ||
          h.includes("applicant")
        ) {
          tempChildCol = colIdx;
        } else if (
          h.includes("parent") ||
          h.includes("father") ||
          h.includes("mother") ||
          h.includes("guardian") ||
          h.includes("poshak")
        ) {
          tempParentCol = colIdx;
        } else if (h.includes("name") || h.includes("donor") || h.includes("person") || h.includes("contactname") || h.includes("leadname")) {
          if (!h.includes("id")) tempNameCol = colIdx;
        } else if (h === "lead" || h === "donors" || h === "contacts") {
          tempNameCol = colIdx;
        }

        if (
          h.includes("phone") ||
          h.includes("mobile") ||
          h.includes("whatsapp") ||
          h.includes("contact") ||
          h.includes("cell") ||
          h.includes("tel") ||
          h.includes("number")
        ) {
          if (!h.includes("date") && !h.includes("time") && !h.includes("id")) {
            tempPhoneCol = colIdx;
          }
        }

        if (h.includes("month")) {
          tempMonthCol = colIdx;
        }

        if (h.includes("dobday") || h.includes("birthdayday") || ((h.includes("day") || raw.includes("ದಿನ")) && !h.includes("birth") && !h.includes("month"))) {
          tempDayCol = colIdx;
        }

        if (h.includes("email") || h.includes("mail")) {
          tempEmailCol = colIdx;
        }

        const isKannadaBirthday = raw.includes("ಹುಟ್ಟುಹಬ್ಬ") || raw.includes("ದಿನಾಂಕ");
        if (
          (h.includes("birthday") || h.includes("dob") || h.includes("birthdate") || h.includes("dateofbirth") || h.includes("bday") || h.includes("bdate") || h === "date" || isKannadaBirthday) &&
          !h.includes("dobday") &&
          !h.includes("dobmonth")
        ) {
          tempDateCol = colIdx;
        }
      });

      // Smart Column Disambiguation:
      // If there is a parent column (e.g. Father Name) and a generic name column, the generic name column IS the student!
      if (tempChildCol === -1 && tempNameCol !== -1 && tempParentCol !== -1) {
        tempChildCol = tempNameCol;
        tempNameCol = -1;
      } else if (
        streamOverride !== "DIRECT_DONOR" &&
        uploadStream === "PARENTS" &&
        tempChildCol === -1 &&
        tempNameCol !== -1 &&
        tempParentCol === -1
      ) {
        tempChildCol = tempNameCol;
      }

      if (tempPhoneCol !== -1 || (tempNameCol !== -1 && tempDateCol !== -1)) {
        headerRowIdx = r;
        nameCol = tempNameCol;
        parentCol = tempParentCol;
        childCol = tempChildCol;
        phoneCol = tempPhoneCol;
        dayCol = tempDayCol;
        monthCol = tempMonthCol;
        emailCol = tempEmailCol;
        dateCol = tempDateCol;
        break;
      }
    }

    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    const leads: Array<{
      stream?: "PARENTS" | "DIRECT_DONOR";
      name: string;
      parentName?: string;
      childName?: string;
      phone: string;
      dobDay: number;
      dobMonth: number;
      email?: string;
    }> = [];

    for (let r = startRow; r < grid.length; r++) {
      const cells = grid[r] || [];
      if (cells.length === 0 || cells.every((c) => c === "" || c == null)) continue;

      let leadName = "";
      let leadParentName = "";
      let leadChildName = "";
      let leadPhone = "";
      let leadDay = curDay;
      let leadMonth = curMonth;
      let leadEmail: string | undefined = undefined;

      if (headerRowIdx !== -1 && phoneCol !== -1) {
        leadPhone = normalizePhoneNumber(cells[phoneCol]);
        if (nameCol !== -1 && cells[nameCol] != null) {
          leadName = String(cells[nameCol]).trim();
        }
        if (parentCol !== -1 && cells[parentCol] != null) {
          leadParentName = String(cells[parentCol]).trim();
        }
        if (childCol !== -1 && cells[childCol] != null) {
          leadChildName = String(cells[childCol]).trim();
        }

        if (dateCol !== -1 && cells[dateCol] != null) {
          const parsedDate = parseBirthdayCell(cells[dateCol], curDay, curMonth);
          leadDay = parsedDate.day;
          leadMonth = parsedDate.month;
        } else {
          if (dayCol !== -1 && cells[dayCol] != null) {
            const d = parseInt(String(cells[dayCol]), 10);
            if (!isNaN(d) && d >= 1 && d <= 31) leadDay = d;
          }
          if (monthCol !== -1 && cells[monthCol] != null) {
            const rawM = String(cells[monthCol]).trim().toLowerCase();
            if (MONTH_MAP[rawM]) {
              leadMonth = MONTH_MAP[rawM];
            } else {
              const m = parseInt(rawM, 10);
              if (!isNaN(m) && m >= 1 && m <= 12) leadMonth = m;
            }
          }
        }

        if (emailCol !== -1 && cells[emailCol] != null) {
          const em = String(cells[emailCol]).trim();
          if (em.includes("@")) leadEmail = em;
        }
      }

      // If phone wasn't detected by header, do dynamic cell scan across the row
      if (!leadPhone || leadPhone.length < 10) {
        let phoneIdx = -1;
        for (let c = 0; c < cells.length; c++) {
          const p = normalizePhoneNumber(cells[c]);
          if (p.length === 10) {
            leadPhone = p;
            phoneIdx = c;
            break;
          }
        }

        if (!leadPhone || phoneIdx === -1) continue;

        for (let c = 0; c < cells.length; c++) {
          if (c === phoneIdx) continue;
          const val = cells[c];
          if (val == null) continue;
          const s = String(val).trim();
          if (!s) continue;

          if (s.includes("@") && !leadEmail) {
            leadEmail = s;
            continue;
          }

          if (/[a-zA-Z]/.test(s) && !/^\d+$/.test(s) && !leadName) {
            leadName = s;
            continue;
          }

          const parsedD = parseBirthdayCell(s, leadDay, leadMonth);
          if (parsedD.day !== curDay || parsedD.month !== curMonth) {
            leadDay = parsedD.day;
            leadMonth = parsedD.month;
          }
        }
      }

      // Auto-detect parents stream if child/student or parent column is found, unless uploadStream is explicitly DIRECT_DONOR
      const hasParentOrChildCol = childCol !== -1 || parentCol !== -1;
      const effectiveUploadStream = streamOverride || uploadStream;
      const isParentsStream = effectiveUploadStream === "DIRECT_DONOR"
        ? false
        : (effectiveUploadStream === "PARENTS" ? true : hasParentOrChildCol);
      const activeStream: "PARENTS" | "DIRECT_DONOR" = isParentsStream ? "PARENTS" : "DIRECT_DONOR";

      // Smart resolution of student/child name and parent name
      let resolvedChild = leadChildName ? leadChildName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim() : "";
      let resolvedParent = leadParentName ? leadParentName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim() : "";

      if (isParentsStream) {
        if (!resolvedChild && leadName && leadParentName) {
          // If we have leadName and a distinct leadParentName, leadName is the student/child!
          resolvedChild = leadName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
        } else if (!resolvedChild && leadName && !leadParentName) {
          // If only leadName is present in parents stream, it represents the student/child!
          resolvedChild = leadName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
          resolvedParent = "Parent";
        } else if (resolvedChild && !resolvedParent && leadName && leadName !== resolvedChild) {
          resolvedParent = leadName;
        }
      }

      const finalChildName = isParentsStream
        ? (resolvedChild && resolvedChild.toLowerCase() !== "child" ? resolvedChild : (leadName ? leadName.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim() : undefined))
        : undefined;
      const finalParentName = isParentsStream
        ? (resolvedParent && resolvedParent.toLowerCase() !== "parent" ? resolvedParent : (leadName && leadName !== finalChildName ? leadName : "Parent"))
        : undefined;

      const finalDisplayName = isParentsStream
        ? (finalChildName
            ? (finalParentName && finalParentName !== "Parent" ? `${finalChildName} (${finalParentName})` : `${finalChildName} (Child)`)
            : (finalParentName && finalParentName !== "Parent" ? `Parent (${finalParentName})` : (leadName || "Child")))
        : (leadName || `Well-wisher (${leadPhone.slice(-4)})`);

      const pVal = validateIndianMobile(leadPhone);
      if (pVal.isValid) {
        leads.push({
          stream: activeStream,
          name: finalDisplayName.replace(/^["']|["']$/g, "").trim(),
          parentName: finalParentName ? finalParentName.replace(/^["']|["']$/g, "").trim() : undefined,
          childName: finalChildName ? finalChildName.replace(/^["']|["']$/g, "").trim() : undefined,
          phone: pVal.phone10,
          dobDay: leadDay,
          dobMonth: leadMonth,
          email: leadEmail,
        });
      } else if (leadPhone) {
        junkCount++;
      }
    }

    setParsedLeads(leads);
    setParsedJunkCount(junkCount);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        if (inQuotes && line[i + 1] === char) {
          current += char;
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === "," || char === "\t" || char === ";") && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((c) => c.replace(/^["']|["']$/g, "").trim());
  };

  const parseRawLeadText = (text: string) => {
    if (!text || !text.trim()) {
      setParsedLeads([]);
      return;
    }
    const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const grid = rawLines.map((line) => parseCSVLine(line));
    parse2DGrid(grid);
  };

  const parseUploadedFile = (file: File) => {
    setUploadedFileName(file.name);
    const isExcel = /\.(xlsx|xls)$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
          // Smart sheet detection: if user selected DIRECT_DONOR, look for a sheet matching donor/direct
          let targetSheetName = workbook.SheetNames[0];
          if (uploadStream === "DIRECT_DONOR") {
            const donorSheet = workbook.SheetNames.find((s) => /donor|direct/i.test(s));
            if (donorSheet) targetSheetName = donorSheet;
            else if (workbook.SheetNames.length > 1) targetSheetName = workbook.SheetNames[1];
          } else if (uploadStream === "PARENTS") {
            const parentSheet = workbook.SheetNames.find((s) => /parent|child|student/i.test(s));
            if (parentSheet) targetSheetName = parentSheet;
          }
          const worksheet = workbook.Sheets[targetSheetName];
          // raw: true preserves Excel serial date numbers so parseBirthdayCell() can convert them correctly
          const grid = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: true, defval: "" });
          // Generate clean CSV preview for textarea
          const csvPreview = grid.slice(0, 50).map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
          setPastedText(csvPreview);
          parse2DGrid(grid, uploadStream);
        } catch (err: any) {
          showToast("❌ Error parsing Excel file: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setPastedText(content);
          parseRawLeadText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseUploadedFile(file);
    e.target.value = ""; // Allow re-selecting same file
  };

  const handleDownloadParentsTemplate = () => {
    const sample = `Parent Name,Parent Phone,Child Name,Child Birthday Day,Child Birthday Month,Email\n"Suresh Gowda","9880123456","Aarav Gowda",14,10,"suresh@gmail.com"\n"Lakshmi Devi","9845011002","Ananya",15,10,"lakshmi@yahoo.com"\n"Venkatesh Rao","9845011003","Rohan Rao",16,10,"venkatesh@gmail.com"`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_parents_child_birthday.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDonorsTemplate = () => {
    const sample = `Donor Name,Donor Phone,Birthday Day,Birthday Month,Email\n"Dr. Ramesh Patil","9880123456",14,10,"ramesh@patilclinic.com"\n"Deepa Rao","9845011002",15,10,"deepa@yahoo.com"\n"Anand Joshi","9845011003",16,10,"anand@gmail.com"`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_direct_donors_birthday.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    if (uploadStream === "PARENTS") {
      handleDownloadParentsTemplate();
    } else {
      handleDownloadDonorsTemplate();
    }
  };

  const handleClearDemoLeads = async (wipeAll: boolean = false) => {
    const promptMsg = wipeAll
      ? "⚠️ Reset Entire CRM Queue: Are you sure you want to delete ALL leads? Telecaller staff accounts will remain intact."
      : "Clean Demo Leads: Are you sure you want to remove all dummy/sample leads ('Patron Donor %', 'Sample%', 'Test%')? Real leads will be preserved.";
    const confirmed = window.confirm(promptMsg);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_leads", onlySample: !wipeAll }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to clear leads");
      showToast(`✓ ${data.message}`);
      await loadAdminData();
    } catch (err: any) {
      showToast("Error cleaning leads: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAllLeads = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_all_leads" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete leads");
      showToast(`✓ ${data.message}`);
      setIsDeleteAllModalOpen(false);
      setLeadsList([]);
      setSelectedLeadIds([]);
      setLeadsPage(1);
      await loadAdminData();
    } catch (err: any) {
      showToast("Error deleting leads: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDailyQuota = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_daily_quota", mode: resetDistributionMode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to reset daily quota");
      showToast(`✓ ${data.message}`);
      setIsResetDailyModalOpen(false);
      setLeadsPage(1);
      await loadAdminData();
      await loadLeadsForReassignment(selectedCallerForLeads || "ALL");
    } catch (err: any) {
      showToast("Error resetting daily queue: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepairStudentNames = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repair_student_names" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to repair student names");
      showToast(`✓ ${data.message}`);
      await loadAdminData();
      await loadLeadsForReassignment(selectedCallerForLeads || "ALL");
    } catch (err: any) {
      showToast("Error repairing student names: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeduplicateDatabase = async () => {
    const confirmed = window.confirm(
      "🔍 Scan & Merge Database Duplicates: This will scan all leads by 10-digit phone, merge call history & donations into the primary lead, and safely purge duplicate rows. Proceed?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deduplicate_database" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to deduplicate database");
      showToast(`✓ ${data.message}`);
      await loadAdminData();
      await loadLeadsForReassignment(selectedCallerForLeads || "ALL");
    } catch (err: any) {
      showToast("Error deduplicating database: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEqualizeWorkload = async () => {
    const confirmed = window.confirm(
      "⚖️ Equalize Pending Workload: This will evenly balance UNTOUCHED pending leads across all active telecallers (including newly added callers). Contacted, interested, and callback leads are 100% frozen. Proceed?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "equalize_pending_workload" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to equalize workload");
      showToast(`✓ ${data.message}`);
      await loadAdminData();
      await loadLeadsForReassignment(selectedCallerForLeads || "ALL");
    } catch (err: any) {
      showToast("Error equalizing workload: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── RESUME INCOMPLETE BACKGROUND UPLOAD ──
  const handleResumeUpload = async () => {
    if (!activeResumableJob) return;
    setIsUploadModalOpen(true);
    await runChunkedUploadEngine({
      jobId: activeResumableJob.jobId,
      uploadBatchId: activeResumableJob.uploadBatchId,
      chunks: activeResumableJob.chunks,
      startChunkIndex: activeResumableJob.currentChunk,
      totalLeadsCount: activeResumableJob.totalLeads,
      stream: activeResumableJob.stream,
      fileName: activeResumableJob.fileName,
      autoDistribute: activeResumableJob.autoDistribute,
      mode: activeResumableJob.distributionMode,
      initialStats: activeResumableJob.stats,
    });
  };

  const handleDismissResumableJob = () => {
    clearActiveUploadJob();
    setActiveResumableJob(null);
  };

  // ── IN-FLIGHT CANCEL & SAFE BATCH ROLLBACK HANDLERS ──
  const handleCancelUpload = async (rollbackBatch = false) => {
    cancelRequestedRef.current = true;
    const batchIdToRollback = currentUploadBatchIdRef.current;
    setIsCancelConfirmOpen(false);

    if (rollbackBatch && batchIdToRollback) {
      setCancellingUpload(true);
      try {
        const res = await fetch("/api/v1/admin/telecallers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rollback_upload_batch", batchId: batchIdToRollback }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`✓ Upload cancelled & batch rolled back: ${data.message}`);
        } else {
          showToast(`Upload stopped: ${data.error || "Rollback failed"}`);
        }
      } catch (err: any) {
        showToast("Upload stopped: " + err.message);
      } finally {
        setCancellingUpload(false);
      }
    } else {
      showToast("Upload paused. Partial progress saved in database.");
    }

    clearActiveUploadJob();
    setActiveResumableJob(null);
    setIsUploadModalOpen(false);
    setUploadProgress(null);
    await loadAdminData();
    await loadLeadsForReassignment(selectedCallerForLeads || "ALL");
  };

  const handleOpenRollbackModal = async () => {
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_upload_batches" }),
      });
      const data = await res.json();
      if (data.batches && Array.isArray(data.batches)) {
        setRecentBatches(data.batches);
        if (data.batches.length > 0) {
          setSelectedBatchForRollback(data.batches[0].batchId);
        }
      }
    } catch (err) {
      console.error("Failed to load upload batches:", err);
    }
    setIsRollbackModalOpen(true);
  };

  const handleExecuteRollback = async (targetBatchId?: string) => {
    const batchId = targetBatchId || selectedBatchForRollback;
    if (!batchId) return;
    setRollingBackBatch(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback_upload_batch", batchId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Rollback failed");
      showToast(`✓ Rollback complete: ${data.message}`);
      setIsRollbackModalOpen(false);
      clearActiveUploadJob();
      setActiveResumableJob(null);
      await loadAdminData();
      await loadLeadsForReassignment(selectedCallerForLeads || "ALL");
    } catch (err: any) {
      showToast("Rollback error: " + err.message);
    } finally {
      setRollingBackBatch(false);
    }
  };

  const runChunkedUploadEngine = async (params: {
    jobId?: string;
    uploadBatchId?: string;
    chunks: any[][];
    startChunkIndex: number;
    totalLeadsCount: number;
    stream: "PARENTS" | "DIRECT_DONOR";
    fileName: string;
    autoDistribute: boolean;
    mode: "balanced" | "round_robin";
    initialStats?: {
      insertedTotal: number;
      duplicatesTotal: number;
      enrichedTotal: number;
      junkTotal?: number;
    };
  }) => {
    setActionLoading(true);
    cancelRequestedRef.current = false;
    void acquireWakeLock();

    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Lead upload is currently in progress. Navigating away will pause the upload.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);

    const {
      chunks,
      startChunkIndex,
      totalLeadsCount,
      stream,
      fileName,
      autoDistribute,
      mode,
    } = params;

    const totalChunks = chunks.length;
    const CHUNK_SIZE = chunks[0]?.length || 500;
    const jobId = params.jobId || `job_${Date.now()}`;
    const uploadBatchId =
      params.uploadBatchId ||
      `BATCH_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Date.now().toString(36).toUpperCase()}_${fileName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 16)}`;
    currentUploadBatchIdRef.current = uploadBatchId;

    let cumInserted = params.initialStats?.insertedTotal || 0;
    let cumDuplicates = params.initialStats?.duplicatesTotal || 0;
    let cumEnriched = params.initialStats?.enrichedTotal || 0;
    let cumJunk = params.initialStats?.junkTotal || parsedJunkCount || 0;

    // Wake-up interruptible sleep mechanism for screen wake & tab visibility
    let interruptSleep: (() => void) | null = null;
    const onVisibilityOrOnline = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void acquireWakeLock();
        if (interruptSleep) {
          interruptSleep();
        }
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityOrOnline);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", onVisibilityOrOnline);
    }

    const waitWithInterrupt = (ms: number) => {
      return new Promise<void>((resolve) => {
        let timer: any = null;
        const wake = () => {
          if (timer) clearTimeout(timer);
          interruptSleep = null;
          resolve();
        };
        interruptSleep = wake;
        timer = setTimeout(wake, ms);
      });
    };

    setUploadProgress({
      inProgress: true,
      currentChunk: startChunkIndex,
      totalChunks,
      processedLeads: Math.min(startChunkIndex * CHUNK_SIZE, totalLeadsCount),
      totalLeads: totalLeadsCount,
      percent: Math.min(95, Math.max(1, Math.round((startChunkIndex / totalChunks) * 95))),
      stage: "uploading",
      statusMessage: startChunkIndex > 0
        ? `Resuming ingestion from chunk ${startChunkIndex + 1} of ${totalChunks}...`
        : `Preparing chunked upload of ${totalLeadsCount.toLocaleString()} leads in ${totalChunks} chunks...`,
      insertedTotal: cumInserted,
      duplicatesTotal: cumDuplicates,
      enrichedTotal: cumEnriched,
      junkTotal: cumJunk,
    });

    try {
      for (let i = startChunkIndex; i < totalChunks; i++) {
        if (cancelRequestedRef.current) {
          break;
        }

        const chunk = chunks[i];
        const chunkNum = i + 1;
        const processedSoFar = Math.min((i * CHUNK_SIZE) + chunk.length, totalLeadsCount);

        setUploadProgress({
          inProgress: true,
          currentChunk: chunkNum,
          totalChunks,
          processedLeads: processedSoFar,
          totalLeads: totalLeadsCount,
          percent: Math.min(95, Math.max(1, Math.round((chunkNum / totalChunks) * 95))),
          stage: "uploading",
          statusMessage: `Processing chunk ${chunkNum} of ${totalChunks} (${processedSoFar.toLocaleString()} / ${totalLeadsCount.toLocaleString()} leads)...`,
          insertedTotal: cumInserted,
          duplicatesTotal: cumDuplicates,
          enrichedTotal: cumEnriched,
          junkTotal: cumJunk,
        });

        let attempts = 0;
        let success = false;
        let lastErr = "";
        const MAX_RETRIES = 30;

        while (attempts < MAX_RETRIES && !success) {
          if (cancelRequestedRef.current) break;

          attempts++;
          try {
            const res = await fetch("/api/v1/admin/telecallers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "upload_chunk",
                leads: chunk,
                autoDistribute,
                mode,
                uploadBatchId,
              }),
            });

            let data: any;
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              data = await res.json();
            } else {
              const errBody = await res.text();
              if (!res.ok) {
                throw new Error(`Server returned HTTP ${res.status}: ${errBody.slice(0, 150)}`);
              }
              throw new Error(`Server returned unexpected response: ${errBody.slice(0, 150)}`);
            }

            if (!data.success) {
              throw new Error(data.error || "Chunk ingestion failed");
            }

            if (data.uploadResult) {
              cumInserted += Number(data.uploadResult.validInserted || 0);
              cumDuplicates +=
                Number(data.uploadResult.alreadyInDbSkipped || 0) +
                Number(data.uploadResult.internalDuplicatesSkipped || 0);
              cumEnriched += Number(data.uploadResult.enrichedUpdatedCount || 0);
              if (data.uploadResult.junkFilteredCount) {
                cumJunk += Number(data.uploadResult.junkFilteredCount);
              }
            }
            success = true;
          } catch (err: any) {
            lastErr = err.message || "Network error";
            if (cancelRequestedRef.current) break;

            if (attempts < MAX_RETRIES) {
              const backoffDelay = Math.min(1000 * Math.pow(1.3, attempts - 1), 12000);
              const cleanReason = lastErr.includes("504") || lastErr.includes("TIMEOUT")
                ? "Server busy / 504 timeout"
                : (lastErr.includes("Failed to fetch") ? "Network disconnected" : lastErr);
              setUploadProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      statusMessage: `⚠️ Auto-retrying Chunk ${chunkNum}/${totalChunks} (${cleanReason}). Resuming in ${(backoffDelay / 1000).toFixed(0)}s (Attempt ${attempts}/${MAX_RETRIES}). All progress is safe in database.`,
                    }
                  : null
              );
              await waitWithInterrupt(backoffDelay);
            }
          }
        }

        if (cancelRequestedRef.current) break;

        if (!success) {
          throw new Error(`Upload paused on chunk ${chunkNum}/${totalChunks}: ${lastErr}. You can tap Resume Upload anytime.`);
        }

        // Persist progress to IndexedDB and localStorage on each completed chunk
        void saveActiveUploadJob({
          jobId,
          uploadBatchId,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          fileName,
          stream,
          totalLeads: totalLeadsCount,
          totalChunks,
          currentChunk: chunkNum,
          chunks,
          autoDistribute,
          distributionMode: mode,
          status: "in_progress",
          statusMessage: `Uploaded chunk ${chunkNum} of ${totalChunks}`,
          stats: {
            insertedTotal: cumInserted,
            duplicatesTotal: cumDuplicates,
            enrichedTotal: cumEnriched,
            junkTotal: cumJunk,
          },
        });

        // 150ms gentle breath between chunks
        // 15ms UI render tick
        await new Promise((r) => setTimeout(r, 15));
      }

      if (cancelRequestedRef.current) {
        // User requested cancellation
        return;
      }

      // Upload finished successfully
      clearActiveUploadJob();
      releaseWakeLock();
      setActiveResumableJob(null);

      if (autoDistribute && cumInserted > 0) {
        setUploadProgress((prev) =>
          prev
            ? {
                ...prev,
                statusMessage: "Dividing leads equally by upcoming birthday across active telecallers in database...",
              }
            : null
        );
        try {
          await fetch("/api/v1/admin/telecallers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "distribute_equally", mode }),
          });
        } catch (distErr) {
          console.warn("[CRM] In-database equal distribution error:", distErr);
        }
      }

      setUploadProgress({
        inProgress: false,
        currentChunk: totalChunks,
        totalChunks,
        processedLeads: totalLeadsCount,
        totalLeads: totalLeadsCount,
        percent: 100,
        stage: "done",
        statusMessage: `✓ Import complete! ${cumInserted.toLocaleString()} unique leads added & equally divided by date (${cumEnriched} updated with Student Names, ${cumDuplicates.toLocaleString()} duplicates skipped, ${cumJunk.toLocaleString()} junk filtered).`,
        insertedTotal: cumInserted,
        duplicatesTotal: cumDuplicates,
        enrichedTotal: cumEnriched,
        junkTotal: cumJunk,
      });

      const enrichNote = cumEnriched > 0 ? `, ${cumEnriched} student names updated` : "";
      showToast(
        `✓ Successfully imported ${cumInserted.toLocaleString()} leads! (${cumDuplicates.toLocaleString()} duplicates & ${cumJunk.toLocaleString()} junk filtered${enrichNote}).`
      );

      // Refresh admin data and lead view
      await loadAdminData();
      await loadLeadsForReassignment(selectedCallerForLeads || "ALL");

      // Auto-close modal after brief delay so user sees 100% completion
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadProgress(null);
        setPastedText("");
        setParsedLeads([]);
        setParsedJunkCount(0);
        setUploadedFileName("");
      }, 1800);
    } catch (err: any) {
      releaseWakeLock();
      void saveActiveUploadJob({
        jobId,
        uploadBatchId,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        fileName,
        stream,
        totalLeads: totalLeadsCount,
        totalChunks,
        currentChunk: uploadProgress?.currentChunk || 0,
        chunks,
        autoDistribute,
        distributionMode: mode,
        status: "paused",
        statusMessage: err.message,
        stats: {
          insertedTotal: cumInserted,
          duplicatesTotal: cumDuplicates,
          enrichedTotal: cumEnriched,
          junkTotal: cumJunk,
        },
      });

      setUploadProgress((prev) => ({
        inProgress: false,
        currentChunk: prev?.currentChunk || 0,
        totalChunks,
        processedLeads: prev?.processedLeads || 0,
        totalLeads: totalLeadsCount,
        percent: prev?.percent || 0,
        stage: "error",
        statusMessage: `Upload paused: ${err.message}. Progress is safely saved in database and can be resumed with 1 click.`,
        insertedTotal: cumInserted,
        duplicatesTotal: cumDuplicates,
        enrichedTotal: cumEnriched,
        junkTotal: cumJunk,
      }));
      // ZERO blocking alert() calls! The UI sticky banner informs the user clearly and cleanly.
    } finally {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityOrOnline);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onVisibilityOrOnline);
      }
      setActionLoading(false);
    }
  };

  const handleExecuteLeadUpload = async () => {
    if (parsedLeads.length === 0) {
      return showToast("⚠️ No valid leads detected. Please paste or upload data containing Name and Phone.");
    }

    const totalLeadsCount = parsedLeads.length;
    const CHUNK_SIZE = 500;
    const chunks: typeof parsedLeads[] = [];
    for (let i = 0; i < totalLeadsCount; i += CHUNK_SIZE) {
      chunks.push(parsedLeads.slice(i, i + CHUNK_SIZE));
    }

    const cleanFileName = uploadedFileName || (uploadStream === "PARENTS" ? "parents_leads.xlsx" : "direct_donor_leads.xlsx");
    const uploadBatchId = `BATCH_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${Date.now().toString(36).toUpperCase()}_${cleanFileName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 16)}`;

    await runChunkedUploadEngine({
      chunks,
      startChunkIndex: 0,
      totalLeadsCount,
      stream: uploadStream,
      fileName: cleanFileName,
      uploadBatchId,
      autoDistribute: autoDistributeOnUpload,
      mode: distributionMode,
      initialStats: {
        insertedTotal: 0,
        duplicatesTotal: 0,
        enrichedTotal: 0,
        junkTotal: parsedJunkCount,
      },
    });
  };

  // ── EQUAL DISTRIBUTION ENGINE ──
  const handleDistributeEqually = async (mode: "balanced" | "round_robin" = "balanced") => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "distribute_equally", mode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Distribution failed");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
      setTotalLeads(data.totalLeads || 0);
      if (data.streamCounts) setStreamCounts(data.streamCounts);
      await loadLeadsForReassignment("TC01");
    } catch (err: any) {
      showToast("Distribution failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── DISTRIBUTE UNASSIGNED LEADS ONLY (DUAL STREAM 50/50) ──
  const handleDistributeUnassigned = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "distribute_unassigned" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Distribution failed");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
      setTotalLeads(data.totalLeads || 0);
      if (data.streamCounts) setStreamCounts(data.streamCounts);
      await loadLeadsForReassignment("TC01");
    } catch (err: any) {
      showToast("Distribution failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── TRIGGER CRON ROUTING ──
  const handleTriggerRouting = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger_routing" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ ${data.message}`);
        setCallers(data.callers || []);
        setTotalLeads(data.totalLeads || 0);
        setTotalRevenue(data.totalRevenue || 0);
      }
    } catch (err: any) {
      showToast("Routing failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── BULK REASSIGNMENT ──
  const handleBulkReassign = async () => {
    if (selectedLeadIds.length === 0) {
      return showToast("⚠️ Please select at least one lead to re-assign.");
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_reassign",
          leadIds: selectedLeadIds,
          targetCallerId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ ${data.message}`);
        setSelectedLeadIds([]);
        await loadAdminData();
      }
    } catch (err: any) {
      showToast("Reassignment failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── SIMULATE DONATION TEST ──
  const handleSimulateDonation = async (callerId: string) => {
    const amount = 1000;
    try {
      const res = await fetch("/api/v1/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_donation",
          callerRefId: callerId,
          amount,
          donorName: `Well-wisher for ${callerId}`,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        showToast(`✓ Simulated donation of ₹${amount} attributed to ${callerId}!`);
        await loadAdminData();
      }
    } catch (err: any) {
      showToast("Simulation failed: " + err.message);
    }
  };

  // ── EXPORT AGENCY REPORT (CSV) ──
  const handleTriggerCSVDownload = (type: "performance" | "leads" | "donations" | "roster") => {
    window.open(`/api/v1/admin/telecallers/export?type=${type}`, "_blank");
    setIsExportMenuOpen(false);
    showToast(`✓ Initiated ${type.toUpperCase()} CSV export download`);
  };

  // ── TELECALLER CREDENTIALS & ACCESS MODAL HANDLERS ──
  const handleOpenAccessModal = (c: TelecallerStats) => {
    setSelectedCallerForAccess(c);
    setNewPasswordInput("");
    setIsAccessModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCallerForAccess || !newPasswordInput.trim()) return;
    if (newPasswordInput.trim().length < 4) {
      showToast("⚠️ New password must be at least 4 characters.");
      return;
    }
    setResettingPassword(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_password",
          callerId: selectedCallerForAccess.callerId,
          newPassword: newPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to reset password");
      showToast(`✓ Password for ${selectedCallerForAccess.callerId} updated successfully!`);
      setNewPasswordInput("");
    } catch (err: any) {
      showToast("❌ Error resetting password: " + err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleCopyCredentials = (caller: TelecallerStats, pwd?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";
    const text = `🌟 *JANASEVA ASHRAMA TELECALLER PORTAL ACCESS*\n👤 Advisor Name: ${caller.name}\n🆔 Caller ID: ${caller.callerId}\n📧 Login Email: ${caller.email || `${caller.callerId.toLowerCase()}@janaseva.org`}\n🔑 Password: ${pwd || "ashrama@123"}\n🔗 Login Portal: ${origin}/portal?caller=${caller.callerId}\n🎯 Primary 'Sponsor 25 Boys' Campaign Link: ${origin}/give?ref=${caller.callerId}`;
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied login credentials for ${caller.callerId} to clipboard!`);
  };

  const handleSendWhatsAppCredentials = (caller: TelecallerStats, pwd?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://janasevaashrama.org";
    const tokenQuery = caller.exportToken ? `&token=${caller.exportToken}` : "";
    const text = `🌸 *JANASEVA ASHRAMA TELECALLER PORTAL & CALLING DATA*\n\nNamaste ${caller.name},\nHere are your access credentials and assigned calling data:\n\n🎧 *Telecaller:* ${caller.name}\n🆔 *Caller ID:* ${caller.callerId}\n📧 *Login ID:* ${caller.callerId}\n🔑 *Password:* ${pwd || "ashrama@123"}\n🎯 *Daily Target:* ${caller.dailyQuota || 50} donors\n📋 *Total Assigned Leads:* ${caller.assignedCount.toLocaleString()}\n\n🔗 *Calling Portal (1-Tap Call & Log):*\n${origin}/portal?caller=${caller.callerId}\n\n📥 *Download Your Leads (CSV Spreadsheet):*\n${origin}/api/v1/admin/telecallers/export?type=caller_leads&callerId=${caller.callerId}${tokenQuery}\n\n🎁 *Your Direct Donation Link:*\n${origin}/give?ref=${caller.callerId}\n\nPlease open your portal and start reaching out to donors with sincere devotion!`;
    const cleanNumber = (caller.whatsappNumber || "").replace(/\D/g, "").slice(-10);
    window.open(`https://wa.me/91${cleanNumber}?text=${encodeURIComponent(text)}`, "_blank");
    showToast(`✓ Opened WhatsApp to send calling sheet & access to ${caller.name}`);
  };

  const handleCopyAgencySummary = () => {
    const activeCount = callers.filter((c) => c.isActive).length;
    const avgTicket = totalDonations > 0 ? Math.round(totalRevenue / totalDonations) : 0;
    const summary = `📊 *JANASEVA ASHRAMA TELECALLER CAMPAIGN REPORT*\n📅 Date: ${new Date().toLocaleDateString()}\n💰 Total Attributed Revenue: ${formatINR(totalRevenue)}\n🎧 Active Telecallers: ${activeCount}\n🎂 Total Managed Leads: ${totalLeads}\n✅ Completed Donations: ${totalDonations}\n📈 Conversion Rate: ${totalLeads > 0 ? ((totalDonations / totalLeads) * 100).toFixed(1) : 0}%\n🎟️ Average Donation Ticket: ${formatINR(avgTicket)}\n\n🏆 Top Performer: ${callers[0]?.name || "N/A"} (${callers[0]?.callerId}) - ${formatINR(callers[0]?.totalDonationAmount || 0)}`;

    navigator.clipboard.writeText(summary);
    showToast("✓ Copied agency performance summary to clipboard!");
    setIsExportMenuOpen(false);
  };

  // ── SAVE CENTRAL WHATSAPP CRM SETTINGS ──
  const handleSaveCrmSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCrmSettings(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_whatsapp_settings",
          settings: crmSettings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ Central WhatsApp outreach settings saved successfully!");
        if (data.settings) setCrmSettings(data.settings);
      } else {
        showToast("Failed to save settings: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      showToast("Error saving settings: " + err.message);
    } finally {
      setSavingCrmSettings(false);
    }
  };

  // ── EDIT TELECALLER DETAILS MODAL HANDLERS ──
  const handleOpenEditModal = (c: TelecallerStats) => {
    setEditingCaller(c);
    setEditCallerForm({
      name: c.name,
      whatsappNumber: c.whatsappNumber,
      email: c.email || "",
      dailyQuota: c.dailyQuota || 50,
      isActive: c.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveCallerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaller) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_caller",
          callerId: editingCaller.callerId,
          ...editCallerForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Telecaller ${editingCaller.callerId} details updated successfully!`);
        setIsEditModalOpen(false);
        setEditingCaller(null);
        await loadAdminData();
      } else {
        showToast("Failed to update telecaller: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      showToast("Error updating telecaller: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── OPEN ADMIN WHATSAPP ANTI-BAN MODAL ──
  const handleOpenAdminWhatsApp = (lead: any) => {
    setSelectedLeadForWhatsApp(lead);
    setIsAntiBanModalOpen(true);
  };

  const filteredLeads = useMemo(() => {
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    const base = leadsList.filter((l) => {
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      const isLeadParent = l.stream === "PARENTS" || (l.stream !== "DIRECT_DONOR" && l.stream !== "DIRECT_DONORS" && Boolean(l.parentName || l.childName));
      const normalizedStream = isLeadParent ? "PARENTS" : "DIRECT_DONOR";
      if (leadStreamFilter !== "ALL" && normalizedStream !== leadStreamFilter) return false;
      return true;
    });

    const getBirthdayDistance = (m?: number, d?: number) => {
      if (!m || !d) return 9999;
      let diff = (m - curMonth) * 31 + (d - curDay);
      if (diff < 0) diff += 372;
      return diff;
    };

    return [...base].sort((a, b) => {
      if (leadDateSort === "birthday_upcoming") {
        const distA = getBirthdayDistance(a.dobMonth, a.dobDay);
        const distB = getBirthdayDistance(b.dobMonth, b.dobDay);
        return distA - distB || (a.leadId - b.leadId);
      }
      if (leadDateSort === "birthday_calendar") {
        const monthDiff = (a.dobMonth || 0) - (b.dobMonth || 0);
        if (monthDiff !== 0) return monthDiff;
        return (a.dobDay || 0) - (b.dobDay || 0) || (a.leadId - b.leadId);
      }
      if (leadDateSort === "date_newest") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.leadId;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.leadId;
        return timeB - timeA;
      }
      if (leadDateSort === "date_oldest") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.leadId;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.leadId;
        return timeA - timeB;
      }
      if (leadDateSort === "callback_earliest") {
        if (!a.rescheduleDate && !b.rescheduleDate) return a.leadId - b.leadId;
        if (!a.rescheduleDate) return 1;
        if (!b.rescheduleDate) return -1;
        return new Date(a.rescheduleDate).getTime() - new Date(b.rescheduleDate).getTime();
      }
      return 0;
    });
  }, [leadsList, statusFilter, leadStreamFilter, leadDateSort]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / leadsPerPage));
  const paginatedLeads = useMemo(() => {
    const start = (leadsPage - 1) * leadsPerPage;
    return filteredLeads.slice(start, start + leadsPerPage);
  }, [filteredLeads, leadsPage, leadsPerPage]);

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.leadId));
    }
  };

  const toggleSelectCurrentPage = () => {
    const pageIds = paginatedLeads.map((l) => l.leadId);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedLeadIds.includes(id));
    if (allPageSelected) {
      setSelectedLeadIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  // Agency Metrics calculations
  const activeCallersCount = callers.filter((c) => c.isActive).length;
  const totalContacted = callers.reduce((sum, c) => sum + c.contactedCount, 0);
  const totalAssigned = callers.reduce((sum, c) => sum + c.assignedCount, 0);
  const contactRate = totalAssigned > 0 ? ((totalContacted / totalAssigned) * 100).toFixed(1) : "0.0";
  const avgDonationTicket = totalDonations > 0 ? Math.round(totalRevenue / totalDonations) : 0;
  const equalQuotaPerCaller = activeCallersCount > 0 ? Math.floor(totalLeads / activeCallersCount) : 0;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-white hover:text-gold ml-3 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ── PERSISTENT BACKGROUND UPLOAD RESUME BANNER ── */}
      {activeResumableJob && (
        <div className="rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 p-4 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse shrink-0">⏳</span>
            <div>
              <p className="font-display font-black text-xs sm:text-sm text-amber-950 flex items-center gap-2">
                <span>Unfinished Lead Ingestion Job Detected</span>
                <span className="rounded-full bg-amber-950 text-gold px-2 py-0.5 text-[10px] font-mono font-bold">
                  {activeResumableJob.fileName}
                </span>
              </p>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-snug">
                Chunk {activeResumableJob.currentChunk} of {activeResumableJob.totalChunks} completed (
                {Math.min(activeResumableJob.currentChunk * (activeResumableJob.chunks?.[0]?.length || 500), activeResumableJob.totalLeads).toLocaleString()} / {activeResumableJob.totalLeads.toLocaleString()} leads).
                You can resume safely without creating duplicate leads.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleResumeUpload}
              className="px-4 py-2 rounded-xl bg-teal-950 hover:bg-teal-900 active:scale-95 text-gold font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <span>▶ Resume Ingestion</span>
            </button>
            {activeResumableJob.uploadBatchId && (
              <button
                type="button"
                onClick={() => handleExecuteRollback(activeResumableJob.uploadBatchId)}
                className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
                title="Rollback this unfinished file and delete untouched leads"
              >
                <span>⏪ Rollback This File</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDismissResumableJob}
              className="px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-amber-950 font-bold text-xs border border-amber-900/20 transition cursor-pointer"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── 0. HERO BRAND HEADER & ACTION STRIP ── */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-teal-950 p-6 text-white shadow-lg border border-teal-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <LogoMark size={56} className="ring-2 ring-amber-400/40" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-black text-gold">
                  Antigravity CRM &amp; Telecaller Sales Agency
                </h2>
                <span className="rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase px-2.5 py-0.5 border border-amber-400/30">
                  Affiliate Attribution
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
                Direct gateway payment attribution engine for birthday donation outreach. Equal load-balancing, 1-tap WhatsApp message delivery, and real-time sales agency campaign analytics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Add Telecaller Button */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-gold hover:bg-amber-400 text-teal-950 px-3.5 py-2.5 text-xs font-black shadow-sm transition cursor-pointer"
            >
              <span>➕ Add Telecaller</span>
            </button>

            {/* Upload Leads Button */}
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand text-teal-950 px-3.5 py-2.5 text-xs font-black shadow-sm transition cursor-pointer"
            >
              <span>📤 Bulk Upload Leads</span>
            </button>

            {/* Distribute Tomorrow's Calling Queue (50/50 Mix) */}
            <button
              type="button"
              onClick={handleTriggerRouting}
              disabled={actionLoading}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-teal-950 px-3.5 py-2.5 text-xs font-black shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Distribute tomorrow's birthdays (T+1) with 50% Parents + 50% Donors fair share across all active callers"
            >
              <span>🎯 Distribute Tomorrow (50/50 Mix)</span>
            </button>

            {/* Desktop Actions (Shown on XL screens) */}
            <div className="hidden xl:flex items-center gap-2 flex-wrap">
              {/* Reset Daily Limit / Queue Button */}
              <button
                type="button"
                onClick={() => setIsResetDailyModalOpen(true)}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-teal-950 px-3 py-2 text-xs font-black shadow-sm transition cursor-pointer disabled:opacity-50"
                title="Reset non-donated leads to Pending and refresh daily quota across active callers"
              >
                <span>🔄 Reset Daily Limit</span>
              </button>

              {/* Rollback Latest Batch Button */}
              <button
                type="button"
                onClick={handleOpenRollbackModal}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-800/80 hover:bg-amber-800 text-amber-200 border border-amber-700/60 px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Safely undo an accidental wrong file upload without deleting called leads"
              >
                <span>⏪ Rollback Batch</span>
              </button>

              {/* Equalize Pending Workload Button */}
              <button
                type="button"
                onClick={handleEqualizeWorkload}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                title="Evenly balance untouched pending leads across all active callers"
              >
                <span>⚖️ Equalize</span>
              </button>

              {/* Date-Wise Equal Math Distribution Button */}
              <button
                type="button"
                onClick={() => handleDistributeEqually("balanced")}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-amber-300 border border-teal-600 px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                title="Equally divide all pending leads by upcoming birthday across active telecallers with exact mathematical fairness"
              >
                <span>🎯 Date-Wise Divide</span>
              </button>

              {/* Deduplicate Database Button */}
              <button
                type="button"
                onClick={handleDeduplicateDatabase}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-900 text-purple-200 border border-purple-700/60 px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                title="Scan and merge duplicate phone numbers in the database"
              >
                <span>🔍 Merge Dups</span>
              </button>

              {/* Repair Student Names Button */}
              <button
                type="button"
                onClick={handleRepairStudentNames}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                title="Replace placeholder 'Child' with student/parent indicators in database"
              >
                <span>🔄 Repair Names</span>
              </button>

              {/* Clean Demo Leads Button */}
              <button
                type="button"
                onClick={() => handleClearDemoLeads(false)}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900/60 hover:bg-teal-900 text-teal-200 border border-teal-700/60 px-3 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                title="Remove sample and dummy test leads from the database"
              >
                <span>🧹 Clean Demo</span>
              </button>

              {/* Delete All Leads Button */}
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white border border-rose-600 px-3 py-2 text-xs font-black shadow-sm transition cursor-pointer disabled:opacity-50"
                title="Permanently delete all leads and call logs"
              >
                <span>🗑️ Delete All</span>
              </button>
            </div>

            {/* Mobile / Tablet Maintenance Tools Drawer Trigger */}
            <div className="xl:hidden">
              <button
                type="button"
                onClick={() => setIsToolsMenuOpen(true)}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900/80 hover:bg-teal-900 text-gold border border-teal-700/60 px-3.5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>⚙️ Tools &amp; Maintenance ▾</span>
              </button>
            </div>

            {/* Export Dropdown / Drawer Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white border border-teal-700 px-3.5 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <span>📥 Export CRM Data ▾</span>
              </button>

              {/* Desktop Export Dropdown (Anchored to right edge so it never overflows offscreen) */}
              {isExportMenuOpen && (
                <div className="hidden xl:block absolute right-0 mt-2 w-72 rounded-2xl bg-white text-teal-950 shadow-2xl border border-teal-900/10 p-2 z-[150]">
                  <div className="px-3 py-2 border-b border-teal-900/10 text-[10px] font-bold text-teal-950/60 uppercase tracking-wider">
                    Agency Campaign Reports (CSV)
                  </div>
                  <button
                    onClick={() => handleTriggerCSVDownload("performance")}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 rounded-xl transition flex items-center justify-between"
                  >
                    <span>📊 Performance Leaderboard</span>
                    <span className="text-[10px] text-teal-950/50">.CSV</span>
                  </button>
                  <button
                    onClick={() => handleTriggerCSVDownload("leads")}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 rounded-xl transition flex items-center justify-between"
                  >
                    <span>📋 Birthday Leads Registry</span>
                    <span className="text-[10px] text-teal-950/50">.CSV</span>
                  </button>
                  <button
                    onClick={() => handleTriggerCSVDownload("donations")}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 rounded-xl transition flex items-center justify-between"
                  >
                    <span>💳 Attributed Donations Ledger</span>
                    <span className="text-[10px] text-teal-950/50">.CSV</span>
                  </button>
                  <button
                    onClick={() => handleTriggerCSVDownload("roster")}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 rounded-xl transition flex items-center justify-between"
                  >
                    <span>👥 Telecaller Accounts Roster</span>
                    <span className="text-[10px] text-teal-950/50">.CSV</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      window.open("/api/v1/admin/influencers/export?type=summary", "_blank");
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100 rounded-xl transition flex items-center justify-between"
                  >
                    <span>📸 Influencer Performance Summary</span>
                    <span className="text-[10px] text-amber-900 font-bold">.CSV</span>
                  </button>
                  <div className="border-t border-teal-900/10 mt-1 pt-1">
                    <button
                      onClick={handleCopyAgencySummary}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 rounded-xl transition"
                    >
                      📋 Copy Summary to Clipboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Export Action Sheet Modal (100% Mobile Friendly, Centered or Bottom Sheet, Never Cut Off) */}
            {isExportMenuOpen && (
              <div
                className="xl:hidden fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-teal-950/80 backdrop-blur-sm animate-fadeIn p-0 sm:p-4"
                onClick={() => setIsExportMenuOpen(false)}
              >
                <div
                  className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-teal-900/10 space-y-3 max-h-[85vh] overflow-y-auto pb-8 sm:pb-5 safe-area-pb"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1.5 rounded-full bg-teal-900/20 mx-auto mb-2 shrink-0 sm:hidden" />
                  <div className="flex items-center justify-between pb-2 border-b border-teal-900/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📥</span>
                      <h3 className="font-display text-base font-bold text-teal-950">
                        Export Campaign Reports
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsExportMenuOpen(false)}
                      className="rounded-full bg-cream p-1.5 text-teal-950/60 hover:text-teal-950 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleTriggerCSVDownload("performance")}
                      className="w-full p-3 rounded-2xl bg-cream/50 hover:bg-cream border border-teal-900/10 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-xs text-teal-950 block">📊 Performance Leaderboard</span>
                        <span className="text-[10px] text-teal-950/60">Calls made, donations raised &amp; rank</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-teal-950 text-gold px-2 py-0.5 rounded-md">.CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerCSVDownload("leads")}
                      className="w-full p-3 rounded-2xl bg-cream/50 hover:bg-cream border border-teal-900/10 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-xs text-teal-950 block">📋 Birthday Leads Registry</span>
                        <span className="text-[10px] text-teal-950/60">Assigned caller, stream, phone &amp; DOB</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-teal-950 text-gold px-2 py-0.5 rounded-md">.CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerCSVDownload("donations")}
                      className="w-full p-3 rounded-2xl bg-cream/50 hover:bg-cream border border-teal-900/10 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-xs text-teal-950 block">💳 Attributed Donations Ledger</span>
                        <span className="text-[10px] text-teal-950/60">Claimed &amp; verified donation transactions</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-teal-950 text-gold px-2 py-0.5 rounded-md">.CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerCSVDownload("roster")}
                      className="w-full p-3 rounded-2xl bg-cream/50 hover:bg-cream border border-teal-900/10 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-xs text-teal-950 block">👥 Telecaller Accounts Roster</span>
                        <span className="text-[10px] text-teal-950/60">Login credentials, quotas &amp; active status</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-teal-950 text-gold px-2 py-0.5 rounded-md">.CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        window.open("/api/v1/admin/influencers/export?type=summary", "_blank");
                      }}
                      className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-xs text-amber-950 block">📸 Creator &amp; Influencer Summary</span>
                        <span className="text-[10px] text-amber-800">30-day link conversions &amp; totals</span>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-amber-900 text-white px-2 py-0.5 rounded-md">.CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyAgencySummary}
                      className="w-full p-3 rounded-2xl bg-sand/60 hover:bg-sand border border-teal-900/15 text-center font-bold text-xs text-teal-950 transition cursor-pointer mt-1"
                    >
                      📋 Copy Summary to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Maintenance Tools Action Sheet Drawer */}
            {isToolsMenuOpen && (
              <div
                className="xl:hidden fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center bg-teal-950/80 backdrop-blur-sm animate-fadeIn p-0 sm:p-4"
                onClick={() => setIsToolsMenuOpen(false)}
              >
                <div
                  className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-teal-900/10 space-y-3 max-h-[85vh] overflow-y-auto pb-8 sm:pb-5 safe-area-pb"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-12 h-1.5 rounded-full bg-teal-900/20 mx-auto mb-2 shrink-0 sm:hidden" />
                  <div className="flex items-center justify-between pb-2 border-b border-teal-900/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚙️</span>
                      <h3 className="font-display text-base font-bold text-teal-950">
                        Floor &amp; Database Maintenance
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsToolsMenuOpen(false)}
                      className="rounded-full bg-cream p-1.5 text-teal-950/60 hover:text-teal-950 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsResetDailyModalOpen(true);
                      }}
                      className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">🔄</span>
                      <div>
                        <span className="font-bold text-xs text-amber-950 block">Reset Daily Limit &amp; Rebalance</span>
                        <span className="text-[11px] text-amber-900/80">Reset pending leads and divide equally across present callers</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        void handleOpenRollbackModal();
                      }}
                      className="w-full p-3 rounded-2xl bg-amber-100/70 hover:bg-amber-100 border border-amber-300 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">⏪</span>
                      <div>
                        <span className="font-bold text-xs text-amber-950 block">Rollback Recent Upload Batch</span>
                        <span className="text-[11px] text-amber-900/80">Safely undo accidental wrong file upload without deleting called leads</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        void handleDistributeEqually("balanced");
                      }}
                      className="w-full p-3 rounded-2xl bg-teal-900 hover:bg-teal-800 border border-teal-700 text-left flex items-start gap-3 transition cursor-pointer text-white shadow-sm"
                    >
                      <span className="text-xl">🎯</span>
                      <div>
                        <span className="font-bold text-xs text-amber-300 block">Date-Wise Equal Math Distribution (All Dates)</span>
                        <span className="text-[11px] text-teal-100/90">Divide all uploaded leads equally by upcoming birthday across active callers</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        void handleEqualizeWorkload();
                      }}
                      className="w-full p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">⚖️</span>
                      <div>
                        <span className="font-bold text-xs text-indigo-950 block">Equalize Workload</span>
                        <span className="text-[11px] text-indigo-900/80">Re-distribute untouched leads to new or low-quota callers</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        void handleDeduplicateDatabase();
                      }}
                      className="w-full p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">🔍</span>
                      <div>
                        <span className="font-bold text-xs text-purple-950 block">Merge Duplicate Numbers</span>
                        <span className="text-[11px] text-purple-900/80">Scan for repeated phones and combine call histories</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        void handleRepairStudentNames();
                      }}
                      className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">🔄</span>
                      <div>
                        <span className="font-bold text-xs text-amber-950 block">Repair Student &amp; Child Names</span>
                        <span className="text-[11px] text-amber-900/80">Replace placeholder &quot;Child&quot; with genuine student names</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        void handleClearDemoLeads(false);
                      }}
                      className="w-full p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">🧹</span>
                      <div>
                        <span className="font-bold text-xs text-teal-950 block">Clean Demo Leads</span>
                        <span className="text-[11px] text-teal-900/80">Safely remove test placeholder data from database</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsMenuOpen(false);
                        setIsDeleteAllModalOpen(true);
                      }}
                      className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-rose-300 text-left flex items-start gap-3 transition cursor-pointer"
                    >
                      <span className="text-xl">🗑️</span>
                      <div>
                        <span className="font-bold text-xs text-rose-950 block">Delete All Leads (Wipe Database)</span>
                        <span className="text-[11px] text-rose-800">Clear all leads before importing official Excel registry</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Link
              href="/portal"
              target="_blank"
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900/80 hover:bg-teal-900 border border-teal-700/60 text-amber-300 px-3.5 py-2.5 text-xs font-bold shadow-xs transition"
            >
              <span>📱 Caller Portal →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 0. CRM SUB-NAVIGATION: STAFF TELECALLERS vs INSTAGRAM INFLUENCERS ── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-teal-900/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubtab("callers")}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
            activeSubtab === "callers"
              ? "bg-teal-950 text-gold shadow-md"
              : "bg-white text-teal-950 hover:bg-cream border border-teal-900/10"
          }`}
        >
          <span>📞</span>
          <span>Staff Telecallers &amp; Birthday Leads</span>
          <span className="rounded-full bg-teal-900/20 px-2 py-0.5 text-[10px] font-mono">
            {callers.length} callers
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubtab("financials");
            void loadFinancialData();
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
            activeSubtab === "financials"
              ? "bg-teal-950 text-gold shadow-md"
              : "bg-white text-teal-950 hover:bg-cream border border-teal-900/10"
          }`}
        >
          <span>💰</span>
          <span>Financial CRM &amp; Approvals</span>
          {finStats?.pendingApprovals?.length > 0 && (
            <span className="rounded-full bg-amber-500 text-teal-950 px-2 py-0.5 text-[10px] font-black animate-pulse">
              {finStats.pendingApprovals.length} pending
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubtab("influencers");
            void loadInfluencers();
          }}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-2 ${
            activeSubtab === "influencers"
              ? "bg-teal-950 text-gold shadow-md"
              : "bg-white text-teal-950 hover:bg-cream border border-teal-900/10"
          }`}
        >
          <span>📸</span>
          <span>Instagram Influencers &amp; Creators</span>
          <span className="rounded-full bg-amber-500 text-teal-950 px-2 py-0.5 text-[10px] font-black">
            {influencers.length}
          </span>
          {totalInfluencerRaised > 0 && (
            <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold">
              {formatINR(totalInfluencerRaised)}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 1: STAFF TELECALLERS & BIRTHDAY LEADS
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubtab === "callers" && (
        <div className="space-y-6">
          {/* ── 1. AGENCY SALES CAMPAIGN KPIS (6 TILES) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
            Attributed Revenue
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
            {formatINR(totalRevenue)}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
            {totalDonations} completed gifts
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
            Telecallers
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
            {activeCallersCount} / {callers.length}
          </p>
          <span className="text-[10px] text-teal-950/60 font-semibold mt-0.5 block">
            {activeCallersCount * 50} calls / day quota
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
              Managed Leads
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
              Dual Stream
            </span>
          </div>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
            {totalLeads.toLocaleString()} Leads
          </p>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold mt-1">
            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              🎂 Donors: {streamCounts.DIRECT_DONOR.toLocaleString()}
            </span>
            <span className="text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              👨‍👩‍👧 Parents: {streamCounts.PARENTS.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
            Calls Contacted
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
            {totalContacted}
          </p>
          <span className="text-[10px] text-blue-700 font-bold mt-0.5 block">
            {contactRate}% contact rate
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
            Conversion Rate
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-saffron-dark">
            {totalLeads > 0 ? ((totalDonations / totalLeads) * 100).toFixed(1) : 0}%
          </p>
          <span className="text-[10px] text-teal-950/60 font-semibold mt-0.5 block">
            Lead to verified payment
          </span>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
            Average Ticket (AOV)
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
            {formatINR(avgDonationTicket)}
          </p>
          <span className="text-[10px] text-teal-950/60 font-semibold mt-0.5 block">
            Per attributed donation
          </span>
        </div>
      </div>

      {/* ── 2. EQUAL LEAD DISTRIBUTION & ROUTING CONTROLS ── */}
      <div className="rounded-3xl bg-amber-50/60 p-5 border border-amber-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display text-sm font-bold text-teal-950">
              Agency Equal Lead Distribution &amp; Birthday Routing Engine
            </h3>
          </div>
          <p className="text-xs text-teal-950/70 mt-1 max-w-xl leading-relaxed">
            Algorithms balance pending leads across {activeCallersCount} active telecallers so every caller receives an equal share (~{equalQuotaPerCaller} leads each).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReallocateAbsenteeAdvance}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Harvest T+1 advance leads from absent telecallers and distribute equally to present floor callers"
          >
            <span>⚡ Reallocate Absentee T+1 Leads to Floor</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetDailyModalOpen(true)}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Reset non-donated leads to Pending and refresh daily quota across active callers"
          >
            <span>🔄 Reset Daily Limit / Queue</span>
          </button>

          <button
            type="button"
            onClick={() => handleDistributeEqually("balanced")}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Distribute and rebalance all pending leads by date (50% Parents + 50% Donors fair share) across active callers"
          >
            <span>🎯 Date-Partitioned Equal Distribution (All Dates)</span>
          </button>

          <button
            type="button"
            onClick={handleDistributeUnassigned}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-amber-300 px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Distribute newly uploaded unassigned leads (Parents & Donors 50/50 mix) across active callers"
          >
            <span>📥 Distribute Unassigned Leads</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRouting}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-teal-950 px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Distribute tomorrow's birthdays (T+1) with 50% Parents + 50% Donors fair share across all active callers"
          >
            <span>🎯 Distribute Tomorrow's Queue (50/50 Mix)</span>
          </button>
        </div>
      </div>

      {/* ── 2.5 CENTRAL WHATSAPP OUTREACH & ANTI-BAN CONFIGURATION ── */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-teal-900/10">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 text-xl font-bold ring-1 ring-emerald-200">
              📲
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base sm:text-lg font-bold text-teal-950">
                  Central Outreach WhatsApp &amp; Anti-Ban Controls
                </h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 border border-emerald-300">
                  🛡️ Active Protection
                </span>
              </div>
              <p className="text-xs text-teal-950/70 mt-0.5">
                Configure the organization master WhatsApp number, toggle sender mode (central vs. telecaller individual), and manage automated spintax parameters.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveCrmSettings} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Central Master WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-teal-950">
                🏢 Master Central WhatsApp Number
              </label>
              <input
                type="text"
                value={crmSettings.masterWhatsAppNumber}
                onChange={(e) =>
                  setCrmSettings((prev) => ({ ...prev, masterWhatsAppNumber: e.target.value }))
                }
                placeholder="+91 99803 59595"
                className="w-full rounded-xl border border-teal-900/20 bg-cream/30 px-3.5 py-2 text-xs font-mono font-bold text-teal-950 focus:border-teal-900 focus:outline-hidden"
              />
              <p className="text-[10px] text-teal-950/60">
                Official Janaseva Ashrama WhatsApp number shown to donors.
              </p>
            </div>

            {/* Sender Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-teal-950">
                📡 Outbound Sender Channel Mode
              </label>
              <select
                value={crmSettings.senderMode}
                onChange={(e) =>
                  setCrmSettings((prev) => ({
                    ...prev,
                    senderMode: e.target.value as "central" | "individual",
                  }))
                }
                className="w-full rounded-xl border border-teal-900/20 bg-cream/30 px-3 py-2 text-xs font-bold text-teal-950 focus:border-teal-900 focus:outline-hidden cursor-pointer"
              >
                <option value="central">🏢 Send as Central Number for All Callers</option>
                <option value="individual">👤 Each Caller sends from Own WhatsApp</option>
              </select>
              <p className="text-[10px] text-teal-950/60">
                Controls which number is used when telecallers click &apos;Send WhatsApp&apos;.
              </p>
            </div>

            {/* Default Outreach Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-teal-950">
                🌐 Default Outreach Language
              </label>
              <select
                value={crmSettings.defaultLanguage}
                onChange={(e) =>
                  setCrmSettings((prev) => ({
                    ...prev,
                    defaultLanguage: e.target.value as any,
                  }))
                }
                className="w-full rounded-xl border border-teal-900/20 bg-cream/30 px-3 py-2 text-xs font-bold text-teal-950 focus:border-teal-900 focus:outline-hidden cursor-pointer"
              >
                <option value="en">🇬🇧 English (Default)</option>
                <option value="kn">🇮🇳 ಕನ್ನಡ (Kannada)</option>
                <option value="mixed">🔤 Manglish (Mixed)</option>
              </select>
              <p className="text-[10px] text-teal-950/60">
                Initial template selected in caller modal.
              </p>
            </div>

            {/* Default Narrative Angle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-teal-950">
                🎯 Default Narrative Focus
              </label>
              <select
                value={crmSettings.defaultAngle}
                onChange={(e) =>
                  setCrmSettings((prev) => ({
                    ...prev,
                    defaultAngle: e.target.value as any,
                  }))
                }
                className="w-full rounded-xl border border-teal-900/20 bg-cream/30 px-3 py-2 text-xs font-bold text-teal-950 focus:border-teal-900 focus:outline-hidden cursor-pointer"
              >
                <option value="annadana">🍲 Annadana Meals (₹4,500 Full Day)</option>
                <option value="birthday">🎂 Birthday Seva Feast (₹5,000)</option>
                <option value="vidya">📚 Vidya &amp; School Kits (₹9,600)</option>
                <option value="trust_80g">📜 80G Tax Exemption &amp; Govt Registration</option>
              </select>
              <p className="text-[10px] text-teal-950/60">
                Primary sponsorship angle highlighted.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-teal-900/10">
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
              <span>🛡️</span>
              <span>
                Anti-Ban Engine auto-spins unique greetings, permutations &amp; cryptographic salt tokens (#JS-xxxxx) on every click.
              </span>
            </div>

            <button
              type="submit"
              disabled={savingCrmSettings}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <span>{savingCrmSettings ? "Saving..." : "💾 Save WhatsApp Settings"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. TELECALLER LEADERBOARD TABLE WITH CRUD ── */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-teal-950">
              Telecaller Agency Performance &amp; Attribution Leaderboard
            </h3>
            <p className="text-xs text-teal-950/60">
              Real-time revenue tracked via unique reference codes (<code className="font-mono text-teal-900 font-bold">?ref=TCxx</code>)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black">
              {activeCallersCount} Active
            </span>
            {callers.length - activeCallersCount > 0 && (
              <span className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-bold">
                {callers.length - activeCallersCount} Inactive
              </span>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Caller Name &amp; ID</th>
                <th className="p-3">WhatsApp Mobile</th>
                <th className="p-3">Quota</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned</th>
                <th className="p-3">Contacted</th>
                <th className="p-3">Converted</th>
                <th className="p-3">Conv. %</th>
                <th className="p-3">Attributed Revenue</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {callers.map((c) => {
                return (
                  <tr
                    key={c.callerId}
                    className={`hover:bg-sand/30 transition ${
                      !c.isActive ? "opacity-60 bg-slate-50/50" : c.rank === 1 ? "bg-amber-50/60" : ""
                    }`}
                  >
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-black ${
                          c.rank === 1
                            ? "bg-gold text-teal-950 shadow-sm"
                            : c.rank === 2
                            ? "bg-slate-300 text-slate-900"
                            : c.rank === 3
                            ? "bg-amber-600 text-white"
                            : "text-teal-950/60"
                        }`}
                      >
                        {c.rank}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-teal-950">{c.name}</p>
                      <p className="text-[10px] font-mono text-teal-900/70">{c.callerId} · {c.email || "No email"}</p>
                    </td>
                    <td className="p-3 font-mono text-teal-950/80">
                      +91 {c.whatsappNumber}
                    </td>
                    <td className="p-3 font-semibold">{c.dailyQuota || 50}/day</td>
                    <td className="p-3">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c.callerId, c.isActive)}
                          title="Click to toggle Active / Paused state"
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase cursor-pointer transition ${
                            c.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {c.isActive ? "● Active" : "○ Paused"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(c.callerId, c.isWorkingToday)}
                          title="Click to toggle Today's Shift Presence (Present vs Absent)"
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase cursor-pointer transition ${
                            c.isWorkingToday !== false
                              ? "bg-teal-100 text-teal-800 hover:bg-teal-200"
                              : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                          }`}
                        >
                          {c.isWorkingToday !== false ? "🟢 Present" : "🔴 Absent"}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 font-semibold">{c.assignedCount}</td>
                    <td className="p-3">
                      <div className="font-semibold text-teal-950">{c.contactedCount}</div>
                      <div className="text-[10px] text-amber-700 font-bold whitespace-nowrap">
                        🎯 {c.todayContactedCount ?? 0} today
                      </div>
                    </td>
                    <td className="p-3 text-emerald-700 font-bold">{c.convertedCount}</td>
                    <td className="p-3">
                      <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                        {c.conversionRate}%
                      </span>
                    </td>
                    <td className="p-3 font-display font-black text-sm text-teal-950">
                      {formatINR(c.totalDonationAmount)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          title="Edit telecaller name, individual WhatsApp number, email, and quota"
                          className="rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-950 border border-teal-200 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAccessModal(c)}
                          title="Manage credentials, reset password, and send portal login"
                          className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          🔑 Access
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateDonation(c.callerId)}
                          title="Simulate ₹1,000 donation attributed to this caller"
                          className="rounded-lg bg-teal-900/10 hover:bg-teal-900/20 text-teal-900 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          +₹1k Test
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/v1/admin/telecallers/export?type=caller_leads&callerId=${c.callerId}`, "_blank")}
                          title={`Download CSV of all leads assigned to ${c.callerId} (${c.name})`}
                          className="rounded-lg bg-teal-900/10 hover:bg-teal-900/20 text-teal-950 border border-teal-900/20 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          📥 CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCallerForLeads(c.callerId);
                            loadLeadsForReassignment(c.callerId);
                          }}
                          className="rounded-lg bg-white border border-teal-900/20 text-teal-950 px-2 py-1 text-[10px] font-bold hover:bg-sand transition cursor-pointer"
                        >
                          Leads
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePromptDelete(c)}
                          title="Delete this telecaller"
                          className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Telecaller Roster Cards */}
        <div className="md:hidden space-y-3 p-3">
          {callers.map((c) => (
            <div
              key={c.callerId}
              className={`rounded-2xl p-4 bg-white border transition shadow-xs space-y-3 ${
                !c.isActive
                  ? "opacity-60 bg-slate-50/50 border-slate-200"
                  : c.rank === 1
                  ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/40"
                  : "border-teal-900/10"
              }`}
            >
              {/* Header: Rank, Name, Caller ID, Active Toggle */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center h-7 w-7 shrink-0 rounded-full text-xs font-black ${
                      c.rank === 1
                        ? "bg-gold text-teal-950 shadow-sm"
                        : c.rank === 2
                        ? "bg-slate-300 text-slate-900"
                        : c.rank === 3
                        ? "bg-amber-600 text-white"
                        : "bg-teal-950/10 text-teal-950 font-bold"
                    }`}
                  >
                    #{c.rank}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-bold text-teal-950 text-sm truncate">{c.name}</h4>
                    <p className="text-[10px] font-mono text-teal-900/70">
                      {c.callerId} · Quota: {c.dailyQuota || 50}/day
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(c.callerId, c.isActive)}
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase cursor-pointer transition ${
                      c.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {c.isActive ? "● Active" : "○ Paused"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAttendance(c.callerId, c.isWorkingToday)}
                    className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase cursor-pointer transition ${
                      c.isWorkingToday !== false
                        ? "bg-teal-100 text-teal-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {c.isWorkingToday !== false ? "🟢 Present" : "🔴 Absent"}
                  </button>
                </div>
              </div>

              {/* Phone info & Quota */}
              <div className="flex items-center justify-between text-xs bg-cream/40 p-2 rounded-xl border border-teal-900/10">
                <span className="font-mono text-teal-950 font-medium">
                  📱 +91 {c.whatsappNumber || "Not Set"}
                </span>
                <span className="font-display font-black text-emerald-800 text-xs">
                  {formatINR(c.totalDonationAmount)}
                </span>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-200/60">
                  <span className="block text-[10px] text-teal-950/60 uppercase">Assigned</span>
                  <span className="font-bold text-teal-950 text-xs">{c.assignedCount}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2 border border-slate-200/60">
                  <span className="block text-[10px] text-teal-950/60 uppercase">Contacted</span>
                  <span className="font-bold text-teal-950 text-xs">{c.contactedCount}</span>
                  <span className="block text-[9px] text-amber-700 font-bold whitespace-nowrap">🎯 {c.todayContactedCount ?? 0} today</span>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2 border border-emerald-200/60">
                  <span className="block text-[10px] text-emerald-800 uppercase">Converted</span>
                  <span className="font-bold text-emerald-800 text-xs">{c.convertedCount}</span>
                </div>
                <div className="rounded-xl bg-amber-50 p-2 border border-amber-200/60">
                  <span className="block text-[10px] text-amber-900 uppercase">Conv %</span>
                  <span className="font-bold text-amber-900 text-xs">{c.conversionRate}%</span>
                </div>
              </div>

              {/* Actions Toolbar */}
              <div className="grid grid-cols-5 gap-1 pt-1 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(c)}
                  className="rounded-xl bg-teal-50 border border-teal-200 text-teal-950 py-2 text-[11px] font-bold hover:bg-teal-100 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAccessModal(c)}
                  className="rounded-xl bg-amber-100 border border-amber-300 text-amber-900 py-2 text-[11px] font-bold hover:bg-amber-200 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>🔑</span>
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCallerForLeads(c.callerId);
                    loadLeadsForReassignment(c.callerId);
                  }}
                  className="rounded-xl bg-cream border border-teal-900/20 text-teal-950 py-2 text-[11px] font-bold hover:bg-sand transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>📋</span>
                  <span>Leads</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`/api/v1/admin/telecallers/export?type=caller_leads&callerId=${c.callerId}`, "_blank")}
                  title={`Export leads assigned to ${c.callerId}`}
                  className="rounded-xl bg-teal-900/10 border border-teal-900/20 text-teal-950 py-2 text-[11px] font-bold hover:bg-teal-900/20 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>📥</span>
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePromptDelete(c)}
                  className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 py-2 text-[11px] font-bold hover:bg-rose-100 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>🗑️</span>
                  <span>Del</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. BULK LEAD RE-ASSIGNMENT ENGINE ── */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-teal-950 flex items-center gap-2">
              <span>Bulk Lead Re-Assignment &amp; Caller Lead Exporter</span>
              <span className="text-xs font-mono font-bold bg-cream px-2 py-0.5 rounded-full border border-teal-900/15">
                {leadsList.length} Leads in View
              </span>
            </h3>
            <p className="text-xs text-teal-950/60 mt-0.5">
              Filter by caller, select leads, and re-assign in bulk or download individual CSV files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Caller Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-teal-950/70">Caller:</span>
              <select
                value={selectedCallerForLeads}
                onChange={(e) => {
                  setSelectedCallerForLeads(e.target.value);
                  loadLeadsForReassignment(e.target.value);
                }}
                className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-bold bg-sand/30 text-teal-950 cursor-pointer"
              >
                <option value="ALL">ALL Telecallers ({totalLeads} total leads)</option>
                {callers.map((c) => (
                  <option key={c.callerId} value={c.callerId}>
                    {c.callerId} - {c.name} ({c.assignedCount} leads)
                  </option>
                ))}
              </select>
            </div>

            {/* Export Currently Filtered Caller Leads to CSV */}
            <button
              type="button"
              onClick={() => {
                const url =
                  selectedCallerForLeads === "ALL"
                    ? "/api/v1/admin/telecallers/export?type=leads"
                    : `/api/v1/admin/telecallers/export?type=caller_leads&callerId=${selectedCallerForLeads}`;
                window.open(url, "_blank");
                showToast(`✓ Downloading CSV for ${selectedCallerForLeads}...`);
              }}
              className="rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3 py-1.5 text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1"
            >
              <span>📥 Export {selectedCallerForLeads} CSV</span>
            </button>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-bold bg-white text-teal-950 cursor-pointer"
            >
              <option value="ALL">All Statuses ({leadsList.length})</option>
              <option value="Pending">Pending</option>
              <option value="Reschedule">Reschedule</option>
              <option value="Interested">Interested</option>
              <option value="Donated">Donated</option>
            </select>

            {/* Stream Selector */}
            <select
              value={leadStreamFilter}
              onChange={(e) => {
                setLeadStreamFilter(e.target.value as any);
                setLeadsPage(1);
              }}
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-bold bg-white text-teal-950 cursor-pointer"
            >
              <option value="ALL">All Sheets (Parents &amp; Donors)</option>
              <option value="PARENTS">👶 Parents Sheet (Child Birthday)</option>
              <option value="DIRECT_DONOR">🎂 Direct Donors Sheet</option>
            </select>

            {/* Sort by Date Selector */}
            <div className="flex items-center gap-1.5 bg-sand/40 border border-teal-900/15 rounded-xl px-2.5 py-1">
              <span className="text-xs font-bold text-teal-950/70 whitespace-nowrap">📅 Sort by Date:</span>
              <select
                value={leadDateSort}
                onChange={(e) => {
                  setLeadDateSort(e.target.value as any);
                  setLeadsPage(1);
                }}
                className="bg-transparent text-xs font-bold text-teal-950 outline-none cursor-pointer"
              >
                <option value="birthday_upcoming">🎂 Upcoming Birthday First</option>
                <option value="birthday_calendar">🎂 Calendar Date (Jan 1 → Dec 31)</option>
                <option value="date_newest">🆕 Date Added (Newest First)</option>
                <option value="date_oldest">⏳ Date Added (Oldest First)</option>
                <option value="callback_earliest">⏰ Callback Due (Earliest First)</option>
              </select>
            </div>

            <span className="text-xs text-teal-950/50">Transfer to:</span>
            <select
              value={targetCallerId}
              onChange={(e) => setTargetCallerId(e.target.value)}
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-bold bg-white text-teal-950 cursor-pointer"
            >
              {callers.map((c) => (
                <option key={c.callerId} value={c.callerId}>
                  {c.callerId} - {c.name} {c.isActive ? "" : "(Paused)"}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleBulkReassign}
              disabled={selectedLeadIds.length === 0 || actionLoading}
              className="rounded-xl bg-teal-950 text-gold px-4 py-1.5 text-xs font-black shadow-xs hover:bg-teal-900 disabled:opacity-50 transition cursor-pointer"
            >
              Re-assign {selectedLeadIds.length} Leads
            </button>
          </div>
        </div>

        {/* Quick Selection & Pagination Helper Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-sand/40 p-3 rounded-2xl border border-teal-900/10 text-xs mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-teal-950">
              Showing {filteredLeads.length === 0 ? 0 : (leadsPage - 1) * leadsPerPage + 1} - {Math.min(leadsPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
            </span>
            <span className="text-teal-950/40">|</span>
            <button
              type="button"
              onClick={toggleSelectCurrentPage}
              className="text-xs font-semibold text-teal-950 hover:underline cursor-pointer"
            >
              Select Page ({paginatedLeads.length})
            </button>
            <span className="text-teal-950/40">•</span>
            <button
              type="button"
              onClick={toggleSelectAllLeads}
              className="text-xs font-semibold text-teal-950 hover:underline cursor-pointer"
            >
              {selectedLeadIds.length === filteredLeads.length ? "Deselect All" : `Select All (${filteredLeads.length})`}
            </button>
            {selectedLeadIds.length > 0 && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[11px]">
                {selectedLeadIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-teal-950/70 font-semibold">Rows per page:</span>
            <select
              value={leadsPerPage}
              onChange={(e) => {
                setLeadsPerPage(Number(e.target.value));
                setLeadsPage(1);
              }}
              className="rounded-lg border border-teal-900/20 px-2 py-1 text-xs font-bold bg-white text-teal-950 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        {/* Leads Table (Desktop) */}
        <div className="hidden md:block overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10 sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedLeads.length > 0 &&
                      paginatedLeads.every((l) => selectedLeadIds.includes(l.leadId))
                    }
                    onChange={toggleSelectCurrentPage}
                    className="rounded text-teal-950"
                    title="Select/Deselect current page"
                  />
                </th>
                <th className="p-3">Stream / Sheet</th>
                <th className="p-3">Contact &amp; Celebrant</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Birthday Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3 text-right">Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-teal-950/50">
                    No leads found matching filter.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.leadId);
                  return (
                    <tr
                      key={lead.leadId}
                      onClick={() => toggleLeadSelection(lead.leadId)}
                      className={`cursor-pointer transition ${
                        isSelected ? "bg-amber-50/80" : "hover:bg-sand/30"
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-teal-950"
                        />
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          lead.stream === "DIRECT_DONOR"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                        }`}>
                          {lead.stream === "DIRECT_DONOR" ? "🎂 Donor" : "👶 Parents"}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-teal-950">
                        {lead.stream === "PARENTS" ? (
                          <div>
                            <div className="text-sm font-black text-indigo-950 flex items-center gap-1">
                              <span>👶</span>
                              <span>{lead.childName && lead.childName !== "Child" ? lead.childName : lead.name.replace(/\s*\(Child\)$/i, "")}</span>
                              <span className="text-[10px] font-normal text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">Child</span>
                            </div>
                            <div className="text-[11px] font-normal text-teal-950/70 mt-0.5">
                              Parent: <strong>{lead.parentName || "Parent"}</strong>
                            </div>
                          </div>
                        ) : (
                          <div>{lead.name}</div>
                        )}
                        {lead.lifetimeDonations && lead.lifetimeDonations > 0 ? (
                          <div className="text-[10px] font-black text-emerald-700">
                            ★ Prior Donor (₹{lead.lifetimeDonations.toLocaleString()})
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3 font-mono text-teal-950/80">{lead.phone}</td>
                      <td className="p-3 text-amber-800 font-semibold">
                        Day {lead.dobDay} / Month {lead.dobMonth}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                            lead.status === "Donated"
                              ? "bg-emerald-100 text-emerald-800"
                              : lead.status === "Interested"
                              ? "bg-amber-100 text-amber-800"
                              : lead.status === "Reschedule"
                              ? "bg-blue-100 text-blue-800"
                              : lead.status === "Rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-teal-900">
                        {lead.assignedCallerId || "Unassigned"}
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAdminWhatsApp(lead)}
                            className="focus-ring tap-scale inline-flex items-center gap-1 rounded-xl bg-[#25D366] hover:brightness-105 text-white px-2 py-1 text-[11px] font-bold shadow-2xs cursor-pointer"
                            title="Send Anti-Ban WhatsApp Message"
                          >
                            <span>💬</span> WhatsApp
                          </button>
                          <a
                            href={`tel:${lead.phone}`}
                            className="rounded-xl bg-teal-950 hover:bg-teal-900 text-white px-2 py-1 text-[11px] font-bold shadow-2xs inline-flex items-center justify-center"
                            title="Call donor directly"
                          >
                            📞
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Leads Card Deck */}
        <div className="md:hidden space-y-2.5 max-h-[500px] overflow-y-auto p-1">
          {filteredLeads.length === 0 ? (
            <div className="p-6 text-center text-xs text-teal-950/50">
              No leads found matching filter.
            </div>
          ) : (
            paginatedLeads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.leadId);
              return (
                <div
                  key={lead.leadId}
                  onClick={() => toggleLeadSelection(lead.leadId)}
                  className={`rounded-2xl p-3.5 border transition cursor-pointer space-y-2.5 shadow-2xs ${
                    isSelected
                      ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40"
                      : "bg-white border-teal-900/10 hover:border-teal-900/20"
                  }`}
                >
                  {/* Row 1: Checkbox + Name + Birthday */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-teal-950 h-4 w-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                            lead.stream === "DIRECT_DONOR"
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-indigo-100 text-indigo-900 border border-indigo-200"
                          }`}>
                            {lead.stream === "DIRECT_DONOR" ? "🎂 Donor" : "👶 Parents"}
                          </span>
                          {lead.lifetimeDonations && lead.lifetimeDonations > 0 ? (
                            <span className="text-[9px] font-black text-emerald-700">
                              ★ Prior Donor
                            </span>
                          ) : null}
                        </div>
                        {lead.stream === "PARENTS" ? (
                          <div>
                            <h4 className="font-black text-indigo-950 text-sm truncate flex items-center gap-1">
                              <span>👶</span>
                              <span>{lead.childName && lead.childName !== "Child" ? lead.childName : lead.name.replace(/\s*\(Child\)$/i, "")}</span>
                            </h4>
                            <p className="text-[11px] text-teal-950/70 font-medium truncate">
                              Parent: <strong>{lead.parentName || "Parent"}</strong>
                            </p>
                          </div>
                        ) : (
                          <h4 className="font-bold text-teal-950 text-sm truncate">
                            {lead.name}
                          </h4>
                        )}
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="font-mono text-teal-950/70">{lead.phone}</span>
                          {lead.dobDay && lead.dobMonth && (
                            <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                              🎂 {lead.dobDay}/{lead.dobMonth}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        lead.status === "Donated"
                          ? "bg-emerald-100 text-emerald-800"
                          : lead.status === "Interested"
                          ? "bg-amber-100 text-amber-800"
                          : lead.status === "Reschedule"
                          ? "bg-blue-100 text-blue-800"
                          : lead.status === "Rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  {/* Row 2: Assigned caller & Quick 1-tap Outreach Toolbar */}
                  <div
                    className="flex items-center justify-between pt-1 border-t border-teal-900/10 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] font-mono text-teal-900/70 font-semibold">
                      Assigned: {lead.assignedCallerId || "Unassigned"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex h-9 items-center justify-center gap-1 rounded-xl bg-teal-950 text-white px-3 text-xs font-bold shadow-2xs active:scale-95 transition"
                        title="Call donor directly"
                      >
                        <span>📞</span>
                        <span>Call</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenAdminWhatsApp(lead)}
                        className="flex h-9 items-center justify-center gap-1 rounded-xl bg-[#25D366] text-white px-3 text-xs font-black shadow-2xs active:scale-95 transition cursor-pointer"
                        title="Send Anti-Ban WhatsApp Message"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-teal-900/10 text-xs mt-3">
            <div className="text-teal-950/60 font-semibold">
              Page {leadsPage} of {totalPages}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLeadsPage(1)}
                disabled={leadsPage === 1}
                className="rounded-xl border border-teal-900/20 px-2.5 py-1 text-xs font-bold bg-white hover:bg-sand disabled:opacity-40 transition cursor-pointer"
              >
                ◀◀ First
              </button>
              <button
                type="button"
                onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                disabled={leadsPage === 1}
                className="rounded-xl border border-teal-900/20 px-3 py-1 text-xs font-bold bg-white hover:bg-sand disabled:opacity-40 transition cursor-pointer"
              >
                ◀ Prev
              </button>
              <span className="px-2 font-mono font-bold text-teal-950">
                {leadsPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setLeadsPage((p) => Math.min(totalPages, p + 1))}
                disabled={leadsPage === totalPages}
                className="rounded-xl border border-teal-900/20 px-3 py-1 text-xs font-bold bg-white hover:bg-sand disabled:opacity-40 transition cursor-pointer"
              >
                Next ▶
              </button>
              <button
                type="button"
                onClick={() => setLeadsPage(totalPages)}
                disabled={leadsPage === totalPages}
                className="rounded-xl border border-teal-900/20 px-2.5 py-1 text-xs font-bold bg-white hover:bg-sand disabled:opacity-40 transition cursor-pointer"
              >
                Last ▶▶
              </button>
            </div>
          </div>
        )}
      </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 2: FINANCIAL CRM & PAYMENT APPROVALS COCKPIT
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubtab === "financials" && (
        <div className="space-y-6">
          {/* 1. TODAY'S FINANCIAL SNAPSHOT (4 TILES) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="rounded-2xl bg-emerald-50/80 p-4 shadow-sm border border-emerald-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950 block">
                Today&apos;s Verified Collections
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
                {loadingFinancials ? "..." : `₹${formatINR(finStats?.today?.verified || 0)}`}
              </p>
              <span className="text-[11px] text-emerald-900/70 font-semibold block mt-0.5">
                Confirmed received in Ashram bank account
              </span>
            </div>

            <div className="rounded-2xl bg-amber-50/80 p-4 shadow-sm border border-amber-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                Pending Admin Verification
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-amber-800 mt-1">
                {loadingFinancials ? "..." : `₹${formatINR(finStats?.today?.pending || 0)}`}
              </p>
              <span className="text-[11px] text-amber-900/70 font-semibold block mt-0.5">
                {finStats?.pendingApprovals?.length || 0} claims waiting for bank statement match
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
                Today&apos;s Total Claimed
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-teal-950 mt-1">
                {loadingFinancials ? "..." : `₹${formatINR(finStats?.today?.claimed || 0)}`}
              </p>
              <span className="text-[11px] text-teal-950/60 font-semibold block mt-0.5">
                {finStats?.today?.totalCalls || 0} total calls logged by telecallers today
              </span>
            </div>

            <div className="rounded-2xl bg-rose-50/70 p-4 shadow-sm border border-rose-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-900 block">
                Rejected / Discrepancy
              </span>
              <p className="font-display text-2xl sm:text-3xl font-black text-rose-800 mt-1">
                {loadingFinancials ? "..." : `₹${formatINR(finStats?.today?.rejected || 0)}`}
              </p>
              <span className="text-[11px] text-rose-800/70 font-semibold block mt-0.5">
                Bounced, fake UTRs or unverified claims
              </span>
            </div>
          </div>

          {/* 2. MONTH-TO-DATE (MTD) ASHRAM TARGET & PERFORMANCE */}
          <div className="rounded-3xl bg-sand/35 p-5 border border-teal-900/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-black text-base text-teal-950 flex items-center gap-2">
                  <span>🎯 Monthly Ashram Seva Progress</span>
                  <span className="text-xs font-mono bg-teal-950 text-gold px-2.5 py-0.5 rounded-full font-bold">
                    Target: ₹{formatINR(finStats?.month?.target || 500000)}
                  </span>
                </h3>
                <p className="text-xs text-teal-950/70 mt-0.5">
                  Month-to-date verified collections credited to official Janaseva Ashrama trust account.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-950 bg-white px-3 py-1.5 rounded-xl border border-teal-900/15">
                  🏆 MTD Verified: <strong>₹{formatINR(finStats?.month?.verified || 0)}</strong>
                </span>
                <span className="text-xs font-bold text-teal-950 bg-white px-3 py-1.5 rounded-xl border border-teal-900/15">
                  👥 Donors: <strong>{finStats?.month?.donorsCount || 0}</strong>
                </span>
                <span className="text-xs font-bold text-teal-950 bg-white px-3 py-1.5 rounded-xl border border-teal-900/15">
                  Avg Ticket: <strong>₹{formatINR(finStats?.month?.averageDonation || 0)}</strong>
                </span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-teal-950">
                <span>{finStats?.month?.targetAchievedPercent || 0}% Achieved</span>
                <span>₹{formatINR(finStats?.month?.verified || 0)} / ₹{formatINR(finStats?.month?.target || 500000)}</span>
              </div>
              <div className="w-full bg-teal-950/10 rounded-full h-3 overflow-hidden border border-teal-900/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-teal-700 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(3, finStats?.month?.targetAchievedPercent || 0))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. PENDING PAYMENT APPROVALS COCKPIT */}
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-teal-900/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
              <div>
                <h3 className="font-display font-black text-base text-teal-950 flex items-center gap-2">
                  <span>💰 Pending Payment Approvals</span>
                  <span className="text-xs font-mono font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                    {finStats?.pendingApprovals?.length || 0} pending
                  </span>
                </h3>
                <p className="text-xs text-teal-950/60 mt-0.5">
                  Verify claimed donations against Ashrama bank statements. Approving permanently credits verified revenue.
                </p>
              </div>

              <button
                type="button"
                onClick={loadFinancialData}
                disabled={loadingFinancials}
                className="px-3 py-1.5 rounded-xl bg-sand hover:bg-cream text-teal-950 text-xs font-bold border border-teal-900/15 cursor-pointer shadow-2xs"
              >
                🔄 Refresh Approvals
              </button>
            </div>

            {loadingFinancials ? (
              <div className="p-8 text-center text-xs text-teal-950/60 bg-cream/40 rounded-2xl">
                Loading pending payment claims...
              </div>
            ) : !finStats?.pendingApprovals || finStats.pendingApprovals.length === 0 ? (
              <div className="p-8 text-center text-xs text-teal-950/60 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                🎉 All caught up! No pending payment claims waiting for verification.
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs text-teal-950">
                    <thead className="bg-sand/40 border-b border-teal-900/10 text-[11px] uppercase tracking-wider font-extrabold text-teal-950/70">
                      <tr>
                        <th className="py-2.5 px-3">Date &amp; Time</th>
                        <th className="py-2.5 px-3">Telecaller</th>
                        <th className="py-2.5 px-3">Donor Name &amp; Phone</th>
                        <th className="py-2.5 px-3">Claimed Amount</th>
                        <th className="py-2.5 px-3">Mode &amp; UTR</th>
                        <th className="py-2.5 px-3">Notes</th>
                        <th className="py-2.5 px-3 text-right">Verification Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-900/5 font-medium">
                      {finStats.pendingApprovals.map((p: any) => {
                        const dateDisplay = new Date(p.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const isActing = actionInProgress === p.txnId;

                        return (
                          <tr key={p.txnId} className="hover:bg-amber-50/30 transition">
                            <td className="py-3 px-3 text-[11px] text-teal-950/70 whitespace-nowrap">
                              {dateDisplay}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-teal-950 block">{p.callerName}</span>
                              <span className="text-[10px] font-mono text-teal-950/60">{p.callerRefId}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-teal-950 block">{p.donorName || "Anonymous Donor"}</span>
                              <span className="text-[10px] font-mono text-teal-950/60">{p.donorPhone}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-display font-black text-sm text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                                ₹{formatINR(p.amount)}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-[11px] block">{p.paymentMode || "UPI"}</span>
                              {p.utr ? (
                                <span className="font-mono text-[10px] text-teal-950/70 bg-sand/60 px-1 rounded">
                                  {p.utr}
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-800 italic">No UTR provided</span>
                              )}
                            </td>
                            <td className="py-3 px-3 max-w-[200px] truncate text-[11px] text-teal-950/70">
                              {p.notes || "—"}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveDonation(p.txnId)}
                                  disabled={isActing}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                                  title="Approve full claimed amount"
                                >
                                  {isActing ? "..." : "✓ Approve"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustingDonation(p);
                                    setAdjustedAmountInput(p.amount);
                                    setAdjustNoteInput("");
                                  }}
                                  disabled={isActing}
                                  className="px-2.5 py-1.5 rounded-lg bg-sand hover:bg-cream border border-teal-900/20 text-teal-950 font-bold text-xs cursor-pointer disabled:opacity-50"
                                  title="Correct amount and approve"
                                >
                                  ✏️ Adjust
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingDonation(p);
                                    setRejectionReasonInput("");
                                  }}
                                  disabled={isActing}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                                  title="Reject payment claim"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Touch-Friendly Card Stack */}
                <div className="md:hidden space-y-3">
                  {finStats.pendingApprovals.map((p: any) => {
                    const dateDisplay = new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const isActing = actionInProgress === p.txnId;

                    return (
                      <div
                        key={p.txnId}
                        className="rounded-2xl border border-teal-900/15 p-4 bg-white shadow-xs space-y-3 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-display font-bold text-teal-950 text-sm block">
                              {p.donorName || "Anonymous Donor"}
                            </span>
                            <span className="font-mono text-xs text-teal-900 font-semibold block">
                              📞 {p.donorPhone}
                            </span>
                            <span className="text-[10px] text-teal-950/60 block mt-0.5">
                              Caller: {p.callerName} ({p.callerRefId}) · {dateDisplay}
                            </span>
                          </div>
                          <span className="font-display font-black text-sm text-emerald-950 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-xl shrink-0">
                            ₹{formatINR(p.amount)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-sand/40 p-2 rounded-xl">
                          <span className="font-bold text-teal-950">Mode: {p.paymentMode || "UPI"}</span>
                          {p.utr && (
                            <span className="font-mono font-bold text-teal-900 bg-white px-1.5 py-0.5 rounded border border-teal-900/10">
                              UTR: {p.utr}
                            </span>
                          )}
                          {p.notes && (
                            <p className="w-full text-teal-950/70 italic text-[11px] mt-1 border-t border-teal-900/10 pt-1">
                              &ldquo;{p.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleApproveDonation(p.txnId)}
                            disabled={isActing}
                            className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs text-center cursor-pointer disabled:opacity-50"
                          >
                            {isActing ? "..." : "✓ Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingDonation(p);
                              setAdjustedAmountInput(p.amount);
                              setAdjustNoteInput("");
                            }}
                            disabled={isActing}
                            className="py-2.5 px-2 rounded-xl bg-sand hover:bg-cream border border-teal-900/20 text-teal-950 font-bold text-xs text-center cursor-pointer disabled:opacity-50"
                          >
                            ✏️ Adjust
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingDonation(p);
                              setRejectionReasonInput("");
                            }}
                            disabled={isActing}
                            className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 font-bold text-xs text-center cursor-pointer disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 4. INDIVIDUAL TELECALLER FINANCIAL CRM ROSTER */}
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-teal-900/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
              <div>
                <h3 className="font-display font-black text-base text-teal-950 flex items-center gap-2">
                  <span>👥 Individual Telecaller Financial CRM</span>
                  <span className="text-xs font-mono font-bold bg-cream px-2 py-0.5 rounded-full border border-teal-900/15">
                    {finStats?.callers?.length || 0} active callers
                  </span>
                </h3>
                <p className="text-xs text-teal-950/60 mt-0.5">
                  Ranked by verified collections. Telecaller accuracy rate measures verified amount vs claimed amount.
                </p>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-teal-950">
                <thead className="bg-sand/40 border-b border-teal-900/10 text-[11px] uppercase tracking-wider font-extrabold text-teal-950/70">
                  <tr>
                    <th className="py-2.5 px-3">Rank &amp; Caller</th>
                    <th className="py-2.5 px-3">Today&apos;s Calls</th>
                    <th className="py-2.5 px-3">Today Claimed</th>
                    <th className="py-2.5 px-3">Today Verified</th>
                    <th className="py-2.5 px-3">Today Pending</th>
                    <th className="py-2.5 px-3">MTD Verified</th>
                    <th className="py-2.5 px-3">Donors</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Shift Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-900/5 font-medium">
                  {finStats?.callers?.map((c: any, idx: number) => {
                    const isSubmitted = c.shiftStatus === "SUBMITTED";

                    return (
                      <tr key={c.callerId} className="hover:bg-cream/40 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 rounded px-1.5 py-0.2 border border-amber-300">
                              #{idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-teal-950 block">{c.name}</span>
                              <span className="text-[10px] font-mono text-teal-950/60">
                                {c.callerId} · +91 {c.whatsappNumber}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">{c.todayCalls}</td>
                        <td className="py-3 px-3 text-teal-950/70">₹{formatINR(c.todayClaimedAmount)}</td>
                        <td className="py-3 px-3 font-black text-emerald-800">₹{formatINR(c.todayVerifiedAmount)}</td>
                        <td className="py-3 px-3 font-bold text-amber-800">
                          {c.todayPendingAmount > 0 ? `₹${formatINR(c.todayPendingAmount)}` : "—"}
                        </td>
                        <td className="py-3 px-3 font-display font-black text-sm text-teal-950">
                          ₹{formatINR(c.monthVerifiedAmount)}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold">{c.monthDonorsCount}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              c.approvalRate >= 90
                                ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                                : c.approvalRate >= 70
                                ? "bg-amber-100 text-amber-950 border border-amber-300"
                                : "bg-rose-100 text-rose-950 border border-rose-300"
                            }`}
                          >
                            {c.approvalRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {isSubmitted ? (
                            <span className="rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 text-[10px] font-black">
                              ✓ Submitted
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                              ⏳ Active / Unsubmitted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleViewCallerLedger(c)}
                              className="px-2.5 py-1 rounded-lg bg-sand hover:bg-cream border border-teal-900/15 text-teal-950 text-xs font-bold cursor-pointer"
                              title="View individual donor attribution ledger"
                            >
                              📋 Ledger
                            </button>
                            {isSubmitted && (
                              <button
                                type="button"
                                onClick={() => handleUnlockCallerShift(c.callerId)}
                                className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 text-xs font-bold cursor-pointer"
                                title="Unlock shift so telecaller can make corrections"
                              >
                                🔓 Unlock
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stack */}
            <div className="md:hidden space-y-3">
              {finStats?.callers?.map((c: any, idx: number) => {
                const isSubmitted = c.shiftStatus === "SUBMITTED";

                return (
                  <div
                    key={c.callerId}
                    className="rounded-2xl border border-teal-900/15 p-4 bg-white shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 rounded px-2 py-0.5 border border-amber-300">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-teal-950 block text-sm">{c.name}</span>
                          <span className="text-[10px] font-mono text-teal-950/60">
                            {c.callerId} · +91 {c.whatsappNumber}
                          </span>
                        </div>
                      </div>
                      {isSubmitted ? (
                        <span className="rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 text-[10px] font-black shrink-0">
                          ✓ Submitted
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 text-[10px] font-bold shrink-0">
                          ⏳ Active
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-sand/30 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] text-teal-950/60 block">Calls Today:</span>
                        <span className="font-bold text-teal-950">{c.todayCalls}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-teal-950/60 block">Verified Today:</span>
                        <span className="font-bold text-emerald-800">₹{formatINR(c.todayVerifiedAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-teal-950/60 block">Claimed Today:</span>
                        <span className="font-semibold text-teal-950">₹{formatINR(c.todayClaimedAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-teal-950/60 block">Approval Accuracy:</span>
                        <span className="font-bold text-teal-950">{c.approvalRate}%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-teal-900/10">
                      <button
                        type="button"
                        onClick={() => handleViewCallerLedger(c)}
                        className="flex-1 py-2 rounded-xl bg-sand hover:bg-cream border border-teal-900/15 text-teal-950 text-xs font-bold text-center cursor-pointer"
                      >
                        📋 View Ledger
                      </button>
                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleUnlockCallerShift(c.callerId)}
                          className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-950 text-xs font-bold text-center cursor-pointer"
                        >
                          🔓 Unlock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 3: INSTAGRAM INFLUENCERS & CREATORS REFERRAL HUB
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubtab === "influencers" && (
        <div className="space-y-6">
          {/* Top Metric Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
                Total Influencer Funds Raised
              </span>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black text-emerald-800">
                {formatINR(totalInfluencerRaised)}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                {totalInfluencerDonors} completed donations
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
                Active Creators
              </span>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
                {influencers.filter((i) => i.status === "ACTIVE").length} / {influencers.length}
              </p>
              <span className="text-[10px] text-teal-950/60 font-semibold mt-0.5 block">
                Configured with custom referral links
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
                Wholesome Meals Sponsored
              </span>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black text-amber-900">
                {Math.round(totalInfluencerRaised / 50).toLocaleString()} Meals
              </p>
              <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
                For 25 resident boys in Bengaluru
              </span>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm border border-teal-900/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
                Average Donation Ticket
              </span>
              <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
                {formatINR(totalInfluencerDonors > 0 ? Math.round(totalInfluencerRaised / totalInfluencerDonors) : 0)}
              </p>
              <span className="text-[10px] text-teal-950/60 font-semibold mt-0.5 block">
                Per contributing follower
              </span>
            </div>
          </div>

          {/* Action Bar */}
          <div className="rounded-3xl bg-amber-50/60 p-5 border border-amber-200/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">📸</span>
                <h3 className="font-display text-base font-bold text-teal-950">
                  Instagram Influencer Campaign Manager
                </h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 border border-emerald-300">
                  30-Day Attribution Active
                </span>
              </div>
              <p className="text-xs text-teal-950/70 mt-1 max-w-xl leading-relaxed">
                Generate custom referral links (<code className="font-mono text-teal-900 font-bold">/give?ref=CODE</code>) for Instagram creators. Track every rupee raised, send 1-click WhatsApp EOD Impact Cards, and download audit-ready CSV donor ledgers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenAddInfluencer}
                disabled={actionLoading}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-3.5 py-2 text-xs font-black shadow-xs transition cursor-pointer"
              >
                <span>➕ Add Creator Partner</span>
              </button>

              <button
                type="button"
                onClick={() => window.open("/api/v1/admin/influencers/export?type=summary", "_blank")}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>📥 Export All Summary (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => void loadInfluencers()}
                disabled={loadingInfluencers}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-sand/60 hover:bg-sand border border-teal-900/10 text-teal-950 px-3 py-2 text-xs font-bold transition cursor-pointer"
              >
                <span>{loadingInfluencers ? "Refreshing..." : "🔄 Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Influencer Cards Grid */}
          {influencers.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-teal-900/10 shadow-sm space-y-3">
              <div className="text-4xl">📸</div>
              <h4 className="font-display text-base font-bold text-teal-950">No Instagram Influencers Added Yet</h4>
              <p className="text-xs text-teal-950/60 max-w-md mx-auto">
                Partner with Instagram creators, fitness coaches, food bloggers, or public figures. Click &quot;Add Creator Partner&quot; to give them a custom referral code.
              </p>
              <button
                type="button"
                onClick={handleOpenAddInfluencer}
                className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-xs transition cursor-pointer"
              >
                ➕ Create First Creator Link
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {influencers.map((inf, idx) => (
                <div
                  key={inf.id}
                  className="rounded-3xl bg-white p-5 border border-teal-900/10 shadow-sm space-y-4 hover:border-teal-900/30 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-950 text-gold text-xs font-black">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-teal-950">{inf.displayName}</h4>
                          <p className="text-[11px] font-mono text-teal-900/70 flex items-center gap-1.5">
                            <span>{inf.instagramHandle || "@creator"}</span>
                            <span>•</span>
                            <span className="font-black text-amber-800">{inf.influencerCode}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleInfluencerStatus(inf.influencerCode, inf.status)}
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer transition ${
                          inf.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {inf.status === "ACTIVE" ? "● Active" : "○ Paused"}
                      </button>
                    </div>

                    {/* Progress Bar & Funds Raised */}
                    <div className="rounded-2xl bg-cream/50 p-3 border border-teal-900/10 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-teal-950/70">Funds Raised:</span>
                        <span className="font-display font-black text-emerald-800 text-sm">
                          {formatINR(inf.totalDonationAmount)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${inf.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-teal-950/60">
                        <span>Goal: {formatINR(inf.targetGoalAmount)}</span>
                        <span className="font-black text-teal-950">{inf.progressPercent}% Achieved</span>
                      </div>
                    </div>

                    {/* Donor & Ticket Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-slate-50 p-2 border border-slate-200/60">
                        <span className="block text-[9px] text-teal-950/60 uppercase">Donors</span>
                        <span className="font-bold text-teal-950 text-xs">{inf.totalDonorsCount}</span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2 border border-slate-200/60">
                        <span className="block text-[9px] text-teal-950/60 uppercase">Avg Ticket</span>
                        <span className="font-bold text-teal-950 text-xs">{formatINR(inf.averageDonation)}</span>
                      </div>
                      <div className="rounded-xl bg-amber-50 p-2 border border-amber-200/60">
                        <span className="block text-[9px] text-amber-900 uppercase">Meals</span>
                        <span className="font-bold text-amber-900 text-xs">
                          {Math.round(inf.totalDonationAmount / 50)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="space-y-1.5 pt-2 border-t border-teal-900/10">
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyText(inf.referralLink, "Instagram Referral Link")}
                        className="rounded-xl bg-sand/50 hover:bg-sand border border-teal-900/20 text-teal-950 py-1.5 text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Copy direct checkout link to clipboard"
                      >
                        <span>🔗</span>
                        <span>Copy Link</span>
                      </button>

                      <a
                        href={inf.whatsappKitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 py-1.5 text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                        title="Open WhatsApp with ready-to-post Story caption & link"
                      >
                        <span>📱</span>
                        <span>Share Kit</span>
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <a
                        href={inf.whatsappReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 py-1.5 text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                        title="Send today's live impact update to creator via WhatsApp"
                      >
                        <span>📲</span>
                        <span>EOD Card</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => window.open(`/api/v1/admin/influencers/export?code=${inf.influencerCode}`, "_blank")}
                        className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold py-1.5 text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Download complete donor ledger CSV for this creator"
                      >
                        <span>📥</span>
                        <span>CSV Ledger</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1: ADD NEW TELECALLER
      ══════════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-t-4 border-teal-800 sm:border border-teal-900/10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-4 border-b border-teal-900/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-950 text-gold flex items-center justify-center font-black">
                  ➕
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-teal-950">Add New Telecaller</h3>
                  <p className="text-[11px] text-teal-950/60">Create credentials and add to round-robin roster</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-teal-950/40 hover:text-teal-950 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTelecaller} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-teal-950 mb-1">Caller ID</label>
                  <input
                    type="text"
                    required
                    value={addCallerForm.callerId}
                    onChange={(e) => setAddCallerForm({ ...addCallerForm, callerId: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-mono font-bold uppercase text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                    placeholder="e.g. TC16"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-teal-950 mb-1">Daily Target</label>
                  <input
                    type="number"
                    value={addCallerForm.dailyQuota}
                    onChange={(e) =>
                      setAddCallerForm({ ...addCallerForm, dailyQuota: Number(e.target.value) || 50 })
                    }
                    className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-bold text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addCallerForm.name}
                  onChange={(e) => setAddCallerForm({ ...addCallerForm, name: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-bold text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="e.g. Rajesh Bhat"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">WhatsApp Mobile (10 Digits)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-teal-950/50">+91</span>
                  <input
                    type="tel"
                    required
                    value={addCallerForm.whatsappNumber}
                    onChange={(e) => setAddCallerForm({ ...addCallerForm, whatsappNumber: e.target.value })}
                    className="w-full rounded-xl border border-teal-900/20 pl-11 pr-3 py-2 text-xs font-mono font-bold text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                    placeholder="9845012345"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">Email Address</label>
                <input
                  type="email"
                  value={addCallerForm.email}
                  onChange={(e) => setAddCallerForm({ ...addCallerForm, email: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="e.g. tc16@janaseva.org"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">Portal Password</label>
                <input
                  type="password"
                  value={addCallerForm.password}
                  onChange={(e) => setAddCallerForm({ ...addCallerForm, password: e.target.value })}
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                  placeholder="ashrama@123"
                />
                <span className="text-[10px] text-teal-950/50 mt-0.5 block">
                  Telecaller uses Caller ID &amp; Password to login at <code className="font-mono">/portal</code>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-5 py-2 text-xs font-black shadow-xs transition cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Create Telecaller"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2: DELETE TELECALLER CONFIRMATION
      ══════════════════════════════════════════════════════════════════ */}
      {isDeleteModalOpen && callerToDelete && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-t-4 border-rose-600 sm:border border-rose-200 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-rose-900/20 mb-2 shrink-0" />
            <div className="flex items-center gap-3 text-rose-700 pb-3 border-b border-rose-100">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-display text-base font-bold">Delete Telecaller {callerToDelete.callerId}?</h3>
                <p className="text-xs text-teal-950/60">This action will permanently remove the telecaller profile.</p>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs text-teal-950/80">
              <div className="p-3 bg-sand rounded-xl border border-teal-900/10">
                <p className="font-bold text-teal-950">{callerToDelete.name} ({callerToDelete.callerId})</p>
                <p className="text-[11px] text-teal-950/60">Currently assigned: {callerToDelete.assignedCount} leads</p>
                <p className="text-[11px] text-teal-950/60">Attributed donations: {formatINR(callerToDelete.totalDonationAmount)}</p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-xl bg-amber-50 border border-amber-200">
                <input
                  type="checkbox"
                  checked={redistributeOnDelete}
                  onChange={(e) => setRedistributeOnDelete(e.target.checked)}
                  className="mt-0.5 rounded text-teal-950"
                />
                <span className="text-xs text-amber-900 font-semibold">
                  Automatically redistribute their {callerToDelete.assignedCount} assigned leads equally to remaining active telecallers
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-5 py-2 text-xs font-black shadow-xs transition cursor-pointer"
              >
                {actionLoading ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2B: DELETE ALL LEADS CONFIRMATION
      ══════════════════════════════════════════════════════════════════ */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border-t-4 border-rose-600 sm:border-2 border-rose-300 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-rose-900/20 mb-2 shrink-0" />
            <div className="flex items-center gap-3 text-rose-700 pb-3 border-b border-rose-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 text-2xl font-bold">
                🗑️
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-rose-950">Delete ALL Leads from CRM?</h3>
                <p className="text-xs text-rose-700">Permanent database wipe for real donor rollout</p>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs text-teal-950/80">
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-1.5">
                <p className="font-bold text-rose-950 text-sm">
                  ⚠️ Warning: This will delete all {totalLeads} leads and all historical call logs!
                </p>
                <p className="text-rose-900 text-[11px] leading-relaxed">
                  Use this when you are ready to remove test/demo data and upload the official real donor Excel sheet.
                </p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <span>✓</span> Telecaller Staff Logins Preserved
                </p>
                <p className="text-emerald-900 text-[11px] mt-0.5">
                  All telecaller accounts (TC01 to TC16), passwords, and phone numbers remain completely safe and untouched.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAllLeads}
                disabled={actionLoading}
                className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-5 py-2 text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Deleting All..." : "Confirm Delete All Leads"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2C: RESET DAILY LIMIT & REBALANCE QUEUE
      ══════════════════════════════════════════════════════════════════ */}
      {isResetDailyModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-amber-300 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-3 shrink-0" />
            <div className="flex items-center gap-3 text-amber-800 pb-3 border-b border-amber-100">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 text-2xl font-bold">
                🔄
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-teal-950">Reset Daily Calling Queue</h3>
                <p className="text-xs text-amber-800">Fresh daily limit distribution for active callers</p>
              </div>
            </div>

            <div className="my-4 space-y-3 text-xs text-teal-950/80">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-1.5">
                <p className="font-bold text-amber-950 text-xs">
                  How Daily Reset Works:
                </p>
                <ul className="list-disc list-inside space-y-1 text-amber-900 text-[11px] leading-relaxed">
                  <li>Resets all non-donated leads back to <span className="font-bold">Pending</span> status.</li>
                  <li>Preserves all confirmed <span className="font-bold text-emerald-800">Donated</span> gifts and payment receipts.</li>
                  <li>Mathematically balances and divides pending leads equally across all {activeCallersCount} active telecallers (~{equalQuotaPerCaller} each).</li>
                </ul>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-teal-950 mb-1">
                  Distribution Arithmetic Algorithm:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    onClick={() => setResetDistributionMode("balanced")}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
                      resetDistributionMode === "balanced"
                        ? "bg-teal-950 text-gold border-teal-950"
                        : "bg-white text-teal-950 border-teal-900/20 hover:bg-sand"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      checked={resetDistributionMode === "balanced"}
                      onChange={() => setResetDistributionMode("balanced")}
                      className="hidden"
                    />
                    <span>⚖️ Workload Balanced</span>
                  </label>
                  <label
                    onClick={() => setResetDistributionMode("round_robin")}
                    className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
                      resetDistributionMode === "round_robin"
                        ? "bg-teal-950 text-gold border-teal-950"
                        : "bg-white text-teal-950 border-teal-900/20 hover:bg-sand"
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetMode"
                      checked={resetDistributionMode === "round_robin"}
                      onChange={() => setResetDistributionMode("round_robin")}
                      className="hidden"
                    />
                    <span>🔄 Round Robin</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setIsResetDailyModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDailyQuota}
                disabled={actionLoading}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Resetting..." : "Confirm Reset Daily Queue"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3: BULK LEAD UPLOAD & EQUAL DISTRIBUTION
      ══════════════════════════════════════════════════════════════════ */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-teal-900/10 h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-teal-900/10 shrink-0 bg-white">
              <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-teal-950 text-gold flex items-center justify-center font-black">
                    📤
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-teal-950">Bulk Upload Birthday Leads</h3>
                    <p className="text-[11px] text-teal-950/60">
                      Import leads from CSV or paste Excel sheets &amp; distribute equally to telecallers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (uploadProgress?.inProgress || actionLoading) {
                      setIsCancelConfirmOpen(true);
                      return;
                    }
                    setIsUploadModalOpen(false);
                  }}
                  className="text-teal-950/40 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
              {/* Auto-Enrichment Notice */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
                <span className="text-base shrink-0">✨</span>
                <div>
                  <p className="font-bold">Student Name Auto-Enrichment Enabled</p>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Re-uploading your Excel sheet with the <strong>Student</strong> or <strong>Student Name</strong> column immediately enriches existing leads with their real student names. Zero duplicate calls created!
                  </p>
                </div>
              </div>

              {/* Dual-Stream Category Selector */}
              <div className="rounded-2xl bg-teal-950/5 p-3.5 border border-teal-900/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-teal-950 uppercase tracking-wider">
                    Select Data Stream / Sheet Type:
                  </span>
                  <span className="rounded-full bg-teal-950 text-gold text-[10px] font-black px-2.5 py-0.5">
                    {uploadStream === "PARENTS" ? "👶 Parents Sheet Selected" : "🎂 Direct Donors Sheet Selected"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadStream("PARENTS");
                      if (pastedText && pastedText.trim()) {
                        const rawLines = pastedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
                        const grid = rawLines.map((line) => parseCSVLine(line));
                        parse2DGrid(grid, "PARENTS");
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-2xl text-left border transition cursor-pointer ${
                      uploadStream === "PARENTS"
                        ? "bg-teal-950 text-white border-teal-950 shadow-md ring-2 ring-amber-400"
                        : "bg-white text-teal-950 border-teal-900/15 hover:bg-sand/60"
                    }`}
                  >
                    <span className="text-2xl shrink-0">👶</span>
                    <div>
                      <p className="font-bold text-xs">Sheet 1: Parents (Child Birthday)</p>
                      <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                        Parent Name &amp; Phone, Child Name &amp; Birthday. Callers wish child 1 day in advance &amp; seek meal sponsorship for ashrama boys.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadStream("DIRECT_DONOR");
                      if (pastedText && pastedText.trim()) {
                        const rawLines = pastedText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
                        const grid = rawLines.map((line) => parseCSVLine(line));
                        parse2DGrid(grid, "DIRECT_DONOR");
                      }
                    }}
                    className={`flex items-start gap-3 p-3 rounded-2xl text-left border transition cursor-pointer ${
                      uploadStream === "DIRECT_DONOR"
                        ? "bg-teal-950 text-white border-teal-950 shadow-md ring-2 ring-amber-400"
                        : "bg-white text-teal-950 border-teal-900/15 hover:bg-sand/60"
                    }`}
                  >
                    <span className="text-2xl shrink-0">🎂</span>
                    <div>
                      <p className="font-bold text-xs">Sheet 2: Direct Donors (Donor Birthday)</p>
                      <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                        Donor Name &amp; Phone, Donor Birthday. Callers wish donor 1 day in advance for ashrama blessings &amp; contributions.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-2 border-b border-teal-900/10 pb-2">
                <button
                  type="button"
                  onClick={() => setUploadMode("paste")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    uploadMode === "paste"
                      ? "bg-teal-950 text-gold"
                      : "bg-cream text-teal-950 hover:bg-sand"
                  }`}
                >
                  📋 Copy-Paste Spreadsheets (Excel / Sheets)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    uploadMode === "file"
                      ? "bg-teal-950 text-gold"
                      : "bg-cream text-teal-950 hover:bg-sand"
                  }`}
                >
                  📁 Upload Excel / CSV File (.xlsx, .xls, .csv)
                </button>
              </div>

              {/* Format Hint & Template Download */}
              <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-200/80 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <span>💡</span> Column Support for {uploadStream === "PARENTS" ? "Parents Sheet" : "Direct Donors"}
                  </p>
                  <p className="text-[11px] text-amber-800/80 font-mono">
                    {uploadStream === "PARENTS"
                      ? "Parent Name, Parent Mobile (10-digit), Child Name, Child Birthday Day & Month"
                      : "Donor Name, Donor Mobile (10-digit), Birthday Day & Month, Email"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadParentsTemplate}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                  >
                    📥 Parents Template (.csv)
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDonorsTemplate}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                  >
                    📥 Donors Template (.csv)
                  </button>
                </div>
              </div>

              {uploadMode === "paste" ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-teal-950">
                      Paste Rows (CSV, TSV, or Tab-Separated from Excel):
                    </label>
                    <span className="text-[10px] text-teal-950/60 font-semibold">
                      Auto-detects columns
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      parseRawLeadText(e.target.value);
                    }}
                    placeholder={
                      uploadStream === "PARENTS"
                        ? `Parent Name, Parent Phone, Child Name, Birthday Day, Birthday Month, Email\nSuresh Gowda, 9880123456, Aarav Gowda, 14, 10, suresh@gmail.com\nLakshmi Devi, 9845011002, Ananya, 15, 10, lakshmi@yahoo.com`
                        : `Donor Name, Phone Number, Birthday Day, Birthday Month, Email\nVijay Kumar, 9845011001, 14, 10, vijay@gmail.com\nDeepa Rao, 9845011002, 15, 10, deepa@yahoo.com`
                    }
                    className="w-full rounded-2xl border border-teal-900/20 p-3 font-mono text-xs text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      parseUploadedFile(file);
                    }
                  }}
                  className="border-2 border-dashed border-teal-900/20 rounded-2xl p-6 text-center hover:bg-sand/30 transition cursor-pointer"
                >
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <span className="text-3xl block mb-2">📁</span>
                    <span className="text-xs font-bold text-teal-950 block">
                      {uploadedFileName ? `Selected: ${uploadedFileName}` : "Click to browse or Drag & Drop Excel (.xlsx / .xls) or CSV file here"}
                    </span>
                    <span className="text-[11px] text-teal-950/60 block mt-1">
                      Directly parses Microsoft Excel spreadsheets (.xlsx, .xls), Google Sheets exports, and CSV/TSV files
                    </span>
                  </label>

                  {/* Dynamic Status Pill */}
                  {uploadedFileName && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {parsedLeads.length > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                          <span>✓ Detected {parsedLeads.length.toLocaleString()} Valid Indian Mobile Leads</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                          <span>⚠️ No valid Indian mobile numbers detected in this file yet</span>
                        </div>
                      )}
                      {parsedJunkCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                          <span>🛡️ {parsedJunkCount.toLocaleString()} junk / landline numbers filtered out</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Live Preview with Date Sort Option */}
              {parsedLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-teal-950">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700">✓ Detected {parsedLeads.length.toLocaleString()} Valid Leads Ready for Distribution</span>
                      {parsedJunkCount > 0 && (
                        <span className="text-amber-800 text-[11px] font-semibold">({parsedJunkCount.toLocaleString()} junk dropped)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const curM = now.getMonth() + 1;
                          const curD = now.getDate();
                          const sorted = [...parsedLeads].sort((a, b) => {
                            let diffA = (a.dobMonth - curM) * 31 + (a.dobDay - curD);
                            if (diffA < 0) diffA += 372;
                            let diffB = (b.dobMonth - curM) * 31 + (b.dobDay - curD);
                            if (diffB < 0) diffB += 372;
                            return diffA - diffB;
                          });
                          setParsedLeads(sorted);
                          showToast("✓ Sorted parsed leads by upcoming birthday date!");
                        }}
                        className="rounded-lg bg-sand border border-teal-900/20 px-2.5 py-1 text-[11px] font-bold text-teal-950 hover:bg-amber-100 transition cursor-pointer"
                        title="Sort so donors with birthdays today or coming soon are distributed first"
                      >
                        🎂 Sort by Birthday (Upcoming First)
                      </button>
                      <span className="text-[10px] text-teal-950/50">Previewing first 4 rows</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-36 rounded-xl border border-teal-900/10">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-cream font-bold border-b border-teal-900/10">
                        <tr>
                          <th className="p-2">Stream</th>
                          <th className="p-2">Name / Celebrant</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">Birthday Date</th>
                          <th className="p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-900/5">
                        {parsedLeads.slice(0, 4).map((pl, idx) => (
                          <tr key={idx} className="hover:bg-sand/40">
                            <td className="p-2">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                pl.stream === "PARENTS" ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {pl.stream === "PARENTS" ? "👶 Parents" : "🎂 Donor"}
                              </span>
                            </td>
                            <td className="p-2 font-bold">
                              <div>{pl.name}</div>
                              {pl.childName && (
                                <div className="text-[10px] font-normal text-teal-950/60">
                                  Parent: {pl.parentName || "—"} | Child: {pl.childName}
                                </div>
                              )}
                            </td>
                            <td className="p-2 font-mono">+91 {pl.phone}</td>
                            <td className="p-2 font-semibold text-amber-800">
                              {pl.dobDay}/{pl.dobMonth}
                            </td>
                            <td className="p-2 text-teal-950/60">{pl.email || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Distribution Options */}
              <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDistributeOnUpload}
                    onChange={(e) => setAutoDistributeOnUpload(e.target.checked)}
                    className="rounded text-teal-950"
                  />
                  <span className="text-xs font-bold text-teal-950">
                    Equally distribute leads across all {activeCallersCount} active telecallers immediately
                  </span>
                </label>

                {autoDistributeOnUpload && (
                  <div className="flex items-center gap-4 text-xs pl-6">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="distMode"
                        checked={distributionMode === "balanced"}
                        onChange={() => setDistributionMode("balanced")}
                      />
                      <span>Balanced (Even workload balancing)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="distMode"
                        checked={distributionMode === "round_robin"}
                        onChange={() => setDistributionMode("round_robin")}
                      />
                      <span>Round-Robin (Sequential)</span>
                    </label>
                  </div>
                )}
              </div>
              {/* High-Volume Upload & Chunking Progress Bar */}
              {uploadProgress && (
                <div className="rounded-2xl bg-teal-950 text-sand p-4 space-y-3 shadow-md border border-gold/30 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gold flex items-center gap-2">
                      {uploadProgress.stage === "distributing" ? (
                        <>
                          <span className="animate-spin text-base">⚙️</span>
                          <span>Equal Distribution in Progress...</span>
                        </>
                      ) : uploadProgress.stage === "done" ? (
                        <>
                          <span className="text-emerald-400 text-base">✓</span>
                          <span className="text-emerald-300 font-black">All Leads Ingested & Distributed!</span>
                        </>
                      ) : uploadProgress.stage === "error" ? (
                        <>
                          <span className="text-rose-400 text-base">⚠️</span>
                          <span className="text-rose-300">Upload Encountered Error</span>
                        </>
                      ) : (
                        <>
                          <span className="animate-pulse text-base">🚀</span>
                          <span>
                            Chunk {uploadProgress.currentChunk} of {uploadProgress.totalChunks} (500 leads/chunk)
                          </span>
                        </>
                      )}
                    </span>
                    <span className="font-mono text-gold font-black text-sm">{uploadProgress.percent}%</span>
                  </div>

                  {/* Progress Track */}
                  <div className="w-full bg-teal-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-teal-800">
                    <div
                      className="bg-linear-to-r from-amber-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-300 shadow-sm"
                      style={{ width: `${Math.max(3, uploadProgress.percent)}%` }}
                    />
                  </div>

                  {/* Realtime Numbers */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-sand/80 gap-2 font-mono">
                    <span>
                      {uploadProgress.processedLeads.toLocaleString()} / {uploadProgress.totalLeads.toLocaleString()} leads processed
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-300 font-bold">✓ {uploadProgress.insertedTotal.toLocaleString()} unique added</span>
                      {uploadProgress.enrichedTotal != null && uploadProgress.enrichedTotal > 0 && (
                        <span className="text-blue-300 font-bold">🎓 {uploadProgress.enrichedTotal.toLocaleString()} student names updated</span>
                      )}
                      <span className="text-amber-300">⚡ {uploadProgress.duplicatesTotal.toLocaleString()} duplicates filtered</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-sand/70 italic truncate">
                    {uploadProgress.statusMessage}
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 p-4 sm:p-5 border-t border-teal-900/10 bg-sand/20 flex items-center justify-end gap-2 pb-6 sm:pb-4 safe-area-pb flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (uploadProgress?.inProgress || actionLoading) {
                    setIsCancelConfirmOpen(true);
                    return;
                  }
                  setIsUploadModalOpen(false);
                  setUploadProgress(null);
                }}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition cursor-pointer"
              >
                {uploadProgress?.inProgress || actionLoading ? "Stop / Cancel" : "Cancel"}
              </button>

              {uploadProgress?.stage === "error" && (
                <>
                  {currentUploadBatchIdRef.current && (
                    <button
                      type="button"
                      onClick={() => handleCancelUpload(true)}
                      disabled={cancellingUpload}
                      className="rounded-xl bg-rose-700 hover:bg-rose-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>⏪ Rollback File</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResumeUpload}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 text-teal-950 px-4 py-2 text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>▶ Resume Upload</span>
                  </button>
                </>
              )}

              {uploadProgress?.stage !== "error" && (
                <button
                  type="button"
                  onClick={handleExecuteLeadUpload}
                  disabled={actionLoading || parsedLeads.length === 0}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <span className="animate-spin text-xs">⚙️</span>}
                  <span>
                    {actionLoading
                      ? `Importing Chunk ${uploadProgress?.currentChunk || 1}/${uploadProgress?.totalChunks || 1}...`
                      : `Import & Distribute ${parsedLeads.length.toLocaleString()} Leads`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3B: IN-FLIGHT CANCEL & SAFE ROLLBACK DIALOG ── */}
      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-rose-300 space-y-4 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-rose-900/20 mb-2 shrink-0" />
            <div className="flex items-center gap-3 text-rose-700 pb-2 border-b border-rose-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-xl font-bold">🛑</span>
              <div>
                <h3 className="font-display text-base font-bold text-teal-950">Stop Lead Upload?</h3>
                <p className="text-xs text-rose-800">Chunk {uploadProgress?.currentChunk || 1} of {uploadProgress?.totalChunks || 1} is currently in progress.</p>
              </div>
            </div>

            <p className="text-xs text-teal-950/80 leading-relaxed">
              Did you upload the wrong Excel file by mistake? You can either safely delete (rollback) this file, or stop and keep leads uploaded so far.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleCancelUpload(true)}
                disabled={cancellingUpload}
                className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-left flex items-start gap-3 transition cursor-pointer"
              >
                <span className="text-xl">⏪</span>
                <div>
                  <span className="font-bold text-xs text-rose-950 block">Cancel &amp; Rollback This File</span>
                  <span className="text-[11px] text-rose-800/80">Stops upload immediately and deletes untouched leads from this batch</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCancelUpload(false)}
                disabled={cancellingUpload}
                className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-left flex items-start gap-3 transition cursor-pointer"
              >
                <span className="text-xl">💾</span>
                <div>
                  <span className="font-bold text-xs text-amber-950 block">Stop &amp; Keep Processed Leads</span>
                  <span className="text-[11px] text-amber-800/80">Stops further chunks; keeps {uploadProgress?.insertedTotal?.toLocaleString() || 0} leads already saved in database</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={cancellingUpload}
                className="w-full py-2.5 rounded-xl bg-sand/60 hover:bg-sand text-center text-xs font-bold text-teal-950 transition cursor-pointer"
              >
                ▶ Continue Uploading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3C: SAFE NON-DESTRUCTIVE BATCH ROLLBACK ── */}
      {isRollbackModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-2 border-amber-400 max-h-[90vh] overflow-y-auto space-y-4 pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-teal-900/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 text-xl font-bold">⏪</span>
                <div>
                  <h3 className="font-display text-base font-bold text-teal-950">Rollback Upload Batch</h3>
                  <p className="text-xs text-amber-900">Safely undo an accidental wrong file upload</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRollbackModalOpen(false)}
                className="rounded-full bg-cream p-1.5 text-teal-950/60 hover:text-teal-950 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <span>🛡️ Non-Destructive Protection Guarantee:</span>
              </div>
              <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                Only untouched, pending leads from the selected batch will be deleted. Any lead that a telecaller has already contacted, logged calls for, or collected a donation for is <strong>100% PROTECTED</strong> and will never be removed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-teal-950">
                Select Upload Batch to Rollback:
              </label>
              {recentBatches.length === 0 ? (
                <div className="p-4 rounded-xl bg-sand/40 border border-teal-900/10 text-xs text-teal-950/70 text-center">
                  No tagged upload batches found in database.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recentBatches.map((batch) => {
                    const isSelected = (selectedBatchForRollback || recentBatches[0]?.batchId) === batch.batchId;
                    return (
                      <div
                        key={batch.batchId}
                        onClick={() => setSelectedBatchForRollback(batch.batchId)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/30"
                            : "bg-cream/40 border-teal-900/10 hover:bg-cream"
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-mono font-bold text-teal-950 truncate max-w-[260px] sm:max-w-xs">
                            {batch.batchId}
                          </div>
                          <div className="text-[10px] text-teal-950/60">
                            {new Date(batch.createdAt).toLocaleString()} · {batch.totalCount.toLocaleString()} total leads
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-rose-700 block">
                            -{batch.pendingCount.toLocaleString()} pending
                          </span>
                          {batch.contactedCount > 0 && (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ✓ {batch.contactedCount.toLocaleString()} protected
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setIsRollbackModalOpen(false)}
                disabled={rollingBackBatch}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteRollback()}
                disabled={rollingBackBatch || recentBatches.length === 0}
                className="rounded-xl bg-rose-700 hover:bg-rose-800 active:scale-95 text-white px-5 py-2 text-xs font-black shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {rollingBackBatch && <span className="animate-spin text-xs">⚙️</span>}
                <span>{rollingBackBatch ? "Rolling back batch..." : "Confirm Rollback"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TELECALLER CREDENTIALS & ACCESS MODAL ── */}
      {isAccessModalOpen && selectedCallerForAccess && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-teal-900/10 text-teal-950 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-950 text-gold font-display font-black text-sm">
                  {selectedCallerForAccess.callerId}
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-teal-950 flex items-center gap-2">
                    {selectedCallerForAccess.name}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                        selectedCallerForAccess.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {selectedCallerForAccess.isActive ? "Active" : "Paused"}
                    </span>
                  </h3>
                  <p className="text-xs text-teal-950/60 font-mono">
                    ID: {selectedCallerForAccess.callerId} · Quota: {selectedCallerForAccess.dailyQuota || 50}/day
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(false)}
                className="text-teal-950/50 hover:text-teal-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Portal & Login Credentials Info */}
            <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-teal-900/5">
                <span className="font-bold text-teal-950/70">Login Identifier:</span>
                <span className="font-mono font-bold text-teal-950">{selectedCallerForAccess.callerId}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-teal-900/5">
                <span className="font-bold text-teal-950/70">Registered Email:</span>
                <span className="font-mono text-teal-900 font-semibold">
                  {selectedCallerForAccess.email || `${selectedCallerForAccess.callerId.toLowerCase()}@janaseva.org`}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-teal-900/5">
                <span className="font-bold text-teal-950/70">WhatsApp Mobile:</span>
                <span className="font-mono text-teal-900 font-semibold">+91 {selectedCallerForAccess.whatsappNumber}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-teal-900/5">
                <span className="font-bold text-teal-950/70">Telecaller Portal:</span>
                <span className="font-mono text-teal-950 font-bold">/portal</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-teal-950/70">Referral Link:</span>
                <span className="font-mono font-bold text-amber-900">/donate?ref={selectedCallerForAccess.callerId}</span>
              </div>
            </div>

            {/* Reset Password Section */}
            <form onSubmit={handleResetPassword} className="space-y-3">
              <label className="block text-xs font-bold text-teal-950">
                Set / Reset Portal Password
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new password (e.g. ashrama@2026)"
                  className="flex-1 rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-semibold text-teal-950 focus:border-amber-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={resettingPassword || !newPasswordInput.trim()}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {resettingPassword ? "Saving..." : "Save Password"}
                </button>
              </div>
              <p className="text-[11px] text-teal-950/60">
                Default password for seeded accounts: <code className="font-mono font-bold text-amber-900">ashrama@123</code>. Advisors can also change their password directly in their portal.
              </p>
            </form>

            {/* Quick 1-Click Share & Export Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => window.open(`/api/v1/admin/telecallers/export?type=caller_leads&callerId=${selectedCallerForAccess.callerId}`, "_blank")}
                title={`Download CSV file with all leads assigned to ${selectedCallerForAccess.callerId}`}
                className="w-full sm:w-auto flex-1 focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3 py-2.5 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <span>📥 Download Leads CSV</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyCredentials(selectedCallerForAccess, newPasswordInput || undefined)}
                className="w-full sm:w-auto flex-1 focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-sand hover:bg-amber-100 border border-teal-900/15 text-teal-950 px-3 py-2.5 text-xs font-bold transition cursor-pointer"
              >
                <span>📋 Copy Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsAppCredentials(selectedCallerForAccess, newPasswordInput || undefined)}
                className="w-full sm:w-auto flex-1 focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:brightness-105 text-white px-3.5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>📱 WhatsApp Sheet & Login</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 6: EDIT TELECALLER DETAILS & INDIVIDUAL WHATSAPP NUMBER
      ══════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && editingCaller && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-teal-900/10 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-4 border-b border-teal-900/10">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-950 font-bold text-sm">
                  ✏️
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-teal-950">
                    Edit Telecaller: {editingCaller.callerId}
                  </h3>
                  <p className="text-[11px] text-teal-950/60">
                    Update caller details, individual WhatsApp number, and daily quota.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingCaller(null);
                }}
                className="text-teal-950/50 hover:text-teal-950 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCallerEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editCallerForm.name}
                  onChange={(e) =>
                    setEditCallerForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  Individual WhatsApp Mobile Number
                </label>
                <div className="flex items-center">
                  <span className="bg-cream px-3 py-2 border border-r-0 border-teal-900/20 rounded-l-xl text-xs font-mono font-bold text-teal-950">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={editCallerForm.whatsappNumber}
                    onChange={(e) =>
                      setEditCallerForm((prev) => ({
                        ...prev,
                        whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                      }))
                    }
                    className="w-full rounded-r-xl border border-teal-900/20 px-3 py-2 text-xs font-mono font-semibold text-teal-950 focus:border-amber-500 outline-none"
                    placeholder="9845011001"
                  />
                </div>
                <p className="text-[10px] text-teal-950/60 mt-1">
                  Used when outreach sender mode is set to &apos;individual&apos;.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editCallerForm.email}
                  onChange={(e) =>
                    setEditCallerForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:border-amber-500 outline-none"
                  placeholder="advisor@janaseva.org"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Daily Quota
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={editCallerForm.dailyQuota}
                    onChange={(e) =>
                      setEditCallerForm((prev) => ({
                        ...prev,
                        dailyQuota: parseInt(e.target.value, 10) || 50,
                      }))
                    }
                    className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs text-teal-950 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editCallerForm.isActive ? "active" : "inactive"}
                    onChange={(e) =>
                      setEditCallerForm((prev) => ({
                        ...prev,
                        isActive: e.target.value === "active",
                      }))
                    }
                    className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-xs font-bold text-teal-950 bg-white"
                  >
                    <option value="active">Active (Receiving Leads)</option>
                    <option value="inactive">Paused (No New Leads)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCaller(null);
                  }}
                  className="rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 hover:bg-sand cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2 text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Telecaller Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ANTI-BAN WHATSAPP OUTREACH MODAL IN ADMIN CRM ── */}
      {selectedLeadForWhatsApp && (
        <AntiBanWhatsAppModal
          isOpen={isAntiBanModalOpen}
          onClose={() => {
            setIsAntiBanModalOpen(false);
            setSelectedLeadForWhatsApp(null);
          }}
          lead={selectedLeadForWhatsApp}
          callerId="ADMIN"
          callerName="Janaseva Ashrama Administrator"
          masterWhatsAppNumber={crmSettings.masterWhatsAppNumber}
          initialSenderMode={crmSettings.senderMode}
          onDispositionLogged={(leadId, disp) => {
            setLeadsList((prev) =>
              prev.map((l) => (l.leadId === leadId ? { ...l, status: disp } : l))
            );
            showToast(`✓ Updated lead #${leadId} status to ${disp}`);
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 9: ADD / EDIT INFLUENCER PARTNER
      ══════════════════════════════════════════════════════════════════ */}
      {isInfluencerModalOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-teal-900/10 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb">
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between pb-4 border-b border-teal-900/10">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-teal-950 text-gold flex items-center justify-center font-black">
                  📸
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-teal-950">Add Creator / Influencer Partner</h3>
                  <p className="text-[11px] text-teal-950/60">Generate tracked Instagram link with 30-day attribution</p>
                </div>
              </div>
              <button
                onClick={() => setIsInfluencerModalOpen(false)}
                className="text-teal-950/40 hover:text-teal-950 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInfluencer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-teal-950">Influencer Full Name *</label>
                <input
                  type="text"
                  required
                  value={influencerForm.displayName}
                  onChange={(e) => setInfluencerForm({ ...influencerForm, displayName: e.target.value })}
                  placeholder="e.g. Rohit Sharma"
                  className="mt-1 w-full rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-teal-950">Referral Code *</label>
                  <input
                    type="text"
                    required
                    value={influencerForm.influencerCode}
                    onChange={(e) =>
                      setInfluencerForm({
                        ...influencerForm,
                        influencerCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                      })
                    }
                    placeholder="ROHIT_FIT"
                    className="mt-1 w-full rounded-xl border border-teal-900/20 px-3.5 py-2 font-mono text-xs font-black text-amber-900 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-teal-950/50">Used in ?ref=CODE</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950">Instagram Handle</label>
                  <input
                    type="text"
                    value={influencerForm.instagramHandle}
                    onChange={(e) => setInfluencerForm({ ...influencerForm, instagramHandle: e.target.value })}
                    placeholder="@rohit_fitness"
                    className="mt-1 w-full rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-semibold text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-teal-950/50">Shown to followers</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-teal-950">WhatsApp Phone *</label>
                  <input
                    type="tel"
                    required
                    value={influencerForm.whatsappNumber}
                    onChange={(e) => setInfluencerForm({ ...influencerForm, whatsappNumber: e.target.value })}
                    placeholder="9880123456"
                    className="mt-1 w-full rounded-xl border border-teal-900/20 px-3.5 py-2 font-mono text-xs font-bold text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-teal-950/50">For 1-click EOD card</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-teal-950">Target Goal (₹)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={influencerForm.targetGoalAmount}
                    onChange={(e) =>
                      setInfluencerForm({ ...influencerForm, targetGoalAmount: Number(e.target.value) })
                    }
                    placeholder="50000"
                    className="mt-1 w-full rounded-xl border border-teal-900/20 px-3.5 py-2 text-xs font-bold text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-teal-950/50">Fundraising goal</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-teal-950">Campaign Message / Story</label>
                <textarea
                  rows={2}
                  value={influencerForm.campaignStory}
                  onChange={(e) => setInfluencerForm({ ...influencerForm, campaignStory: e.target.value })}
                  placeholder="e.g. Join me in feeding 25 orphaned boys at Janaseva Ashrama Bangalore..."
                  className="mt-1 w-full rounded-xl border border-teal-900/20 p-2.5 text-xs text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => setIsInfluencerModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save & Generate Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADJUST DONATION AMOUNT & APPROVE ── */}
      {adjustingDonation && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setAdjustingDonation(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-teal-900/10 space-y-4 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <div>
                  <h3 className="font-display font-black text-base text-teal-950">
                    Adjust Donation Amount
                  </h3>
                  <p className="text-[11px] text-teal-950/60 font-mono">
                    {adjustingDonation.donorName || "Donor"} · Claimed: ₹{formatINR(adjustingDonation.amount)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingDonation(null)}
                className="text-teal-950/60 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Actual Verified Amount Received in Bank (₹) *
              </label>
              <input
                type="number"
                value={adjustedAmountInput}
                onChange={(e) => setAdjustedAmountInput(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Enter exact bank amount in INR"
                className="w-full rounded-xl border border-teal-900/20 px-3 py-2 text-sm font-bold text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
              />
              <p className="text-[10px] text-teal-950/60 mt-1">
                Original amount claimed by {adjustingDonation.callerName}: ₹{formatINR(adjustingDonation.amount)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Adjustment Reason / Admin Note
              </label>
              <textarea
                value={adjustNoteInput}
                onChange={(e) => setAdjustNoteInput(e.target.value)}
                placeholder="e.g. Bank statement received ₹1,500 via PhonePe on Nov 2..."
                rows={2}
                className="w-full rounded-xl border border-teal-900/20 p-2 text-xs text-teal-950 outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setAdjustingDonation(null)}
                className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAdjustDonation}
                disabled={actionInProgress === adjustingDonation.txnId || !adjustedAmountInput}
                className="py-2.5 px-3 rounded-xl bg-teal-950 hover:bg-teal-900 text-gold font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {actionInProgress === adjustingDonation.txnId ? "Verifying..." : "Confirm & Verify"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REJECT DONATION CLAIM ── */}
      {rejectingDonation && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setRejectingDonation(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-teal-900/10 space-y-4 max-h-[90vh] overflow-y-auto pb-8 sm:pb-6 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">❌</span>
                <div>
                  <h3 className="font-display font-black text-base text-rose-950">
                    Reject Donation Claim
                  </h3>
                  <p className="text-[11px] text-teal-950/60 font-mono">
                    Claimed: ₹{formatINR(rejectingDonation.amount)} by {rejectingDonation.callerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingDonation(null)}
                className="text-teal-950/60 hover:text-teal-950 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-950 mb-1">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. UTR not found in bank statement, or transaction bounced..."
                rows={3}
                className="w-full rounded-xl border border-rose-300 p-2.5 text-xs text-teal-950 outline-none focus:ring-2 focus:ring-rose-400"
              />
              <p className="text-[10px] text-rose-800 mt-1">
                This donation will be marked as REJECTED and ₹0 will be credited to {rejectingDonation.callerName}.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => setRejectingDonation(null)}
                className="py-2.5 px-3 rounded-xl border border-teal-900/20 text-xs font-bold text-teal-950 hover:bg-cream cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectDonation}
                disabled={actionInProgress === rejectingDonation.txnId}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {actionInProgress === rejectingDonation.txnId ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: TELECALLER DONATION AUDIT LEDGER ── */}
      {selectedCallerForLedger && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 bg-teal-950/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedCallerForLedger(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-teal-900/10 space-y-4 flex flex-col pb-8 sm:pb-6 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden mx-auto w-12 h-1.5 rounded-full bg-teal-900/20 mb-2 shrink-0" />
            <div className="flex items-center justify-between border-b border-teal-900/10 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-teal-950 flex items-center gap-2">
                  <span>📋 Donation &amp; Call Ledger</span>
                  <span className="text-xs font-mono font-bold bg-cream px-2 py-0.5 rounded-full border border-teal-900/15">
                    {selectedCallerForLedger.name} ({selectedCallerForLedger.callerId})
                  </span>
                </h3>
                <p className="text-xs text-teal-950/60 mt-0.5">
                  Detailed shift activity and verification history for this telecaller.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCallerForLedger(null)}
                className="text-teal-950/60 hover:text-teal-950 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {loadingLedger ? (
                <div className="p-8 text-center text-xs text-teal-950/60">
                  Loading caller records...
                </div>
              ) : callerLedgerLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-teal-950/60 bg-cream/30 rounded-2xl">
                  No activity logged yet today for this telecaller.
                </div>
              ) : (
                <div className="space-y-2">
                  {callerLedgerLogs.map((log: any) => (
                    <div
                      key={log.logId}
                      className="rounded-2xl border border-teal-900/10 p-3 bg-white text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-950">
                          {log.leadName} ({log.phone})
                        </span>
                        <span className="font-mono text-[10px] text-teal-950/60">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sand border border-teal-900/15">
                          {log.disposition}
                        </span>
                        {log.effectiveAmount > 0 && (
                          <span className="font-mono font-bold text-emerald-900">
                            Claimed: ₹{formatINR(log.effectiveAmount)}
                          </span>
                        )}
                        {log.verificationStatus && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              log.verificationStatus === "VERIFIED"
                                ? "bg-emerald-600 text-white"
                                : log.verificationStatus === "REJECTED"
                                ? "bg-rose-600 text-white"
                                : "bg-amber-400 text-teal-950"
                            }`}
                          >
                            {log.verificationStatus}
                          </span>
                        )}
                        {log.utr && (
                          <span className="font-mono text-[10px] text-teal-950/70">
                            UTR: {log.utr}
                          </span>
                        )}
                      </div>
                      {log.notes && (
                        <p className="text-[11px] text-teal-950/70 italic bg-cream/40 p-1.5 rounded-lg">
                          &ldquo;{log.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-teal-900/10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCallerForLedger(null)}
                className="px-4 py-2 rounded-xl bg-teal-950 text-white text-xs font-bold cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
