"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import type { TelecallerStats, CrmWhatsAppSettings, InfluencerStats } from "@/lib/antigravity-crm";
import { AntiBanWhatsAppModal } from "@/components/admin/AntiBanWhatsAppModal";

export function AdminTelecallerCRM() {
  const [loading, setLoading] = useState(true);
  const [callers, setCallers] = useState<TelecallerStats[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Bulk Reassignment State
  const [selectedCallerForLeads, setSelectedCallerForLeads] = useState<string>("ALL");
  const [leadsList, setLeadsList] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [targetCallerId, setTargetCallerId] = useState<string>("TC01");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
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
  const [uploadMode, setUploadMode] = useState<"paste" | "file">("paste");
  const [pastedText, setPastedText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedLeads, setParsedLeads] = useState<
    Array<{ name: string; phone: string; dobDay: number; dobMonth: number; email?: string }>
  >([]);
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
  } | null>(null);

  // 4. Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

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

  // ── SUB-TABS: STAFF TELECALLERS vs INSTAGRAM INFLUENCERS ──
  const [activeSubtab, setActiveSubtab] = useState<"callers" | "influencers">("callers");
  const [influencers, setInfluencers] = useState<InfluencerStats[]>([]);
  const [totalInfluencerRaised, setTotalInfluencerRaised] = useState(0);
  const [totalInfluencerDonors, setTotalInfluencerDonors] = useState(0);
  const [loadingInfluencers, setLoadingInfluencers] = useState(false);

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
    if (!influencerForm.displayName.trim()) return alert("Please enter the influencer display name.");
    if (!influencerForm.influencerCode.trim()) return alert("Please enter a custom referral code (e.g. ROHIT_FIT).");
    if (influencerForm.whatsappNumber.replace(/\D/g, "").length < 10) {
      return alert("Please enter a valid 10-digit WhatsApp number.");
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
      alert("Error saving influencer: " + err.message);
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

        if (data.crmWhatsAppSettings) {
          setCrmSettings(data.crmWhatsAppSettings);
        }

        // Pre-fill targetCallerId if valid
        if (data.callers && data.callers.length > 0) {
          const firstActive = data.callers.find((c: TelecallerStats) => c.isActive) || data.callers[0];
          setTargetCallerId(firstActive.callerId);
        }
      }
      await loadLeadsForReassignment("ALL");
      await loadInfluencers();
    } catch (err: any) {
      showToast("Error loading telecaller CRM data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void loadAdminData();
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
    if (!addCallerForm.name.trim()) return alert("Please enter the telecaller full name.");
    if (addCallerForm.whatsappNumber.replace(/\D/g, "").length < 10) {
      return alert("Please enter a valid 10-digit WhatsApp phone number.");
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
      alert("Error adding telecaller: " + err.message);
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
      alert("Error deleting telecaller: " + err.message);
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
        // DD/MM/YYYY
        const d = parts[0];
        const m = parts[1];
        return {
          day: d >= 1 && d <= 31 ? d : defaultDay,
          month: m >= 1 && m <= 12 ? m : defaultMonth,
        };
      }
    }

    return { day: defaultDay, month: defaultMonth };
  };

  const parse2DGrid = (grid: any[][]) => {
    if (!grid || grid.length === 0) {
      setParsedLeads([]);
      return;
    }

    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    // Multi-row header detection: scan up to the first 6 rows for donor/name/phone/dob columns
    let headerRowIdx = -1;
    let nameCol = -1;
    let phoneCol = -1;
    let dayCol = -1;
    let monthCol = -1;
    let emailCol = -1;
    let dateCol = -1;

    const maxHeaderScan = Math.min(grid.length, 6);
    for (let r = 0; r < maxHeaderScan; r++) {
      const row = grid[r] || [];
      let tempNameCol = -1;
      let tempPhoneCol = -1;
      let tempDayCol = -1;
      let tempMonthCol = -1;
      let tempEmailCol = -1;
      let tempDateCol = -1;

      row.forEach((cellVal: any, colIdx: number) => {
        const raw = String(cellVal || "").toLowerCase().trim();
        const h = raw.replace(/[^a-z0-9]/g, "");

        if (h.includes("name") || h.includes("donor") || h.includes("person") || h.includes("contactname") || h.includes("leadname")) {
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

        if (h.includes("dobday") || h.includes("birthdayday") || (h.includes("day") && !h.includes("month"))) {
          tempDayCol = colIdx;
        }

        if (h.includes("email") || h.includes("mail")) {
          tempEmailCol = colIdx;
        }

        if (
          (h.includes("birthday") || h.includes("dob") || h.includes("birthdate") || h.includes("dateofbirth")) &&
          !h.includes("day") &&
          !h.includes("month")
        ) {
          tempDateCol = colIdx;
        }
      });

      if (tempPhoneCol !== -1 || (tempNameCol !== -1 && tempDateCol !== -1)) {
        headerRowIdx = r;
        nameCol = tempNameCol;
        phoneCol = tempPhoneCol;
        dayCol = tempDayCol;
        monthCol = tempMonthCol;
        emailCol = tempEmailCol;
        dateCol = tempDateCol;
        break;
      }
    }

    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    const leads: Array<{ name: string; phone: string; dobDay: number; dobMonth: number; email?: string }> = [];

    for (let r = startRow; r < grid.length; r++) {
      const cells = grid[r] || [];
      if (cells.length === 0 || cells.every((c) => c === "" || c == null)) continue;

      let leadName = "";
      let leadPhone = "";
      let leadDay = curDay;
      let leadMonth = curMonth;
      let leadEmail: string | undefined = undefined;

      if (headerRowIdx !== -1 && phoneCol !== -1) {
        leadPhone = normalizePhoneNumber(cells[phoneCol]);
        if (nameCol !== -1 && cells[nameCol] != null) {
          leadName = String(cells[nameCol]).trim();
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

      if (!leadName || leadName.length < 2) {
        leadName = `Well-wisher (${leadPhone.slice(-4)})`;
      }

      if (leadPhone.length === 10) {
        leads.push({
          name: leadName.replace(/^["']|["']$/g, "").trim(),
          phone: leadPhone,
          dobDay: leadDay,
          dobMonth: leadMonth,
          email: leadEmail,
        });
      }
    }

    setParsedLeads(leads);
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
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const grid = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false, defval: "" });
          // Generate clean CSV preview for textarea
          const csvPreview = grid.slice(0, 50).map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
          setPastedText(csvPreview);
          parse2DGrid(grid);
        } catch (err: any) {
          alert("Error parsing Excel file: " + err.message);
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

  const handleDownloadSampleTemplate = () => {
    const sample = `Lead Name,Phone Number,Birthday Day,Birthday Month,Email\n"Ramesh Patil","9880123456",14,10,"ramesh@gmail.com"\n"Deepa Rao","9845011002",15,10,"deepa@yahoo.com"\n"Anand Joshi","9845011003",16,10,"anand@gmail.com"`;
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_birthday_leads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleExecuteLeadUpload = async () => {
    if (parsedLeads.length === 0) {
      return alert("No valid leads detected. Please paste or upload data containing Name and Phone.");
    }

    setActionLoading(true);
    const totalLeadsCount = parsedLeads.length;
    // Chunk size 1,000 ensures each JSON payload is ~80KB, completely avoiding HTTP 413 "Request Entity Too Large"
    const CHUNK_SIZE = 1000;
    const chunks: typeof parsedLeads[] = [];
    for (let i = 0; i < totalLeadsCount; i += CHUNK_SIZE) {
      chunks.push(parsedLeads.slice(i, i + CHUNK_SIZE));
    }
    const totalChunks = chunks.length;

    setUploadProgress({
      inProgress: true,
      currentChunk: 0,
      totalChunks,
      processedLeads: 0,
      totalLeads: totalLeadsCount,
      percent: 0,
      stage: "uploading",
      statusMessage: `Preparing chunked upload of ${totalLeadsCount.toLocaleString()} leads in ${totalChunks} chunks...`,
      insertedTotal: 0,
      duplicatesTotal: 0,
    });

    let cumInserted = 0;
    let cumDuplicates = 0;

    try {
      for (let i = 0; i < totalChunks; i++) {
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
        });

        let attempts = 0;
        let success = false;
        let lastErr = "";

        while (attempts < 3 && !success) {
          attempts++;
          try {
            const res = await fetch("/api/v1/admin/telecallers", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "upload_chunk",
                leads: chunk,
                autoDistribute: autoDistributeOnUpload,
                mode: distributionMode,
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
            }
            success = true;
          } catch (err: any) {
            lastErr = err.message || "Network error";
            if (attempts < 3) {
              await new Promise((r) => setTimeout(r, 800));
            }
          }
        }

        if (!success) {
          throw new Error(`Failed on chunk ${chunkNum}/${totalChunks}: ${lastErr}`);
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
        statusMessage: `✓ Import complete! ${cumInserted.toLocaleString()} unique leads added & distributed (${cumDuplicates.toLocaleString()} duplicates filtered).`,
        insertedTotal: cumInserted,
        duplicatesTotal: cumDuplicates,
      });

      showToast(
        `✓ Successfully imported ${cumInserted.toLocaleString()} leads! (${cumDuplicates.toLocaleString()} duplicates filtered out). Distributed across callers.`
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
        setUploadedFileName("");
      }, 1800);
    } catch (err: any) {
      setUploadProgress((prev) => ({
        inProgress: false,
        currentChunk: prev?.currentChunk || 0,
        totalChunks,
        processedLeads: prev?.processedLeads || 0,
        totalLeads: totalLeadsCount,
        percent: prev?.percent || 0,
        stage: "error",
        statusMessage: `Upload error: ${err.message}`,
        insertedTotal: cumInserted,
        duplicatesTotal: cumDuplicates,
      }));
      alert("Error importing leads: " + err.message);
    } finally {
      setActionLoading(false);
    }
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
      return alert("Please select at least one lead to re-assign.");
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
      alert("New password must be at least 4 characters.");
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
      alert("Error resetting password: " + err.message);
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
      if (statusFilter === "ALL") return true;
      return l.status === statusFilter;
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
  }, [leadsList, statusFilter, leadDateSort]);

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
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-white hover:text-gold ml-3 cursor-pointer">
            ✕
          </button>
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

            {/* Reset Daily Limit / Queue Button */}
            <button
              type="button"
              onClick={() => setIsResetDailyModalOpen(true)}
              disabled={actionLoading}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-teal-950 px-3.5 py-2.5 text-xs font-black shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Reset non-donated leads to Pending and refresh daily quota across active callers"
            >
              <span>🔄 Reset Daily Limit</span>
            </button>

            {/* Delete All Leads Button */}
            <button
              type="button"
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={actionLoading}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white border border-rose-600 px-3.5 py-2.5 text-xs font-black shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Permanently delete all leads and call logs to start 100% fresh (keeps telecaller login accounts safe)"
            >
              <span>🗑️ Delete All Leads</span>
            </button>

            {/* Clean Demo Leads Button */}
            <button
              type="button"
              onClick={() => handleClearDemoLeads(false)}
              disabled={actionLoading}
              className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-900/60 hover:bg-teal-900 text-teal-200 border border-teal-700/60 px-3 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
              title="Remove sample and dummy test leads from the database"
            >
              <span>🧹 Clean Demo Leads</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white border border-teal-700 px-3.5 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <span>📥 Export CRM Data ▾</span>
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white text-teal-950 shadow-2xl border border-teal-900/10 p-2 z-50 animate-fadeIn">
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
                    onClick={() => window.open("/api/v1/admin/influencers/export?type=summary", "_blank")}
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
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-950/60 block">
            Managed Leads
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-teal-950">
            {totalLeads} Leads
          </p>
          <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
            ≈ {equalQuotaPerCaller} leads / caller
          </span>
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
          >
            <span>⚖️ Distribute &amp; Balance Workload</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerRouting}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <span>🚀 Run Birthday Cron (00:01 AM)</span>
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
                    </td>
                    <td className="p-3 font-semibold">{c.assignedCount}</td>
                    <td className="p-3 text-teal-950/70">{c.contactedCount}</td>
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

                <button
                  type="button"
                  onClick={() => handleToggleActive(c.callerId, c.isActive)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase cursor-pointer shrink-0 transition ${
                    c.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {c.isActive ? "● Active" : "○ Paused"}
                </button>
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
                <th className="p-3">Lead Name</th>
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
                  <td colSpan={7} className="p-6 text-center text-teal-950/50">
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
                      <td className="p-3 font-bold text-teal-950">{lead.name}</td>
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
                        <h4 className="font-bold text-teal-950 text-sm truncate">{lead.name}</h4>
                        <div className="flex items-center gap-2 text-xs">
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
          VIEW 2: INSTAGRAM INFLUENCERS & CREATORS REFERRAL HUB
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-teal-900/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-rose-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-teal-900/10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-teal-900/10 shrink-0">
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
                onClick={() => setIsUploadModalOpen(false)}
                className="text-teal-950/40 hover:text-teal-950 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4">
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
                    <span>💡</span> Universal Column Support: Name, Phone (10-digit), Birthday Day (1-31), Birthday Month (1-12), Email
                  </p>
                  <p className="text-[11px] text-amber-800/80 font-mono">
                    Works automatically with Janaseva registry exports, Google Sheets, or custom CSV files.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSampleTemplate}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 text-xs font-bold transition shadow-2xs"
                >
                  📥 Download Sample CSV
                </button>
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
                    placeholder={`Lead Name, Phone Number, Birthday Day, Birthday Month, Email\nVijay Kumar, 9845011001, 14, 10, vijay@gmail.com\nDeepa Rao, 9845011002, 15, 10, deepa@yahoo.com`}
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
                    <div className="mt-3">
                      {parsedLeads.length > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                          <span>✓ Successfully detected {parsedLeads.length} leads ready for import</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                          <span>⚠️ No valid 10-digit phone numbers detected in this file yet</span>
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
                    <span className="text-emerald-700">✓ Detected {parsedLeads.length} Valid Leads Ready for Distribution</span>
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
                          <th className="p-2">Name</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">DOB Day</th>
                          <th className="p-2">DOB Month</th>
                          <th className="p-2">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-teal-900/5">
                        {parsedLeads.slice(0, 4).map((pl, idx) => (
                          <tr key={idx} className="hover:bg-sand/40">
                            <td className="p-2 font-bold">{pl.name}</td>
                            <td className="p-2 font-mono">+91 {pl.phone}</td>
                            <td className="p-2">{pl.dobDay}</td>
                            <td className="p-2">{pl.dobMonth}</td>
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
                            Chunk {uploadProgress.currentChunk} of {uploadProgress.totalChunks} (1,500 leads/chunk)
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
                      <span className="text-amber-300">⚡ {uploadProgress.duplicatesTotal.toLocaleString()} duplicates filtered</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-sand/70 italic truncate">
                    {uploadProgress.statusMessage}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (uploadProgress?.inProgress) {
                    if (!confirm("Upload is currently in progress. Do you want to cancel?")) return;
                  }
                  setIsUploadModalOpen(false);
                  setUploadProgress(null);
                }}
                disabled={actionLoading}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition disabled:opacity-40"
              >
                Cancel
              </button>
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
            </div>
          </div>
        </div>
      )}

      {/* ── 5. TELECALLER CREDENTIALS & ACCESS MODAL ── */}
      {isAccessModalOpen && selectedCallerForAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-teal-900/10 text-teal-950 space-y-5">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-teal-900/10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-teal-900/10">
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
    </div>
  );
}
