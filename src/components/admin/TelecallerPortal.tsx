"use client";

import { useEffect, useState } from "react";
import { formatINR } from "@/lib/site";

export function TelecallerPortal({ initialCallerId }: { initialCallerId?: string }) {
  const [callerId, setCallerId] = useState<string>(initialCallerId || "TC01");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    contactedCount: 0,
    convertedCount: 0,
    totalRevenue: 0,
  });

  const [filter, setFilter] = useState<string>("ALL");
  const [toastMsg, setToastMsg] = useState("");
  const [activeNotesLeadId, setActiveNotesLeadId] = useState<number | null>(null);
  const [notesText, setNotesText] = useState("");

  useEffect(() => {
    loadCallerLeads(callerId);
  }, [callerId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  };

  const loadCallerLeads = async (cid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/leads/assigned?callerId=${cid}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
        computeStats(data.leads || [], cid);
      }
    } catch (err: any) {
      showToast("Error loading leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const computeStats = async (leadItems: any[], cid: string) => {
    let contacted = 0;
    let converted = 0;
    leadItems.forEach((l) => {
      if (l.status !== "Pending") contacted++;
      if (l.status === "Donated") converted++;
    });

    // Fetch total revenue from admin api for this caller
    try {
      const adminRes = await fetch("/api/v1/admin/telecallers");
      const adminData = await adminRes.json();
      const myStat = adminData.callers?.find((c: any) => c.callerId === cid);
      setStats({
        totalAssigned: leadItems.length,
        contactedCount: contacted,
        convertedCount: converted,
        totalRevenue: myStat?.totalDonationAmount || 0,
      });
    } catch {
      setStats({
        totalAssigned: leadItems.length,
        contactedCount: contacted,
        convertedCount: converted,
        totalRevenue: 0,
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callerId, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Login failed");
      setIsLoggedIn(true);
      await loadCallerLeads(callerId);
    } catch (err: any) {
      setLoginError(err.message);
    }
  };

  // 1-Tap WhatsApp Launcher
  const handleOpenWhatsApp = async (leadId: number) => {
    try {
      const res = await fetch(`/api/v1/telecaller/whatsapp-link/${leadId}?callerId=${callerId}`);
      const data = await res.json();
      if (data.success && data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
        showToast(`✓ Opened WhatsApp message for ${data.leadName} with referral token: ${callerId}`);
      }
    } catch (err: any) {
      alert("WhatsApp link generation error: " + err.message);
    }
  };

  // Update Call Disposition
  const handleUpdateDisposition = async (leadId: number, disposition: string, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerId,
          disposition,
          notes: notes || "Updated from telecaller dashboard",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.leadId === leadId ? { ...l, status: disposition } : l))
        );
        showToast(`✓ Status updated to ${disposition}`);
        setActiveNotesLeadId(null);
        setNotesText("");
        computeStats(
          leads.map((l) => (l.leadId === leadId ? { ...l, status: disposition } : l)),
          callerId
        );
      }
    } catch (err: any) {
      showToast("Error updating disposition: " + err.message);
    }
  };

  // Simulate payment conversion test
  const handleSimulatePayment = async (leadId: number) => {
    try {
      const res = await fetch("/api/v1/webhooks/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate_donation",
          callerRefId: callerId,
          leadId,
          amount: 1000,
        }),
      });
      const data = await res.json();
      if (data.status === "ok") {
        showToast(`🎉 ₹1,000 Donation attributed to you (${callerId})! Lead marked as Donated.`);
        await loadCallerLeads(callerId);
      }
    } catch (err: any) {
      showToast("Attribution test failed: " + err.message);
    }
  };

  const filtered = leads.filter((l) => {
    if (filter === "ALL") return true;
    return l.status === filter;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="rounded-2xl bg-teal-950 text-gold px-4 py-3 shadow-lg border border-amber-400/40 text-xs font-bold flex items-center justify-between">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg("")} className="text-white hover:text-gold ml-2">✕</button>
        </div>
      )}

      {/* ── TOP TELECALLER HEADER & STATS BAR ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-teal-900/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-950 text-gold font-display font-black text-lg shadow-sm">
              {callerId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold text-teal-950">
                  Telecaller Workspace
                </h1>
                <span className="rounded-full bg-emerald-500/15 text-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs text-teal-950/60 mt-0.5">
                Affiliate Referral Link:{" "}
                <span className="font-mono font-bold text-teal-900">
                  /donate?ref={callerId}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Caller Switcher (Supports testing all 15 telecallers TC01 to TC15) */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-teal-950/70">Switch Caller:</label>
            <select
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
              className="rounded-xl border border-teal-900/20 px-3 py-1.5 text-xs font-black bg-white text-teal-950 focus:ring-2 focus:ring-amber-500"
            >
              {Array.from({ length: 15 }).map((_, i) => {
                const id = `TC${String(i + 1).padStart(2, "0")}`;
                return <option key={id} value={id}>{id} Advisor</option>;
              })}
            </select>
          </div>
        </div>

        {/* Real-Time Telecaller Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Assigned Leads
            </p>
            <p className="font-display text-2xl font-black text-teal-950 mt-1">
              {stats.totalAssigned}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">Today&apos;s call queue</p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Calls Completed
            </p>
            <p className="font-display text-2xl font-black text-teal-950 mt-1">
              {stats.contactedCount}
            </p>
            <p className="text-[10px] text-teal-950/60 mt-0.5">Logged dispositions</p>
          </div>

          <div className="rounded-2xl bg-cream/70 p-4 border border-teal-900/10">
            <p className="text-[10px] font-black uppercase text-teal-950/60 tracking-wider">
              Conversions
            </p>
            <p className="font-display text-2xl font-black text-emerald-700 mt-1">
              {stats.convertedCount}
            </p>
            <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
              {stats.totalAssigned > 0 ? ((stats.convertedCount / stats.totalAssigned) * 100).toFixed(1) : 0}% success rate
            </p>
          </div>

          <div className="rounded-2xl bg-teal-950 p-4 text-white shadow-sm border border-teal-900">
            <p className="text-[10px] font-black uppercase text-amber-300 tracking-wider">
              Total Revenue Attributed
            </p>
            <p className="font-display text-2xl font-black text-gold mt-1">
              {formatINR(stats.totalRevenue)}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">via ?ref={callerId}</p>
          </div>
        </div>
      </div>

      {/* ── ASSIGNED LEADS QUEUE TABLE ── */}
      <div className="rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-teal-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-teal-950">
              Birthday Leads Queue
            </h2>
            <p className="text-xs text-teal-950/60">
              Call lead, wish them happy birthday on behalf of 25 boys, and send WhatsApp link
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {["ALL", "Pending", "Interested", "Reschedule", "Donated", "Rejected"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filter === st
                    ? "bg-teal-950 text-gold shadow-sm"
                    : "bg-cream text-teal-950/70 hover:bg-sand"
                }`}
              >
                {st} {st === "ALL" ? `(${leads.length})` : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream text-teal-950 font-bold border-b border-teal-900/10">
              <tr>
                <th className="p-3">Lead Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Birthday</th>
                <th className="p-3">Status / Disposition</th>
                <th className="p-3">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-900/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-teal-950/60">
                    Loading call queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-teal-950/60">
                    No leads found in this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.leadId} className="hover:bg-sand/30 transition">
                    <td className="p-3">
                      <p className="font-bold text-teal-950 text-sm">{lead.name}</p>
                      <p className="text-[10px] text-teal-950/60">ID #{lead.leadId}</p>
                    </td>
                    <td className="p-3">
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-mono font-bold text-teal-900 hover:underline flex items-center gap-1"
                      >
                        <span>📞</span> {lead.phone}
                      </a>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 text-amber-900 font-bold px-2 py-0.5 text-[11px]">
                        🎂 Day {lead.dobDay} / Month {lead.dobMonth}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateDisposition(lead.leadId, e.target.value)}
                        className={`rounded-xl border px-2.5 py-1 text-xs font-bold shadow-2xs outline-none ${
                          lead.status === "Donated"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : lead.status === "Interested"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : lead.status === "Reschedule"
                            ? "bg-blue-100 text-blue-900 border-blue-300"
                            : lead.status === "Rejected"
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : "bg-white text-teal-950 border-teal-900/20"
                        }`}
                      >
                        <option value="Pending">Pending (Not Called)</option>
                        <option value="Interested">Interested (Warm)</option>
                        <option value="Reschedule">Reschedule (Callback)</option>
                        <option value="No_Answer">No Answer / Busy</option>
                        <option value="Rejected">Not Interested</option>
                        <option value="Donated">Donated (Paid)</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1-Tap WhatsApp Sender */}
                        <button
                          type="button"
                          onClick={() => handleOpenWhatsApp(lead.leadId)}
                          className="focus-ring tap-scale inline-flex items-center gap-1 rounded-xl bg-[#25D366] hover:brightness-105 text-white px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                        >
                          <span>💬</span> WhatsApp
                        </button>

                        {/* Test Payment Attribution */}
                        <button
                          type="button"
                          onClick={() => handleSimulatePayment(lead.leadId)}
                          title="Simulate payment attribution via webhook"
                          className="rounded-xl bg-teal-900/10 hover:bg-teal-900/20 text-teal-900 px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                        >
                          +₹1k Test
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
