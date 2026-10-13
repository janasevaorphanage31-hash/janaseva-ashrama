"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/site";
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

  // Notifications
  const [toastMessage, setToastMessage] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

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
      }
      // Also load leads for reassignment table
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

  // 1. Trigger Round-Robin Lead Routing
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

  // 2. Execute Bulk Reassignment
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

  // 3. Test Attribution Simulation
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="text-white hover:text-gold ml-3">✕</button>
        </div>
      )}

      {/* ── 1. SUMMARY STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-teal-950 p-5 text-white shadow-md border border-teal-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
              Total Attributed Revenue
            </span>
            <span className="text-xl">💰</span>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-gold">
            {formatINR(totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-white/70">
            Attributed across {totalDonations} completed donations
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm border border-teal-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-950/60">
              Active Telecallers
            </span>
            <span className="text-xl">🎧</span>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-teal-950">
            {callers.length} Callers
          </p>
          <p className="mt-1 text-[11px] text-emerald-600 font-bold">
            100% Round-Robin Active (TC01-TC15)
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm border border-teal-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-950/60">
              Managed Birthday Leads
            </span>
            <span className="text-xl">🎂</span>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-teal-950">
            {totalLeads} Leads
          </p>
          <p className="mt-1 text-[11px] text-teal-950/60">
            Targeted for Today, Tomorrow &amp; Day+2
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm border border-teal-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-950/60">
              Overall Conversion Rate
            </span>
            <span className="text-xl">📈</span>
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-black text-saffron-dark">
            {totalLeads > 0 ? ((totalDonations / totalLeads) * 100).toFixed(1) : 0}%
          </p>
          <p className="mt-1 text-[11px] text-teal-950/60">
            Assigned calls to successful payments
          </p>
        </div>
      </div>

      {/* ── 2. QUICK AUTOMATION & ACTION STRIP ── */}
      <div className="rounded-3xl bg-sand/50 p-5 border border-teal-900/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-display text-sm font-bold text-teal-950">
              Automated Birthday Lead Routing Engine
            </h3>
          </div>
          <p className="text-xs text-teal-950/70 mt-0.5">
            Runs daily at 00:01 AM automatically. You can also manually trigger routing anytime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleTriggerRouting}
            disabled={actionLoading}
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-gold px-4 py-2.5 text-xs font-black shadow-sm transition cursor-pointer"
          >
            <span>🚀 Run Round-Robin Routing Now</span>
          </button>

          <Link
            href="/portal"
            target="_blank"
            className="focus-ring tap-scale inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-sand border border-teal-900/20 text-teal-950 px-4 py-2.5 text-xs font-bold shadow-xs transition"
          >
            <span>📱 Open Telecaller Portal →</span>
          </Link>
        </div>
      </div>

      {/* ── 3. TELECALLER LEADERBOARD TABLE ── */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-teal-950">
              Telecaller Revenue Leaderboard
            </h3>
            <p className="text-xs text-teal-950/60">
              Ranked in real time based on gateway webhook attribution (notes.caller_ref_id)
            </p>
          </div>
          <span className="rounded-full bg-saffron/15 text-saffron-dark px-3 py-1 text-xs font-black">
            15 Active Callers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Caller Name &amp; ID</th>
                <th className="p-3">WhatsApp Mobile</th>
                <th className="p-3">Assigned Leads</th>
                <th className="p-3">Contacted</th>
                <th className="p-3">Conversions</th>
                <th className="p-3">Conv. Rate</th>
                <th className="p-3">Total Attributed</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {callers.map((c) => {
                const isTop3 = c.rank <= 3;
                return (
                  <tr
                    key={c.callerId}
                    className={`hover:bg-sand/30 transition ${
                      c.rank === 1
                        ? "bg-amber-50/60 font-semibold"
                        : c.rank === 2
                        ? "bg-amber-50/30"
                        : c.rank === 3
                        ? "bg-amber-50/15"
                        : ""
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
                      <p className="text-[10px] font-mono text-teal-900/60">{c.callerId}</p>
                    </td>
                    <td className="p-3 font-mono text-teal-950/80">
                      +91 {c.whatsappNumber}
                    </td>
                    <td className="p-3 font-semibold">{c.assignedCount}</td>
                    <td className="p-3 text-teal-950/70">{c.contactedCount}</td>
                    <td className="p-3 text-emerald-700 font-bold">{c.convertedCount}</td>
                    <td className="p-3">
                      <span className="rounded-md bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                        {c.conversionRate}%
                      </span>
                    </td>
                    <td className="p-3 font-display font-extrabold text-sm text-teal-950">
                      {formatINR(c.totalDonationAmount)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
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
                          View Leads
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

      {/* ── 4. BULK LEAD RE-ASSIGNMENT TOOL ── */}
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
                  {c.callerId} - {c.name}
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
                          onChange={() => {}} // handled by row click
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
    </div>
  );
}
