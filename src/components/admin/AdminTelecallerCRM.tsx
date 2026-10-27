"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import type { TelecallerStats, CrmWhatsAppSettings } from "@/lib/antigravity-crm";
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

  // Notifications & Loaders
  const [toastMessage, setToastMessage] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

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
      await loadLeadsForReassignment("TC01");
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

  // ── UNIVERSAL CSV & SPREADSHEET PARSER ──
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
    if (rawLines.length === 0) {
      setParsedLeads([]);
      return;
    }

    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    // Check if first row is a header
    const firstRowCells = parseCSVLine(rawLines[0]);
    let hasHeader = false;
    let nameCol = -1;
    let phoneCol = -1;
    let dayCol = -1;
    let monthCol = -1;
    let emailCol = -1;
    let dateCol = -1;

    firstRowCells.forEach((header, idx) => {
      const raw = header.toLowerCase().trim();
      const h = raw.replace(/[^a-z0-9]/g, "");

      // Name column: match 'lead name', 'name', 'donor', 'person', 'contact name'
      if (h.includes("name") || h.includes("donor") || h.includes("person")) {
        if (!h.includes("id")) nameCol = idx;
      } else if (h.includes("lead") && !h.includes("id")) {
        nameCol = idx;
      }

      // Phone column: prioritize 'phone', 'mobile', 'whatsapp', 'tel', 'cell'
      if (
        h.includes("phone") ||
        h.includes("mobile") ||
        h.includes("whatsapp") ||
        h.includes("tel") ||
        h.includes("cell")
      ) {
        phoneCol = idx;
      } else if (
        h.includes("contact") &&
        !h.includes("date") &&
        !h.includes("time") &&
        !h.includes("last") &&
        phoneCol === -1
      ) {
        phoneCol = idx;
      }

      // Month column: must have 'month'
      if (h.includes("month")) {
        monthCol = idx;
      }

      // Day column: check 'day' but NOT 'birthday month'
      if (
        h.includes("dobday") ||
        h.includes("birthdayday") ||
        h.endsWith("day") ||
        h === "day" ||
        (h.includes("day") && !h.includes("month") && (h.includes("birth") ? h.includes("birthdayday") || raw.includes("day") : true))
      ) {
        if (!h.includes("month")) {
          dayCol = idx;
        }
      }

      // Email column
      if (h.includes("email") || h.includes("mail")) {
        emailCol = idx;
      }

      // Combined birthday or date column (e.g. Birthday, DOB, Birthdate)
      if (
        (h.includes("birthday") || h.includes("dob") || h.includes("birthdate") || h.includes("date")) &&
        !h.includes("day") &&
        !h.includes("month") &&
        !h.includes("contact") &&
        !h.includes("create")
      ) {
        dateCol = idx;
      }
    });

    if (nameCol !== -1 || phoneCol !== -1 || dayCol !== -1) {
      hasHeader = true;
    }

    const startLine = hasHeader ? 1 : 0;
    const leads: Array<{ name: string; phone: string; dobDay: number; dobMonth: number; email?: string }> = [];

    for (let i = startLine; i < rawLines.length; i++) {
      const line = rawLines[i];
      const cells = parseCSVLine(line);
      if (cells.length === 0 || cells.every((c) => c === "")) continue;

      let leadName = "";
      let leadPhone = "";
      let leadDay = curDay;
      let leadMonth = curMonth;
      let leadEmail: string | undefined = undefined;

      if (hasHeader && phoneCol !== -1 && nameCol !== -1) {
        leadName = cells[nameCol] || "";
        const rawPhone = cells[phoneCol] || "";
        const cleanDigits = rawPhone.replace(/\D/g, "");
        leadPhone = cleanDigits.slice(-10);

        if (dayCol !== -1 && cells[dayCol]) {
          const d = parseInt(cells[dayCol], 10);
          if (!isNaN(d) && d >= 1 && d <= 31) leadDay = d;
        }
        if (monthCol !== -1 && cells[monthCol]) {
          const m = parseInt(cells[monthCol], 10);
          if (!isNaN(m) && m >= 1 && m <= 12) leadMonth = m;
        }
        if (emailCol !== -1 && cells[emailCol] && cells[emailCol].includes("@")) {
          leadEmail = cells[emailCol];
        }
        if (dateCol !== -1 && cells[dateCol]) {
          const parts = cells[dateCol].split(/[-/.]/);
          if (parts.length >= 2) {
            const p0 = parseInt(parts[0], 10);
            const p1 = parseInt(parts[1], 10);
            if (p0 > 31) {
              if (p1 >= 1 && p1 <= 12) leadMonth = p1;
              const p2 = parseInt(parts[2], 10);
              if (p2 >= 1 && p2 <= 31) leadDay = p2;
            } else {
              if (p0 >= 1 && p0 <= 31) leadDay = p0;
              if (p1 >= 1 && p1 <= 12) leadMonth = p1;
            }
          }
        }
      } else {
        // Dynamic Cell Detection across all cells in this row
        let phoneCellIdx = -1;
        for (let c = 0; c < cells.length; c++) {
          const digits = cells[c].replace(/\D/g, "");
          if (digits.length >= 10 && digits.length <= 13) {
            leadPhone = digits.slice(-10);
            phoneCellIdx = c;
            break;
          }
        }

        if (!leadPhone || phoneCellIdx === -1) continue;

        for (let c = 0; c < cells.length; c++) {
          if (c === phoneCellIdx) continue;
          const cell = cells[c];
          if (cell.includes("@")) {
            leadEmail = cell;
            continue;
          }
          const isNumericOnly = /^\d+$/.test(cell.trim());
          if (!isNumericOnly && /[a-zA-Z]/.test(cell)) {
            if (!leadName) {
              leadName = cell;
            }
          } else if (isNumericOnly) {
            const num = parseInt(cell, 10);
            if (num >= 1 && num <= 31 && leadDay === curDay) {
              leadDay = num;
            } else if (num >= 1 && num <= 12 && leadMonth === curMonth) {
              leadMonth = num;
            }
          }
        }
      }

      if (!leadName.trim()) {
        leadName = `Well-wisher (${leadPhone.slice(-4)})`;
      }

      if (leadPhone.length >= 10) {
        leads.push({
          name: leadName.trim(),
          phone: leadPhone,
          dobDay: leadDay,
          dobMonth: leadMonth,
          email: leadEmail,
        });
      }
    }

    setParsedLeads(leads);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        parseRawLeadText(content);
      }
    };
    reader.readAsText(file);
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

  const handleExecuteLeadUpload = async () => {
    if (parsedLeads.length === 0) {
      return alert("No valid leads detected. Please paste or upload data containing Name and Phone.");
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/admin/telecallers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload_leads",
          leads: parsedLeads,
          autoDistribute: autoDistributeOnUpload,
          mode: distributionMode,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Lead upload failed");

      showToast(`✓ ${data.message}`);
      setCallers(data.callers || []);
      setTotalLeads(data.totalLeads || 0);
      setIsUploadModalOpen(false);
      setPastedText("");
      setParsedLeads([]);
      setUploadedFileName("");
      await loadLeadsForReassignment("TC01");
    } catch (err: any) {
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
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.janasevaorphanage.org";
    const text = `🌟 *JANASEVA ASHRAMA TELECALLER PORTAL ACCESS*\n👤 Advisor Name: ${caller.name}\n🆔 Caller ID: ${caller.callerId}\n📧 Login Email: ${caller.email || `${caller.callerId.toLowerCase()}@janaseva.org`}\n🔑 Password: ${pwd || "ashrama@123"}\n🔗 Login Portal: ${origin}/portal\n🎯 Primary 'Sponsor 25 Boys' Campaign Link: ${origin}/#official-tiers?ref=${caller.callerId}`;
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied login credentials for ${caller.callerId} to clipboard!`);
  };

  const handleSendWhatsAppCredentials = (caller: TelecallerStats, pwd?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.janasevaorphanage.org";
    const text = `🌟 *JANASEVA ASHRAMA TELECALLER PORTAL ACCESS*\n\nNamaste ${caller.name},\nHere are your access credentials for our telecaller outreach portal (Focus: Sponsor 25 Boys Tiers):\n\n👤 *Advisor:* ${caller.name}\n🆔 *Caller ID:* ${caller.callerId}\n📧 *Login Email:* ${caller.email || `${caller.callerId.toLowerCase()}@janaseva.org`}\n🔑 *Password:* ${pwd || "ashrama@123"}\n\n🔗 *Login to Portal:* ${origin}/portal\n🎯 *Your 'Sponsor 25 Boys' Referral Link:* ${origin}/#official-tiers?ref=${caller.callerId}\n\nPlease login and start reaching out to your assigned queue today!`;
    const cleanNumber = (caller.whatsappNumber || "").replace(/\D/g, "");
    window.open(`https://wa.me/91${cleanNumber}?text=${encodeURIComponent(text)}`, "_blank");
    showToast(`✓ Opened WhatsApp to send credentials to ${caller.name}`);
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

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.leadId));
    }
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const filteredLeads = leadsList.filter((l) => {
    if (statusFilter === "ALL") return true;
    return l.status === statusFilter;
  });

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
              <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-teal-900/10">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(c)}
                  className="rounded-xl bg-teal-50 border border-teal-200 text-teal-950 py-2 text-xs font-bold hover:bg-teal-100 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAccessModal(c)}
                  className="rounded-xl bg-amber-100 border border-amber-300 text-amber-900 py-2 text-xs font-bold hover:bg-amber-200 transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>🔑</span>
                  <span>Access</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCallerForLeads(c.callerId);
                    loadLeadsForReassignment(c.callerId);
                  }}
                  className="rounded-xl bg-cream border border-teal-900/20 text-teal-950 py-2 text-xs font-bold hover:bg-sand transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>📋</span>
                  <span>Leads</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePromptDelete(c)}
                  className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 py-2 text-xs font-bold hover:bg-rose-100 transition cursor-pointer flex items-center justify-center gap-1"
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
            <h3 className="font-display text-base font-bold text-teal-950">
              Bulk Lead Re-Assignment Engine
            </h3>
            <p className="text-xs text-teal-950/60">
              Select leads currently assigned to{" "}
              <span className="font-bold text-teal-900">{selectedCallerForLeads}</span> and transfer them to another telecaller.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-bold bg-white text-teal-950"
            >
              <option value="ALL">All Statuses ({leadsList.length})</option>
              <option value="Pending">Pending</option>
              <option value="Reschedule">Reschedule</option>
              <option value="Interested">Interested</option>
              <option value="Donated">Donated</option>
            </select>

            <span className="text-xs text-teal-950/50">Transfer to:</span>
            <select
              value={targetCallerId}
              onChange={(e) => setTargetCallerId(e.target.value)}
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-bold bg-white text-teal-950"
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

        {/* Leads Table (Desktop) */}
        <div className="hidden md:block overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10 sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.length > 0 &&
                      selectedLeadIds.length === filteredLeads.length
                    }
                    onChange={toggleSelectAllLeads}
                    className="rounded text-teal-950"
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
                filteredLeads.map((lead) => {
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
            filteredLeads.map((lead) => {
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
      </div>

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
                  📁 Upload CSV File
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
                      setUploadedFileName(file.name);
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
                  }}
                  className="border-2 border-dashed border-teal-900/20 rounded-2xl p-6 text-center hover:bg-sand/30 transition cursor-pointer"
                >
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <span className="text-3xl block mb-2">📁</span>
                    <span className="text-xs font-bold text-teal-950 block">
                      {uploadedFileName ? `Selected: ${uploadedFileName}` : "Click to browse or Drag & Drop CSV / Excel file here"}
                    </span>
                    <span className="text-[11px] text-teal-950/60 block mt-1">
                      Supports comma, tab, or semicolon separated files
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

              {/* Live Preview */}
              {parsedLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-950">
                    <span className="text-emerald-700">✓ Detected {parsedLeads.length} Valid Leads Ready for Distribution</span>
                    <span className="text-[10px] text-teal-950/50">Previewing first 4 rows</span>
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-900/10 shrink-0">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-teal-950/70 hover:bg-sand transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteLeadUpload}
                disabled={actionLoading || parsedLeads.length === 0}
                className="rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-5 py-2 text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Importing..." : `Import & Distribute ${parsedLeads.length} Leads`}
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

            {/* Quick 1-Click Share & Copy Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-teal-900/10">
              <button
                type="button"
                onClick={() => handleCopyCredentials(selectedCallerForAccess, newPasswordInput || undefined)}
                className="w-full sm:w-auto flex-1 focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-sand hover:bg-amber-100 border border-teal-900/15 text-teal-950 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer"
              >
                <span>📋 Copy Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendWhatsAppCredentials(selectedCallerForAccess, newPasswordInput || undefined)}
                className="w-full sm:w-auto flex-1 focus-ring tap-scale inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:brightness-105 text-white px-3.5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <span>📱 WhatsApp Access Details</span>
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
    </div>
  );
}
