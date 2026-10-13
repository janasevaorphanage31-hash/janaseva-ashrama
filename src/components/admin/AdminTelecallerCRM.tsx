"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
import { LogoMark } from "@/components/Logo";
import type { TelecallerStats } from "@/lib/antigravity-crm";

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

  useEffect(() => {
    loadAdminData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 5000);
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

  const loadLeadsForReassignment = async (callerId: string) => {
    try {
      const res = await fetch(`/api/v1/leads/assigned?callerId=${callerId}`);
      const data = await res.json();
      if (data.success) {
        setLeadsList(data.leads || []);
      }
    } catch {}
  };

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

  // ── PARSE RAW LEADS (CSV / TSV / EXCEL PASTE) ──
  const parseRawLeadText = (text: string) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const now = new Date();
    const curDay = now.getDate();
    const curMonth = now.getMonth() + 1;

    const leads: Array<{ name: string; phone: string; dobDay: number; dobMonth: number; email?: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip header lines
      if (i === 0 && (line.toLowerCase().includes("name") || line.toLowerCase().includes("phone"))) {
        continue;
      }

      // Support comma, tab, or semicolon separated
      const parts = line.split(/[,\t;]+/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      if (parts.length < 2) continue;

      const name = parts[0];
      const phoneDigits = parts[1].replace(/\D/g, "");
      if (!name || phoneDigits.length < 10) continue;

      let day = curDay;
      let month = curMonth;
      let email: string | undefined = undefined;

      if (parts.length >= 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d) && d >= 1 && d <= 31) day = d;
      }
      if (parts.length >= 4) {
        const m = parseInt(parts[3], 10);
        if (!isNaN(m) && m >= 1 && m <= 12) month = m;
      }
      if (parts.length >= 5 && parts[4].includes("@")) {
        email = parts[4];
      }

      leads.push({
        name,
        phone: phoneDigits.slice(-10),
        dobDay: day,
        dobMonth: month,
        email,
      });
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
  const handleTriggerCSVDownload = (type: "performance" | "leads" | "donations") => {
    window.open(`/api/v1/admin/telecallers/export?type=${type}`, "_blank");
    setIsExportMenuOpen(false);
    showToast(`✓ Initiated ${type.toUpperCase()} CSV export download`);
  };

  const handleCopyAgencySummary = () => {
    const activeCount = callers.filter((c) => c.isActive).length;
    const avgTicket = totalDonations > 0 ? Math.round(totalRevenue / totalDonations) : 0;
    const summary = `📊 *JANASEVA ASHRAMA TELECALLER CAMPAIGN REPORT*\n📅 Date: ${new Date().toLocaleDateString()}\n💰 Total Attributed Revenue: ${formatINR(totalRevenue)}\n🎧 Active Telecallers: ${activeCount}\n🎂 Total Managed Leads: ${totalLeads}\n✅ Completed Donations: ${totalDonations}\n📈 Conversion Rate: ${totalLeads > 0 ? ((totalDonations / totalLeads) * 100).toFixed(1) : 0}%\n🎟️ Average Donation Ticket: ${formatINR(avgTicket)}\n\n🏆 Top Performer: ${callers[0]?.name || "N/A"} (${callers[0]?.callerId}) - ${formatINR(callers[0]?.totalDonationAmount || 0)}`;

    navigator.clipboard.writeText(summary);
    showToast("✓ Copied agency performance summary to clipboard!");
    setIsExportMenuOpen(false);
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

        <div className="overflow-x-auto">
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

        {/* Leads Table */}
        <div className="overflow-x-auto max-h-96">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-teal-950/50">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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

              {/* Format Hint */}
              <div className="rounded-2xl bg-amber-50/80 p-3 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span>💡</span> Accepted Columns: Name, Phone (10-digit), Birthday Day (1-31), Birthday Month (1-12), Email (Optional)
                </p>
                <p className="text-[11px] text-amber-800/80 font-mono">
                  Example: Ramesh Patil, 9880123456, 15, 10, ramesh@gmail.com
                </p>
              </div>

              {uploadMode === "paste" ? (
                <div>
                  <label className="block text-[11px] font-bold text-teal-950 mb-1">
                    Paste Rows (CSV, TSV, or Tab-Separated from Excel):
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      parseRawLeadText(e.target.value);
                    }}
                    placeholder={`Vijay Kumar, 9845011001, 14, 10\nDeepa Rao, 9845011002, 15, 10\nAnand Joshi, 9845011003, 16, 10`}
                    className="w-full rounded-2xl border border-teal-900/20 p-3 font-mono text-xs text-teal-950 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-teal-900/20 rounded-2xl p-6 text-center hover:bg-sand/30 transition">
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <span className="text-3xl block mb-2">📄</span>
                    <span className="text-xs font-bold text-teal-950 block">
                      {uploadedFileName ? `Selected: ${uploadedFileName}` : "Click to select CSV or TXT file"}
                    </span>
                    <span className="text-[11px] text-teal-950/60 block mt-1">
                      UTF-8 formatted Comma/Tab delimited file
                    </span>
                  </label>
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
    </div>
  );
}
